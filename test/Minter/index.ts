/* eslint-disable camelcase */
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { Mafagafo, Mafagafo__factory, Minter, Minter__factory } from "../../typechain";
import { utils } from "ethers";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { expect } from "chai";

describe("Unit tests", function () {
  let mafagafo: Mafagafo;
  let minter: Minter;
  const users: {
    address: string;
    amount: number;
  }[] = [];
  const users2: {
    address: string;
  }[] = [];
  let elements: string[];
  let elements2: string[];
  let merkleTree: MerkleTree;
  let merkleTree2: MerkleTree;
  let accounts: SignerWithAddress[];

  describe("Minter", function () {
    before(async () => {
      accounts = await ethers.getSigners();

      for (let i = 0; i < 500; i++) {
        const wallet = ethers.Wallet.createRandom();

        users.push({ address: wallet.address, amount: 3 });

        users2.push({ address: wallet.address });
      }

      // equal to MerkleDistributor.sol #keccak256(abi.encodePacked(account, amount));
      elements = users.map(x => utils.solidityKeccak256(["address", "uint256"], [x.address, x.amount]));
      elements2 = users2.map(x => utils.solidityKeccak256(["address"], [x.address]));
    });

    beforeEach(async function () {
      merkleTree = new MerkleTree(elements, keccak256, { sort: true });
      merkleTree2 = new MerkleTree(elements2, keccak256, { sort: true });

      const root = merkleTree.getHexRoot();
      const root2 = merkleTree2.getHexRoot();

      const mafagafoFactory = <Mafagafo__factory>await ethers.getContractFactory("Mafagafo");
      mafagafo = <Mafagafo>await upgrades.deployProxy(
        mafagafoFactory,
        ["https://store.mafagafo.com/assets/mafagafos/0.png", accounts[2].address, 420],
        {
          initializer: "initialize",
          kind: "uups",
        },
      );
      await mafagafo.deployed();

      const minterFactory = <Minter__factory>await ethers.getContractFactory("Minter");
      minter = <Minter>await upgrades.deployProxy(
        minterFactory,
        [
          root,
          root2,
          mafagafo.address,
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
      await minter.deployed();

      await mafagafo.grantRole(ethers.utils.id("MINTER_ROLE"), minter.address);
    });

    describe("phase 1 claim", async function () {
      it("should claim successfully for valid proof", async function () {
        const leaf = elements[3];
        const proof = merkleTree.getHexProof(leaf);

        // Attempt to claim and verify success
        await expect(minter.claim1(users[3].address, users[3].amount, users[3].amount, proof))
          .to.emit(minter, "Claimed")
          .withArgs(users[3].address, users[3].amount);

        expect(await mafagafo.balanceOf(users[3].address)).to.equal(users[3].amount);
      });

      it("should be able to claim multiple times if totalClaimed is less than totalQuantity", async function () {
        const leaf = elements[3];
        const proof = merkleTree.getHexProof(leaf);

        for (let i = 0; i < users[3].amount; i++) {
          await expect(minter.claim1(users[3].address, 1, users[3].amount, proof))
            .to.emit(minter, "Claimed")
            .withArgs(users[3].address, 1);
          expect(await mafagafo.balanceOf(users[3].address)).to.equal(i + 1);
        }

        await expect(minter.claim1(users[3].address, 1, users[3].amount, proof)).to.be.revertedWith(
          `AlreadyClaimed("${users[3].address}")`,
        );
      });

      it("should revert for invalid amount or address", async function () {
        const leaf = elements[3];
        const proof = merkleTree.getHexProof(leaf);

        // random amount
        await expect(minter.claim1(users[3].address, 5000, 5000, proof)).to.be.revertedWith("InvalidProof()");
        await expect(minter.claim1(users[3].address, 100, users[3].amount, proof)).to.be.revertedWith(
          `AlreadyClaimed("${users[3].address}")`,
        );

        // random address
        await expect(minter.claim1(users[2].address, users[3].amount, users[3].amount, proof)).to.be.revertedWith(
          "InvalidProof()",
        );
      });

      it("should revert for invalid proof", async function () {
        // Attempt to claim and verify success
        await expect(minter.claim1(users[3].address, users[3].amount, users[3].amount, [])).to.be.revertedWith(
          "InvalidProof()",
        );
      });

      it("should revert if user has already claimed", async function () {
        const leaf = elements[3];
        const proof = merkleTree.getHexProof(leaf);

        await minter.claim1(users[3].address, users[3].amount, users[3].amount, proof);

        await expect(minter.claim1(users[3].address, users[3].amount, users[3].amount, proof)).to.be.revertedWith(
          `AlreadyClaimed("${users[3].address}")`,
        );
      });
    });

    describe("phase 2 claim", async function () {
      it("should claim successfully for valid proof", async function () {
        const previousAccount2Balance = await mafagafo.provider.getBalance(accounts[2].address);
        const previousAccount3Balance = await mafagafo.provider.getBalance(accounts[3].address);

        let leaf = elements2[3];
        let proof = merkleTree2.getHexProof(leaf);

        // Attempt to claim and verify success
        await expect(minter.claim2(users2[3].address, 1, proof, { value: utils.parseEther("0.1") }))
          .to.emit(minter, "Claimed")
          .withArgs(users2[3].address, 1);

        expect(await mafagafo.balanceOf(users2[3].address)).to.equal(1);
        expect(await mafagafo.provider.getBalance(accounts[2].address)).to.equal(
          previousAccount2Balance.add(utils.parseEther("0.07")),
        );
        expect(await mafagafo.provider.getBalance(accounts[3].address)).to.equal(
          previousAccount3Balance.add(utils.parseEther("0.03")),
        );

        leaf = elements2[4];
        proof = merkleTree2.getHexProof(leaf);

        await expect(minter.claim2(users2[4].address, 3, proof, { value: utils.parseEther("0.29") }))
          .to.emit(minter, "Claimed")
          .withArgs(users2[4].address, 3);

        expect(await mafagafo.balanceOf(users2[4].address)).to.equal(3);
        expect(await mafagafo.provider.getBalance(accounts[2].address)).to.equal(
          previousAccount2Balance.add(utils.parseEther("0.07").add(utils.parseEther("0.203"))),
        );
        expect(await mafagafo.provider.getBalance(accounts[3].address)).to.equal(
          previousAccount3Balance.add(utils.parseEther("0.03").add(utils.parseEther("0.087"))),
        );

        leaf = elements2[5];
        proof = merkleTree2.getHexProof(leaf);

        await expect(minter.claim2(users2[5].address, 5, proof, { value: utils.parseEther("0.45") }))
          .to.emit(minter, "Claimed")
          .withArgs(users2[5].address, 5);

        expect(await mafagafo.balanceOf(users2[5].address)).to.equal(5);
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
        const leaf = elements2[3];
        const proof = merkleTree2.getHexProof(leaf);

        await minter.setFirstOption(false);

        await expect(minter.claim2(users2[3].address, 1, proof, { value: utils.parseEther("0.1") })).to.be.revertedWith(
          "InvalidOption()",
        );

        await minter.setSecondOption(false);

        await expect(
          minter.claim2(users2[3].address, 3, proof, { value: utils.parseEther("0.29") }),
        ).to.be.revertedWith("InvalidOption()");

        await minter.setThirdOption(false);

        await expect(
          minter.claim2(users2[3].address, 5, proof, { value: utils.parseEther("0.45") }),
        ).to.be.revertedWith("InvalidOption()");

        await minter.setFirstOption(true);

        await expect(minter.claim2(users2[3].address, 1, proof, { value: utils.parseEther("0.1") }))
          .to.emit(minter, "Claimed")
          .withArgs(users2[3].address, 1);
      });

      it("should revert for invalid address", async function () {
        const leaf = elements2[3];
        const proof = merkleTree2.getHexProof(leaf);

        // random address
        await expect(
          minter.claim2(users2[2].address, 3, proof, { value: utils.parseEther("0.29") }),
        ).to.be.revertedWith("InvalidProof()");
      });

      it("should revert for invalid quantity", async function () {
        const leaf = elements2[3];
        const proof = merkleTree2.getHexProof(leaf);

        await expect(minter.claim2(users2[3].address, 0, proof, { value: utils.parseEther("0.1") })).to.be.revertedWith(
          "QuantityError(0)",
        );

        await expect(minter.claim2(users2[3].address, 2, proof, { value: utils.parseEther("0.2") })).to.be.revertedWith(
          "QuantityError(2)",
        );

        await expect(minter.claim2(users2[3].address, 4, proof, { value: utils.parseEther("0.4") })).to.be.revertedWith(
          "QuantityError(4)",
        );
      });

      it("should revert for invalid proof", async function () {
        // Attempt to claim and verify success
        await expect(minter.claim2(users2[3].address, 1, [], { value: utils.parseEther("0.1") })).to.be.revertedWith(
          "InvalidProof()",
        );
      });

      it("should revert if user has already claimed", async function () {
        const leaf = elements2[3];
        const proof = merkleTree2.getHexProof(leaf);

        await minter.claim2(users2[3].address, 1, proof, { value: utils.parseEther("0.1") });

        await expect(minter.claim2(users2[3].address, 3, proof, { value: utils.parseEther("0.3") })).to.be.revertedWith(
          `AlreadyClaimed("${users2[3].address}")`,
        );
      });

      it("should revert if user doesn't send enough ETH", async function () {
        const leaf = elements2[3];
        const proof = merkleTree2.getHexProof(leaf);

        await expect(
          minter.claim2(users2[3].address, 1, proof, { value: utils.parseEther("0.09") }),
        ).to.be.revertedWith("PriceMismatch(90000000000000000, 100000000000000000)");

        await expect(
          minter.claim2(users2[3].address, 3, proof, { value: utils.parseEther("0.28") }),
        ).to.be.revertedWith("PriceMismatch(280000000000000000, 290000000000000000)");

        await expect(
          minter.claim2(users2[3].address, 5, proof, { value: utils.parseEther("0.44") }),
        ).to.be.revertedWith("PriceMismatch(440000000000000000, 450000000000000000)");
      });
    });
  });
});
