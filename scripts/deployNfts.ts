/* eslint-disable camelcase */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";
import {
  BrooderNft,
  BrooderNft__factory,
  EggNft,
  EggNft__factory,
  MafaBox,
  MafaBox__factory,
  MafaCoin__factory,
  MafagafoAvatarNft,
  MafagafoAvatarNft__factory,
  MafaStore,
  MafaStore__factory,
} from "../typechain";
import { daysToUnixDate, expandTo18Decimals } from "../test/shared/utilities";

async function main() {
  // MAINNET LPs
  // const MAFA_BNB = "0xC53C7F4736F4a6DA25e950e25c58011Fe26B4a93";
  // const BNB_BUSD = "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16";

  // TESTNET LPs
  const MAFA_BNB = "0xb6692F1237DbbDD691Aaa801DFce92BC75E32Cb8";
  const BNB_BUSD = "0x85EcDcdd01EbE0BfD0Aba74B81Ca6d7F4A53582b";

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const MafaCoinFactory: MafaCoin__factory = await ethers.getContractFactory("MafaCoin");
  // MAINET MAFACOIN
  // const mafacoin = MafaCoinFactory.attach("0xaf44400a99a9693bf3c2e89b02652babacc5cdb9");

  // TESTNET MAFACOIN
  const mafacoin = MafaCoinFactory.attach("0xa76a7d869c42a0021B9aB69E5012aD3fc38dEaA1");

  console.log("Deployed mafacoin at:", mafacoin.address);

  const brooderFactory: BrooderNft__factory = await ethers.getContractFactory("BrooderNft");
  let brooder = <BrooderNft>await upgrades.deployProxy(brooderFactory, [], {
    initializer: "initialize",
    kind: "uups",
  });
  brooder = await brooder.deployed();

  console.log("Deployed brooder at:", brooder.address);

  const eggFactory: EggNft__factory = await ethers.getContractFactory("EggNft");
  let egg = <EggNft>await upgrades.deployProxy(eggFactory, [brooder.address], {
    initializer: "initialize",
    kind: "uups",
  });
  egg = await egg.deployed();

  console.log("Deployed egg at:", egg.address);

  const mafagafoAvatarFactory: MafagafoAvatarNft__factory = await ethers.getContractFactory("MafagafoAvatarNft");
  let mafagafoAvatar = <MafagafoAvatarNft>await upgrades.deployProxy(mafagafoAvatarFactory, [egg.address], {
    initializer: "initialize",
    kind: "uups",
  });
  mafagafoAvatar = await mafagafoAvatar.deployed();

  console.log("Deployed mafagafoAvatar at:", mafagafoAvatar.address);

  await egg.setMafagafoContract(mafagafoAvatar.address);

  const mafastoreFactory: MafaStore__factory = await ethers.getContractFactory("MafaStore");
  let mafastore = <MafaStore>await upgrades.deployProxy(
    mafastoreFactory,
    [mafacoin.address, mafagafoAvatar.address, MAFA_BNB, BNB_BUSD],
    {
      initializer: "initialize",
      kind: "uups",
    },
  );
  mafastore = await mafastore.deployed();

  console.log("Deployed mafastore at:", mafastore.address);

  const mafaBoxFactory = <MafaBox__factory>await ethers.getContractFactory("MafaBox");
  let mafaBox = <MafaBox>await upgrades.deployProxy(
    mafaBoxFactory,
    [mafagafoAvatar.address, [500, 1500, 2000, 2500, 3500]],
    {
      initializer: "initialize",
      kind: "uups",
    },
  );
  mafaBox = await mafaBox.deployed();

  console.log("Deployed mafabox at:", mafaBox.address);

  await (await brooder.grantRole(ethers.utils.id("MINTER_ROLE"), mafastore.address)).wait(1);
  await (await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), mafaBox.address)).wait(1);
  await (await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), egg.address)).wait(1);
  await (await brooder.grantRole(ethers.utils.id("BURNER_ROLE"), egg.address)).wait(1);

  console.log("Roles granted");

  await (await brooder.createBrooder(0, daysToUnixDate(20))).wait(1);
  await (await brooder.createBrooder(1, daysToUnixDate(10))).wait(1);
  await (await brooder.createBrooder(2, daysToUnixDate(5))).wait(1);

  console.log("Brooders created");

  await (
    await mafastore.addItemToBeSold(
      mafaBox.address,
      0,
      ethers.utils.formatBytes32String("mafabox"),
      expandTo18Decimals(50),
    )
  ).wait(1);

  console.log("MafaBox created at the store");

  await (
    await mafastore.addItemToBeSold(
      brooder.address,
      0,
      ethers.utils.formatBytes32String("brooder 0"),
      expandTo18Decimals(50),
    )
  ).wait(1);
  await (
    await mafastore.addItemToBeSold(
      brooder.address,
      1,
      ethers.utils.formatBytes32String("brooder 1"),
      expandTo18Decimals(100),
    )
  ).wait(1);
  await (
    await mafastore.addItemToBeSold(
      brooder.address,
      2,
      ethers.utils.formatBytes32String("brooder 2"),
      expandTo18Decimals(150),
    )
  ).wait(1);

  console.log("Brooders created at the store");

  await (await mafagafoAvatar.setBaseURI("https://jsonkeeper.com/b/B8X8/")).wait(1);
  await (await egg.setBaseURI("https://jsonkeeper.com/b/Q6WL/")).wait(1);
  await (await mafaBox.setTokenUri(0, "https://jsonkeeper.com/b/8JCM/")).wait(1);
  await (await brooder.setTokenUri(0, "https://jsonkeeper.com/b/SEKZ/")).wait(1);
  await (await brooder.setTokenUri(1, "https://jsonkeeper.com/b/SEKZ/")).wait(1);
  await (await brooder.setTokenUri(2, "https://jsonkeeper.com/b/SEKZ/")).wait(1);

  console.log("NFTs uris setted");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
