import { expect } from "chai";
import {ethers, upgrades} from "hardhat";
import {MafaCoin, MafaCoin__factory} from "../typechain";
import {Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe("MafaCoin", function () {
  let contract: Contract;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;

  before(async function () {
    [owner, address1, address2] = await ethers.getSigners();
  });

  beforeEach(async function (){
    const MafaCoinFactory: MafaCoin__factory = await ethers.getContractFactory("MafaCoin");
    contract = await upgrades.deployProxy(MafaCoinFactory, ["MafaCoin", "MAFA"], { initializer: "initialize" });
    contract = await contract.deployed();
  });

  it("should have the correct name and symbol", async function () {
    const name = await contract.name();
    const symbol = await contract.symbol();

    expect(name).to.equal("MafaCoin");
    expect(symbol).to.equal("MAFA");
  });
});
