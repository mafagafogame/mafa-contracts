/* eslint-disable camelcase */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { Mafagafo, Mafagafo__factory } from "../typechain";
import { utils } from "ethers";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { users } from "./users";

async function main() {
  const accounts = await ethers.getSigners();

  console.log("Updating contracts with the account:", accounts[0].address);

  // equal to MerkleDistributor.sol #keccak256(abi.encodePacked(account, amount));
  const elements = users.map(x => utils.solidityKeccak256(["address", "uint256"], [x.address, x.amount]));

  const merkleTree = new MerkleTree(elements, keccak256, { sort: true });

  const root = merkleTree.getHexRoot();

  const mafagafoFactory = <Mafagafo__factory>await ethers.getContractFactory("Mafagafo");
  const mafagafo = <Mafagafo>mafagafoFactory.attach("0x1616616BC0e824d599c6C31de47718B8e3945192");

  await mafagafo.setMerkleRoot(root);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
