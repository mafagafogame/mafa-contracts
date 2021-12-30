// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";
import { MafaFake__factory } from "../typechain";
import { abi } from "../artifacts/contracts/MafaCoin/MafaCoin.sol/MafaFake.json";
import { Contract } from "ethers";
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // const mafaFactory = (await ethers.getContractFactory("MafaFake")) as MafaFake__factory;
  // let mafaFake = await mafaFactory.deploy();
  // mafaFake = await mafaFake.deployed();
  // console.log("MafaFake deployed to:", mafaFake.address);

  const mafaFake = new Contract("0x44AC913c87950Ccf6d18293955eEC21f3B26ca17", abi, deployer);

  let transaction = await mafaFake.startLiquidity("0x10ED43C718714eb63d5aA57B78B54704E256024E");
  console.log("Transaction: " + transaction.hash);
  await transaction.wait(10);
  console.log("Router: " + (await mafaFake.dexRouter()));
  console.log("Pair: " + (await mafaFake.dexPair()));

  transaction = await mafaFake.afterPreSale();
  console.log("Set afterPreSale tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafaFake.setLotteryFee(0);
  console.log("Set setLotteryFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafaFake.setLiquidyFee(0);
  console.log("Set setLiquidyFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafaFake.setBurnFee(0);
  console.log("Set burn tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafaFake.setTeamSellFee(0);
  console.log("Set setTeamSellFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafaFake.setTeamBuyFee(0);
  console.log("Set setTeamBuyFee tx: " + transaction.hash);
  await transaction.wait(10);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
