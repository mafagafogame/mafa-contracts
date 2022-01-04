/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BaseERC1155,
  BaseERC1155__factory,
  MafaCoin, MafaCoin__factory, MafaStore, MafaStore__factory, MafaStoreTestV2, MafaStoreTestV2__factory,
} from "../../typechain";
import {deployMafaCoin, expandTo18Decimals} from "../shared/utilities";
import axios from "axios";

describe("MafaStore", function () {
  let mafastore: MafaStore;
  let mafacoin: MafaCoin;
  let baseNft: BaseERC1155;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let mafaPrice: number;
  const MAFA_BNB = "0xC53C7F4736F4a6DA25e950e25c58011Fe26B4a93";
  const BNB_BUSD = "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16";

  before(async function () {
    [owner, account1] = await ethers.getSigners();
  });

  describe("MafaStore", function () {
    beforeEach(async function () {
      mafacoin = await deployMafaCoin(owner);
      await mafacoin.transfer(account1.address, expandTo18Decimals(100000));

      const baseNftFactory: BaseERC1155__factory = <BaseERC1155__factory>await ethers.getContractFactory("BaseERC1155");
      baseNft = <BaseERC1155>await upgrades.deployProxy(baseNftFactory, [""], {
        initializer: "initialize",
        kind: "uups",
      });

      const mafastoreFactory: MafaStore__factory = <MafaStore__factory>await ethers.getContractFactory("MafaStore");
      mafastore = <MafaStore>await upgrades.deployProxy(
        mafastoreFactory,
        [mafacoin.address, MAFA_BNB, BNB_BUSD],
        {
          initializer: "initialize",
          kind: "uups",
        },
      );

      await baseNft.grantRole(ethers.utils.id("MINTER_ROLE"), mafastore.address);
    });

    it("should be deployed with correct values", async function () {
      expect(await mafastore.acceptedToken()).to.equal(mafacoin.address);
      expect(await mafastore.owner()).to.equal(owner.address);
    });

    it("should return the correct MAFABUSD price", async function () {
      const response = await axios(
        "https://api.pancakeswap.info/api/v2/tokens/0xaf44400a99a9693bf3c2e89b02652babacc5cdb9",
      );
      const data = await response.data;
      mafaPrice = parseFloat(data.data.price);

      expect(parseFloat(ethers.utils.formatEther(await mafastore.getMAFAtoBUSDprice()))).to.be.within(
        mafaPrice - 0.01,
        mafaPrice + 0.01,
      );
    });

    describe("non owner", function () {
      it("non owner user should not be able to set the price of an item", async function () {
        await expect(
          mafastore.connect(account1).createItem(baseNft.address, 0, expandTo18Decimals(100)),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("owner", function () {
      describe("create item", function () {
        it("owner should not be able to create an item passing a non contract NFT address", async function () {
          await expect(mafastore.createItem(account1.address, 0, expandTo18Decimals(0))).to.be.revertedWith(
            "NFT address must be a contract",
          );
        });

        it("owner should not be able to create an item with 0 price", async function () {
          await expect(mafastore.createItem(baseNft.address, 0, expandTo18Decimals(0))).to.be.revertedWith(
            "Item price can't be 0",
          );
        });

        it("owner should be able to create an item", async function () {
          await expect(mafastore.createItem(baseNft.address, 0, expandTo18Decimals(100)))
            .to.emit(mafastore, "ItemCreated")
            .withArgs(baseNft.address, 0, 0, expandTo18Decimals(100));
        });
      });
    });

    describe("buy item", function () {
      it("user shouldn't be able to buy an item passing an id that doesn't exists", async function () {
        await expect(mafastore.buyItem(0, 1)).to.be.revertedWith("Item doesn't exists");
      });

      it("user should not be able to buy an item if he doesn't allow the transfer", async function () {
        await mafastore.createItem(baseNft.address, 0, expandTo18Decimals(100));

        await expect(mafastore.connect(account1).buyItem(0, 1)).to.be.revertedWith("Check the token allowance");
      });

      it("user should not be able to buy an item if allowances are not enough", async function () {
        await mafastore.createItem(baseNft.address, 0, expandTo18Decimals(100));

        await mafacoin.connect(account1).approve(mafastore.address, expandTo18Decimals(1));

        await expect(mafastore.connect(account1).buyItem(0, 1)).to.be.revertedWith("Check the token allowance");
      });

      it("user should be able to buy an item", async function () {
        await mafastore.createItem(baseNft.address, 0, expandTo18Decimals(100));

        await mafacoin.connect(account1).approve(mafastore.address, ethers.constants.MaxUint256);

        expect(await baseNft.totalSupply(0)).to.equal(0);
        expect(await mafacoin.balanceOf(account1.address)).to.equal(expandTo18Decimals(100000));
        expect(await baseNft.balanceOf(account1.address, 0)).to.equal(0);

        await expect(mafastore.connect(account1).buyItem(0, 1)).to.emit(mafastore, "ItemBought");

        expect(await baseNft.totalSupply(0)).to.equal(1);
        expect(parseFloat(ethers.utils.formatEther(await mafacoin.balanceOf(account1.address)))).to.be.within(
          100000 - 100 / mafaPrice - 100,
          100000 - 100 / mafaPrice + 100,
        );
        expect(await baseNft.balanceOf(account1.address, 0)).to.equal(1);
      });

      it("user should be able to buy multiple amounts of an item", async function () {
        await mafastore.createItem(baseNft.address, 0, expandTo18Decimals(100));

        await mafacoin.connect(account1).approve(mafastore.address, ethers.constants.MaxUint256);

        expect(await baseNft.totalSupply(0)).to.equal(0);
        expect(await mafacoin.balanceOf(account1.address)).to.equal(expandTo18Decimals(100000));
        expect(await baseNft.balanceOf(account1.address, 0)).to.equal(0);

        await expect(mafastore.connect(account1).buyItem(0, 5)).to.emit(mafastore, "ItemBought");

        expect(await baseNft.totalSupply(0)).to.equal(5);
        expect(parseFloat(ethers.utils.formatEther(await mafacoin.balanceOf(account1.address)))).to.be.within(
          100000 - (5 * 100) / mafaPrice - 100,
          100000 - (5 * 100) / mafaPrice + 100,
        );
        expect(await baseNft.balanceOf(account1.address, 0)).to.equal(5);
      });
    });

    describe("pause", function () {
      it("contract should initiate unpaused", async function () {
        expect(await mafastore.paused()).to.equal(false);
      });

      it("owner should be able to pause/unpause contract", async function () {
        await mafastore.pause();
        expect(await mafastore.paused()).to.equal(true);

        await mafastore.unpause();
        expect(await mafastore.paused()).to.equal(false);
      });
    });

    describe("upgradable", function () {
      it("should initiate on version 1.0.0", async function () {
        expect(await mafastore.version()).to.equal("1.0.0");
      });

      it("should be upgradable", async function () {
        expect(await mafastore.version()).to.equal("1.0.0");
        const mafastoreFactoryV2: MafaStoreTestV2__factory = <MafaStoreTestV2__factory>await ethers.getContractFactory("MafaStoreTestV2");
        const mafastoreV2 = <MafaStoreTestV2>(
          await upgrades.upgradeProxy(mafastore, mafastoreFactoryV2, { kind: "uups" })
        );

        expect(await mafastoreV2.version()).to.equal("2.0.0");
      });
    });
  });
});
