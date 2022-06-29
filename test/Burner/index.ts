/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BrooderNft,
  BrooderNft__factory,
  BurnerMock,
  BurnerMock__factory,
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

      const burnerFactory = <BurnerMock__factory>await ethers.getContractFactory("BurnerMock");
      burner = <BurnerMock>await upgrades.deployProxy(burnerFactory, [mafagafoAvatar.address], {
        initializer: "initialize",
        kind: "uups",
      });

      await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), burner.address);
    });

    describe("List Mafaegg", async function () {
      it("should list all mafaeggs", async function () {
        await mafagafoAvatar.multiMint(
          accounts[1].address,
          0,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          0,
          0,
          0,
          0x00000000,
          20,
        );

        await mafagafoAvatar.multiMint(
          accounts[1].address,
          0,
          "0x0000000000000000000000000000000000000000000000000000000000000008",
          2,
          0,
          0,
          0x00000000,
          20,
        );

        await mafagafoAvatar.multiMint(
          accounts[1].address,
          0,
          "0x0000000000000000000000000000000000000000000000000000000000000007",
          1,
          0,
          0,
          0x10000000,
          20,
        );

        const eggs = (await burner.connect(accounts[1]).listMafaEggs(accounts[1].address)).map(id =>
          ethers.BigNumber.from(id).toNumber(),
        );

        expect(eggs).to.eql(range(21, 40));
      });

      it("should list mafaeggs that have been minted by burner contract", async function () {
        await mafagafoAvatar.multiMint(
          accounts[1].address,
          0,
          "0x0000000000000000000000000000000000000000000000000000000000000007",
          1,
          0,
          0,
          0x10000000,
          30,
        );

        await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

        await expect(burner.connect(accounts[1]).burnMafagolds(range(1, 30))).to.emit(burner, "MafagoldsBurned");

        const eggs = (await burner.connect(accounts[1]).listMafaEggs(accounts[1].address)).map(id =>
          ethers.BigNumber.from(id).toNumber(),
        );

        expect(eggs).to.eql(range(31, 40));
      });
    });

    describe("Mafagold burn", async function () {
      beforeEach(async function () {
        await mafagafoAvatar.multiMint(
          accounts[1].address,
          await mafagafoAvatar.mafaVersion(),
          "0x0000000000000000000000000000000000000000000000000000000000000007",
          1,
          0,
          0,
          0x10000000,
          99,
        );
      });

      it("should revert if user burns 0 mafagolds", async function () {
        await expect(burner.connect(accounts[1]).burnMafagolds([])).to.be.revertedWith("No mafagolds to burn");
      });

      it("should revert if user burns an amount of mafagolds that is not multiple of 3", async function () {
        await expect(burner.connect(accounts[1]).burnMafagolds([1, 2])).to.be.revertedWith(
          "Amount of mafagolds must be multiple of 3",
        );
      });

      it("should revert if user doesn't approve mafagolds", async function () {
        await expect(burner.connect(accounts[1]).burnMafagolds([1, 2, 3])).to.be.revertedWith(
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

        await expect(burner.connect(accounts[1]).burnMafagolds([1, 2, 3, 100, 4, 5])).to.be.revertedWith(
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

        await expect(burner.connect(accounts[1]).burnMafagolds([1, 2, 100, 3, 4, 5])).to.be.revertedWith(
          "You can only burn avatars from version 0",
        );

        await expect(burner.connect(accounts[1]).burnMafagolds([1, 2, 101, 3, 4, 5])).to.be.revertedWith(
          "You can only burn avatars from generation 1",
        );
      });

      it("user should be able to burn 3 mafagolds that he owns", async function () {
        await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

        await expect(burner.connect(accounts[1]).burnMafagolds([1, 2, 3]))
          .to.emit(burner, "MafagoldsBurned")
          .withArgs(accounts[1].address, 3, 1);

        expect(await mafagafoAvatar.balanceOf(accounts[1].address)).to.equal(97); // 99 - 3 + 1
        expect((await mafagafoAvatar.mafagafo(100)).generation).to.equal(ethers.BigNumber.from(2));
      });

      it("user should be able to burn multiple (multiples by 3) mafagolds that he owns", async function () {
        await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

        await expect(burner.connect(accounts[1]).burnMafagolds(range(1, 99)))
          .to.emit(burner, "MafagoldsBurned")
          .withArgs(accounts[1].address, 99, 33);

        expect(await mafagafoAvatar.balanceOf(accounts[1].address)).to.equal(33); // 99 - 99 + 33
      });

      it("should stop burning mafagolds if limit is achived", async function () {
        // mint 300 mafagolds to account1
        for (let i = 0; i < 3; i++) {
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

        await expect(burner.connect(accounts[1]).burnMafagolds(range(1, 240))).to.emit(burner, "MafagoldsBurned");

        expect(await burner.totalMinted()).to.equal(80);

        await expect(burner.connect(accounts[1]).burnMafagolds(range(241, 330))).to.be.revertedWith(
          "Mint limit exceeded",
        );

        expect(await burner.totalMinted()).to.equal(80);

        await expect(burner.connect(accounts[1]).burnMafagolds(range(241, 300))).to.emit(burner, "MafagoldsBurned");

        expect(await burner.totalMinted()).to.equal(100);

        await expect(burner.connect(accounts[1]).burnMafagolds([301, 302, 303])).to.be.revertedWith(
          "Mint limit exceeded",
        );
      });
    });

    describe("Mafagafo burn", async function () {
      beforeEach(async function () {
        await mafagafoAvatar.multiMint(
          accounts[1].address,
          0,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          0,
          0,
          0,
          0x00000000,
          120,
        );
      });

      it("should revert if user burns 0 mafagafos", async function () {
        await expect(burner.connect(accounts[1]).burnMafagafos([])).to.be.revertedWith("No mafagafos to burn");
      });

      it("should revert if user burns an amount of mafagafos that is not multiple of 3", async function () {
        await expect(burner.connect(accounts[1]).burnMafagafos(range(1, 10))).to.be.revertedWith(
          "Amount of mafagafos must be multiple of 12",
        );
      });

      it("should revert if user doesn't approve mafagafos", async function () {
        await expect(burner.connect(accounts[1]).burnMafagafos(range(1, 12))).to.be.revertedWith(
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

        await expect(
          burner.connect(accounts[1]).burnMafagafos([1, 2, 3, 121, 4, 5, 6, 7, 8, 9, 10, 11]),
        ).to.be.revertedWith("You have to own this avatar to be able to burn it");
      });

      it("should revert if user burns a mafagafo that isn't a normal mafagafo", async function () {
        await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
          accounts[1].address,
          1,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          0,
          0,
          0,
          0x00000000,
        );

        await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
          accounts[1].address,
          0,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          1,
          0,
          0,
          0x00000000,
        );

        await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

        await expect(
          burner.connect(accounts[1]).burnMafagafos([1, 2, 3, 121, 4, 5, 6, 7, 8, 9, 10, 11]),
        ).to.be.revertedWith("You can only burn avatars from version 0");

        await expect(
          burner.connect(accounts[1]).burnMafagafos([1, 2, 3, 122, 4, 5, 6, 7, 8, 9, 10, 11]),
        ).to.be.revertedWith("You can only burn avatars from generation 0");
      });

      it("should revert if user burns a mafagafo that has been mated", async function () {
        await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
          accounts[1].address,
          0,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          0,
          0,
          0,
          0x00000000,
        );

        await mafagafoAvatar["mint(address,uint16,bytes32,uint32,uint256,uint256,uint32)"](
          accounts[1].address,
          0,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          0,
          0,
          0,
          0x00000000,
        );

        await mafagafoAvatar.connect(accounts[1])["mate(uint256,uint256)"](121, 122);

        await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

        await expect(
          burner.connect(accounts[1]).burnMafagafos([1, 2, 3, 11, 4, 5, 6, 7, 8, 9, 10, 121]),
        ).to.be.revertedWith("You can only burn avatars that have not been mated");

        await expect(
          burner.connect(accounts[1]).burnMafagafos([1, 2, 3, 122, 4, 5, 6, 7, 8, 9, 10, 11]),
        ).to.be.revertedWith("You can only burn avatars that have not been mated");
      });

      it("user should be able to burn 12 mafagafos that he owns", async function () {
        await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

        await expect(burner.connect(accounts[1]).burnMafagafos(range(1, 12)))
          .to.emit(burner, "MafagafosBurned")
          .withArgs(accounts[1].address, 12, 1);

        expect(await mafagafoAvatar.balanceOf(accounts[1].address)).to.equal(109); // 120 - 12 + 1
        expect((await mafagafoAvatar.mafagafo(121)).generation).to.equal(ethers.BigNumber.from(2));
      });

      it("user should be able to burn multiple (multiples by 12) mafagafos that he owns", async function () {
        await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

        await expect(burner.connect(accounts[1]).burnMafagafos(range(1, 120)))
          .to.emit(burner, "MafagafosBurned")
          .withArgs(accounts[1].address, 120, 10);

        expect(await mafagafoAvatar.balanceOf(accounts[1].address)).to.equal(10); // 120 - 120 + 10
      });

      it("should stop burning mafagolds if limit is achived", async function () {
        // mint 300 mafagolds to account1
        for (let i = 0; i < 3; i++) {
          await mafagafoAvatar.multiMint(
            accounts[1].address,
            0,
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            0,
            0,
            0,
            0x00000000,
            100,
          );
        }

        await mafagafoAvatar.connect(accounts[1]).setApprovalForAll(burner.address, true);

        await expect(burner.connect(accounts[1]).burnMafagafos(range(1, 240))).to.emit(burner, "MafagafosBurned");

        expect(await burner.totalMinted()).to.equal(20);

        await expect(burner.connect(accounts[1]).burnMafagafos(range(241, 324))).to.be.revertedWith(
          "Mint limit exceeded",
        );

        expect(await burner.totalMinted()).to.equal(20);

        await expect(burner.connect(accounts[1]).burnMafagafos(range(241, 300))).to.emit(burner, "MafagafosBurned");

        expect(await burner.totalMinted()).to.equal(25);

        await expect(burner.connect(accounts[1]).burnMafagafos(range(301, 312))).to.be.revertedWith(
          "Mint limit exceeded",
        );
      });
    });
  });
});
