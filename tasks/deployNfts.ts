/* eslint-disable camelcase */
import { task } from "hardhat/config";

import {
  BrooderNft,
  BrooderNft__factory,
  EggNft,
  EggNft__factory,
  MafaBox,
  MafaBox__factory,
  MafaCoin,
  MafaCoin__factory,
  MafagafoAvatarNft,
  MafagafoAvatarNft__factory,
  MafaStore,
  MafaStore__factory,
} from "../typechain";

export function daysToUnixDate(days: number): number {
  return days * 24 * 60 * 60;
}

task("deploy:nfts", "Deploy all contracts related to nfts")
  .addParam("chain", "mainnet, testnet, or localhost")
  .setAction(async ({ chain }, { ethers, upgrades }) => {
    let MAFA_BNB: string;
    let BNB_BUSD: string;

    switch (chain) {
      case "mainnet":
      case "localhost":
        MAFA_BNB = "0xC53C7F4736F4a6DA25e950e25c58011Fe26B4a93";
        BNB_BUSD = "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16";
        break;
      case "testnet":
        MAFA_BNB = "0xb6692F1237DbbDD691Aaa801DFce92BC75E32Cb8";
        BNB_BUSD = "0x6204cFf92d89bcFe3AaB986469800A9031a3EE45";
        break;
      default:
        throw Error("unknown chain");
    }

    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const MafaCoinFactory: MafaCoin__factory = await ethers.getContractFactory("MafaCoin");
    let mafacoin: MafaCoin;

    switch (chain) {
      case "mainnet":
        mafacoin = MafaCoinFactory.attach("0xaf44400a99a9693bf3c2e89b02652babacc5cdb9");
        break;
      case "testnet":
        mafacoin = MafaCoinFactory.attach("0xa76a7d869c42a0021B9aB69E5012aD3fc38dEaA1");
        break;
      case "localhost":
        mafacoin = await MafaCoinFactory.deploy();
        mafacoin = await mafacoin.deployed();

        await (await mafacoin.afterPreSale()).wait(1);
        await (await mafacoin.setBurnBuyFee(0)).wait(1);
        await (await mafacoin.setBurnSellFee(0)).wait(1);
        await (await mafacoin.setLiquidyBuyFee(0)).wait(1);
        await (await mafacoin.setLiquidySellFee(0)).wait(1);
        await (await mafacoin.setTeamBuyFee(0)).wait(1);
        await (await mafacoin.setTeamSellFee(0)).wait(1);
        await (await mafacoin.setLotterySellFee(0)).wait(1);
        break;
      default:
        throw Error("unknown chain");
    }

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

    await (await egg.setMafagafoAddress(mafagafoAvatar.address)).wait(1);

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
      [
        mafagafoAvatar.address,
        [
          ethers.utils.parseEther("0.143"),
          ethers.utils.parseEther("0.143"),
          ethers.utils.parseEther("0.143"),
          ethers.utils.parseEther("0.143"),
          ethers.utils.parseEther("0.143"),
          ethers.utils.parseEther("0.143"),
          ethers.utils.parseEther("0.142"),
        ],
      ],
      {
        initializer: "initialize",
        kind: "uups",
      },
    );
    mafaBox = await mafaBox.deployed();

    console.log("Deployed mafabox at:", mafaBox.address);

    await (await mafaBox.grantRole(ethers.utils.id("MINTER_ROLE"), mafastore.address)).wait(1);
    await (await brooder.grantRole(ethers.utils.id("MINTER_ROLE"), mafastore.address)).wait(1);
    await (await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), mafaBox.address)).wait(1);
    await (await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), egg.address)).wait(1);
    await (await brooder.grantRole(ethers.utils.id("BURNER_ROLE"), egg.address)).wait(1);

    console.log("Roles granted");

    await (await brooder.createBrooder(0, daysToUnixDate(30))).wait(1);
    await (await brooder.createBrooder(1, daysToUnixDate(20))).wait(1);
    await (await brooder.createBrooder(2, daysToUnixDate(10))).wait(1);

    console.log("Brooders created");

    await (
      await mafastore.addItemToBeSold(
        mafaBox.address,
        0,
        ethers.utils.formatBytes32String("mafabox"),
        ethers.utils.parseEther("50"),
      )
    ).wait(1);

    console.log("MafaBox created at the store");

    await (
      await mafastore.addItemToBeSold(
        brooder.address,
        0,
        ethers.utils.formatBytes32String("brooder 0"),
        ethers.utils.parseEther("50"),
      )
    ).wait(1);
    await (
      await mafastore.addItemToBeSold(
        brooder.address,
        1,
        ethers.utils.formatBytes32String("brooder 1"),
        ethers.utils.parseEther("100"),
      )
    ).wait(1);
    await (
      await mafastore.addItemToBeSold(
        brooder.address,
        2,
        ethers.utils.formatBytes32String("brooder 2"),
        ethers.utils.parseEther("150"),
      )
    ).wait(1);

    console.log("Brooders created at the store");
    console.log("NFTs uris setted");
    console.log("Brooder: " + brooder.address);
    console.log("Egg: " + egg.address);
    console.log("Avatar: " + mafagafoAvatar.address);
    console.log("Store: " + mafastore.address);
    console.log("Box: " + mafaBox.address);
  });
