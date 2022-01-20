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
} from "../../typechain";

describe("Unit tests", function () {
  let brooder: BrooderNft;
  let egg: EggNft;
  let mafagafoAvatar: MafagafoAvatarNft;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;

  before(async function () {
    [owner, account1] = await ethers.getSigners();
  });

  describe.only("Mafagafo Avatar", function () {
    beforeEach(async function () {
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

      await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
        account1.address,
        await mafagafoAvatar.mafaVersion(),
        ethers.utils.formatBytes32String("0"),
        0,
        0,
        0,
        0x00000000,
      );

      await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
        account1.address,
        await mafagafoAvatar.mafaVersion(),
        ethers.utils.formatBytes32String("0"),
        0,
        0,
        0,
        0x00000000,
      );
    });

    it("should be deployed with correct values", async function () {
      expect(await mafagafoAvatar.eggContract()).to.equal(egg.address);
      expect(await mafagafoAvatar.totalSupply()).to.equal(3);
      expect(await mafagafoAvatar.ownerOf(0)).to.equal("0x000000000000000000000000000000000000dEaD");
      expect(await mafagafoAvatar.ownerOf(1)).to.equal(account1.address);
      expect(await mafagafoAvatar.ownerOf(2)).to.equal(account1.address);
      expect(await mafagafoAvatar.version()).to.equal("1.0.0");
      expect(await mafagafoAvatar.mafaVersion()).to.equal(0);
    });

    it("user should not be able to change mafa version", async function () {
      await expect(mafagafoAvatar.connect(account1).setMafaVersion(1)).to.be.reverted;
    });

    it("admin should be able to change mafa version", async function () {
      expect(await mafagafoAvatar.mafaVersion()).to.equal(0);

      await expect(mafagafoAvatar.setMafaVersion(1)).to.emit(mafagafoAvatar, "MafaVersionChanged").withArgs(1);

      expect(await mafagafoAvatar.mafaVersion()).to.equal(1);
    });

    it("user should not be able to mint avatars", async function () {
      await expect(
        mafagafoAvatar
          .connect(account1)
          ["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
            account1.address,
            await mafagafoAvatar.mafaVersion(),
            ethers.utils.formatBytes32String("0"),
            0,
            0,
            0,
            0x00000000,
          ),
      ).to.be.reverted;

      await expect(mafagafoAvatar.connect(account1)["mint(address)"](account1.address)).to.be.revertedWith(
        "ERC721PresetMinterPauserAutoId: must have minter role to mint",
      );
    });

    describe("mate", function () {
      it("user should not be able to mate mafagafos that are not owned by him", async function () {
        mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
          owner.address,
          await mafagafoAvatar.mafaVersion(),
          ethers.utils.formatBytes32String("0"),
          0,
          0,
          0,
          0x00000000,
        );
        await expect(mafagafoAvatar.connect(account1)["mate(uint256,uint256)"](0, 3)).to.be.revertedWith(
          "Sender must be the owner of 1st parent",
        );
        await expect(mafagafoAvatar.connect(account1)["mate(uint256,uint256)"](3, 2)).to.be.revertedWith(
          "Sender must be the owner of 1st parent",
        );
        await expect(mafagafoAvatar.connect(account1)["mate(uint256,uint256)"](1, 3)).to.be.revertedWith(
          "Sender must be the owner of 2nd parent",
        );
      });

      it("user should not be able to mate using the same mafagafo", async function () {
        await expect(mafagafoAvatar.connect(account1)["mate(uint256,uint256)"](1, 1)).to.be.revertedWith(
          "You must use different mafagafos to mate",
        );
      });

      it("user should be able to mate two mafagafos", async function () {
        expect((await mafagafoAvatar.mafagafo(1)).matings).to.equal(0);
        expect((await mafagafoAvatar.mafagafo(2)).matings).to.equal(0);
        expect(await egg.totalSupply()).to.equal(0);

        await expect(mafagafoAvatar.connect(account1)["mate(uint256,uint256)"](1, 2))
          .to.emit(mafagafoAvatar, "Mate")
          .withArgs(account1.address, 1, 2, 0, "0x0000000000000000000000000000000000000000000000000000000000000007", 1);

        expect((await mafagafoAvatar.mafagafo(1)).matings).to.equal(1);
        expect((await mafagafoAvatar.mafagafo(2)).matings).to.equal(1);
        expect(await egg.totalSupply()).to.equal(1);
        expect(await egg.ownerOf(0)).to.equal(account1.address);
      });

      it("user should not be able to mate if 1st parent has already mated", async function () {
        mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
          account1.address,
          await mafagafoAvatar.mafaVersion(),
          ethers.utils.formatBytes32String("0"),
          0,
          0,
          0,
          0x00000000,
        );

        await mafagafoAvatar.connect(account1)["mate(uint256,uint256)"](1, 3);

        await expect(mafagafoAvatar.connect(account1)["mate(uint256,uint256)"](1, 2)).to.be.revertedWith(
          "1st parent has already mated",
        );
      });

      it("user should not be able to mate if 2nd parent has already mated", async function () {
        mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
          account1.address,
          await mafagafoAvatar.mafaVersion(),
          ethers.utils.formatBytes32String("0"),
          0,
          0,
          0,
          0x00000000,
        );

        await mafagafoAvatar.connect(account1)["mate(uint256,uint256)"](2, 3);

        await expect(mafagafoAvatar.connect(account1)["mate(uint256,uint256)"](1, 2)).to.be.revertedWith(
          "2nd parent has already mated",
        );
      });
    });

    describe("mate multiple", function () {
      it("user should not be able to mate more than 150 mafagafos", async function () {
        const length = 152;
        for (let index = 0; index < length; index++) {
          await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
            account1.address,
            await mafagafoAvatar.mafaVersion(),
            ethers.utils.formatBytes32String("0"),
            0,
            0,
            0,
            0x00000000,
          );
        }

        await expect(
          mafagafoAvatar.connect(account1)["mate(uint256[])"](Array.from({ length: length }, (_, i) => i + 1)),
        ).to.be.revertedWith("You can only mate at most 150 mafagafos at a time");
      });

      it("user should not be able to mate an odd amount of mafagafos", async function () {
        await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
          account1.address,
          await mafagafoAvatar.mafaVersion(),
          ethers.utils.formatBytes32String("0"),
          0,
          0,
          0,
          0x00000000,
        );

        await expect(mafagafoAvatar.connect(account1)["mate(uint256[])"]([1, 2, 3])).to.be.revertedWith(
          "You must mate an even number of mafagafos",
        );
      });

      it("user should not be able to mate mafagafos that are not owned by him", async function () {
        await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
          owner.address,
          await mafagafoAvatar.mafaVersion(),
          ethers.utils.formatBytes32String("0"),
          0,
          0,
          0,
          0x00000000,
        );

        await expect(mafagafoAvatar.connect(account1)["mate(uint256[])"]([0, 3])).to.be.revertedWith(
          "Sender must be the owner of 1st parent",
        );
        await expect(mafagafoAvatar.connect(account1)["mate(uint256[])"]([3, 2])).to.be.revertedWith(
          "Sender must be the owner of 1st parent",
        );
        await expect(mafagafoAvatar.connect(account1)["mate(uint256[])"]([1, 3])).to.be.revertedWith(
          "Sender must be the owner of 2nd parent",
        );
      });

      it("user should be able to mate an even amount of mafagafos", async function () {
        const length = 150;
        for (let index = 0; index < length; index++) {
          await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
            account1.address,
            await mafagafoAvatar.mafaVersion(),
            ethers.utils.formatBytes32String("0"),
            0,
            0,
            0,
            0x00000000,
          );
        }

        expect(await egg.totalSupply()).to.equal(0);

        await expect(
          mafagafoAvatar.connect(account1)["mate(uint256[])"](Array.from({ length: length }, (_, i) => i + 1)),
        )
          .to.emit(mafagafoAvatar, "Mate")
          .withArgs(account1.address, 1, 2, 0, "0x0000000000000000000000000000000000000000000000000000000000000007", 1);

        expect(await egg.totalSupply()).to.equal(length / 2);
        expect(await egg.ownerOf(0)).to.equal(account1.address);
        expect(await egg.ownerOf(length / 3 - 1)).to.equal(account1.address);
        expect(await egg.ownerOf(length / 2 - 1)).to.equal(account1.address);
      });
    });
  });
});
