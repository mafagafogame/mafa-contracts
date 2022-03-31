/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BrooderNft,
  BrooderNft__factory,
  EggNft,
  EggNft__factory,
  MafagafoAvatarNft,
  MafagafoAvatarNft__factory,
  MafaStore,
  MafaStore__factory,
  MafaStoreTestV2,
  MafaStoreTestV2__factory,
  MafaCoinV2,
} from "../../typechain";
import {
  bigNumberToFloat,
  daysToUnixDate,
  deployMafaCoin,
  expandTo18Decimals,
  getMAFAtoBUSDprice,
} from "../shared/utilities";

describe("MafaStore", function () {
  let mafastore: MafaStore;
  let mafacoin: MafaCoinV2;
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

      await egg.setMafagafoAddress(mafagafoAvatar.address);

      const mafastoreFactory: MafaStore__factory = await ethers.getContractFactory("MafaStore");
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
      mafaPrice = await getMAFAtoBUSDprice();

      expect(bigNumberToFloat(await mafastore.getMAFAtoBUSDprice())).to.be.within(mafaPrice - 0.01, mafaPrice + 0.01);
    });

    describe("non owner", function () {
      it("non owner user should not be able to create an item", async function () {
        await expect(
          mafastore
            .connect(account1)
            .addItemToBeSold(
              brooder.address,
              0,
              ethers.utils.formatBytes32String("brooder 0"),
              expandTo18Decimals(100),
            ),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("non owner user should not be able to remove an item", async function () {
        await mafastore.addItemToBeSold(
          brooder.address,
          0,
          ethers.utils.formatBytes32String("brooder 0"),
          expandTo18Decimals(100),
        );

        await expect(mafastore.connect(account1).removeItemFromStore(0)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("non owner user should not be able to update the price of an item", async function () {
        await mafastore.addItemToBeSold(
          brooder.address,
          0,
          ethers.utils.formatBytes32String("brooder 0"),
          expandTo18Decimals(100),
        );

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
          mafastore.connect(account1).withdrawERC721(mafagafoAvatar.address, account1.address, [1]),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("non owner user should not be able to withdraw ERC1155", async function () {
        await expect(
          mafastore.connect(account1).withdrawERC1155(brooder.address, account1.address, 1, 2),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("owner", function () {
      describe("add item", function () {
        // it("owner should not be able to add an item passing a non contract NFT address", async function () {
        //   await expect(
        //     mafastore.addItemToBeSold(
        //       account1.address,
        //       0,
        //       ethers.utils.formatBytes32String("brooder 0"),
        //       expandTo18Decimals(0),
        //     ),
        //   ).to.be.revertedWith("NFT address must be a contract");
        // });

        it("owner should not be able to add an item with 0 price", async function () {
          await expect(
            mafastore.addItemToBeSold(
              brooder.address,
              0,
              ethers.utils.formatBytes32String("brooder 0"),
              expandTo18Decimals(0),
            ),
          ).to.be.revertedWith("Item price can't be 0");
        });

        it("owner should be able to add an item", async function () {
          await expect(
            mafastore.addItemToBeSold(
              brooder.address,
              0,
              ethers.utils.formatBytes32String("brooder 0"),
              expandTo18Decimals(100),
            ),
          )
            .to.emit(mafastore, "ItemAdded")
            .withArgs(brooder.address, 0, 0, ethers.utils.formatBytes32String("brooder 0"), expandTo18Decimals(100));

          const item = await mafastore.items(0);
          expect(item[2]).to.equal(ethers.utils.formatBytes32String("brooder 0"));
        });
      });

      describe("remove item", function () {
        it("owner should not be able to remove an item that doesn't exists", async function () {
          await expect(mafastore.removeItemFromStore(0)).to.be.revertedWith("Id should be between 0 and items length");
        });

        it("owner should be able to remove an item", async function () {
          await mafastore.addItemToBeSold(
            brooder.address,
            0,
            ethers.utils.formatBytes32String("brooder 0"),
            expandTo18Decimals(100),
          );

          await expect(mafastore.removeItemFromStore(0))
            .to.emit(mafastore, "ItemDeleted")
            .withArgs(0, brooder.address, 0, expandTo18Decimals(100));

          const itemsList = await mafastore.listItems();
          expect(itemsList.length).to.equal(0);
        });

        it("items list should readjust on item removal", async function () {
          await mafastore.addItemToBeSold(
            brooder.address,
            0,
            ethers.utils.formatBytes32String("brooder 0"),
            expandTo18Decimals(100),
          );

          await mafastore.addItemToBeSold(
            brooder.address,
            1,
            ethers.utils.formatBytes32String("brooder 1"),
            expandTo18Decimals(150),
          );

          await mafastore.addItemToBeSold(
            brooder.address,
            2,
            ethers.utils.formatBytes32String("brooder 2"),
            expandTo18Decimals(200),
          );

          await mafastore.addItemToBeSold(
            brooder.address,
            3,
            ethers.utils.formatBytes32String("brooder 3"),
            expandTo18Decimals(250),
          );

          await expect(mafastore.removeItemFromStore(1))
            .to.emit(mafastore, "ItemDeleted")
            .withArgs(1, brooder.address, 1, expandTo18Decimals(150));

          const itemsList = await mafastore.listItems();
          expect(itemsList.length).to.equal(3);
          expect(itemsList[1].tokenId).to.equal(3);
          expect(itemsList[1].title).to.equal(ethers.utils.formatBytes32String("brooder 3"));
          expect(itemsList[1].price).to.equal(expandTo18Decimals(250));
        });
      });

      describe("update item price", function () {
        it("owner should not be able to update the price of an item to 0", async function () {
          await mafastore.addItemToBeSold(
            brooder.address,
            0,
            ethers.utils.formatBytes32String("brooder 0"),
            expandTo18Decimals(100),
          );

          await expect(mafastore.updateItemPrice(0, expandTo18Decimals(0))).to.be.revertedWith("Item price can't be 0");
        });

        it("owner should not be able to update the price of an item that doesn't exists", async function () {
          await expect(mafastore.updateItemPrice(0, expandTo18Decimals(200))).to.be.revertedWith("Item doesn't exists");
        });

        it("owner should be able to update the price of an item", async function () {
          await mafastore.addItemToBeSold(
            brooder.address,
            0,
            ethers.utils.formatBytes32String("brooder 0"),
            expandTo18Decimals(100),
          );

          await expect(mafastore.updateItemPrice(0, expandTo18Decimals(200)))
            .to.emit(mafastore, "ItemPriceUpdated")
            .withArgs(0, expandTo18Decimals(200));

          const item = await mafastore.items(0);
          expect(item[3]).to.equal(expandTo18Decimals(200));
        });
      });
    });

    describe("buy item", function () {
      beforeEach(async function () {
        await mafastore.addItemToBeSold(
          brooder.address,
          0,
          ethers.utils.formatBytes32String("brooder 0"),
          expandTo18Decimals(100),
        );
      });

      it("user should not be able to buy 0 amounts of an item", async function () {
        await expect(mafastore.buyItem(0, ethers.utils.formatBytes32String("brooder 0"), 0)).to.be.revertedWith(
          "Amounts must be greater than zero",
        );
      });

      it("user should not be able to buy an item passing an id that doesn't exists", async function () {
        await expect(mafastore.buyItem(1, ethers.utils.formatBytes32String("brooder 1"), 1)).to.be.revertedWith(
          "Item doesn't exists",
        );
      });

      it("user should not be able to buy an item if he doesn't allow the transfer", async function () {
        await expect(
          mafastore.connect(account1).buyItem(0, ethers.utils.formatBytes32String("brooder 0"), 1),
        ).to.be.revertedWith("Check the token allowance");
      });

      it("user should not be able to buy an item if allowances are not enough", async function () {
        await mafacoin.connect(account1).approve(mafastore.address, expandTo18Decimals(1));

        await expect(
          mafastore.connect(account1).buyItem(0, ethers.utils.formatBytes32String("brooder 0"), 1),
        ).to.be.revertedWith("Check the token allowance");
      });

      it("user should not be able to buy an item if he doesn't have enough balance", async function () {
        await mafacoin.connect(account2).approve(mafastore.address, ethers.constants.MaxUint256);

        await expect(
          mafastore.connect(account2).buyItem(0, ethers.utils.formatBytes32String("brooder 0"), 1),
        ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      });

      it("user should not be able to buy an item passing wrong item title", async function () {
        await mafacoin.connect(account1).approve(mafastore.address, ethers.constants.MaxUint256);

        await expect(
          mafastore.connect(account1).buyItem(0, ethers.utils.formatBytes32String("mafagafador"), 1),
        ).to.be.revertedWith("Title argument must match requested item title");
      });

      it("user should be able to buy an item", async function () {
        await mafacoin.connect(account1).approve(mafastore.address, ethers.constants.MaxUint256);

        expect(await brooder.totalSupply(0)).to.equal(0);
        expect(await mafacoin.balanceOf(account1.address)).to.equal(expandTo18Decimals(100000));
        expect(await brooder.balanceOf(account1.address, 0)).to.equal(0);

        await expect(mafastore.connect(account1).buyItem(0, ethers.utils.formatBytes32String("brooder 0"), 1)).to.emit(
          mafastore,
          "ItemBought",
        );

        mafaPrice = await getMAFAtoBUSDprice();

        expect(await brooder.totalSupply(0)).to.equal(1);
        expect(bigNumberToFloat(await mafacoin.balanceOf(account1.address))).to.be.within(
          100000 - 100 / mafaPrice - 100,
          100000 - 100 / mafaPrice + 100,
        );
        expect(await brooder.balanceOf(account1.address, 0)).to.equal(1);
      });

      it("user should be able to buy multiple amounts of an item", async function () {
        const amount = 5;

        await mafacoin.connect(account1).approve(mafastore.address, ethers.constants.MaxUint256);

        expect(await brooder.totalSupply(0)).to.equal(0);
        expect(await mafacoin.balanceOf(account1.address)).to.equal(expandTo18Decimals(100000));
        expect(await brooder.balanceOf(account1.address, 0)).to.equal(0);

        await expect(
          mafastore.connect(account1).buyItem(0, ethers.utils.formatBytes32String("brooder 0"), amount),
        ).to.emit(mafastore, "ItemBought");

        mafaPrice = await getMAFAtoBUSDprice();

        expect(await brooder.totalSupply(0)).to.equal(5);
        expect(bigNumberToFloat(await mafacoin.balanceOf(account1.address))).to.be.within(
          100000 - (amount * 100) / mafaPrice - 500,
          100000 - (amount * 100) / mafaPrice + 500,
        );
        expect(await brooder.balanceOf(account1.address, 0)).to.equal(amount);
      });

      describe("buy ticket", function () {
        beforeEach(async function () {
          await mafastore.setTicketSeller(account2.address);

          await mafastore.addItemToBeSold(
            "0x0000000000000000000000000000000000000000",
            0,
            ethers.utils.formatBytes32String("pack 1"),
            expandTo18Decimals(100),
          );
        });

        it("user should not be able to buy a ticket passing an id that doesn't exists", async function () {
          await expect(mafastore.buyTicket(2, ethers.utils.formatBytes32String("pack 2"))).to.be.revertedWith(
            "Item doesn't exists",
          );
        });

        it("user should not be able to buy a ticket on buyItem function", async function () {
          await expect(mafastore.buyItem(1, ethers.utils.formatBytes32String("pack 1"), 1)).to.be.revertedWith(
            "Only NFT items can be bought",
          );
        });

        it("user should not be able to buy a NFT on buyTicket function", async function () {
          await expect(mafastore.buyTicket(0, ethers.utils.formatBytes32String("brooder 0"))).to.be.revertedWith(
            "Only ticket packs can be bought",
          );
        });

        it("user should not be able to buy a ticket if he doesn't allow the transfer", async function () {
          await expect(
            mafastore.connect(account1).buyTicket(1, ethers.utils.formatBytes32String("pack 1")),
          ).to.be.revertedWith("Check the token allowance");
        });

        it("user should not be able to buy a ticket if allowances are not enough", async function () {
          await mafacoin.connect(account1).approve(mafastore.address, expandTo18Decimals(1));

          await expect(
            mafastore.connect(account1).buyTicket(1, ethers.utils.formatBytes32String("pack 1")),
          ).to.be.revertedWith("Check the token allowance");
        });

        it("user should not be able to buy a ticket if he doesn't have enough balance", async function () {
          await mafacoin.connect(account2).approve(mafastore.address, ethers.constants.MaxUint256);

          await expect(
            mafastore.connect(account2).buyTicket(1, ethers.utils.formatBytes32String("pack 1")),
          ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("user should not be able to buy a ticket passing wrong item title", async function () {
          await mafacoin.connect(account1).approve(mafastore.address, ethers.constants.MaxUint256);

          await expect(
            mafastore.connect(account1).buyTicket(1, ethers.utils.formatBytes32String("ultra pack")),
          ).to.be.revertedWith("Title argument must match requested item title");
        });

        it("user should be able to buy a ticket", async function () {
          await mafacoin.connect(account1).approve(mafastore.address, ethers.constants.MaxUint256);

          expect(await brooder.totalSupply(0)).to.equal(0);
          expect(await mafacoin.balanceOf(account1.address)).to.equal(expandTo18Decimals(100000));
          expect(await brooder.balanceOf(account1.address, 0)).to.equal(0);

          await expect(mafastore.connect(account1).buyTicket(1, ethers.utils.formatBytes32String("pack 1"))).to.emit(
            mafastore,
            "TicketBought",
          );

          mafaPrice = await getMAFAtoBUSDprice();

          expect(bigNumberToFloat(await mafacoin.balanceOf(account1.address))).to.be.within(
            100000 - 100 / mafaPrice - 100,
            100000 - 100 / mafaPrice + 100,
          );
        });
      });
    });

    describe("sell avatar", function () {
      it("user should not be able to sell an avatar if mafastore contract doesn't have enough MAFAs", async function () {
        await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

        await expect(mafastore.connect(account1).sellAvatar([0])).to.be.revertedWith(
          "Amount exceeds mafastore balance",
        );
      });

      it("user should not be able to sell more than 500 avatars", async function () {
        const length = 501;

        await expect(
          mafastore.connect(account1).sellAvatar(Array.from({ length: length }, (_, i) => i + 1)),
        ).to.be.revertedWith("You can sell at most 500 avatars at a time");
      });

      describe("after transfering some MAFAs to the mafastore", function () {
        beforeEach(async function () {
          await mafacoin.transfer(mafastore.address, expandTo18Decimals(100000));
        });

        it("user should not be able to sell an avatar that he doesn't own", async function () {
          await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

          await expect(mafastore.connect(account1).sellAvatar([0])).to.be.revertedWith(
            "You have to own this avatar to be able to sell it",
          );
        });

        describe("after user has a nft to sell", function () {
          it("user should not be able to sell an avatar if he doesn't approve the transfer before", async function () {
            await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
              account1.address,
              0,
              ethers.utils.id("0"),
              1,
              0,
              0,
              "0x10000000",
            );

            await expect(mafastore.connect(account1).sellAvatar([1])).to.be.revertedWith(
              "Check the approval of your avatars",
            );
          });

          it("user should not be able to sell an avatar from another version than 0", async function () {
            await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
              account1.address,
              1,
              ethers.utils.id("0"),
              0,
              0,
              0,
              "0x10000000",
            );

            await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

            await expect(mafastore.connect(account1).sellAvatar([1])).to.be.revertedWith(
              "You can only sell avatars from version 0",
            );
          });

          it("user should not be able to sell an avatar from another generation than 1", async function () {
            await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
              account1.address,
              0,
              ethers.utils.id("0"),
              0,
              0,
              0,
              "0x10000000",
            );

            await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

            await expect(mafastore.connect(account1).sellAvatar([1])).to.be.revertedWith(
              "You can only sell avatars from generation 1",
            );
          });

          it("user should be able to sell an avatar", async function () {
            await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
              account1.address,
              0,
              "0x0000000000000000000000000000000000000000000000000000000000000007",
              1,
              0,
              0,
              "0x10000000",
            );

            expect(await mafagafoAvatar.ownerOf(1)).to.equal(account1.address);
            expect(await mafacoin.balanceOf(mafastore.address)).to.equal(expandTo18Decimals(100000));

            await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

            await expect(mafastore.connect(account1).sellAvatar([1])).to.emit(mafastore, "AvatarSold");

            mafaPrice = await getMAFAtoBUSDprice();

            expect(bigNumberToFloat(await mafacoin.balanceOf(account1.address))).to.within(
              100000 + 300 / mafaPrice - 100,
              100000 + 300 / mafaPrice + 100,
            );
            expect(bigNumberToFloat(await mafacoin.balanceOf(mafastore.address))).to.within(
              100000 - 300 / mafaPrice - 100,
              100000 - 300 / mafaPrice + 100,
            );
            expect(await mafagafoAvatar.ownerOf(1)).to.equal(mafastore.address);
          });

          it("user should be able to sell multiple avatars", async function () {
            await mafastore.setDailySellPercentage(ethers.utils.parseEther("100"));

            const length = 380;

            for (let i = 1; i <= length; i++) {
              await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
                account1.address,
                0,
                "0x0000000000000000000000000000000000000000000000000000000000000007",
                1,
                0,
                0,
                "0x10000000",
              );
            }

            expect(await mafagafoAvatar.ownerOf(1)).to.equal(account1.address);
            expect(await mafagafoAvatar.ownerOf(length / 2)).to.equal(account1.address);
            expect(await mafagafoAvatar.ownerOf(length)).to.equal(account1.address);

            await mafacoin.transfer(mafastore.address, expandTo18Decimals(40000000));

            expect(await mafacoin.balanceOf(mafastore.address)).to.equal(expandTo18Decimals(40100000));

            await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

            await expect(
              mafastore.connect(account1).sellAvatar(Array.from({ length: length }, (_, i) => i + 1)),
            ).to.emit(mafastore, "AvatarSold");

            mafaPrice = await getMAFAtoBUSDprice();

            expect(bigNumberToFloat(await mafacoin.balanceOf(account1.address))).to.within(
              100000 + (300 * length) / mafaPrice - 5000,
              100000 + (300 * length) / mafaPrice + 5000,
            );
            expect(bigNumberToFloat(await mafacoin.balanceOf(mafastore.address))).to.within(
              40100000 - (300 * length) / mafaPrice - 5000,
              40100000 - (300 * length) / mafaPrice + 5000,
            );
            expect(await mafagafoAvatar.ownerOf(1)).to.equal(mafastore.address);
            expect(await mafagafoAvatar.ownerOf(length / 2)).to.equal(mafastore.address);
            expect(await mafagafoAvatar.ownerOf(length)).to.equal(mafastore.address);
            expect(await mafagafoAvatar.totalSupply()).to.equal(length + 1);
          });
        });

        describe("daily limit", function () {
          beforeEach(async function () {
            await mafacoin.transfer(mafastore.address, expandTo18Decimals(200000));
            await mafastore.setDailySellPercentage(ethers.utils.parseEther("1"));
          });

          it("user should be able to sell at least 1 avatar daily even if price is more than 1% of store supply", async function () {
            await mafastore.withdrawERC20(mafacoin.address, owner.address, expandTo18Decimals(250000));

            const length = 2;

            for (let i = 1; i <= length; i++) {
              await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
                account1.address,
                0,
                "0x0000000000000000000000000000000000000000000000000000000000000007",
                1,
                0,
                0,
                "0x10000000",
              );
            }

            await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

            await expect(mafastore.connect(account1).sellAvatar([1])).to.emit(mafastore, "AvatarSold");

            await expect(mafastore.connect(account1).sellAvatar([2])).to.be.revertedWith(
              "You already exceeded your maximum sell amount for the day",
            );
          });

          it("user should not be able to sell more than 1% of total supply on an one day period", async function () {
            const length = Math.ceil((3000 * (await getMAFAtoBUSDprice())) / 300);

            for (let i = 1; i <= length; i++) {
              await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
                account1.address,
                0,
                "0x0000000000000000000000000000000000000000000000000000000000000007",
                1,
                0,
                0,
                "0x10000000",
              );
            }

            await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

            await expect(
              mafastore.connect(account1).sellAvatar(Array.from({ length: length - 1 }, (_, i) => i + 1)),
            ).to.emit(mafastore, "AvatarSold");

            await expect(mafastore.connect(account1).sellAvatar([length])).to.be.revertedWith(
              "You already exceeded your maximum sell amount for the day",
            );
          });

          it("user should be able to sell more than 1% of total supply if he sells split on more than one day period", async function () {
            const length = Math.ceil((3000 * (await getMAFAtoBUSDprice())) / 300);

            for (let i = 1; i <= length; i++) {
              await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
                account1.address,
                0,
                "0x0000000000000000000000000000000000000000000000000000000000000007",
                1,
                0,
                0,
                "0x10000000",
              );
            }

            await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

            for (let i = 1; i < length; i++) {
              await expect(mafastore.connect(account1).sellAvatar([i])).to.emit(mafastore, "AvatarSold");
            }

            await expect(mafastore.connect(account1).sellAvatar([length])).to.be.revertedWith(
              "You already exceeded your maximum sell amount for the day",
            );

            await ethers.provider.send("evm_increaseTime", [daysToUnixDate(1)]);
            await ethers.provider.send("evm_mine", []);

            await expect(mafastore.connect(account1).sellAvatar([length])).to.emit(mafastore, "AvatarSold");
          });

          it("owner should not be able to set daily sell percentage to 0", async function () {
            await expect(mafastore.setDailySellPercentage(0)).to.be.revertedWith("New percentage cannot be 0");
          });

          describe("daily sell percentage changed", async function () {
            beforeEach(async function () {
              await mafastore.setDailySellPercentage(ethers.utils.parseEther("0.5"));
            });

            it("daily percentage change should impact sell amount", async function () {
              const length = Math.ceil((1500 * (await getMAFAtoBUSDprice())) / 300);

              for (let i = 1; i <= length; i++) {
                await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
                  account1.address,
                  0,
                  "0x0000000000000000000000000000000000000000000000000000000000000007",
                  1,
                  0,
                  0,
                  "0x10000000",
                );
              }

              await mafagafoAvatar.connect(account1).setApprovalForAll(mafastore.address, true);

              await expect(
                mafastore.connect(account1).sellAvatar(Array.from({ length: length - 1 }, (_, i) => i + 1)),
              ).to.emit(mafastore, "AvatarSold");

              await expect(mafastore.connect(account1).sellAvatar([length])).to.be.revertedWith(
                "You already exceeded your maximum sell amount for the day",
              );

              await ethers.provider.send("evm_increaseTime", [daysToUnixDate(1)]);
              await ethers.provider.send("evm_mine", []);

              await expect(mafastore.connect(account1).sellAvatar([length])).to.emit(mafastore, "AvatarSold");
            });
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
        const length = 550;

        for (let index = 1; index <= length; index++) {
          await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
            mafastore.address,
            0,
            ethers.utils.id("0"),
            0,
            0,
            0,
            "0x10000000",
          );
        }

        expect(await mafagafoAvatar.ownerOf(1)).to.equal(mafastore.address);
        expect(await mafagafoAvatar.ownerOf(length / 2)).to.equal(mafastore.address);
        expect(await mafagafoAvatar.ownerOf(length - 1)).to.equal(mafastore.address);

        await mafastore.withdrawERC721(
          mafagafoAvatar.address,
          owner.address,
          Array.from({ length: length }, (_, i) => i + 1),
        );

        expect(await mafagafoAvatar.ownerOf(1)).to.equal(owner.address);
        expect(await mafagafoAvatar.ownerOf(length / 2)).to.equal(owner.address);
        expect(await mafagafoAvatar.ownerOf(length)).to.equal(owner.address);
      }).timeout(200000000);

      it("owner should be able to withdraw NFTs from the contract", async function () {
        const length = 500;

        for (let index = 1; index <= length; index++) {
          await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
            mafastore.address,
            0,
            ethers.utils.id("0"),
            0,
            0,
            0,
            "0x10000000",
          );
        }

        expect(await mafagafoAvatar.ownerOf(1)).to.equal(mafastore.address);
        expect(await mafagafoAvatar.ownerOf(length / 2)).to.equal(mafastore.address);
        expect(await mafagafoAvatar.ownerOf(length - 1)).to.equal(mafastore.address);

        await mafastore.withdrawNFTs(mafagafoAvatar.address, owner.address, length);

        expect(await mafagafoAvatar.ownerOf(1)).to.equal(owner.address);
        expect(await mafagafoAvatar.ownerOf(length / 2)).to.equal(owner.address);
        expect(await mafagafoAvatar.ownerOf(length)).to.equal(owner.address);
      }).timeout(200000000);

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

    describe("upgradable", function () {
      it("should initiate on version 1.0.0", async function () {
        expect(await mafastore.version()).to.equal("1.0.0");
      });

      it("should be upgradable", async function () {
        expect(await mafastore.version()).to.equal("1.0.0");
        const mafastoreFactoryV2: MafaStoreTestV2__factory = <MafaStoreTestV2__factory>(
          await ethers.getContractFactory("MafaStoreTestV2")
        );
        const mafastoreV2 = <MafaStoreTestV2>(
          await upgrades.upgradeProxy(mafastore, mafastoreFactoryV2, { kind: "uups" })
        );

        expect(await mafastoreV2.version()).to.equal("2.0.0");
      });
    });
  });
});
