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

    if (taskArgs.name === "mafastore") {
      await contract.setTicketSeller("0x6eA4d3dAB05f63495a002feD5AdAf0BA8FF6Bd94");

      await (await contract.addTicketToBeSold(10, ethers.utils.formatBytes32String("pack 1"), 100)).wait(1);
      await (await contract.addTicketToBeSold(15, ethers.utils.formatBytes32String("pack 2"), 140)).wait(1);
      await (await contract.addTicketToBeSold(30, ethers.utils.formatBytes32String("pack 3"), 250)).wait(1);
    }

    console.log("Contract Upgraded!");
  });
