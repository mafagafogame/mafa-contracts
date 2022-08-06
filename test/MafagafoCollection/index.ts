/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { Mafagafo, Mafagafo__factory } from "../../typechain";

describe("Unit tests", function () {
  let mafagafo: Mafagafo;
  let accounts: SignerWithAddress[];

  before(async function () {
    accounts = await ethers.getSigners();
  });

  describe("Mafagafo", async function () {
    beforeEach(async function () {
      const mafagafoFactory = <Mafagafo__factory>await ethers.getContractFactory("Mafagafo");
      mafagafo = <Mafagafo>await upgrades.deployProxy(
        mafagafoFactory,
        ["https://store.mafagafo.com/assets/mafagafos/0.png", accounts[2].address, 420],
        {
          initializer: "initialize",
          kind: "uups",
        },
      );
    });

    it("Should be deployed", async function () {
      expect(await mafagafo.name()).to.equal("Mafagafo");
      expect(await mafagafo.symbol()).to.equal("MAFA");
      expect(await mafagafo.totalSupply()).to.equal(420);
      expect(await mafagafo.balanceOf(accounts[2].address)).to.equal(420);
      expect(await mafagafo.ownerOf(0)).to.equal(accounts[2].address);
      expect(await mafagafo.ownerOf(419)).to.equal(accounts[2].address);
    });

    it("Should show each nft its own tokenURI when baseURI is updated", async function () {
      expect(await mafagafo.tokenURI(0)).to.equal("https://store.mafagafo.com/assets/mafagafos/0.png");
      expect(await mafagafo.tokenURI(419)).to.equal("https://store.mafagafo.com/assets/mafagafos/0.png");

      await mafagafo.setBaseURI("https://store.mafagafo.com/assets/mafagafos/");

      expect(await mafagafo.tokenURI(0)).to.equal("https://store.mafagafo.com/assets/mafagafos/0");
      expect(await mafagafo.tokenURI(419)).to.equal("https://store.mafagafo.com/assets/mafagafos/419");
    });

    it("Owner Should be able to mint a NFT", async function () {
      expect(await mafagafo.balanceOf(accounts[3].address)).to.equal(0);
      await mafagafo.safeMint(accounts[3].address, 1);
      expect(await mafagafo.balanceOf(accounts[3].address)).to.equal(1);

      expect(await mafagafo.ownerOf(420)).to.equal(accounts[3].address);
    });
  });
});
