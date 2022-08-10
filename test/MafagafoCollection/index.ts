/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { Mafagafo, Mafagafo__factory } from "../../typechain";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { utils } from "ethers";

describe.only("Unit tests", function () {
  let mafagafo: Mafagafo;
  const users: {
    address: string;
    amount: number;
  }[] = [];
  let elements: string[];
  let merkleTree: MerkleTree;
  let accounts: SignerWithAddress[];

  before(async function () {
    accounts = await ethers.getSigners();

    for (let i = 0; i < 500; i++) {
      const wallet = ethers.Wallet.createRandom();

      users.push({ address: wallet.address, amount: 3 });
    }

    // equal to MerkleDistributor.sol #keccak256(abi.encodePacked(account, amount));
    elements = users.map(x => utils.solidityKeccak256(["address", "uint256"], [x.address, x.amount]));
  });

  describe("Mafagafo", async function () {
    beforeEach(async function () {
      merkleTree = new MerkleTree(elements, keccak256, { sort: true });
      const root = merkleTree.getHexRoot();

      const mafagafoFactory = <Mafagafo__factory>await ethers.getContractFactory("Mafagafo");
      mafagafo = <Mafagafo>await upgrades.deployProxy(
        mafagafoFactory,
        [
          "https://mafa-genesis.s3.amazonaws.com/mafaegg",
          accounts[2].address,
          420,
          root,
          accounts[2].address,
          accounts[3].address,
          utils.parseEther("0.1"),
          utils.parseEther("0.29"),
          utils.parseEther("0.45"),
        ],
        {
          initializer: "initialize",
          kind: "uups",
        },
      );
    });

    it("should be deployed", async function () {
      expect(await mafagafo.name()).to.equal("Mafagafo");
      expect(await mafagafo.symbol()).to.equal("MAFA");
      expect(await mafagafo.totalSupply()).to.equal(420);
      expect(await mafagafo.balanceOf(accounts[2].address)).to.equal(420);
      expect(await mafagafo.ownerOf(0)).to.equal(accounts[2].address);
      expect(await mafagafo.ownerOf(419)).to.equal(accounts[2].address);
    });

    it("should show each nft its own tokenURI when baseURI is updated", async function () {
      expect(await mafagafo.tokenURI(0)).to.equal("https://mafa-genesis.s3.amazonaws.com/mafaegg");
      expect(await mafagafo.tokenURI(419)).to.equal("https://mafa-genesis.s3.amazonaws.com/mafaegg");

      await mafagafo.setBaseURI("https://mafa-genesis.s3.amazonaws.com/");

      expect(await mafagafo.tokenURI(0)).to.equal("https://mafa-genesis.s3.amazonaws.com/0");
      expect(await mafagafo.tokenURI(419)).to.equal("https://mafa-genesis.s3.amazonaws.com/419");
    });

    describe("Mint event", async function () {
      describe("phase 1 claim", async function () {
        it("should claim successfully for valid proof", async function () {
          const leaf = elements[3];
          const proof = merkleTree.getHexProof(leaf);

          // Attempt to claim and verify success
          await expect(mafagafo.claim1(users[3].address, users[3].amount, users[3].amount, proof))
            .to.emit(mafagafo, "Claimed")
            .withArgs(users[3].address, users[3].amount);

          expect(await mafagafo.balanceOf(users[3].address)).to.equal(users[3].amount);
        });

        it("should be able to claim multiple times if totalClaimed is less than totalQuantity", async function () {
          const leaf = elements[3];
          const proof = merkleTree.getHexProof(leaf);

          for (let i = 0; i < users[3].amount; i++) {
            await expect(mafagafo.claim1(users[3].address, 1, users[3].amount, proof))
              .to.emit(mafagafo, "Claimed")
              .withArgs(users[3].address, 1);
            expect(await mafagafo.balanceOf(users[3].address)).to.equal(i + 1);
          }

          await expect(mafagafo.claim1(users[3].address, 1, users[3].amount, proof)).to.be.revertedWith(
            `AlreadyClaimed("${users[3].address}")`,
          );
        });

        it("should revert for invalid amount or address", async function () {
          const leaf = elements[3];
          const proof = merkleTree.getHexProof(leaf);

          // random amount
          await expect(mafagafo.claim1(users[3].address, 5000, 5000, proof)).to.be.revertedWith("InvalidProof()");
          await expect(mafagafo.claim1(users[3].address, 100, users[3].amount, proof)).to.be.revertedWith(
            `AlreadyClaimed("${users[3].address}")`,
          );

          // random address
          await expect(mafagafo.claim1(users[2].address, users[3].amount, users[3].amount, proof)).to.be.revertedWith(
            "InvalidProof()",
          );
        });

        it("should revert for invalid proof", async function () {
          // Attempt to claim and verify success
          await expect(mafagafo.claim1(users[3].address, users[3].amount, users[3].amount, [])).to.be.revertedWith(
            "InvalidProof()",
          );
        });

        it("should revert if user has already claimed", async function () {
          const leaf = elements[3];
          const proof = merkleTree.getHexProof(leaf);

          await mafagafo.claim1(users[3].address, users[3].amount, users[3].amount, proof);

          await expect(mafagafo.claim1(users[3].address, users[3].amount, users[3].amount, proof)).to.be.revertedWith(
            `AlreadyClaimed("${users[3].address}")`,
          );
        });
      });

      describe("phase 2 claim", async function () {
        it("should claim successfully for valid proof", async function () {
          const previousAccount2Balance = await mafagafo.provider.getBalance(accounts[2].address);
          const previousAccount3Balance = await mafagafo.provider.getBalance(accounts[3].address);

          // Attempt to claim and verify success
          await expect(mafagafo.claim2(accounts[1].address, 1, { value: utils.parseEther("0.1") }))
            .to.emit(mafagafo, "Claimed")
            .withArgs(accounts[1].address, 1);

          expect(await mafagafo.balanceOf(accounts[1].address)).to.equal(1);
          expect(await mafagafo.provider.getBalance(accounts[2].address)).to.equal(
            previousAccount2Balance.add(utils.parseEther("0.07")),
          );
          expect(await mafagafo.provider.getBalance(accounts[3].address)).to.equal(
            previousAccount3Balance.add(utils.parseEther("0.03")),
          );

          await expect(mafagafo.claim2(accounts[4].address, 3, { value: utils.parseEther("0.29") }))
            .to.emit(mafagafo, "Claimed")
            .withArgs(accounts[4].address, 3);

          expect(await mafagafo.balanceOf(accounts[4].address)).to.equal(3);
          expect(await mafagafo.provider.getBalance(accounts[2].address)).to.equal(
            previousAccount2Balance.add(utils.parseEther("0.07").add(utils.parseEther("0.203"))),
          );
          expect(await mafagafo.provider.getBalance(accounts[3].address)).to.equal(
            previousAccount3Balance.add(utils.parseEther("0.03").add(utils.parseEther("0.087"))),
          );

          await expect(mafagafo.claim2(accounts[5].address, 5, { value: utils.parseEther("0.45") }))
            .to.emit(mafagafo, "Claimed")
            .withArgs(accounts[5].address, 5);

          expect(await mafagafo.balanceOf(accounts[5].address)).to.equal(5);
          expect(await mafagafo.provider.getBalance(accounts[2].address)).to.equal(
            previousAccount2Balance.add(
              utils.parseEther("0.07").add(utils.parseEther("0.203")).add(utils.parseEther("0.315")),
            ),
          );
          expect(await mafagafo.provider.getBalance(accounts[3].address)).to.equal(
            previousAccount3Balance.add(
              utils.parseEther("0.03").add(utils.parseEther("0.087")).add(utils.parseEther("0.135")),
            ),
          );
        });

        it("should revert for invalid options", async function () {
          await mafagafo.setFirstOption(false);

          await expect(mafagafo.claim2(accounts[1].address, 1, { value: utils.parseEther("0.1") })).to.be.revertedWith(
            "InvalidOption()",
          );

          await mafagafo.setSecondOption(false);

          await expect(mafagafo.claim2(accounts[1].address, 3, { value: utils.parseEther("0.29") })).to.be.revertedWith(
            "InvalidOption()",
          );

          await mafagafo.setThirdOption(false);

          await expect(mafagafo.claim2(accounts[1].address, 5, { value: utils.parseEther("0.45") })).to.be.revertedWith(
            "InvalidOption()",
          );

          await mafagafo.setFirstOption(true);

          await expect(mafagafo.claim2(accounts[1].address, 1, { value: utils.parseEther("0.1") }))
            .to.emit(mafagafo, "Claimed")
            .withArgs(accounts[1].address, 1);
        });

        it("should revert for invalid quantity", async function () {
          await expect(mafagafo.claim2(accounts[1].address, 0, { value: utils.parseEther("0.1") })).to.be.revertedWith(
            "QuantityError(0)",
          );

          await expect(mafagafo.claim2(accounts[1].address, 2, { value: utils.parseEther("0.2") })).to.be.revertedWith(
            "QuantityError(2)",
          );

          await expect(mafagafo.claim2(accounts[1].address, 4, { value: utils.parseEther("0.4") })).to.be.revertedWith(
            "QuantityError(4)",
          );
        });

        it("should revert if user has already claimed", async function () {
          await mafagafo.claim2(accounts[1].address, 1, { value: utils.parseEther("0.1") });

          await expect(mafagafo.claim2(accounts[1].address, 3, { value: utils.parseEther("0.29") })).to.be.revertedWith(
            `AlreadyClaimed("${accounts[1].address}")`,
          );
        });

        it("should revert if user doesn't send enough ETH", async function () {
          await expect(mafagafo.claim2(accounts[1].address, 1, { value: utils.parseEther("0.09") })).to.be.revertedWith(
            "PriceMismatch(90000000000000000, 100000000000000000)",
          );

          await expect(mafagafo.claim2(accounts[1].address, 3, { value: utils.parseEther("0.28") })).to.be.revertedWith(
            "PriceMismatch(280000000000000000, 290000000000000000)",
          );

          await expect(mafagafo.claim2(accounts[1].address, 5, { value: utils.parseEther("0.44") })).to.be.revertedWith(
            "PriceMismatch(440000000000000000, 450000000000000000)",
          );
        });

        it("owner Should be able to mint a NFT", async function () {
          expect(await mafagafo.balanceOf(accounts[3].address)).to.equal(0);
          await mafagafo.safeMintMafaTech(accounts[3].address, 1);
          expect(await mafagafo.balanceOf(accounts[3].address)).to.equal(1);

          expect(await mafagafo.ownerOf(420)).to.equal(accounts[3].address);
        });

        it("should revert when trying to mint more than max supply", async function () {
          await mafagafo.safeMintMafaTech(accounts[3].address, 6697);

          await expect(mafagafo.safeMintMafaTech(accounts[3].address, 1)).to.be.revertedWith(
            `'MaxSupplyExceeded(${await mafagafo.totalSupply()}, ${1})'`,
          );
        });
      });
    });
  });
});
