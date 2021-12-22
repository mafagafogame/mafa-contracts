/* eslint-disable camelcase */
import { expect } from "chai";
import { artifacts, ethers, waffle, upgrades } from "hardhat";
import type { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BaseNft,
  BaseNft__factory,
  MafaCoin,
  NftStore,
  NftStoreTestV2,
  NftStoreTestV2__factory,
  NftStore__factory,
} from "../../typechain";
import { expandTo18Decimals } from "../shared/utilities";

describe("Unit tests", function () {
  let nftStore: NftStore;
  let mafacoin: MafaCoin;
  let baseNft: BaseNft;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  const TOKEN_URI = "https://ipfs.io/ipfs/QmWaurhfmT8df3tadivGyqErCR5bhu9wSB59GpLm192mLh/metadata.json/";

  before(async function () {
    [owner, account1] = await ethers.getSigners();
  });

  describe("NFT Store", function () {
    beforeEach(async function () {
      const mafacoinArtifact: Artifact = await artifacts.readArtifact("MafaCoin");
      mafacoin = <MafaCoin>await waffle.deployContract(owner, mafacoinArtifact);

      await mafacoin.afterPreSale();
      await mafacoin.setTeamBuyFee(0);
      await mafacoin.setTeamSellFee(0);
      await mafacoin.setLiquidyFee(0);
      await mafacoin.setLotteryFee(0);
      await mafacoin.transfer(account1.address, expandTo18Decimals(1000));

      const baseNftFactory: BaseNft__factory = await ethers.getContractFactory("BaseNft");
      baseNft = <BaseNft>await upgrades.deployProxy(baseNftFactory, ["mafagafo", "MAFA", TOKEN_URI], {
        initializer: "initialize",
        kind: "uups",
      });

      const nftStoreFactory: NftStore__factory = await ethers.getContractFactory("NftStore");
      nftStore = <NftStore>await upgrades.deployProxy(nftStoreFactory, [mafacoin.address], {
        initializer: "initialize",
        kind: "uups",
      });

      await baseNft.grantRole(ethers.utils.id("MINTER_ROLE"), nftStore.address);
    });

    it("should be deployed with correct values", async function () {
      expect(await nftStore.acceptedToken()).to.equal(mafacoin.address);
      expect(await nftStore.owner()).to.equal(owner.address);
    });

    describe("non owner", function () {
      it("non owner user should not be able to add an item", async function () {
        await expect(
          nftStore.connect(account1).addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 100),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("non owner user should not be able to remove products", async function () {
        await expect(nftStore.connect(account1).removeProducts("mafagafo", 1)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });
    });

    describe("owner", function () {
      describe("add item", function () {
        it("owner should not be able to add an item that has already been added", async function () {
          await nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 100);

          await expect(nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(0), 100)).to.be.revertedWith(
            "Item has already been added",
          );
        });

        it("owner should not be able to add an item with no products", async function () {
          await expect(nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(0), 0)).to.be.revertedWith(
            "Must add at least one product",
          );
        });

        it("owner should not be able to add item with non contract nft address", async function () {
          await expect(nftStore.addItem("mafagafo", account1.address, expandTo18Decimals(0), 100)).to.be.revertedWith(
            "function call to a non-contract account",
          );
        });

        it("owner should not be able to add an item with no price", async function () {
          await expect(nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(0), 100)).to.be.revertedWith(
            "Item price should be bigger than 0",
          );
        });

        it("owner should not be able to add an item with no name", async function () {
          await expect(nftStore.addItem("", baseNft.address, expandTo18Decimals(100), 100)).to.be.revertedWith(
            "Item must have some name",
          );
        });

        it("owner should be able to add an item", async function () {
          await expect(nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 100))
            .to.emit(nftStore, "ItemAdded")
            .withArgs("mafagafo", baseNft.address, expandTo18Decimals(100), 100);
        });
      });

      describe("remove products", function () {
        it("owner should not be able to remove products of an item that doesn't exist", async function () {
          await expect(nftStore.removeProducts("mafagafo", 1)).to.be.revertedWith("Item has not been added");
        });

        it("owner should be able to remove products", async function () {
          await nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 100);

          await expect(nftStore.removeProducts("mafagafo", 1))
            .to.emit(nftStore, "ProductsRemoved")
            .withArgs("mafagafo", baseNft.address, 99);
        });
      });
    });

    describe("buy product", function () {
      it("user should not be able to buy an product of an item that doesn't exist", async function () {
        await expect(nftStore.connect(account1).buyProduct("mafagafo")).to.be.revertedWith("Item has not been added");
      });

      it("user should not be able to buy a product if he doesn't allow the transfer", async function () {
        await nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 100);

        await expect(nftStore.connect(account1).buyProduct("mafagafo")).to.be.revertedWith("Check the token allowance");
      });

      it("user should not be able to buy a product that has been removed", async function () {
        await nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 100);
        await nftStore.removeProducts("mafagafo", 100);

        await mafacoin.connect(account1).approve(nftStore.address, expandTo18Decimals(100));

        await expect(nftStore.connect(account1).buyProduct("mafagafo")).to.be.revertedWith("Item has not been added");
      });

      it("user should be able to buy a product", async function () {
        await nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 100);

        await mafacoin.connect(account1).approve(nftStore.address, expandTo18Decimals(100));

        await expect(nftStore.connect(account1).buyProduct("mafagafo"))
          .to.emit(nftStore, "ProductBought")
          .withArgs(
            "mafagafo",
            owner.address,
            TOKEN_URI,
            baseNft.address,
            expandTo18Decimals(100),
            account1.address,
            99,
          );

        expect(await baseNft.tokenURI(0)).to.equal(TOKEN_URI + "0");
      });

      it("user should not be able to buy a product that has been removed", async function () {
        await nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 1);
        await mafacoin.connect(account1).approve(nftStore.address, expandTo18Decimals(100));
        nftStore.connect(account1).buyProduct("mafagafo");

        await expect(nftStore.connect(account1).buyProduct("mafagafo")).to.be.revertedWith("Item has not been added");
      });
    });

    describe("pause", function () {
      it("contract should initiate unpaused", async function () {
        expect(await nftStore.paused()).to.equal(false);
      });

      it("owner should be able to pause/unpause contract", async function () {
        await nftStore.pause();
        expect(await nftStore.paused()).to.equal(true);

        await nftStore.unpause();
        expect(await nftStore.paused()).to.equal(false);
      });

      it("owner should be able to add item and remove products when contract is paused", async function () {
        await nftStore.pause();

        await expect(nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 100))
          .to.emit(nftStore, "ItemAdded")
          .withArgs("mafagafo", baseNft.address, expandTo18Decimals(100), 100);

        await expect(nftStore.removeProducts("mafagafo", 1))
          .to.emit(nftStore, "ProductsRemoved")
          .withArgs("mafagafo", baseNft.address, 99);
      });

      it("user should not be able to buy a product when contract is paused", async function () {
        await nftStore.pause();

        await nftStore.addItem("mafagafo", baseNft.address, expandTo18Decimals(100), 100);

        await expect(nftStore.connect(account1).buyProduct("mafagafo")).to.be.revertedWith("Pausable: paused");
      });
    });

    describe("upgradable", function () {
      it("should initiate on version 1.0.0", async function () {
        expect(await nftStore.version()).to.equal("1.0.0");
      });

      it("should be upgradable", async function () {
        expect(await nftStore.version()).to.equal("1.0.0");
        const nftStoreFactoryV2: NftStoreTestV2__factory = await ethers.getContractFactory("NftStoreTestV2");
        const nftStoreV2 = <NftStoreTestV2>await upgrades.upgradeProxy(nftStore, nftStoreFactoryV2, { kind: "uups" });

        expect(await nftStoreV2.version()).to.equal("2.0.0");
      });
    });
  });
});
