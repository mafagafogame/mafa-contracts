/* eslint-disable camelcase */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";

async function main() {
  const ContractFactory = await ethers.getContractFactory("MafaStore");
  const contract = ContractFactory.attach("0x56C25a6eEADABc27C46aAD116f7bB34BAA0E2392");

  await upgrades.upgradeProxy(contract, ContractFactory, { kind: "uups" });

  console.log("Contract Upgraded!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
