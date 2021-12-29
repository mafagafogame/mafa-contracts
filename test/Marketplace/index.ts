/* eslint-disable camelcase */
import { expect } from "chai";
import { artifacts, ethers, waffle, upgrades } from "hardhat";
import type { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import fetch from "node-fetch";

import {
  BaseERC1155,
  BaseERC1155__factory,
  MafaCoin,
  Marketplace,
  MarketplaceTestV2,
  MarketplaceTestV2__factory,
  Marketplace__factory,
} from "../../typechain";
import { expandTo18Decimals } from "../shared/utilities";

describe("Unit tests", function () {
  let marketplace: Marketplace;
  let mafacoin: MafaCoin;
  let baseNft: BaseERC1155;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  const MAFA_BNB = "0xC53C7F4736F4a6DA25e950e25c58011Fe26B4a93";
  const BNB_BUSD = "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16";

  before(async function () {
    [owner, account1] = await ethers.getSigners();
  });

  describe("Marketplace", function () {
    beforeEach(async function () {
      const mafacoinArtifact: Artifact = await artifacts.readArtifact("MafaCoin");
      mafacoin = <MafaCoin>await waffle.deployContract(owner, mafacoinArtifact);

      await mafacoin.afterPreSale();
      await mafacoin.setTeamBuyFee(0);
      await mafacoin.setTeamSellFee(0);
      await mafacoin.setLiquidyFee(0);
      await mafacoin.setLotteryFee(0);
      await mafacoin.transfer(account1.address, expandTo18Decimals(100000));

      const baseNftFactory: BaseERC1155__factory = await ethers.getContractFactory("BaseERC1155");
      baseNft = <BaseERC1155>await upgrades.deployProxy(baseNftFactory, [""], {
        initializer: "initialize",
        kind: "uups",
      });

      const marketplaceFactory: Marketplace__factory = await ethers.getContractFactory("Marketplace");
      marketplace = <Marketplace>await upgrades.deployProxy(
        marketplaceFactory,
        [mafacoin.address, MAFA_BNB, BNB_BUSD],
        {
          initializer: "initialize",
          kind: "uups",
        },
      );

      await baseNft.grantRole(ethers.utils.id("MINTER_ROLE"), marketplace.address);
    });

    it("should be deployed with correct values", async function () {
      expect(await marketplace.acceptedToken()).to.equal(mafacoin.address);
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("should return the correct MAFABUSD price", async function () {
      const response = await fetch(
        "https://api.pancakeswap.info/api/v2/tokens/0xaf44400a99a9693bf3c2e89b02652babacc5cdb9",
      );
      const data = await response.json();
      const mafaPrice = parseFloat(data.data.price);

      expect(parseFloat(ethers.utils.formatEther(await marketplace.getMAFABUSDprice()))).to.be.within(
        mafaPrice - 0.01,
        mafaPrice + 0.01,
      );
    });

    describe("non owner", function () {
      it("non owner user should not be able to set the price of an item", async function () {
        await expect(
          marketplace.connect(account1).setItemPrice(baseNft.address, 0, expandTo18Decimals(100)),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("owner", function () {
      describe("set item price", function () {
        it("owner should not be able to set the price of an item if price is 0", async function () {
          await expect(marketplace.setItemPrice(account1.address, 0, expandTo18Decimals(0))).to.be.revertedWith(
            "Item price can't be 0",
          );
        });

        it("owner should be able to set the price of an item", async function () {
          await expect(marketplace.setItemPrice(baseNft.address, 0, expandTo18Decimals(100)))
            .to.emit(marketplace, "ItemPriceUpdated")
            .withArgs(baseNft.address, 0, expandTo18Decimals(100));

          expect(await marketplace.itemPrices(baseNft.address, 0)).to.equal(expandTo18Decimals(100));
        });

        it("owner should be able to reset the price of an item", async function () {
          await expect(marketplace.setItemPrice(baseNft.address, 0, expandTo18Decimals(100)))
            .to.emit(marketplace, "ItemPriceUpdated")
            .withArgs(baseNft.address, 0, expandTo18Decimals(100));

          expect(await marketplace.itemPrices(baseNft.address, 0)).to.equal(expandTo18Decimals(100));

          await expect(marketplace.setItemPrice(baseNft.address, 0, expandTo18Decimals(200)))
            .to.emit(marketplace, "ItemPriceUpdated")
            .withArgs(baseNft.address, 0, expandTo18Decimals(200));

          expect(await marketplace.itemPrices(baseNft.address, 0)).to.equal(expandTo18Decimals(200));
        });
      });
    });

    describe("buy item", function () {
      it("user shouldn't be able to buy an item passing a NFT address that isn't acceptable", async function () {
        await expect(marketplace.buyItem(baseNft.address, 0, 1)).to.be.revertedWith("NFT address is not acceptable");
      });

      it("user should not be able to buy an item if he doesn't allow the transfer", async function () {
        await marketplace.setItemPrice(baseNft.address, 0, expandTo18Decimals(100));

        await expect(marketplace.connect(account1).buyItem(baseNft.address, 0, 1)).to.be.revertedWith(
          "Check the token allowance",
        );
      });

      it("user should not be able to buy an item if allowances are not enough", async function () {
        await marketplace.setItemPrice(baseNft.address, 0, expandTo18Decimals(100));

        await mafacoin.connect(account1).approve(marketplace.address, expandTo18Decimals(1));

        await expect(marketplace.connect(account1).buyItem(baseNft.address, 0, 1)).to.be.revertedWith(
          "Check the token allowance",
        );
      });

      it("user should be able to buy an item", async function () {
        await marketplace.setItemPrice(baseNft.address, 0, expandTo18Decimals(100));

        await mafacoin.connect(account1).approve(marketplace.address, ethers.constants.MaxUint256);

        expect(await baseNft.totalSupply(0)).to.equal(0);
        expect(await mafacoin.balanceOf(account1.address)).to.equal(expandTo18Decimals(100000));
        expect(await baseNft.balanceOf(account1.address, 0)).to.equal(0);

        await expect(marketplace.connect(account1).buyItem(baseNft.address, 0, 1)).to.emit(
          marketplace,
          "ProductBought",
        );

        expect(await baseNft.totalSupply(0)).to.equal(1);
        expect(parseFloat(ethers.utils.formatEther(await mafacoin.balanceOf(account1.address)))).to.be.within(
          97000,
          98000,
        );
        expect(await baseNft.balanceOf(account1.address, 0)).to.equal(1);
      });
    });

    describe("pause", function () {
      it("contract should initiate unpaused", async function () {
        expect(await marketplace.paused()).to.equal(false);
      });

      it("owner should be able to pause/unpause contract", async function () {
        await marketplace.pause();
        expect(await marketplace.paused()).to.equal(true);

        await marketplace.unpause();
        expect(await marketplace.paused()).to.equal(false);
      });
    });

    describe("upgradable", function () {
      it("should initiate on version 1.0.0", async function () {
        expect(await marketplace.version()).to.equal("1.0.0");
      });

      it("should be upgradable", async function () {
        expect(await marketplace.version()).to.equal("1.0.0");
        const marketplaceFactoryV2: MarketplaceTestV2__factory = await ethers.getContractFactory("MarketplaceTestV2");
        const marketplaceV2 = <MarketplaceTestV2>(
          await upgrades.upgradeProxy(marketplace, marketplaceFactoryV2, { kind: "uups" })
        );

        expect(await marketplaceV2.version()).to.equal("2.0.0");
      });
    });
  });
});
