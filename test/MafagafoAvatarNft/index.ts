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

  describe("Mafagafo Avatar", function () {
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

      await egg.setMafagafoContract(mafagafoAvatar.address);

      await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
        account1.address,
        await mafagafoAvatar.mafaVersion(),
        ethers.utils.formatBytes32String("0"),
        0,
        0,
        0,
      );

      await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
        account1.address,
        await mafagafoAvatar.mafaVersion(),
        ethers.utils.formatBytes32String("0"),
        0,
        0,
        0,
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

    it("user should not be able to mint avatars", async function () {
      await expect(
        mafagafoAvatar
          .connect(account1)
          ["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
            account1.address,
            await mafagafoAvatar.mafaVersion(),
            ethers.utils.formatBytes32String("0"),
            0,
            0,
            0,
          ),
      ).to.be.reverted;

      await expect(mafagafoAvatar.connect(account1)["mint(address)"](account1.address)).to.be.revertedWith(
        "ERC721PresetMinterPauserAutoId: must have minter role to mint",
      );
    });

    describe("mate", function () {
      it("user should not be able to mate mafagafos that are not owned by him", async function () {
        mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
          owner.address,
          await mafagafoAvatar.mafaVersion(),
          ethers.utils.formatBytes32String("0"),
          0,
          0,
          0,
        );
        await expect(mafagafoAvatar.connect(account1).mate(0, 3)).to.be.revertedWith(
          "Sender must be the owner of 1st parent",
        );
        await expect(mafagafoAvatar.connect(account1).mate(3, 2)).to.be.revertedWith(
          "Sender must be the owner of 1st parent",
        );
        await expect(mafagafoAvatar.connect(account1).mate(1, 3)).to.be.revertedWith(
          "Sender must be the owner of 2nd parent",
        );
      });
      it("user should not be able to mate using the same mafagafo", async function () {
        await expect(mafagafoAvatar.connect(account1).mate(1, 1)).to.be.revertedWith(
          "You must use different mafagafos to mate",
        );
      });

      it("user should be able to mate two mafagafos", async function () {
        expect((await mafagafoAvatar.mafagafo(1)).matings).to.equal(0);
        expect((await mafagafoAvatar.mafagafo(2)).matings).to.equal(0);
        expect(await egg.totalSupply()).to.equal(0);

        await expect(mafagafoAvatar.connect(account1).mate(1, 2))
          .to.emit(mafagafoAvatar, "Mate")
          .withArgs(account1.address, 1, 2, 0, ethers.utils.formatBytes32String(""), 1);

        expect((await mafagafoAvatar.mafagafo(1)).matings).to.equal(1);
        expect((await mafagafoAvatar.mafagafo(2)).matings).to.equal(1);
        expect(await egg.totalSupply()).to.equal(1);
        expect(await egg.ownerOf(0)).to.equal(account1.address);
      });

      it("user should not be able to mate if 1st parent has already mated", async function () {
        mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
          account1.address,
          await mafagafoAvatar.mafaVersion(),
          ethers.utils.formatBytes32String("0"),
          0,
          0,
          0,
        );

        await mafagafoAvatar.connect(account1).mate(1, 3);

        await expect(mafagafoAvatar.connect(account1).mate(1, 2)).to.be.revertedWith("1st parent has already mated");
      });

      it("user should not be able to mate if 2nd parent has already mated", async function () {
        mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256)"](
          account1.address,
          await mafagafoAvatar.mafaVersion(),
          ethers.utils.formatBytes32String("0"),
          0,
          0,
          0,
        );

        await mafagafoAvatar.connect(account1).mate(2, 3);

        await expect(mafagafoAvatar.connect(account1).mate(1, 2)).to.be.revertedWith("2nd parent has already mated");
      });
    });
  });
});
