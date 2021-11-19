import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export function expandTo18Decimals(n: number): BigNumber {
  return ethers.BigNumber.from(n).mul(ethers.BigNumber.from(10).pow(18));
}
