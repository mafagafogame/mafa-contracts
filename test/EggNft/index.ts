/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BrooderNft,
  BrooderNft__factory,
  EggNft,
  EggNft__factory,
  MafaCoinV2,
  MafagafoAvatarNft,
  MafagafoAvatarNft__factory,
} from "../../typechain";
import { daysToUnixDate, deployMafaCoin, expandTo18Decimals, range } from "../shared/utilities";

describe("Unit tests", function () {
  let mafacoin: MafaCoinV2;
  let brooder: BrooderNft;
  let egg: EggNft;
  let mafagafoAvatar: MafagafoAvatarNft;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let length: number;

  before(async function () {
    [owner, account1, account2] = await ethers.getSigners();
  });

  describe("Egg", function () {
    beforeEach(async function () {
      mafacoin = await deployMafaCoin(owner);
      await mafacoin.transfer(account1.address, expandTo18Decimals(100000));

      const brooderFactory = <BrooderNft__factory>await ethers.getContractFactory("BrooderNft");
      brooder = <BrooderNft>await upgrades.deployProxy(brooderFactory, [], {
        initializer: "initialize",
        kind: "uups",
      });

      const eggFactory = <EggNft__factory>await ethers.getContractFactory("EggNft");
      egg = <EggNft>await upgrades.deployProxy(eggFactory, [brooder.address], {
        initializer: "initialize",
        kind: "uups",
      });

      const mafagafoAvatarFactory = <MafagafoAvatarNft__factory>await ethers.getContractFactory("MafagafoAvatarNft");
      mafagafoAvatar = <MafagafoAvatarNft>await upgrades.deployProxy(mafagafoAvatarFactory, [egg.address], {
        initializer: "initialize",
        kind: "uups",
      });

      await egg.setMafagafoAddress(mafagafoAvatar.address);
      await egg["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
        account1.address,
        0,
        ethers.utils.formatBytes32String(""),
        0,
        0,
        0,
      );

      await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), egg.address);
      await brooder.grantRole(ethers.utils.id("BURNER_ROLE"), egg.address);
    });

    it("should be deployed with correct values", async function () {
      expect(await egg.brooderContract()).to.equal(brooder.address);
      expect(await egg.mafagafoContract()).to.equal(mafagafoAvatar.address);
      expect(await egg.ownerOf(0)).to.equal(account1.address);
      expect(await egg.hatchTime()).to.equal(daysToUnixDate(210));
      const newEgg = await egg.egg(0);
      expect(newEgg.version).to.equal(0);
      expect(newEgg.genes).to.equal(ethers.utils.formatBytes32String(""));
      expect(newEgg.generation).to.equal(0);
      expect(newEgg.parent1Id).to.equal(0);
      expect(newEgg.parent2Id).to.equal(0);
      expect(newEgg.breeding).to.equal(false);
      expect(newEgg.brooderType).to.equal(ethers.utils.formatBytes32String("none"));
    });

    it("admin should be able to update egg hatch time", async function () {
      await expect(egg.setHatchTime(daysToUnixDate(10)))
        .to.emit(egg, "HatchTimeChanged")
        .withArgs(daysToUnixDate(10));

      expect(await egg.hatchTime()).to.equal(daysToUnixDate(10));
    });

    describe("hatch egg", function () {
      it("user should not be able to mint eggs", async function () {
        await expect(
          egg
            .connect(account1)
            ["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
              account1.address,
              0,
              ethers.utils.formatBytes32String(""),
              0,
              0,
              0,
            ),
        ).to.be.reverted;

        await expect(egg.connect(account1)["mint(address)"](account1.address)).to.be.revertedWith(
          "ERC721PresetMinterPauserAutoId: must have minter role to mint",
        );
      });

      it("user should not be able to hatch an egg that is not owned by him", async function () {
        await expect(egg["hatchEgg(uint256)"](0)).to.be.revertedWith("Sender must be the owner of the egg");
      });

      it("user should not be able to hatch an egg if hatch date has not passed", async function () {
        await expect(egg.connect(account1)["hatchEgg(uint256)"](0)).to.be.revertedWith("Egg is not in time to hatch");
      });

      it("user should be able to hatch an egg if hatch date has passed", async function () {
        await ethers.provider.send("evm_increaseTime", [daysToUnixDate(210)]);
        await ethers.provider.send("evm_mine", []);

        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);
        const timestamp = block.timestamp;

        await expect(egg.connect(account1)["hatchEgg(uint256)"](0))
          .to.emit(egg, "EggHatched")
          .withArgs(0, timestamp + 1, 0, ethers.utils.formatBytes32String(""), 0, [0, 0]);

        expect(await egg.balanceOf(account1.address)).to.equal(0);
        expect(await mafagafoAvatar.ownerOf(1)).to.equal(account1.address);
      });
    });

    describe("hatch multiple eggs", function () {
      const length = 120;

      beforeEach(async function () {
        for (let i = 1; i < length; i++) {
          await egg["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
            account1.address,
            0,
            ethers.utils.formatBytes32String(""),
            0,
            0,
            0,
          );
        }
      });

      it("user should not be able to hatch more than 120 eggs", async function () {
        await egg["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
          account1.address,
          0,
          ethers.utils.formatBytes32String(""),
          0,
          0,
          0,
        );

        await expect(egg.connect(account1)["hatchEgg(uint256[])"]([...Array(length + 1).keys()])).to.be.revertedWith(
          "You can hatch at most 120 eggs at a time",
        );
      });

      it("user should be able to hatch multiple eggs if hatch date has passed", async function () {
        await ethers.provider.send("evm_increaseTime", [daysToUnixDate(210)]);
        await ethers.provider.send("evm_mine", []);

        await expect(egg.connect(account1)["hatchEgg(uint256[])"]([...Array(length).keys()])).to.emit(
          egg,
          "EggHatched",
        );

        expect(await egg.balanceOf(account1.address)).to.equal(0);
        expect(await mafagafoAvatar.balanceOf(account1.address)).to.equal(120);
      });
    });

    describe("breed egg", function () {
      beforeEach(async function () {
        await brooder.createBrooder(0, daysToUnixDate(20));

        await brooder.mint(account1.address, 0, 1, ethers.utils.formatBytes32String(""));
      });

      it("user should not be able to breed an egg that is not owned by him", async function () {
        await expect(egg["breedEgg(uint256,uint256)"](0, 0)).to.be.revertedWith("Sender must be the owner of the egg");
      });

      it("user should not be able to breed an egg that is not owned by him", async function () {
        await expect(egg.connect(account1)["breedEgg(uint256,uint256)"](0, 1)).to.be.revertedWith(
          "You don't own any of this brooder",
        );
      });

      it("user should not be able to breed an egg that is already breeding", async function () {
        await egg.connect(account1)["breedEgg(uint256,uint256)"](0, 0);

        await brooder.mint(account1.address, 0, 1, ethers.utils.formatBytes32String(""));

        await expect(egg.connect(account1)["breedEgg(uint256,uint256)"](0, 0)).to.be.revertedWith(
          "Egg is already breeding",
        );
      });

      it("user should be able to breed an egg", async function () {
        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);
        const timestamp = block.timestamp;

        expect((await egg.egg(0)).hatchDate.toNumber()).to.be.greaterThan(timestamp + daysToUnixDate(200));

        await expect(egg.connect(account1)["breedEgg(uint256,uint256)"](0, 0))
          .to.emit(egg, "EggBreeded")
          .withArgs(0, 0, timestamp + 1 + daysToUnixDate(20));

        expect((await egg.egg(0)).hatchDate.toNumber()).to.be.equal(timestamp + 1 + daysToUnixDate(20));

        await expect(egg.connect(account1)["hatchEgg(uint256)"](0)).to.be.revertedWith("Egg is not in time to hatch");

        await ethers.provider.send("evm_increaseTime", [daysToUnixDate(20)]);
        await ethers.provider.send("evm_mine", []);

        await expect(egg.connect(account1)["hatchEgg(uint256)"](0)).to.emit(egg, "EggHatched");
      });
    });

    describe("breed multiple eggs", function () {
      beforeEach(async function () {
        length = 600;
        await brooder.createBrooder(0, daysToUnixDate(20));
        await brooder.createBrooder(0, daysToUnixDate(10));
        await brooder.createBrooder(0, daysToUnixDate(5));

        await brooder.mint(account1.address, 0, length / 3, ethers.utils.formatBytes32String(""));
        await brooder.mint(account1.address, 1, length / 3, ethers.utils.formatBytes32String(""));
        await brooder.mint(account1.address, 2, length / 3, ethers.utils.formatBytes32String(""));

        for (let i = 1; i < length; i++) {
          await egg["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
            account1.address,
            0,
            ethers.utils.formatBytes32String(""),
            0,
            0,
            0,
          );
        }
      });

      it("user should not be able to breed multiple eggs if ids and brooders array does not equals", async function () {
        await expect(
          egg["breedEgg(uint256[],uint256[])"](
            [0, 1],
            Array.from({ length: length }, (_, i) => i % 3),
          ),
        ).to.be.revertedWith("ids and brooderIds arrays must be equal");

        await expect(egg["breedEgg(uint256[],uint256[])"]([...Array(length).keys()], [0, 1])).to.be.revertedWith(
          "ids and brooderIds arrays must be equal",
        );
      });

      it("user should not be able to breed if egg or brooder are not owned by him", async function () {
        await egg["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
          owner.address,
          0,
          ethers.utils.formatBytes32String(""),
          0,
          0,
          0,
        );

        await expect(egg.connect(account1)["breedEgg(uint256[],uint256[])"]([0, 600], [0, 1])).to.be.revertedWith(
          "Sender must be the owner of the egg",
        );

        await expect(egg.connect(account1)["breedEgg(uint256[],uint256[])"]([0, 1], [4, 1])).to.be.revertedWith(
          "You don't own any of this brooder",
        );
      });

      it("user should not be able to breed more than 600 eggs at a time", async function () {
        await brooder.mint(account1.address, 0, 1, ethers.utils.formatBytes32String(""));

        await egg["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
          account1.address,
          0,
          ethers.utils.formatBytes32String(""),
          0,
          0,
          0,
        );

        await expect(
          egg.connect(account1)["breedEgg(uint256[],uint256[])"](
            [...Array(length + 1).keys()],
            Array.from({ length: length + 1 }, (_, i) => i % 3),
          ),
        ).to.be.revertedWith("You can breed at most 600 eggs at a time");
      });

      it("user should be able to breed multiple eggs", async function () {
        await expect(
          egg.connect(account1)["breedEgg(uint256[],uint256[])"](
            [...Array(length).keys()],
            Array.from({ length: length }, (_, i) => i % 3),
          ),
        ).to.emit(egg, "EggBreeded");
      });
    });

    describe("list nfts", function () {
      beforeEach(async function () {
        for (let i = 0; i < 100; i++) {
          await egg["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
            account2.address,
            0,
            ethers.utils.formatBytes32String(""),
            0,
            0,
            0,
          );
        }
      });

      it("should list all of user eggs", async function () {
        const eggs = (await egg.connect(account2).listMyNftIds()).map(id => ethers.BigNumber.from(id).toNumber());

        expect(eggs).to.eql(range(1, 100));
      });

      it("should return an empty array if user tries to list its eggs with pagination with intial index greater than balance", async function () {
        const eggs = (await egg.connect(account2).listMyNftIdsPaginated(20, 5)).map(id =>
          ethers.BigNumber.from(id).toNumber(),
        );

        expect(eggs).to.eql([]);
      });

      it("should list all of user eggs with pagination", async function () {
        const eggs = (await egg.connect(account2).listMyNftIdsPaginated(2, 5)).map(id =>
          ethers.BigNumber.from(id).toNumber(),
        );

        expect(eggs).to.eql(range(11, 15));
      });

      it("should list partial limit of user eggs with pagination if last index is greater than balance", async function () {
        const eggs = (await egg.connect(account2).listMyNftIdsPaginated(3, 30)).map(id =>
          ethers.BigNumber.from(id).toNumber(),
        );

        expect(eggs).to.eql(range(91, 100));
      });

      it("should list all eggs owned by user", async function () {
        const eggs = (await egg.listNftsOwnedBy(account2.address)).map(id => ethers.BigNumber.from(id).toNumber());

        expect(eggs).to.eql(range(1, 100));
      });

      it("should return an empty array when listing all eggs owned by a user with intial index greater than balance", async function () {
        const eggs = (await egg.listNftsOwnedByPaginated(account2.address, 20, 5)).map(id =>
          ethers.BigNumber.from(id).toNumber(),
        );

        expect(eggs).to.eql([]);
      });

      it("should list all eggs owned by a user with pagination", async function () {
        const eggs = (await egg.listNftsOwnedByPaginated(account2.address, 2, 5)).map(id =>
          ethers.BigNumber.from(id).toNumber(),
        );

        expect(eggs).to.eql(range(11, 15));
      });

      it("should list partial limit of eggs owned by a user with pagination if last index is greater than balance", async function () {
        const eggs = (await egg.listNftsOwnedByPaginated(account2.address, 3, 30)).map(id =>
          ethers.BigNumber.from(id).toNumber(),
        );

        expect(eggs).to.eql(range(91, 100));
      });
    });
  });
});
