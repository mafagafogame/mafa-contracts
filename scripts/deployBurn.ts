/* eslint-disable camelcase */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";
import { Burner, Burner__factory, MafagafoAvatarNft__factory } from "../typechain";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const mafagafoAvatarFactory = <MafagafoAvatarNft__factory>await ethers.getContractFactory("MafagafoAvatarNft");
  // MAINET MAFAGAFO
  // const mafagafoAvatar = mafagafoAvatarFactory.attach("0xE06a72D91Afba61Ee58D25daf9253d3f2e2c7D81");

  // TESTNET MAFAGAFO
  const mafagafoAvatar = mafagafoAvatarFactory.attach("0xaD4B2C7C01D69BeFCba32Cb3f0656fCefb6aE3E5");

  console.log("Deployed mafagafo at:", mafagafoAvatar.address);

  const burnerFactory = <Burner__factory>await ethers.getContractFactory("Burner");
  let burner = <Burner>await upgrades.deployProxy(burnerFactory, [mafagafoAvatar.address], {
    initializer: "initialize",
    kind: "uups",
  });
  burner = await burner.deployed();

  console.log("Deployed burner at:", burner.address);

  await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), burner.address);

  console.log("Minter role granted to burner");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
