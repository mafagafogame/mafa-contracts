/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BrooderNft,
  BrooderNft__factory,
  Burner,
  BurnerMock,
  BurnerMock__factory,
  Burner__factory,
  EggNft,
  EggNft__factory,
  MafagafoAvatarNft,
  MafagafoAvatarNft__factory,
} from "../../typechain";
import { range } from "../shared/utilities";

describe("Unit tests", function () {
  let brooder: BrooderNft;
  let egg: EggNft;
  let mafagafoAvatar: MafagafoAvatarNft;
  let burner: BurnerMock;
  let accounts: SignerWithAddress[];

  before(async function () {
    accounts = await ethers.getSigners();
  });

  describe.only("Burner", function () {
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

      await mafagafoAvatar.multiMint(
        accounts[1].address,
        await mafagafoAvatar.mafaVersion(),
        "0x0000000000000000000000000000000000000000000000000000000000000007",
        1,
        0,
        0,
        0x10000000,
        100,
      );

      const burnerFactory = <BurnerMock__factory>await ethers.getContractFactory("BurnerMock");
      burner = <BurnerMock>await upgrades.deployProxy(burnerFactory, [mafagafoAvatar.address], {
        initializer: "initialize",
        kind: "uups",
      });
    });

    it("should revert if user burns an odd amount of mafagolds", async function () {
      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, [1, 2, 3])).to.be.revertedWith(
        "Amount of mafagolfs must be even",
      );
    });

    it("should revert if user doesn't approve mafagolds", async function () {
      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, [1, 2])).to.be.revertedWith(
        "Check the approval of your avatars",
      );
    });

    it("should revert if user burns mafagolds that he doesn't owns", async function () {
      await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
        accounts[0].address,
        await mafagafoAvatar.mafaVersion(),
        "0x0000000000000000000000000000000000000000000000000000000000000007",
        1,
        0,
        0,
        0x10000000,
      );

      await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, [1, 2, 101, 3])).to.be.revertedWith(
        "You have to own this avatar to be able to burn it",
      );
    });

    it("should revert if user burns a mafagafo that isn't a mafagold", async function () {
      await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
        accounts[1].address,
        1,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        1,
        0,
        0,
        0x00000000,
      );

      await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
        accounts[1].address,
        await mafagafoAvatar.mafaVersion(),
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        0,
        0,
        0,
        0x00000000,
      );

      await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, [1, 2, 101, 3])).to.be.revertedWith(
        "You can only burn avatars from version 0",
      );

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, [1, 2, 102, 3])).to.be.revertedWith(
        "You can only burn avatars from generation 1",
      );
    });

    it("user should be able to burn 2 mafagolds that he owns", async function () {
      await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, [1, 2]))
        .to.emit(burner, "MafagoldsBurned")
        .withArgs(accounts[1].address, accounts[1].address, 2, 2);
    });

    it("user should be able to burn even number of mafagolds that he owns passing another wallet to receive", async function () {
      await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[2].address, [1, 2]))
        .to.emit(burner, "MafagoldsBurned")
        .withArgs(accounts[1].address, accounts[2].address, 2, 2);
    });

    it("user should be able to burn multiple (even) mafagolds that he owns", async function () {
      await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, range(1, 100)))
        .to.emit(burner, "MafagoldsBurned")
        .withArgs(accounts[1].address, accounts[1].address, 100, 100);
    });

    it("should stop burning mafagolds if limit is achived", async function () {
      // mint 500 mafagolds to account1
      for (let i = 0; i < 5; i++) {
        await mafagafoAvatar.multiMint(
          accounts[1].address,
          await mafagafoAvatar.mafaVersion(),
          "0x0000000000000000000000000000000000000000000000000000000000000007",
          1,
          0,
          0,
          0x10000000,
          100,
        );
      }

      await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, range(1, 450))).to.emit(
        burner,
        "MafagoldsBurned",
      );

      expect(await burner.totalBurned()).to.equal(450);

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, range(451, 600))).to.be.revertedWith(
        "Burn limit exceeded",
      );

      expect(await burner.totalBurned()).to.equal(450);

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, range(451, 500))).to.emit(
        burner,
        "MafagoldsBurned",
      );

      expect(await burner.totalBurned()).to.equal(500);

      await expect(burner.connect(accounts[1]).burnMafagolds(accounts[1].address, range(501, 502))).to.be.revertedWith(
        "Burn limit exceeded",
      );
    });
  });
});
