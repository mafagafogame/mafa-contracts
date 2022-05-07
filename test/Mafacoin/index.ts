/* eslint-disable camelcase */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { abi as factoryAbi } from "@uniswap/v2-periphery/build/IUniswapV2Factory.json";
import { abi as pairAbi } from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
import { abi } from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import { expect } from "chai";
import { utils } from "ethers";
import { ethers } from "hardhat";

import {
  IUniswapV2Factory,
  IUniswapV2Pair,
  IUniswapV2Router02,
  MafaCoinV2,
  MafaCoinV2__factory,
} from "../../typechain";

describe.only("MafaCoinV2", function () {
  const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
  let contract: MafaCoinV2;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;
  let address3: SignerWithAddress;

  before(async function () {
    [owner, address1, address2, address3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const mafacoinFactory = <MafaCoinV2__factory>await ethers.getContractFactory("MafaCoinV2");
    contract = await mafacoinFactory.deploy("Mafacoin", "MAFA", utils.parseEther("1000000000"));
    contract = await contract.deployed();
  });

  it("Should be constructed properly", async function () {
    expect(await contract.name()).to.equal("Mafacoin");
    expect(await contract.symbol()).to.equal("MAFA");
    expect(await contract.totalSupply()).to.equal(utils.parseEther("1000000000"));
    expect(await contract.decimals()).to.equal(18);
    expect(await contract.balanceOf(owner.address)).to.equal(await contract.totalSupply());

    expect(await contract.feeRecipient()).to.equal(owner.address);

    expect(await contract.buyFee()).to.equal(utils.parseEther("0.05"));
    expect(await contract.sellFee()).to.equal(utils.parseEther("0.05"));
    expect(await contract.MAX_BUY_FEE()).to.equal(utils.parseEther("0.14"));
    expect(await contract.MAX_SELL_FEE()).to.equal(utils.parseEther("0.14"));
    expect(await contract.maxSellAmount()).to.equal(utils.parseEther("100000"));
    expect(await contract.MIN_ANTI_DUMP_LIMIT()).to.equal(utils.parseEther("10000"));
    expect(await contract.minTokensToTakeFeeInBNB()).to.equal(utils.parseEther("1000"));

    expect(await contract.isExcludedFromFees(owner.address)).to.equal(true);
    expect(await contract.isExcludedFromFees(contract.address)).to.equal(true);
  });

  it("Owner should be able to include/exclude in fees an excluded/included from fees account", async function () {
    await contract.excludeFromFees(address2.address);
    expect(await contract.isExcludedFromFees(address2.address)).to.equal(true);

    await contract.includeInFees(address2.address);
    expect(await contract.isExcludedFromFees(address2.address)).to.equal(false);
  });

  it("Owner should not be able to include/exclude in fees an include/exclude from fees account", async function () {
    await contract.excludeFromFees(address2.address);
    await expect(contract.excludeFromFees(address2.address)).to.be.reverted;

    await contract.includeInFees(address2.address);
    await expect(contract.includeInFees(address2.address)).to.be.reverted;
  });

  it("Owner should no be able to set AMM pair with default pair", async function () {
    await expect(contract.setAutomatedMarketMakerPair(await contract.dexPair(), false)).to.be.revertedWith(
      "DefaultPairUpdated()",
    );
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
      await contract.transfer(address1.address, utils.parseEther("100000"));

      await contract.setFeeRecipientAddress(address3.address);
    });

    it("Owner should not be able to set zero address as fee recipient", async function () {
      await expect(contract.setFeeRecipientAddress(ethers.constants.AddressZero)).to.be.revertedWith(
        "SettingZeroAddress()",
      );
    });

    it("Owner should not be able to set fee recipient address twice", async function () {
      await expect(contract.setFeeRecipientAddress(address3.address)).to.be.revertedWith("AddressAlreadySet()");
    });

    it("Should not be able to set buy fee greater than MAX_BUY_FEE value", async function () {
      await expect(contract.setBuyFee(utils.parseEther("0.15"))).to.be.revertedWith(
        "MaxBuyFeeExceeded(150000000000000000)",
      );
    });

    it("Should not be able to set buy fee greater than MAX_BUY_FEE value", async function () {
      await expect(contract.setSellFee(utils.parseEther("0.15"))).to.be.revertedWith(
        "MaxSellFeeExceeded(150000000000000000)",
      );
    });

    it("Should set fees correctly", async function () {
      await contract.setBuyFee(utils.parseEther("0.14"));
      await contract.setSellFee(utils.parseEther("0.14"));

      expect(await contract.buyFee()).to.equal(utils.parseEther("0.14"));
      expect(await contract.sellFee()).to.equal(utils.parseEther("0.14"));
    });

    it("Should charge buy fees on basic transfer", async function () {
      await contract.connect(address1).transfer(address2.address, utils.parseEther("50000"));

      expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("50000"));
      expect(await contract.balanceOf(address2.address)).to.equal(utils.parseEther("47500"));
    });

    it("Should not charge sell fees on basic transfer", async function () {
      await contract.setBuyFee(0);

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
      });

      it("Should be able to transfer tokens between accounts", async function () {
        await contract.connect(address1).transfer(address2.address, utils.parseEther("100"));

        expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("99900"));
        expect(await contract.balanceOf(address2.address)).to.equal(utils.parseEther("95"));
        expect(await contract.balanceOf(address3.address)).to.equal(utils.parseEther("5")); // fee
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
              { value: utils.parseEther("1") },
            ),
        ).to.emit(contract, "Transfer");

        expect(await contract.balanceOf(address1.address)).to.be.gt(utils.parseEther("99900")); // tokens received
        expect(await contract.balanceOf(address3.address)).to.be.gt(utils.parseEther("4.9")); // fee
      });

      // sell
      it("Should swap Tokens for ETH supporting fees on transfer", async function () {
        await contract.connect(address1).approve(router.address, ethers.constants.MaxUint256);

        const initialFeeRecipientBalance = await contract.provider.getBalance(address2.address);

        await expect(
          router
            .connect(address1)
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
              utils.parseEther("100"),
              0,
              [contract.address, WETH],
              address1.address,
              ethers.constants.MaxUint256,
            ),
        ).to.emit(contract, "Transfer");

        const finalFeeRecipientBalance = await contract.provider.getBalance(address2.address);

        expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("99900"));
        expect(await contract.balanceOf(pairContract.address)).to.equal(utils.parseEther("100095"));
        expect(await contract.balanceOf(address2.address)).to.equal(0);
        expect(await contract.balanceOf(contract.address)).to.equal(utils.parseEther("5")); // fee
        expect(initialFeeRecipientBalance).to.equal(finalFeeRecipientBalance);
      });

      it("Should take sell fees in BNB if minTokensToTakeFeeInBNB is achieved", async function () {
        await contract.setSellFee(utils.parseEther("0.14"));

        await contract.connect(address1).approve(router.address, ethers.constants.MaxUint256);

        const initialFeeRecipientBalance = await contract.provider.getBalance(address3.address);

        await expect(
          router
            .connect(address1)
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
              utils.parseEther("500"),
              0,
              [contract.address, WETH],
              address1.address,
              ethers.constants.MaxUint256,
            ),
        ).to.emit(contract, "Transfer");

        expect(await contract.balanceOf(contract.address)).to.equal(utils.parseEther("70"));
        expect(await contract.provider.getBalance(address3.address)).to.equal(initialFeeRecipientBalance);

        await expect(
          router
            .connect(address1)
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
              utils.parseEther("7000"),
              0,
              [contract.address, WETH],
              address1.address,
              ethers.constants.MaxUint256,
            ),
        ).to.emit(contract, "Transfer");

        const finalFeeRecipientBalance = await contract.provider.getBalance(address3.address);

        expect(await contract.balanceOf(contract.address)).to.equal(0);
        expect(initialFeeRecipientBalance).to.be.lt(finalFeeRecipientBalance);
      });

      describe("Max Sell amount", function () {
        beforeEach(async function () {
          await contract.setSellFee(0);
          await contract.setMaxSellAmount(utils.parseEther("10000"));

          await contract.connect(address1).approve(router.address, ethers.constants.MaxUint256);
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
              .connect(address1)
              .swapExactTokensForETHSupportingFeeOnTransferTokens(
                utils.parseEther("10000"),
                0,
                [contract.address, WETH],
                address1.address,
                ethers.constants.MaxUint256,
              ),
          ).to.emit(contract, "Transfer");
        });

        it("Should revert sell transaction if sell amount is greater than maximum sell amount allowed", async function () {
          await expect(
            router
              .connect(address1)
              .swapExactTokensForETHSupportingFeeOnTransferTokens(
                utils.parseEther("10001"),
                0,
                [contract.address, WETH],
                address1.address,
                ethers.constants.MaxUint256,
              ),
          ).to.be.revertedWith("TransferHelper: TRANSFER_FROM_FAILED");
        });
      });

      // it("Should report gas costs of transfers", async function () {
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

      //   await contract.setSellFee(utils.parseEther("0.14"));

      //   console.log("SELL TOKENS TAKING FEES IN BNB GAS:");
      //   console.log(
      //     await router
      //       .connect(address1)
      //       .estimateGas.swapExactTokensForETHSupportingFeeOnTransferTokens(
      //         utils.parseEther("7500"),
      //         0,
      //         [contract.address, WETH],
      //         address1.address,
      //         ethers.constants.MaxUint256,
      //       ),
      //   );
      // });
    });
  });

  it("Automated Market Maker Pair", async function () {
    expect(await contract.setAutomatedMarketMakerPair(DEAD_ADDRESS, true));
  });
});
