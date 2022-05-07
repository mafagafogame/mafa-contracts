/* eslint-disable camelcase */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { abi as factoryAbi } from "@uniswap/v2-periphery/build/IUniswapV2Factory.json";
import { abi as pairAbi } from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
import { abi } from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import { expect } from "chai";
import { utils } from "ethers";
import { ethers } from "hardhat";

import { IUniswapV2Factory, IUniswapV2Pair, IUniswapV2Router02, MafaCoin, MafaCoin__factory } from "../../typechain";

describe.only("MafaCoin", function () {
  const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
  let contract: MafaCoin;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;
  let address3: SignerWithAddress;
  let address4: SignerWithAddress;
  let address5: SignerWithAddress;

  before(async function () {
    [owner, address1, address2, address3, address4, address5] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const mafacoinFactory = <MafaCoin__factory>await ethers.getContractFactory("MafaCoin");
    contract = await mafacoinFactory.deploy("Mafacoin", "MAFA", utils.parseEther("1000000000"));
    contract = await contract.deployed();
  });

  it("Should be constructed properly", async function () {
    expect(await contract.name()).to.equal("Mafacoin");
    expect(await contract.symbol()).to.equal("MAFA");
    expect(await contract.totalSupply()).to.equal(utils.parseEther("1000000000"));
    expect(await contract.decimals()).to.equal(18);
    expect(await contract.balanceOf(owner.address)).to.equal(await contract.totalSupply());

    expect(await contract.developmentAddress()).to.equal("0x056f3E1B30797a122447581d0F34CD69E9A26690");
    expect(await contract.marketingAddress()).to.equal("0x272C14981F2Ff4fF06F5EF326940E7F067b4b5D6");
    expect(await contract.liquidityAddress()).to.equal("0xc76280a36743E1266dC73F114bB1c9950ee37E7c");

    expect(await contract.developmentBuyFee()).to.equal(0);
    expect(await contract.marketingBuyFee()).to.equal(0);
    expect(await contract.liquidityBuyFee()).to.equal(utils.parseEther("0.01"));
    expect(await contract.developmentSellFee()).to.equal(utils.parseEther("0.03"));
    expect(await contract.marketingSellFee()).to.equal(utils.parseEther("0.03"));
    expect(await contract.liquiditySellFee()).to.equal(utils.parseEther("0.01"));

    expect(await contract.MAX_BUY_FEE()).to.equal(utils.parseEther("0.14"));
    expect(await contract.MAX_SELL_FEE()).to.equal(utils.parseEther("0.14"));
    expect(await contract.maxSellAmount()).to.equal(utils.parseEther("100000"));
    expect(await contract.MIN_ANTI_DUMP_LIMIT()).to.equal(utils.parseEther("10000"));
    expect(await contract.minTokensToTakeFeeInBNB()).to.equal(utils.parseEther("1000"));

    expect(await contract.isExcludedFromFees(owner.address)).to.equal(true);
    expect(await contract.isExcludedFromFees(contract.address)).to.equal(true);
  });

  it("Owner should no be able to set AMM pair with default pair", async function () {
    await expect(contract.setAutomatedMarketMakerPair(await contract.dexPair(), false)).to.be.revertedWith(
      "DefaultPairUpdated()",
    );
  });

  it("Automated Market Maker Pair", async function () {
    expect(await contract.setAutomatedMarketMakerPair(DEAD_ADDRESS, true));
  });

  it("Owner should be able to set minTokensToTakeFeeInBNB to any value", async function () {
    expect(await contract.setMinTokensToTakeFeeInBNB(0))
      .to.emit(contract, "MinTokensToTakeFeeInBNBUpdated")
      .withArgs(0);
    expect(await contract.setMinTokensToTakeFeeInBNB(ethers.constants.MaxUint256))
      .to.emit(contract, "MinTokensToTakeFeeInBNBUpdated")
      .withArgs(ethers.constants.MaxUint256);
  });

  describe("Fees", function () {
    beforeEach(async function () {
      await contract.setDevelopmentBuyFee(0);
      await contract.setDevelopmentSellFee(0);
      await contract.setMarketingBuyFee(0);
      await contract.setMarketingSellFee(0);
      await contract.setLiquidityBuyFee(0);
      await contract.setLiquiditySellFee(0);

      await contract.transfer(address1.address, utils.parseEther("100000"));
    });

    it("Owner should not be able to set zero address as fee recipients", async function () {
      await expect(contract.setDevelopmentAddress(ethers.constants.AddressZero)).to.be.revertedWith(
        "SettingZeroAddress()",
      );

      await expect(contract.setMarketingAddress(ethers.constants.AddressZero)).to.be.revertedWith(
        "SettingZeroAddress()",
      );

      await expect(contract.setLiquidityAddress(ethers.constants.AddressZero)).to.be.revertedWith(
        "SettingZeroAddress()",
      );
    });

    it("Owner should not be able to set fee recipients address twice", async function () {
      await contract.setDevelopmentAddress(address3.address);
      await expect(contract.setDevelopmentAddress(address3.address)).to.be.revertedWith("AddressAlreadySet()");

      await contract.setMarketingAddress(address3.address);
      await expect(contract.setMarketingAddress(address3.address)).to.be.revertedWith("AddressAlreadySet()");

      await contract.setLiquidityAddress(address3.address);
      await expect(contract.setLiquidityAddress(address3.address)).to.be.revertedWith("AddressAlreadySet()");
    });

    it("Should not be able to set buy fees greater than MAX_BUY_FEE value", async function () {
      await contract.setDevelopmentBuyFee(utils.parseEther("0.05"));
      await contract.setMarketingBuyFee(utils.parseEther("0.05"));

      await expect(contract.setLiquidityBuyFee(utils.parseEther("0.05"))).to.be.revertedWith(
        "MaxBuyFeeExceeded(150000000000000000)",
      );
    });

    it("Should not be able to set sell fees greater than MAX_SELL_FEE value", async function () {
      await contract.setDevelopmentSellFee(utils.parseEther("0.05"));
      await contract.setMarketingSellFee(utils.parseEther("0.05"));

      await expect(contract.setLiquiditySellFee(utils.parseEther("0.05"))).to.be.revertedWith(
        "MaxSellFeeExceeded(150000000000000000)",
      );
    });

    it("Should calculate total fees correctly", async function () {
      expect(await contract.totalBuyFees()).to.equal(0);
      expect(await contract.totalSellFees()).to.equal(0);
      await contract.setDevelopmentBuyFee(utils.parseEther("0.14"));
      await contract.setDevelopmentSellFee(utils.parseEther("0.14"));
      expect(await contract.totalBuyFees()).to.equal(utils.parseEther("0.14"));
      expect(await contract.totalSellFees()).to.equal(utils.parseEther("0.14"));
    });

    it("Should not charge buy fees on basic transfer", async function () {
      await contract.setDevelopmentBuyFee(utils.parseEther("0.04"));
      await contract.setMarketingBuyFee(utils.parseEther("0.04"));
      await contract.setLiquidityBuyFee(utils.parseEther("0.04"));

      await contract.connect(address1).transfer(address2.address, utils.parseEther("50000"));

      expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("50000"));
      expect(await contract.balanceOf(address2.address)).to.equal(utils.parseEther("50000"));
    });

    it("Should not charge sell fees on basic transfer", async function () {
      await contract.setDevelopmentSellFee(utils.parseEther("0.04"));
      await contract.setMarketingSellFee(utils.parseEther("0.04"));
      await contract.setLiquiditySellFee(utils.parseEther("0.04"));

      await contract.connect(address1).transfer(address2.address, utils.parseEther("50000"));

      expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("50000"));
      expect(await contract.balanceOf(address2.address)).to.equal(utils.parseEther("50000"));
    });

    describe("After liquidity is added", function () {
      const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
      let router: IUniswapV2Router02;
      let WETH: string;
      let factory: IUniswapV2Factory;
      let pairContract: IUniswapV2Pair;

      before(async function () {
        router = <IUniswapV2Router02>new ethers.Contract(ROUTER_ADDRESS, abi, owner);
        WETH = await router.WETH();
        const factoryAddress = await router.factory();
        factory = <IUniswapV2Factory>new ethers.Contract(factoryAddress, factoryAbi, owner);
      });

      beforeEach(async function () {
        const pairAddress = await factory.getPair(contract.address, WETH);
        // PAIR CONTRACT
        pairContract = <IUniswapV2Pair>new ethers.Contract(pairAddress, pairAbi, owner);

        const TokenAmount = utils.parseEther("100000");

        const BNBAmount = utils.parseEther("1000");

        await contract.approve(ROUTER_ADDRESS, ethers.constants.MaxUint256);

        // add liquidity to liquidity pool
        await router
          .connect(owner)
          .addLiquidityETH(contract.address, TokenAmount, 0, 0, owner.address, ethers.constants.MaxUint256, {
            value: BNBAmount,
          });

        await contract.setDevelopmentBuyFee(utils.parseEther("0.01"));
        await contract.setDevelopmentSellFee(utils.parseEther("0.01"));
        await contract.setDevelopmentAddress(address2.address);
        await contract.setMarketingBuyFee(utils.parseEther("0.01"));
        await contract.setMarketingSellFee(utils.parseEther("0.01"));
        await contract.setMarketingAddress(address3.address);
        await contract.setLiquidityBuyFee(utils.parseEther("0.01"));
        await contract.setLiquiditySellFee(utils.parseEther("0.01"));
        await contract.setLiquidityAddress(address4.address);
      });

      it("Should be able to transfer tokens between accounts", async function () {
        await contract.connect(address1).transfer(address5.address, utils.parseEther("1000"));

        expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("99000"));
        expect(await contract.balanceOf(address5.address)).to.equal(utils.parseEther("1000"));
        expect(await contract.balanceOf(address2.address)).to.equal(0); // development fee is not charged
        expect(await contract.balanceOf(address3.address)).to.equal(0); // marketing fee is not charged
        expect(await contract.balanceOf(address4.address)).to.equal(0); // liquidity fee is not charged
      });

      // buy
      it("Should swap ETH for Tokens supporting fees on transfer", async function () {
        await expect(
          router
            .connect(address1)
            .swapExactETHForTokensSupportingFeeOnTransferTokens(
              0,
              [WETH, contract.address],
              address1.address,
              ethers.constants.MaxUint256,
              { value: utils.parseEther("10") },
            ),
        ).to.emit(contract, "Transfer");

        expect(await contract.balanceOf(address1.address)).to.be.gt(utils.parseEther("100950")); // tokens received
        expect(await contract.balanceOf(address2.address)).to.be.gt(utils.parseEther("9.8")); // development fee
        expect(await contract.balanceOf(address3.address)).to.be.gt(utils.parseEther("9.8")); // marketing fee
        expect(await contract.balanceOf(address4.address)).to.be.gt(utils.parseEther("9.8")); // liquidity fee
      });

      it("Should swap ETH for Tokens supporting fees on transfer if fees are removed", async function () {
        await contract.setDevelopmentBuyFee(0);
        await contract.setMarketingBuyFee(0);
        await contract.setLiquidityBuyFee(0);

        await expect(
          router
            .connect(address1)
            .swapExactETHForTokensSupportingFeeOnTransferTokens(
              0,
              [WETH, contract.address],
              address1.address,
              ethers.constants.MaxUint256,
              { value: utils.parseEther("10") },
            ),
        ).to.emit(contract, "Transfer");

        expect(await contract.balanceOf(address1.address)).to.be.gt(utils.parseEther("100980")); // tokens received
        expect(await contract.balanceOf(address2.address)).to.be.equal(0); // development fee is not charged
        expect(await contract.balanceOf(address3.address)).to.be.equal(0); // marketing fee is not charged
        expect(await contract.balanceOf(address4.address)).to.be.equal(0); // liquidity fee is not charged
      });

      // sell
      it("Should swap Tokens for ETH supporting fees on transfer", async function () {
        await contract.connect(address1).approve(router.address, ethers.constants.MaxUint256);

        const initialDevelopmentBalance = await contract.provider.getBalance(address2.address); // development address
        const initialMarketingBalance = await contract.provider.getBalance(address3.address); // marketing address
        const initialLiquidityBalance = await contract.provider.getBalance(address4.address); // liquidity address

        await expect(
          router
            .connect(address1)
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
              utils.parseEther("1000"),
              0,
              [contract.address, WETH],
              address1.address,
              ethers.constants.MaxUint256,
            ),
        ).to.emit(contract, "Transfer");

        const finalDevelopmentBalance = await contract.provider.getBalance(address2.address);
        const finalMarketingBalance = await contract.provider.getBalance(address3.address);
        const finalLiquidityBalance = await contract.provider.getBalance(address4.address);

        expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("99000"));
        expect(await contract.balanceOf(pairContract.address)).to.equal(utils.parseEther("101000"));
        expect(await contract.balanceOf(address2.address)).to.equal(0);
        expect(await contract.balanceOf(address3.address)).to.equal(0);
        expect(initialDevelopmentBalance).to.be.lt(finalDevelopmentBalance); // development fee
        expect(initialMarketingBalance).to.be.lt(finalMarketingBalance); // marketing fee
        expect(initialLiquidityBalance).to.be.lt(finalLiquidityBalance); // liquidity fee
      });

      describe("Max Sell amount", function () {
        beforeEach(async function () {
          await contract.setDevelopmentSellFee(0);
          await contract.setMarketingSellFee(0);
          await contract.setLiquiditySellFee(0);

          await contract.setMaxSellAmount(utils.parseEther("10000"));
          await contract.transfer(address5.address, utils.parseEther("10001"));
          await contract.connect(address5).approve(router.address, ethers.constants.MaxUint256);
        });

        it("Should be able to set max sell amount greater than MIN_ANTI_DUMP_LIMIT", async function () {
          await expect(contract.setMaxSellAmount(utils.parseEther("10000000")))
            .to.emit(contract, "MaxSellAmountUpdated")
            .withArgs(utils.parseEther("10000000"));
        });

        it("Should not be able to set max sell amount lower than MIN_ANTI_DUMP_LIMIT", async function () {
          await expect(contract.setMaxSellAmount(utils.parseEther("9999"))).to.be.revertedWith(
            "MaxSellAmountTooLow(9999000000000000000000)",
          );
        });

        it("Should swap ETH for Tokens if sell amount is lower than maximum sell amount allowed", async function () {
          await expect(
            router
              .connect(address5)
              .swapExactTokensForETHSupportingFeeOnTransferTokens(
                utils.parseEther("10000"),
                0,
                [contract.address, WETH],
                address5.address,
                ethers.constants.MaxUint256,
              ),
          ).to.emit(contract, "Transfer");
        });

        it("Should revert sell transaction if sell amount is greater than maximum sell amount allowed", async function () {
          await expect(
            router
              .connect(address5)
              .swapExactTokensForETHSupportingFeeOnTransferTokens(
                utils.parseEther("10001"),
                0,
                [contract.address, WETH],
                address5.address,
                ethers.constants.MaxUint256,
              ),
          ).to.be.revertedWith("TransferHelper: TRANSFER_FROM_FAILED");
        });
      });

      // it.only("Should report gas costs of transfers", async function () {
      //   console.log("P2P TRANSFER GAS: ");
      //   console.log(await contract.connect(address1).estimateGas.transfer(address2.address, utils.parseEther("1000")));

      //   console.log("BUY TOKENS GAS:");
      //   console.log(
      //     await router
      //       .connect(address1)
      //       .estimateGas.swapExactETHForTokensSupportingFeeOnTransferTokens(
      //         0,
      //         [WETH, contract.address],
      //         address1.address,
      //         ethers.constants.MaxUint256,
      //         { value: utils.parseEther("10") },
      //       ),
      //   );

      //   await contract.connect(address1).approve(router.address, ethers.constants.MaxUint256);
      //   console.log("SELL TOKENS GAS:");
      //   console.log(
      //     await router
      //       .connect(address1)
      //       .estimateGas.swapExactTokensForETHSupportingFeeOnTransferTokens(
      //         utils.parseEther("1000"),
      //         0,
      //         [contract.address, WETH],
      //         address1.address,
      //         ethers.constants.MaxUint256,
      //       ),
      //   );
      // });
    });
  });
});
