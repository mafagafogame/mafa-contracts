// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";
import {MafaCoin, MafaCoin__factory} from "../typechain";
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const mafaFactory = (await ethers.getContractFactory("MafaCoin")) as MafaCoin__factory;
  let mafa = await mafaFactory.deploy();
  mafa = await mafa.deployed();
  console.log("MafaFake deployed to:", mafa.address);

  // const mafa = new Contract("0x44AC913c87950Ccf6d18293955eEC21f3B26ca17", abi, deployer);

  let transaction = await mafa.startLiquidity("0x10ED43C718714eb63d5aA57B78B54704E256024E");
  console.log("Transaction: " + transaction.hash);
  await transaction.wait(10);
  console.log("Router: " + (await mafa.dexRouter()));
  console.log("Pair: " + (await mafa.dexPair()));

  transaction = await mafa.afterPreSale();
  console.log("Set afterPreSale tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setLotteryFee(0);
  console.log("Set setLotteryFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setLiquidyFee(0);
  console.log("Set setLiquidyFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setBurnFee(0);
  console.log("Set burn tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setTeamSellFee(0);
  console.log("Set setTeamSellFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setTeamBuyFee(0);
  console.log("Set setTeamBuyFee tx: " + transaction.hash);
  await transaction.wait(10);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
