import { expect } from "chai";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { MafaCoin, MafagafoNft, NftCrowdSale } from "../../typechain";
import { expandTo18Decimals } from "../shared/utilities";

describe("Unit tests", function () {
  let marketplace: NftCrowdSale;
  let mafacoin: MafaCoin;
  let mafagafo: MafagafoNft;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  const TOKEN_URI = "https://ipfs.io/ipfs/QmWaurhfmT8df3tadivGyqErCR5bhu9wSB59GpLm192mLh/metadata.json";

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
      await mafacoin.transfer(account1.address, expandTo18Decimals(1000));

      const mafagafoArtifact: Artifact = await artifacts.readArtifact("MafagafoNft");
      mafagafo = <MafagafoNft>await waffle.deployContract(owner, mafagafoArtifact);

      const marketplaceArtifact: Artifact = await artifacts.readArtifact("NftCrowdSale");
      marketplace = <NftCrowdSale>await waffle.deployContract(owner, marketplaceArtifact, [mafacoin.address]);

      await mafagafo.setMinter(marketplace.address, true);
    });

    it("should be deployed with correct values", async function () {
      expect(await marketplace.acceptedToken()).to.equal(mafacoin.address);
      expect(await marketplace.orderCounter()).to.equal(0);
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("non owner users should not be able to create orders", async function () {
      await expect(
        marketplace.connect(account1).createOrder(mafagafo.address, expandTo18Decimals(100), "mafagafo"),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("non owner users should not be able to cancel orders", async function () {
      await expect(marketplace.connect(account1).cancelOrder(0)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    describe("owner", function () {
      it("owner should not be able to create orders with 0 price", async function () {
        await expect(marketplace.createOrder(mafagafo.address, expandTo18Decimals(0), "mafagafo")).to.be.revertedWith(
          "Price should be bigger than 0",
        );
      });

      it("owner should be able to create orders", async function () {
        await expect(marketplace.createOrder(mafagafo.address, expandTo18Decimals(100), "mafagafo"))
          .to.emit(marketplace, "OrderCreated")
          .withArgs(0, mafagafo.address, expandTo18Decimals(100), "mafagafo");

        expect(await marketplace.orderCounter()).to.equal(1);
      });

      it("owner should not be able to cancel an order that doesn't exists", async function () {
        await expect(marketplace.cancelOrder(0)).to.be.revertedWith("Order is not Open");
      });

      it("owner should be able to cancel orders", async function () {
        await marketplace.createOrder(mafagafo.address, expandTo18Decimals(100), "mafagafo");

        await expect(marketplace.cancelOrder(0)).to.emit(marketplace, "OrderCancelled").withArgs(0, mafagafo.address);
      });
    });

    it("user should not be able to execute an order that doesn't exists", async function () {
      await expect(marketplace.connect(account1).executeOrder(0, TOKEN_URI)).to.be.revertedWith("Order is not Open");
    });

    it("user should not be able to execute an opened order if he doesn't allow the transfer", async function () {
      await marketplace.createOrder(mafagafo.address, expandTo18Decimals(100), "mafagafo");

      await expect(marketplace.connect(account1).executeOrder(0, TOKEN_URI)).to.be.revertedWith(
        "Check the token allowance",
      );
    });

    it("user should not be able to execute a cancelled order", async function () {
      await marketplace.createOrder(mafagafo.address, expandTo18Decimals(100), "mafagafo");
      await marketplace.cancelOrder(0);

      await mafacoin.connect(account1).approve(marketplace.address, expandTo18Decimals(100));

      await expect(marketplace.connect(account1).executeOrder(0, TOKEN_URI)).to.be.revertedWith("Order is not Open");
    });

    it("user should be able to execute an opened order", async function () {
      await marketplace.createOrder(mafagafo.address, expandTo18Decimals(100), "mafagafo");

      await mafacoin.connect(account1).approve(marketplace.address, expandTo18Decimals(100));

      await expect(marketplace.connect(account1).executeOrder(0, TOKEN_URI))
        .to.emit(marketplace, "OrderExecuted")
        .withArgs(0, 0, TOKEN_URI, owner.address, mafagafo.address, expandTo18Decimals(100), account1.address);

      expect(await mafagafo.tokenURI(0)).to.equal(TOKEN_URI);
    });

    it("user should not be able to execute an order that have been already executed", async function () {
      await marketplace.createOrder(mafagafo.address, expandTo18Decimals(100), "mafagafo");
      await mafacoin.connect(account1).approve(marketplace.address, expandTo18Decimals(100));
      marketplace.connect(account1).executeOrder(0, TOKEN_URI);

      await expect(marketplace.connect(account1).executeOrder(0, TOKEN_URI)).to.be.revertedWith("Order is not Open");
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

      it("owner should be able to create/cancel orders when contract is paused", async function () {
        await marketplace.pause();

        await marketplace.createOrder(mafagafo.address, expandTo18Decimals(100), "mafagafo");

        await expect(marketplace.cancelOrder(0)).to.emit(marketplace, "OrderCancelled").withArgs(0, mafagafo.address);
      });

      it("users should not be able to execute orders when contract is paused", async function () {
        await marketplace.pause();

        await marketplace.createOrder(mafagafo.address, expandTo18Decimals(100), "mafagafo");

        await expect(marketplace.connect(account1).executeOrder(0, TOKEN_URI)).to.be.revertedWith("Pausable: paused");
      });
    });
  });
});
