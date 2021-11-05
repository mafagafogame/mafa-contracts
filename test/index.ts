import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "ethers";
import {
  MafaCoin,
  MafaCoin__factory,
  TimeLockedWallet,
  TimeLockedWallet__factory,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("MafaCoin", function () {
  let contract: MafaCoin;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;
  let address3: SignerWithAddress;
  let address4: SignerWithAddress;
  const deadAddress = "0x000000000000000000000000000000000000dEaD";

  before(async function () {
    [, address1, address2, address3, address4] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const MafaCoinFactory: MafaCoin__factory = await ethers.getContractFactory(
      "MafaCoin"
    );
    contract = await MafaCoinFactory.deploy();
    contract = await contract.deployed();
    await contract.afterPreSale();
    await contract.setTeamWallet(address1.address);
    await contract.setLotteryWallet(address2.address);
  });

  it("should have the correct name and symbol", async function () {
    const name = await contract.name();
    const symbol = await contract.symbol();

    expect(name).to.equal("MafaCoin");
    expect(symbol).to.equal("MAFA");
  });

  it("should stop burn fee after 50% of the total supply is burned", async function () {
    const initialBurnFee = await contract.burnFee();

    await contract.transfer(
      deadAddress,
      utils.parseEther("500000000").toString()
    );
    await contract.transfer(address3.address, 100);

    const totalSupply = await contract.totalSupply();

    const totalBurned = await contract.balanceOf(deadAddress);

    const burnFee = await contract.burnFee();

    expect(totalSupply).to.equal(utils.parseEther("1000000000").toString());
    expect(totalBurned).to.equal(utils.parseEther("500000000").toString());
    expect(initialBurnFee).to.equal(1);
    expect(burnFee).to.equal(0);
  });

  it("should maintain burn fee if 49% of the total supply is burned", async function () {
    const initialBurnFee = await contract.burnFee();

    await contract.transfer(
      deadAddress,
      utils.parseEther("490000000").toString()
    );
    await contract.transfer(address3.address, 100);

    const burnFee = await contract.burnFee();

    expect(initialBurnFee).to.equal(1);
    expect(burnFee).to.equal(1);
  });

  it("should charge buy fees", async function () {
    await contract.setLiquidyFee(0);

    await contract.transfer(
      address3.address,
      utils.parseEther("1000").toString()
    );
    await contract
      .connect(address3)
      .transfer(address4.address, utils.parseEther("1000").toString());

    const zeroBalance = await contract.balanceOf(address3.address);
    const balanceTaxed = await contract.balanceOf(address4.address);
    const teamBalance = await contract.balanceOf(address1.address);
    const burnBalance = await contract.balanceOf(deadAddress);

    expect(zeroBalance).to.equal(0);
    expect(balanceTaxed).to.equal(utils.parseEther("980").toString());
    expect(teamBalance).to.equal(utils.parseEther("10").toString());
    expect(burnBalance).to.equal(utils.parseEther("10").toString());
  });
});

describe("TimeLockedWallet", function () {
  let timeLockedWallet: TimeLockedWallet;
  let mafacoin: MafaCoin;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let timestamp: number;

  const oneDay = 7 * 24 * 60 * 60;

  before(async function () {
    [owner, address1] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    timestamp = block.timestamp;

    const MafaCoinFactory: MafaCoin__factory = await ethers.getContractFactory(
      "MafaCoin"
    );
    mafacoin = await MafaCoinFactory.deploy();
    mafacoin = await mafacoin.deployed();

    const TimeLockedWalletFactory: TimeLockedWallet__factory =
      await ethers.getContractFactory("TimeLockedWallet");
    timeLockedWallet = await TimeLockedWalletFactory.deploy(
      address1.address,
      mafacoin.address,
      timestamp + oneDay
    );
    timeLockedWallet = await timeLockedWallet.deployed();
  });

  it("should have the correct addresses", async function () {
    const creator = await timeLockedWallet.creator();
    const toWallet = await timeLockedWallet.toWallet();
    const mafacoinAddress = await timeLockedWallet.mafacoin();

    expect(creator).to.equal(owner.address);
    expect(toWallet).to.equal(address1.address);
    expect(mafacoinAddress).to.equal(mafacoin.address);
  });

  it("should have the correct createdAt time and unlockDate", async function () {
    const createdAt = await timeLockedWallet.createdAt();
    const unlockDate = await timeLockedWallet.unlockDate();
    const blockNumber = await timeLockedWallet.provider.getBlockNumber();
    const block = await timeLockedWallet.provider.getBlock(blockNumber);
    const contractTimestamp = block.timestamp;

    expect(createdAt).to.equal(contractTimestamp);
    expect(unlockDate).to.equal(timestamp + oneDay);
  });
});
