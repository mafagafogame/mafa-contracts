// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";
import {MafaCoin__factory} from "../typechain";

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

  const MafaCoin = await ethers.getContractFactory("MafaCoin");
  // var mafacoin = await upgrades.deployProxy(MafaCoin, ["MafaCoin", "MAFA"], { initializer: "initialize" });
  var mafacoin = await MafaCoin.deploy("MafaCoin", "MAFA");
  mafacoin = await mafacoin.deployed();

  console.log("MafaCoin deployed to:", mafacoin.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
