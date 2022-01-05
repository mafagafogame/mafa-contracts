/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers } from "hardhat";
import { MafaCoin, MafaCoin__factory, TimeLockedWallet, TimeLockedWallet__factory } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("TimeLockedWallet", function () {
  let timeLockedWallet: TimeLockedWallet;
  let mafacoin: MafaCoin;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let timestamp: number;

  const oneWeek = 7 * 24 * 60 * 60;

  before(async function () {
    [owner, address1] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    timestamp = block.timestamp;

    const MafaCoinFactory: MafaCoin__factory = await ethers.getContractFactory("MafaCoin");
    mafacoin = await MafaCoinFactory.deploy();
    mafacoin = await mafacoin.deployed();

    const TimeLockedWalletFactory: TimeLockedWallet__factory = await ethers.getContractFactory("TimeLockedWallet");
    timeLockedWallet = await TimeLockedWalletFactory.deploy(address1.address, mafacoin.address, timestamp + oneWeek);
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
    expect(unlockDate).to.equal(timestamp + oneWeek);
  });
});
