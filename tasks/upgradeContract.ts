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
      await (await contract.setTicketSeller("0xE341d141133D82Def0Ee59a3D9365fd2942Eeb63")).wait(1);

      await (
        await contract.addItemToBeSold(
          "0x0000000000000000000000000000000000000000",
          0,
          ethers.utils.formatBytes32String("pack 1"),
          ethers.utils.parseEther("100"),
        )
      ).wait(1);

      await (
        await contract.addItemToBeSold(
          "0x0000000000000000000000000000000000000000",
          0,
          ethers.utils.formatBytes32String("pack 2"),
          ethers.utils.parseEther("140"),
        )
      ).wait(1);

      await (
        await contract.addItemToBeSold(
          "0x0000000000000000000000000000000000000000",
          0,
          ethers.utils.formatBytes32String("pack 3"),
          ethers.utils.parseEther("250"),
        )
      ).wait(1);
    }

    console.log("Contract Upgraded!");
  });
