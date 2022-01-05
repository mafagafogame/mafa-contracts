/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BrooderNft,
  BrooderNft__factory,
  EggNft,
  EggNft__factory,
  MafaCoin,
  MafagafoAvatarNft,
  MafagafoAvatarNft__factory,
  MafaStore,
  MafaStore__factory,
  MafaStoreTestV2,
  MafaStoreTestV2__factory,
} from "../../typechain";
import { bigNumberToFloat, deployMafaCoin, expandTo18Decimals } from "../shared/utilities";
import axios from "axios";

describe("MafaStore", function () {
  let mafastore: MafaStore;
  let mafacoin: MafaCoin;
  let brooder: BrooderNft;
  let egg: EggNft;
  let mafagafoAvatar: MafagafoAvatarNft;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let mafaPrice: number;
  const MAFA_BNB = "0xC53C7F4736F4a6DA25e950e25c58011Fe26B4a93";
  const BNB_BUSD = "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16";

  before(async function () {
    [owner, account1, account2] = await ethers.getSigners();
  });

  describe("MafaStore", function () {
    beforeEach(async function () {
      mafacoin = await deployMafaCoin(owner);
      await mafacoin.transfer(account1.address, expandTo18Decimals(100000));

      const brooderFactory: BrooderNft__factory = await ethers.getContractFactory("BrooderNft");
      brooder = <BrooderNft>await upgrades.deployProxy(brooderFactory, [], {
        initializer: "initialize",
        kind: "uups",
      });

      const eggFactory: EggNft__factory = await ethers.getContractFactory("EggNft");
      egg = <EggNft>await upgrades.deployProxy(eggFactory, [brooder.address], {
        initializer: "initialize",
        kind: "uups",
      });

      const mafagafoAvatarFactory: MafagafoAvatarNft__factory = await ethers.getContractFactory("MafagafoAvatarNft");
      mafagafoAvatar = <MafagafoAvatarNft>await upgrades.deployProxy(mafagafoAvatarFactory, [egg.address], {
        initializer: "initialize",
        kind: "uups",
      });

      egg.setMafagafoContract(mafagafoAvatar.address);

      const mafastoreFactory: MafaStore__factory = <MafaStore__factory>await ethers.getContractFactory("MafaStore");
      mafastore = <MafaStore>await upgrades.deployProxy(
        mafastoreFactory,
        [mafacoin.address, mafagafoAvatar.address, MAFA_BNB, BNB_BUSD],
        {
          initializer: "initialize",
          kind: "uups",
        },
      );

      await brooder.grantRole(ethers.utils.id("MINTER_ROLE"), mafastore.address);
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

      expect(bigNumberToFloat(await mafastore.getMAFAtoBUSDprice())).to.be.within(mafaPrice - 0.01, mafaPrice + 0.01);
    });

    describe("non owner", function () {
      it("non owner user should not be able to create an item", async function () {
        await expect(
          mafastore.connect(account1).createItem(brooder.address, 0, expandTo18Decimals(100)),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("non owner user should not be able to update the price of an item", async function () {
        await mafastore.createItem(brooder.address, 0, expandTo18Decimals(100));

        await expect(mafastore.connect(account1).updateItemPrice(0, expandTo18Decimals(200))).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("non owner user should not be able to withdraw BNB", async function () {
        await expect(mafastore.connect(account1).withdraw(account1.address, expandTo18Decimals(1))).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("non owner user should not be able to withdraw ERC20", async function () {
        await expect(
          mafastore.connect(account1).withdrawERC20(mafacoin.address, account1.address, expandTo18Decimals(1)),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("non owner user should not be able to withdraw ERC721", async function () {
        await expect(
          mafastore.connect(account1).withdrawERC721(mafagafoAvatar.address, account1.address, 1),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("non owner user should not be able to withdraw ERC1155", async function () {
        await expect(
          mafastore.connect(account1).withdrawERC1155(brooder.address, account1.address, 1, 2),
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
          await expect(mafastore.createItem(brooder.address, 0, expandTo18Decimals(0))).to.be.revertedWith(
            "Item price can't be 0",
          );
        });

        it("owner should be able to create an item", async function () {
          await expect(mafastore.createItem(brooder.address, 0, expandTo18Decimals(100)))
            .to.emit(mafastore, "ItemCreated")
            .withArgs(brooder.address, 0, 0, expandTo18Decimals(100));
        });
      });

      describe("update item price", function () {
        it("owner should not be able to update the price of an item to 0", async function () {
          await mafastore.createItem(brooder.address, 0, expandTo18Decimals(100));

          await expect(mafastore.updateItemPrice(0, expandTo18Decimals(0))).to.be.revertedWith("Item price can't be 0");
        });

        it("owner should not be able to update the price of an item that doesn't exists", async function () {
          await expect(mafastore.updateItemPrice(0, expandTo18Decimals(200))).to.be.revertedWith("Item doesn't exists");
        });

        it("owner should be able to update the price of an item", async function () {
          await mafastore.createItem(brooder.address, 0, expandTo18Decimals(100));

          await expect(mafastore.updateItemPrice(0, expandTo18Decimals(200)))
            .to.emit(mafastore, "ItemPriceUpdated")
            .withArgs(0, expandTo18Decimals(200));

          const item = await mafastore.items(0);
          expect(item[2]).to.equal(expandTo18Decimals(200));
        });
      });
    });

    describe("buy item", function () {
      it("user should not be able to buy an item passing an id that doesn't exists", async function () {
        await expect(mafastore.buyItem(0, 1)).to.be.revertedWith("Item doesn't exists");
      });

      it("user should not be able to buy an item if he doesn't allow the transfer", async function () {
        await mafastore.createItem(brooder.address, 0, expandTo18Decimals(100));

        await expect(mafastore.connect(account1).buyItem(0, 1)).to.be.revertedWith("Check the token allowance");
      });

      it("user should not be able to buy an item if allowances are not enough", async function () {
        await mafastore.createItem(brooder.address, 0, expandTo18Decimals(100));

        await mafacoin.connect(account1).approve(mafastore.address, expandTo18Decimals(1));

        await expect(mafastore.connect(account1).buyItem(0, 1)).to.be.revertedWith("Check the token allowance");
      });

      it("user should not be able to buy an item if he doesn't have enough balance", async function () {
        await mafastore.createItem(brooder.address, 0, expandTo18Decimals(100));

        await mafacoin.connect(account2).approve(mafastore.address, ethers.constants.MaxUint256);

        await expect(mafastore.connect(account2).buyItem(0, 1)).to.be.revertedWith(
          "ERC20: transfer amount exceeds balance",
        );
      });

      it("user should be able to buy an item", async function () {
        await mafastore.createItem(brooder.address, 0, expandTo18Decimals(100));

        await mafacoin.connect(account1).approve(mafastore.address, ethers.constants.MaxUint256);

        expect(await brooder.totalSupply(0)).to.equal(0);
        expect(await mafacoin.balanceOf(account1.address)).to.equal(expandTo18Decimals(100000));
        expect(await brooder.balanceOf(account1.address, 0)).to.equal(0);

        await expect(mafastore.connect(account1).buyItem(0, 1)).to.emit(mafastore, "ItemBought");

        expect(await brooder.totalSupply(0)).to.equal(1);
        expect(bigNumberToFloat(await mafacoin.balanceOf(account1.address))).to.be.within(
          100000 - 100 / mafaPrice - 100,
          100000 - 100 / mafaPrice + 100,
        );
        expect(await brooder.balanceOf(account1.address, 0)).to.equal(1);
      });

      it("user should be able to buy multiple amounts of an item", async function () {
        await mafastore.createItem(brooder.address, 0, expandTo18Decimals(100));

        await mafacoin.connect(account1).approve(mafastore.address, ethers.constants.MaxUint256);

        expect(await brooder.totalSupply(0)).to.equal(0);
        expect(await mafacoin.balanceOf(account1.address)).to.equal(expandTo18Decimals(100000));
        expect(await brooder.balanceOf(account1.address, 0)).to.equal(0);

        await expect(mafastore.connect(account1).buyItem(0, 5)).to.emit(mafastore, "ItemBought");

        expect(await brooder.totalSupply(0)).to.equal(5);
        expect(bigNumberToFloat(await mafacoin.balanceOf(account1.address))).to.be.within(
          100000 - (5 * 100) / mafaPrice - 100,
          100000 - (5 * 100) / mafaPrice + 100,
        );
        expect(await brooder.balanceOf(account1.address, 0)).to.equal(5);
      });
    });

    describe("sell avatar", function () {
      it("user should not be able to sell an avatar if mafastore contract doesn't have enough MAFAs", async function () {
        await expect(mafastore.connect(account1).sellAvatar(0)).to.be.revertedWith(
          "The mafastore is unable to receive new avatars for the moment",
        );
      });

      describe("after transfering some MAFAs to the mafastore", function () {
        beforeEach(async function () {
          await mafacoin.transfer(mafastore.address, expandTo18Decimals(100000));
        });

        it("user should not be able to sell an avatar that he doesn't own", async function () {
          await expect(mafastore.connect(account1).sellAvatar(0)).to.be.revertedWith(
            "You have to own this avatar to be able to sell it",
          );
        });

        describe("after user has a nft to sell", function () {
          beforeEach(async function () {
            await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
              account1.address,
              0,
              ethers.utils.id("0"),
              0,
              0,
              0,
            );
          });

          it("user should not be able to sell an avatar if he doesn't approve the transfer before", async function () {
            await expect(mafastore.connect(account1).sellAvatar(1)).to.be.revertedWith(
              "Check the token approval for this token ID",
            );
          });

          it("user should be able to sell an avatar", async function () {
            expect(await mafagafoAvatar.ownerOf(1)).to.equal(account1.address);

            await mafagafoAvatar.connect(account1).approve(mafastore.address, 1);

            await expect(mafastore.connect(account1).sellAvatar(1))
              .to.be.emit(mafastore, "AvatarSold")
              .withArgs(account1.address, 1);

            expect(await mafagafoAvatar.ownerOf(1)).to.equal(mafastore.address);
          });
        });
      });
    });

    describe("withdraw tokens", function () {
      it("owner should be able to withdraw BNB from the contract", async function () {
        const previousBalance = bigNumberToFloat(await owner.getBalance());

        await owner.sendTransaction({
          to: mafastore.address,
          value: expandTo18Decimals(2),
        });
        expect(bigNumberToFloat(await owner.getBalance())).to.be.within(
          previousBalance - 2 - 0.01,
          previousBalance - 2,
        );

        await mafastore.withdraw(owner.address, expandTo18Decimals(2));

        expect(bigNumberToFloat(await owner.getBalance())).to.be.within(previousBalance - 0.01, previousBalance);
      });

      it("owner should be able to withdraw ERC20 token from the contract", async function () {
        const previousBalance = await mafacoin.balanceOf(owner.address);

        await mafacoin.transfer(mafastore.address, expandTo18Decimals(2));
        expect(await mafacoin.balanceOf(owner.address)).to.equal(previousBalance.sub(expandTo18Decimals(2)));

        await mafastore.withdrawERC20(mafacoin.address, owner.address, expandTo18Decimals(2));

        expect(await mafacoin.balanceOf(owner.address)).to.equal(previousBalance);
      });

      it("owner should be able to withdraw ER721 token from the contract", async function () {
        await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
          owner.address,
          0,
          ethers.utils.id("0"),
          0,
          0,
          0,
        );

        const previousOwner = await mafagafoAvatar.ownerOf(1);

        await mafagafoAvatar.transferFrom(owner.address, mafastore.address, 1);
        expect(await mafagafoAvatar.ownerOf(1)).to.equal(mafastore.address);

        await mafastore.withdrawERC721(mafagafoAvatar.address, owner.address, 1);
        expect(await mafagafoAvatar.ownerOf(1)).to.equal(previousOwner);
      });

      it("owner should be able to withdraw ERC1155 token from the contract", async function () {
        await brooder.mint(owner.address, 0, 3, ethers.utils.id(""));

        const previousBalance = await brooder.balanceOf(owner.address, 0);

        await brooder.safeTransferFrom(owner.address, mafastore.address, 0, 3, ethers.utils.id(""));
        expect(await brooder.balanceOf(mafastore.address, 0)).to.equal(3);

        await mafastore.withdrawERC1155(brooder.address, owner.address, 0, 3);
        expect(await brooder.balanceOf(owner.address, 0)).to.equal(previousBalance);
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

    // COMMENTING THIS BECAUSE QUICKNODE IS RECEIVING TOO MUCH REQUESTS

    // describe("upgradable", function () {
    //   it("should initiate on version 1.0.0", async function () {
    //     expect(await mafastore.version()).to.equal("1.0.0");
    //   });

    //   it("should be upgradable", async function () {
    //     expect(await mafastore.version()).to.equal("1.0.0");
    //     const mafastoreFactoryV2: MafaStoreTestV2__factory = <MafaStoreTestV2__factory>(
    //       await ethers.getContractFactory("MafaStoreTestV2")
    //     );
    //     const mafastoreV2 = <MafaStoreTestV2>(
    //       await upgrades.upgradeProxy(mafastore, mafastoreFactoryV2, { kind: "uups" })
    //     );

    //     expect(await mafastoreV2.version()).to.equal("2.0.0");
    //   });
    // });
  });
});
