import { BigNumber } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Artifact } from "hardhat/types";
import { MafaCoin } from "../../typechain";

export function expandTo18Decimals(n: number): BigNumber {
  return ethers.BigNumber.from(n).mul(ethers.BigNumber.from(10).pow(18));
}

export async function deployMafaCoin(owner: SignerWithAddress) {
  const mafacoinArtifact: Artifact = await artifacts.readArtifact("MafaCoin");
  const mafacoin = <MafaCoin>await waffle.deployContract(owner, mafacoinArtifact);

  await mafacoin.afterPreSale();
  await mafacoin.setTeamBuyFee(0);
  await mafacoin.setTeamSellFee(0);
  await mafacoin.setLiquidyFee(0);
  await mafacoin.setLotteryFee(0);
  return mafacoin;
}
