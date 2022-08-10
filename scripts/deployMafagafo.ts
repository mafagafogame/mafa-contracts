/* eslint-disable camelcase */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";
import { Mafagafo, Mafagafo__factory } from "../typechain";
import { utils } from "ethers";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { users } from "./users";

async function main() {
  const accounts = await ethers.getSigners();

  console.log("Deploying contracts with the account:", accounts[0].address);

  // equal to MerkleDistributor.sol #keccak256(abi.encodePacked(account, amount));
  const elements = users.map(x => utils.solidityKeccak256(["address", "uint256"], [x.address, x.amount]));

  const merkleTree = new MerkleTree(elements, keccak256, { sort: true });

  const root = merkleTree.getHexRoot();

  const mafagafoFactory = <Mafagafo__factory>await ethers.getContractFactory("Mafagafo");
  const mafagafo = <Mafagafo>await upgrades.deployProxy(
    mafagafoFactory,
    [
      "https://bafkreid75wc6jhboct7tanlsttfqu4pgveiyct6hx5uiibr5fs7co4y2fq.ipfs.nftstorage.link/",
      "0x04015a633202FAa484e6eE2138bDe6dCe0fc28eb",
      10,
      root,
      "0x04015a633202FAa484e6eE2138bDe6dCe0fc28eb",
      "0xffaDa8Ba93422819885Dfa584A62d10133035b04",
      utils.parseEther("0.1"),
      utils.parseEther("0.29"),
      utils.parseEther("0.45"),
    ],
    {
      initializer: "initialize",
      kind: "uups",
    },
  );
  await mafagafo.deployed();

  console.log("Deployed mafagafo at:", mafagafo.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
