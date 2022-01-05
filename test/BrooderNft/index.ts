/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { BrooderNft, BrooderNft__factory } from "../../typechain";

describe("Unit tests", function () {
  let brooder: BrooderNft;
  let account1: SignerWithAddress;

  const fiveDays = 5 * 24 * 60 * 60;

  before(async function () {
    [, account1] = await ethers.getSigners();
  });

  describe("Brooder", function () {
    beforeEach(async function () {
      const brooderFactory = <BrooderNft__factory>await ethers.getContractFactory("BrooderNft");
      brooder = <BrooderNft>await upgrades.deployProxy(brooderFactory, [], {
        initializer: "initialize",
        kind: "uups",
      });
    });

    describe("non admin", function () {
      it("non admin user should not be able to create a new brooder", async function () {
        await expect(brooder.connect(account1).createBrooder(0, fiveDays)).to.be.reverted;
      });

      it("user should be able to query a created brooder", async function () {
        await brooder.createBrooder(0, fiveDays);
        expect(await brooder.callStatic.getBrooder(0)).to.equal(fiveDays);
      });
    });

    describe("admin", function () {
      it("admin user should be able to create a new brooder", async function () {
        await expect(brooder.createBrooder(0, fiveDays)).to.emit(brooder, "BrooderCreated").withArgs(0, fiveDays);
      });

      it("admin user should be able to update a brooder that have been previously created", async function () {
        await brooder.createBrooder(0, fiveDays);

        expect(await brooder.callStatic.getBrooder(0)).to.equal(fiveDays);

        await expect(brooder.createBrooder(0, fiveDays + 5))
          .to.emit(brooder, "BrooderCreated")
          .withArgs(0, fiveDays + 5);

        expect(await brooder.callStatic.getBrooder(0)).to.equal(fiveDays + 5);
      });
    });
  });
});
