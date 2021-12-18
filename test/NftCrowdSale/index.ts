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
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    describe("non owner", function () {
      it("non owner user should not be able to open orders", async function () {
        await expect(
          marketplace.connect(account1).openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 100),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("non owner user should not be able to cancel orders", async function () {
        await expect(marketplace.connect(account1).cancelOrders("mafagafo", 1)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });
    });

    describe("owner", function () {
      describe("open orders", function () {
        it("owner should not be able to open orders that have already been opened", async function () {
          await marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 100);

          await expect(
            marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(0), 100),
          ).to.be.revertedWith("Order has already been opened");
        });

        it("owner should not be able to open orders with no items", async function () {
          await expect(
            marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(0), 0),
          ).to.be.revertedWith("Order must have at least 1 item");
        });

        it("owner should not be able to open orders with non contract address", async function () {
          await expect(
            marketplace.openOrders("mafagafo", account1.address, expandTo18Decimals(0), 100),
          ).to.be.revertedWith("The NFT Address should be a contract");
        });

        it("owner should not be able to open orders with no price", async function () {
          await expect(
            marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(0), 100),
          ).to.be.revertedWith("Order price should be bigger than 0");
        });

        it("owner should not be able to open orders with no item value", async function () {
          await expect(marketplace.openOrders("", mafagafo.address, expandTo18Decimals(100), 100)).to.be.revertedWith(
            "Item must have some value",
          );
        });

        it("owner should be able to open orders", async function () {
          await expect(marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 100))
            .to.emit(marketplace, "OrdersOpened")
            .withArgs("mafagafo", mafagafo.address, expandTo18Decimals(100), 100);
        });
      });

      describe("cancel order", function () {
        it("owner should not be able to cancel orders that are not open", async function () {
          await expect(marketplace.cancelOrders("mafagafo", 1)).to.be.revertedWith("Order is not open");
        });

        it("owner should be able to cancel orders", async function () {
          await marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 100);

          await expect(marketplace.cancelOrders("mafagafo", 1))
            .to.emit(marketplace, "OrdersCanceled")
            .withArgs("mafagafo", mafagafo.address, 99);
        });
      });
    });

    describe("execute order", function () {
      it("user should not be able to execute an order that doesn't exists", async function () {
        await expect(marketplace.connect(account1).executeOrder("mafagafo", TOKEN_URI)).to.be.revertedWith(
          "Order is not open",
        );
      });

      it("user should not be able to execute an opened order if he doesn't allow the transfer", async function () {
        await marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 100);

        await expect(marketplace.connect(account1).executeOrder("mafagafo", TOKEN_URI)).to.be.revertedWith(
          "Check the token allowance",
        );
      });

      it("user should not be able to execute a canceled order", async function () {
        await marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 100);
        await marketplace.cancelOrders("mafagafo", 100);

        await mafacoin.connect(account1).approve(marketplace.address, expandTo18Decimals(100));

        await expect(marketplace.connect(account1).executeOrder("mafagafo", TOKEN_URI)).to.be.revertedWith(
          "Order is not open",
        );
      });

      it("user should be able to execute an opened order", async function () {
        await marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 100);

        await mafacoin.connect(account1).approve(marketplace.address, expandTo18Decimals(100));

        await expect(marketplace.connect(account1).executeOrder("mafagafo", TOKEN_URI))
          .to.emit(marketplace, "OrderExecuted")
          .withArgs(
            "mafagafo",
            0,
            TOKEN_URI,
            owner.address,
            mafagafo.address,
            expandTo18Decimals(100),
            account1.address,
            99,
          );

        expect(await mafagafo.tokenURI(0)).to.equal(TOKEN_URI);
      });

      it("user should not be able to execute an order that have been closed", async function () {
        await marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 1);
        await mafacoin.connect(account1).approve(marketplace.address, expandTo18Decimals(100));
        marketplace.connect(account1).executeOrder("mafagafo", TOKEN_URI);

        await expect(marketplace.connect(account1).executeOrder("mafagafo", TOKEN_URI)).to.be.revertedWith(
          "Order is not open",
        );
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

      it("owner should be able to open/cancel orders when contract is paused", async function () {
        await marketplace.pause();

        await expect(marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 100))
          .to.emit(marketplace, "OrdersOpened")
          .withArgs("mafagafo", mafagafo.address, expandTo18Decimals(100), 100);

        await expect(marketplace.cancelOrders("mafagafo", 1))
          .to.emit(marketplace, "OrdersCanceled")
          .withArgs("mafagafo", mafagafo.address, 99);
      });

      it("user should not be able to execute orders when contract is paused", async function () {
        await marketplace.pause();

        await marketplace.openOrders("mafagafo", mafagafo.address, expandTo18Decimals(100), 100);

        await expect(marketplace.connect(account1).executeOrder("mafagafo", TOKEN_URI)).to.be.revertedWith(
          "Pausable: paused",
        );
      });
    });
  });
});
