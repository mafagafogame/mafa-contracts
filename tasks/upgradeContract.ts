import { task } from "hardhat/config";

task("upgrade:contract", "Upgrade a contract from an address")
  .addParam("name", "contract name")
  .addParam("address", "address of the deployed contract")
  .setAction(async (taskArgs, { ethers, upgrades }) => {
    let ContractFactory: any;

    switch (taskArgs.name) {
      case "brooder":
        ContractFactory = await ethers.getContractFactory("BrooderNft");
        break;
      case "egg":
        ContractFactory = await ethers.getContractFactory("EggNft");
        break;
      case "mafagafo":
        ContractFactory = await ethers.getContractFactory("MafagafoAvatarNft");
        break;
      case "mafastore":
        ContractFactory = await ethers.getContractFactory("MafaStore");
        break;
      case "mafabox":
        ContractFactory = await ethers.getContractFactory("MafaBox");
        break;
    }

    const contract = ContractFactory.attach(taskArgs.address);

    await upgrades.upgradeProxy(contract, ContractFactory, { kind: "uups" });

    console.log("Contract Upgraded!");

    await contract.setDailySellPercentage(ethers.utils.parseEther("1"));

    console.log("Daily Sell Percentage Set to 1%!");
  });
