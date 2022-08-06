/* eslint-disable camelcase */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";
import { Mafagafo, Mafagafo__factory, Minter, Minter__factory } from "../typechain";
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

  const mafagafoFactory = <Mafagafo__factory>await ethers.getContractFactory("Mafagafo");
  const mafagafo = <Mafagafo>await upgrades.deployProxy(
    mafagafoFactory,
    ["https://i.pinimg.com/originals/0b/04/d7/0b04d7f67d836af867c4192699773c52.gif", accounts[0].address, 420],
    {
      initializer: "initialize",
      kind: "uups",
    },
  );
  await mafagafo.deployed();

  console.log("Deployed mafagafo at:", mafagafo.address);

  const minterFactory = <Minter__factory>await ethers.getContractFactory("Minter");
  const minter = <Minter>await upgrades.deployProxy(
    minterFactory,
    [
      root,
      root2,
      mafagafo.address,
      accounts[0].address,
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

  console.log("Deployed minter at:", minter.address);

  await mafagafo.grantRole(ethers.utils.id("MINTER_ROLE"), minter.address);

  console.log("Minter role granted");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
