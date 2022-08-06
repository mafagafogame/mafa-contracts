/* eslint-disable camelcase */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { Minter, Minter__factory } from "../typechain";
import { utils } from "ethers";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { users, users2 } from "./users";

async function main() {
  const accounts = await ethers.getSigners();

  console.log("Deploying contracts with the account:", accounts[0].address);

  // equal to MerkleDistributor.sol #keccak256(abi.encodePacked(account, amount));
  const elements = users.map(x => utils.solidityKeccak256(["address", "uint256"], [x.address, x.amount]));
  const elements2 = users2.map(x => utils.solidityKeccak256(["address"], [x.address]));

  const merkleTree = new MerkleTree(elements, keccak256, { sort: true });
  const merkleTree2 = new MerkleTree(elements2, keccak256, { sort: true });

  const root = merkleTree.getHexRoot();
  const root2 = merkleTree2.getHexRoot();

  const minterFactory = <Minter__factory>await ethers.getContractFactory("Minter");
  const minter = <Minter>minterFactory.attach("0x42Ff7c0b9353510b95D654d4c28b506e92f3cbe5");

  await minter.setMerkleRoot1(root);
  await minter.setMerkleRoot2(root2);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
