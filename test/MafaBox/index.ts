/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BrooderNft,
  BrooderNft__factory,
  EggNft,
  EggNft__factory,
  MafaBox,
  MafaBox__factory,
  MafagafoAvatarNft,
  MafagafoAvatarNft__factory,
} from "../../typechain";
import { expandTo18Decimals } from "../shared/utilities";

describe("Unit tests", function () {
  let brooder: BrooderNft;
  let egg: EggNft;
  let mafagafoAvatar: MafagafoAvatarNft;
  let mafaBox: MafaBox;
  let account1: SignerWithAddress;

  before(async function () {
    [, account1] = await ethers.getSigners();
  });

  describe("MafaBox", function () {
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

      const mafaBoxFactory = <MafaBox__factory>await ethers.getContractFactory("MafaBox");
      mafaBox = <MafaBox>await upgrades.deployProxy(
        mafaBoxFactory,
        [
          mafagafoAvatar.address,
          [
            ethers.utils.parseEther("0.05"),
            ethers.utils.parseEther("0.15"),
            ethers.utils.parseEther("0.2"),
            ethers.utils.parseEther("0.25"),
            ethers.utils.parseEther("0.35"),
          ],
        ],
        {
          initializer: "initialize",
          kind: "uups",
        },
      );

      await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), mafaBox.address);
    });

    it("should be deployed with correct values", async function () {
      expect(await mafaBox.mafagafoContract()).to.equal(mafagafoAvatar.address);
      expect(await mafaBox.probabilities(0)).to.equal(ethers.utils.parseEther("0.05"));
      expect(await mafaBox.probabilities(1)).to.equal(ethers.utils.parseEther("0.15"));
      expect(await mafaBox.probabilities(2)).to.equal(ethers.utils.parseEther("0.2"));
      expect(await mafaBox.probabilities(3)).to.equal(ethers.utils.parseEther("0.25"));
      expect(await mafaBox.probabilities(4)).to.equal(ethers.utils.parseEther("0.35"));
    });

    describe("set probabilities", function () {
      it("owner should not be able to set probabilities to an array that does not sums to 10**18", async function () {
        await expect(
          mafaBox.setProbabilities([
            ethers.utils.parseEther("0.5"),
            ethers.utils.parseEther("0.4"),
            ethers.utils.parseEther("0.3"),
            ethers.utils.parseEther("0.2"),
            ethers.utils.parseEther("0.1"),
          ]),
        ).to.be.revertedWith("probabilities values sum must equal 10**18");
      });

      it("owner should be able to update probabilities", async function () {
        expect(
          await mafaBox.setProbabilities([
            ethers.utils.parseEther("0.5"),
            ethers.utils.parseEther("0.2"),
            ethers.utils.parseEther("0.1"),
            ethers.utils.parseEther("0.1"),
            ethers.utils.parseEther("0.1"),
          ]),
        )
          .to.emit(mafaBox, "ProbabilitiesChanged")
          .withArgs([
            ethers.utils.parseEther("0.5"),
            ethers.utils.parseEther("0.2"),
            ethers.utils.parseEther("0.1"),
            ethers.utils.parseEther("0.1"),
            ethers.utils.parseEther("0.1"),
          ]);

        expect(await mafaBox.probabilities(0)).to.equal(ethers.utils.parseEther("0.5"));
        expect(await mafaBox.probabilities(1)).to.equal(ethers.utils.parseEther("0.2"));
        expect(await mafaBox.probabilities(2)).to.equal(ethers.utils.parseEther("0.1"));
        expect(await mafaBox.probabilities(3)).to.equal(ethers.utils.parseEther("0.1"));
        expect(await mafaBox.probabilities(4)).to.equal(ethers.utils.parseEther("0.1"));
      });
    });

    describe("open boxes", function () {
      it("user should not be able to open 0 boxes", async function () {
        await expect(mafaBox.connect(account1).openBox(0, 0)).to.be.revertedWith("You must open at least 1 box");
      });

      it("user should not be able to open more than 150 boxes", async function () {
        await expect(mafaBox.connect(account1).openBox(0, 200)).to.be.revertedWith(
          "You can only open at most 150 box at a time",
        );
      });

      it("user should not be able to open a box if he doesn't have any", async function () {
        await expect(mafaBox.connect(account1).openBox(0, 1)).to.be.revertedWith("You don't have any box to open");
      });

      it("user should be able to open a box and receive a random mafagafo", async function () {
        await mafaBox.mint(account1.address, 0, 3, ethers.utils.id(""));

        expect(await mafaBox.balanceOf(account1.address, 0)).to.equal(3);

        await expect(mafaBox.connect(account1).openBox(0, 1)).to.emit(mafaBox, "BoxOpened");

        expect(await mafaBox.balanceOf(account1.address, 0)).to.equal(2);
        expect(await mafagafoAvatar.balanceOf(account1.address)).to.equal(1);
      });

      it("user should be able to open N boxes and receive N ramdom mafagafos", async function () {
        await mafaBox.mint(account1.address, 0, 150, ethers.utils.id(""));

        expect(await mafaBox.balanceOf(account1.address, 0)).to.equal(150);

        await expect(mafaBox.connect(account1).openBox(0, 150)).to.emit(mafaBox, "BoxOpened");

        expect(await mafaBox.balanceOf(account1.address, 0)).to.equal(0);
        expect(await mafagafoAvatar.balanceOf(account1.address)).to.equal(150);
      });
    });
  });
});
