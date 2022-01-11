/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import { BrooderNft, BrooderNft__factory } from "../../typechain";
import { BigNumberish, Wallet } from "ethers";

describe("Unit tests", function () {
  let baseERC1155: BrooderNft;
  let addresses: string[];
  let ids: BigNumberish[];
  let amounts: BigNumberish[];
  let length: number;

  before(async function () {
    await ethers.getSigners();
  });

  describe("BaseERC1155", function () {
    beforeEach(async function () {
      const baseERC1155Factory = <BrooderNft__factory>await ethers.getContractFactory("BrooderNft");
      baseERC1155 = <BrooderNft>await upgrades.deployProxy(baseERC1155Factory, [], {
        initializer: "initialize",
        kind: "uups",
      });

      length = 250;
    });

    describe("Multi mint", function () {
      it("should mint amounts of tokens with ids to addresses", async function () {
        addresses = new Array(length);
        ids = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
          amounts[i] = i + 1;
        }

        await baseERC1155.multiMint(addresses, ids, amounts, ethers.utils.formatBytes32String(""));

        expect(await baseERC1155.balanceOf(addresses[0], 0)).to.equal(1);
        expect(await baseERC1155.balanceOf(addresses[length / 2 - 1], length / 2 - 1)).to.equal(length / 2);
        expect(await baseERC1155.balanceOf(addresses[length - 1], length - 1)).to.equal(length);
      });

      it("should revert if addresses is greater than 250", async function () {
        length = 251;

        addresses = new Array(length);
        ids = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
          amounts[i] = i + 1;
        }

        await expect(
          baseERC1155.multiMint(addresses, ids, amounts, ethers.utils.formatBytes32String("")),
        ).to.be.revertedWith("Can't mint to more than 250 addresses in one batch");
      });

      it("should revert if addresses and ids doesn't have the same length", async function () {
        addresses = new Array(length);
        ids = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
          amounts[i] = i + 1;
        }

        ids = ids.slice(0, 200);

        await expect(
          baseERC1155.multiMint(addresses, ids, amounts, ethers.utils.formatBytes32String("")),
        ).to.be.revertedWith("addresses and ids arrays must be equal");
      });

      it("should revert if addresses and amounts doesn't have the same length", async function () {
        addresses = new Array(length);
        ids = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
          amounts[i] = i + 1;
        }

        amounts = amounts.slice(0, 200);

        await expect(
          baseERC1155.multiMint(addresses, ids, amounts, ethers.utils.formatBytes32String("")),
        ).to.be.revertedWith("addresses and amounts arrays must be equal");
      });
    });

    describe("Multi mint equal ID", function () {
      it("should mint amounts of tokens with the same id to addresses", async function () {
        addresses = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          amounts[i] = i + 1;
        }

        await baseERC1155.multiMintEqualId(addresses, 1, amounts, ethers.utils.formatBytes32String(""));

        expect(await baseERC1155.balanceOf(addresses[0], 1)).to.equal(1);
        expect(await baseERC1155.balanceOf(addresses[length / 2 - 1], 1)).to.equal(length / 2);
        expect(await baseERC1155.balanceOf(addresses[length - 1], 1)).to.equal(length);
        expect(await baseERC1155.totalSupply(2)).to.equal(0);
      });

      it("should revert if addresses is greater than 250", async function () {
        length = 251;

        addresses = new Array(length);
        ids = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
          amounts[i] = i + 1;
        }

        await expect(
          baseERC1155.multiMintEqualId(addresses, 1, amounts, ethers.utils.formatBytes32String("")),
        ).to.be.revertedWith("Can't mint to more than 250 addresses in one batch");
      });

      it("should revert if addresses and amounts doesn't have the same length", async function () {
        addresses = new Array(length);
        ids = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
          amounts[i] = i + 1;
        }

        amounts = amounts.slice(0, 200);

        await expect(
          baseERC1155.multiMintEqualId(addresses, 1, amounts, ethers.utils.formatBytes32String("")),
        ).to.be.revertedWith("addresses and amounts arrays must be equal");
      });
    });

    describe("Multi mint equal amount", function () {
      it("should mint an amount of tokens with ids to addresses", async function () {
        addresses = new Array(length);
        ids = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
        }

        await baseERC1155.multiMintEqualAmount(addresses, ids, 50, ethers.utils.formatBytes32String(""));

        expect(await baseERC1155.balanceOf(addresses[0], 0)).to.equal(50);
        expect(await baseERC1155.balanceOf(addresses[length / 2 - 1], length / 2 - 1)).to.equal(50);
        expect(await baseERC1155.balanceOf(addresses[length - 1], length - 1)).to.equal(50);
      });

      it("should revert if addresses is greater than 250", async function () {
        length = 251;

        addresses = new Array(length);
        ids = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
          amounts[i] = i + 1;
        }

        await expect(
          baseERC1155.multiMintEqualAmount(addresses, ids, 50, ethers.utils.formatBytes32String("")),
        ).to.be.revertedWith("Can't mint to more than 250 addresses in one batch");
      });

      it("should revert if addresses and ids doesn't have the same length", async function () {
        addresses = new Array(length);
        ids = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
          amounts[i] = i + 1;
        }

        ids = ids.slice(0, 200);

        await expect(
          baseERC1155.multiMintEqualAmount(addresses, ids, 50, ethers.utils.formatBytes32String("")),
        ).to.be.revertedWith("addresses and ids arrays must be equal");
      });
    });

    describe("Multi mint equal ID and amount", function () {
      it("should mint an amount of tokens with the same id to addresses", async function () {
        addresses = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
        }

        await baseERC1155.multiMintEqualIdAndAmount(addresses, 1, 50, ethers.utils.formatBytes32String(""));

        expect(await baseERC1155.balanceOf(addresses[0], 1)).to.equal(50);
        expect(await baseERC1155.balanceOf(addresses[length / 2 - 1], 1)).to.equal(50);
        expect(await baseERC1155.balanceOf(addresses[length - 1], 1)).to.equal(50);
        expect(await baseERC1155.totalSupply(2)).to.equal(0);
      });

      it("should revert if addresses is greater than 250", async function () {
        length = 251;

        addresses = new Array(length);
        ids = new Array(length);
        amounts = new Array(length);
        for (let i = 0; i < length; i++) {
          addresses[i] = Wallet.createRandom().address;
          ids[i] = i;
          amounts[i] = i + 1;
        }

        await expect(
          baseERC1155.multiMintEqualIdAndAmount(addresses, 1, 50, ethers.utils.formatBytes32String("")),
        ).to.be.revertedWith("Can't mint to more than 250 addresses in one batch");
      });
    });
  });
});
