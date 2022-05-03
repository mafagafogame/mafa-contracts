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
  let address4: SignerWithAddress;
  let address5: SignerWithAddress;

  before(async function () {
    [owner, address1, address2, address3, address4, address5] = await ethers.getSigners();
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

    expect(await contract.developmentAddress()).to.equal(owner.address);
    expect(await contract.marketingAddress()).to.equal(owner.address);
    expect(await contract.liquidityAddress()).to.equal(owner.address);

    expect(await contract.developmentBuyFee()).to.equal(utils.parseEther("0.03"));
    expect(await contract.marketingBuyFee()).to.equal(utils.parseEther("0.01"));
    expect(await contract.liquidityBuyFee()).to.equal(utils.parseEther("0.01"));
    expect(await contract.developmentSellFee()).to.equal(utils.parseEther("0.02"));
    expect(await contract.marketingSellFee()).to.equal(utils.parseEther("0.02"));
    expect(await contract.liquiditySellFee()).to.equal(utils.parseEther("0.01"));

    expect(await contract.isExcludedFromFees(owner.address)).to.equal(true);
    expect(await contract.isExcludedFromFees(contract.address)).to.equal(true);
  });

  it("Owner should be able to include in fees an excluded from fees account", async function () {
    await contract.excludeFromFees(address4.address, true);
    expect(await contract.isExcludedFromFees(address4.address)).to.equal(true);

    await contract.excludeFromFees(address4.address, false);
    expect(await contract.isExcludedFromFees(address4.address)).to.equal(false);
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

    it("Should calculate total fees correctly", async function () {
      expect(await contract.totalBuyFees()).to.equal(0);
      expect(await contract.totalSellFees()).to.equal(0);
      await contract.setDevelopmentBuyFee(utils.parseEther("0.1"));
      await contract.setDevelopmentSellFee(utils.parseEther("0.1"));
      expect(await contract.totalBuyFees()).to.equal(utils.parseEther("0.1"));
    });

    it("should charge buy fees on basic transfer", async function () {
      await contract.setDevelopmentBuyFee(utils.parseEther("0.1"));
      await contract.setMarketingBuyFee(utils.parseEther("0.1"));
      await contract.setLiquidityBuyFee(utils.parseEther("0.1"));

      await contract.connect(address1).transfer(address2.address, utils.parseEther("50000"));

      expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("50000"));
      expect(await contract.balanceOf(address2.address)).to.equal(utils.parseEther("35000"));
    });

    it("should not charge sell fees on basic transfer", async function () {
      await contract.setDevelopmentSellFee(utils.parseEther("0.1"));
      await contract.setMarketingSellFee(utils.parseEther("0.1"));
      await contract.setLiquiditySellFee(utils.parseEther("0.1"));

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
        const initialCakeBalance = await pairContract.balanceOf(address4.address);

        await contract.connect(address1).transfer(address5.address, utils.parseEther("1000"));

        const finalCakeBalance = await pairContract.balanceOf(address4.address);

        expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("99000"));
        expect(await contract.balanceOf(address5.address)).to.equal(utils.parseEther("970"));
        expect(await contract.balanceOf(address2.address)).to.equal(utils.parseEther("10")); // development fee
        expect(await contract.balanceOf(address3.address)).to.equal(utils.parseEther("10")); // marketing fee
        expect(await contract.balanceOf(contract.address)).to.equal(utils.parseEther("10")); // liquidity fee (contract holding them)
        expect(initialCakeBalance).to.be.equal(finalCakeBalance);
      });

      // buy
      it("Should swap ETH for Tokens supporting fees on transfer", async function () {
        const initialCakeBalance = await pairContract.balanceOf(address4.address);

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

        const finalCakeBalance = await pairContract.balanceOf(address4.address);

        expect(await contract.balanceOf(address1.address)).to.be.gt(utils.parseEther("99000")); // tokens received
        expect(await contract.balanceOf(address2.address)).to.be.gt(utils.parseEther("9.8")); // development fee
        expect(await contract.balanceOf(address3.address)).to.be.gt(utils.parseEther("9.8")); // marketing fee
        expect(await contract.balanceOf(contract.address)).to.be.gt(utils.parseEther("9.8")); // liquidity fee (contract holding them)
        expect(initialCakeBalance).to.be.equal(finalCakeBalance);
      });

      // sell
      it("Should swap Tokens for ETH supporting fees on transfer", async function () {
        await contract.connect(address1).approve(router.address, ethers.constants.MaxUint256);

        const initialDevelopmentBalance = await contract.provider.getBalance(address2.address); // development address
        const initialMarketingBalance = await contract.provider.getBalance(address3.address); // marketing address
        const initialCakeBalance = await pairContract.balanceOf(address4.address); // liquidity address

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
        const finalCakeBalance = await pairContract.balanceOf(address4.address);

        expect(await contract.balanceOf(address1.address)).to.equal(utils.parseEther("99000"));
        expect(await contract.balanceOf(pairContract.address)).to.equal(utils.parseEther("100999.987749350064993413"));
        expect(await contract.balanceOf(address2.address)).to.equal(0);
        expect(await contract.balanceOf(address3.address)).to.equal(0);
        expect(initialDevelopmentBalance).to.be.lt(finalDevelopmentBalance); // development fee
        expect(initialMarketingBalance).to.be.lt(finalMarketingBalance); // marketing fee
        expect(initialCakeBalance).to.be.lt(finalCakeBalance); // liquidity fee
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

      describe("Max wallet amount", function () {
        beforeEach(async function () {
          await contract.setDevelopmentBuyFee(0);
          await contract.setMarketingBuyFee(0);
          await contract.setLiquidityBuyFee(0);

          await contract.setMaxWalletAmount(utils.parseEther("10000"));
        });

        it("Should allow transfer between accounts of amounts thatm exceeds maximum wallet amount allowed", async function () {
          await expect(contract.transfer(address5.address, utils.parseEther("100000"))).to.emit(contract, "Transfer");
        });

        it("Should swap ETH for Tokens if the balance of the buy after buying is lower than maximum wallet amount allowed", async function () {
          await expect(
            router
              .connect(address5)
              .swapExactETHForTokensSupportingFeeOnTransferTokens(
                0,
                [WETH, contract.address],
                address5.address,
                ethers.constants.MaxUint256,
                { value: utils.parseEther("100") },
              ),
          ).to.emit(contract, "Transfer");
        });

        it("Should revert buy transaction if the balance of the buy after buying is greater than maximum wallet amount allowed", async function () {
          await expect(
            router
              .connect(address5)
              .swapExactETHForTokensSupportingFeeOnTransferTokens(
                0,
                [WETH, contract.address],
                address5.address,
                ethers.constants.MaxUint256,
                { value: utils.parseEther("120") },
              ),
          ).to.be.revertedWith("Pancake: TRANSFER_FAILED");
        });
      });
    });
  });

  it("Automated Market Maker Pair", async function () {
    expect(await contract.setAutomatedMarketMakerPair(DEAD_ADDRESS, true));
  });
});
