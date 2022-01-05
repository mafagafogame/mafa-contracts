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
} from "../../typechain";
import { deployMafaCoin, expandTo18Decimals } from "../shared/utilities";

describe("Unit tests", function () {
  let mafacoin: MafaCoin;
  let brooder: BrooderNft;
  let egg: EggNft;
  let mafagafoAvatar: MafagafoAvatarNft;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;

  before(async function () {
    [owner, account1] = await ethers.getSigners();
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

      await egg.setMafagafoContract(mafagafoAvatar.address);
      await egg["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
        account1.address,
        0,
        ethers.utils.formatBytes32String(""),
        0,
        0,
        0,
      );

      await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), egg.address);
    });

    it("should be deployed with correct values", async function () {
      expect(await egg.brooderContract()).to.equal(brooder.address);
      expect(await egg.mafagafoContract()).to.equal(mafagafoAvatar.address);
      expect(await egg.ownerOf(0)).to.equal(account1.address);
      const newEgg = await egg.egg(0);
      expect(newEgg.version).to.equal(0);
      expect(newEgg.genes).to.equal(ethers.utils.formatBytes32String(""));
      expect(newEgg.generation).to.equal(0);
      expect(newEgg.parent1Id).to.equal(0);
      expect(newEgg.parent2Id).to.equal(0);
      expect(newEgg.breeding).to.equal(false);
      expect(newEgg.brooderType).to.equal(ethers.utils.formatBytes32String("none"));
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
        await expect(egg.hatchEgg(0)).to.be.revertedWith("Sender must be the owner of the egg");
      });

      it("user should not be able to hatch an egg if hatch date has not passed", async function () {
        await expect(egg.connect(account1).hatchEgg(0)).to.be.revertedWith("Egg is not in time to hatch");
      });

      it("user should be able to hatch an egg if hatch date has passed", async function () {
        await ethers.provider.send("evm_increaseTime", [210 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine", []);

        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);
        const timestamp = block.timestamp;

        await expect(egg.connect(account1).hatchEgg(0))
          .to.emit(egg, "EggHatched")
          .withArgs(0, timestamp + 1, 0, ethers.utils.formatBytes32String(""), 0, [0, 0]);

        expect(await egg.balanceOf(account1.address)).to.equal(0);
        expect(await mafagafoAvatar.ownerOf(1)).to.equal(account1.address);
      });
    });
  });
});
