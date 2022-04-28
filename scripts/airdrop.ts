import accounts from "./airdropBoxes";
import { ethers } from "hardhat";
import { MafaBox__factory, MafaCoin__factory } from "../typechain";

const chunk = (arr: string[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  // todo: add the correct address
  const mafabox = MafaBox__factory.connect("0xAF44400A99a9693bF3c2e89b02652bABACc5cdb9", deployer);

  console.log("Initiating airdrop");

  let addresses: string[] = [];
  for (const add of accounts) {
    try {
      addresses.push(ethers.utils.getAddress(add));
    } catch (e) {
      console.log(add + " is not a valid wallet");
    }
  }

  const chunks = chunk(addresses, 400);
  for (let i = 0; i < chunks.length; i++) {
    let part = chunks[i];
    console.log("part id: " + i + "/" + chunks.length);
    let tx = await mafabox.multiMintEqualIdAndAmount(part, 0, 1, ethers.utils.formatBytes32String(""));
    // let rec = await tx.wait(8);
    console.log("multisend hash: " + tx.hash);
    console.log("multisend block: " + tx.blockNumber);
  }

  console.log("Boxes airdrop completed!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
