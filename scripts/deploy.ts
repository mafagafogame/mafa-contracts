// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";
import { MafaCoinV2, MafaCoinV2__factory } from "../typechain";
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const mafaFactory = (await ethers.getContractFactory("MafaCoinV2")) as MafaCoinV2__factory;
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
  console.log("afterPreSale tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setLiquidyBuyFee(0);
  console.log("setLiquidyBuyFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setLiquidySellFee(0);
  console.log("setLiquidySellFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setBurnBuyFee(0);
  console.log("setBurnBuyFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setBurnSellFee(0);
  console.log("setBurnSellFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setTeamBuyFee(0);
  console.log("setTeamBuyFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setTeamSellFee(0);
  console.log("setTeamSellFee tx: " + transaction.hash);
  await transaction.wait(10);

  transaction = await mafa.setLotterySellFee(0);
  console.log("setLotterySellFee tx: " + transaction.hash);
  await transaction.wait(10);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
