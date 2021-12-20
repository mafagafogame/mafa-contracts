// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";
import { MafaCoin, MafaCoin__factory } from "../typechain";
import { Wallet } from "@ethersproject/wallet";
import {abi} from '../artifacts/contracts/Mafacoin.sol/MafaCoin.json';

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const Greeter = await ethers.getContractFactory("Greeter");
  // const greeter = await Greeter.deploy("Hello, Hardhat!");
  //
  // await greeter.deployed();
  //
  // console.log("Greeter deployed to:", greeter.address);

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  let mafacoin: MafaCoin = new ethers.Contract("0xAF44400A99a9693bF3c2e89b02652bABACc5cdb9", abi, deployer) as MafaCoin;
  let transaction = await mafacoin.startLiquidity("0x10ED43C718714eb63d5aA57B78B54704E256024E");
  console.log("Transaction: " + transaction.hash);
  await transaction.wait(1);
  console.log("Router: " + (await mafacoin.dexRouter()));
  console.log("Pair: " + (await mafacoin.dexPair()));

  // const oneDay = 7 * 24 * 60 * 60;
  //
  // const blockNumber = await ethers.provider.getBlockNumber();
  // const block = await ethers.provider.getBlock(blockNumber);
  // const timestamp = block.timestamp;
  //
  // const TimeLockedWallet = await ethers.getContractFactory("TimeLockedWallet");
  // let timeLockedWallet = await TimeLockedWallet.deploy(
  //   "0x3dBe2A5F92dc05Abd3DDFE1B07E41C4C3D297165",
  //   mafacoin.address,
  //   timestamp + oneDay
  // );
  // timeLockedWallet = await timeLockedWallet.deployed();
  //
  // console.log("TimeLockedWallet deployed to:", timeLockedWallet.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
