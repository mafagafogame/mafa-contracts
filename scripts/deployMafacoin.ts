/* eslint-disable camelcase */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { MafaCoin, MafaCoin__factory } from "../typechain";
import { utils } from "ethers";

async function main() {
  const accounts = await ethers.getSigners();

  console.log("Deploying contracts with the account:", accounts[0].address);

  const mafacoinFactory = <MafaCoin__factory>await ethers.getContractFactory("MafaCoin");
  const mafacoin = <MafaCoin>await mafacoinFactory.deploy("MafaCoin", "MAFA", utils.parseEther("1000000000"));
  await mafacoin.deployed();

  console.log("Deployed mafacoin at:", mafacoin.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
