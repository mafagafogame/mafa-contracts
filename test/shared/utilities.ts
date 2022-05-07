import { BigNumber, utils } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Artifact } from "hardhat/types";
import { MafaCoin } from "../../typechain";
import axios from "axios";

export function expandTo18Decimals(n: number): BigNumber {
  return ethers.BigNumber.from(n).mul(ethers.BigNumber.from(10).pow(18));
}

export function bigNumberToFloat(n: BigNumber): number {
  return parseFloat(utils.formatEther(n));
}

export function daysToUnixDate(days: number): number {
  return days * 24 * 60 * 60;
}

export async function deployMafaCoin(owner: SignerWithAddress) {
  const mafacoinArtifact: Artifact = await artifacts.readArtifact("MafaCoin");
  const mafacoin = <MafaCoin>(
    await waffle.deployContract(owner, mafacoinArtifact, ["Mafacoin", "MAFA", utils.parseEther("1000000000")])
  );

  await mafacoin.setDevelopmentBuyFee(0);
  await mafacoin.setDevelopmentSellFee(0);
  await mafacoin.setMarketingBuyFee(0);
  await mafacoin.setMarketingSellFee(0);
  await mafacoin.setLiquidityBuyFee(0);
  await mafacoin.setLiquiditySellFee(0);
  return mafacoin;
}

export async function getMAFAtoBUSDprice(): Promise<number> {
  const response = await axios("https://api.pancakeswap.info/api/v2/tokens/0xaf44400a99a9693bf3c2e89b02652babacc5cdb9");
  const data = await response.data;
  return parseFloat(data.data.price);
}

export function range(start: number, end: number): number[] {
  return Array(end - start + 1)
    .fill(0)
    .map((_, idx) => start + idx);
}
