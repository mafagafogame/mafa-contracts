import { expect } from "chai";
import { artifacts, ethers, upgrades, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {BaseNft__factory, BaseNft, BaseNftTestV2__factory, BaseNftTestV2} from "../../typechain";
import { expandTo18Decimals } from "../shared/utilities";
import {assert} from "@openzeppelin/upgrades-core/dist/utils/assert";
import {BigNumber} from "ethers";

describe("Base NFT", function () {
  let contract: BaseNft;
  let contractV2: BaseNftTestV2;
  let owner: SignerWithAddress;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;
  let address3: SignerWithAddress;
  let address4: SignerWithAddress;
  let address5: SignerWithAddress;

  const CONTRACT_NAME="Mafagafo NFT Base";
  const CONTRACT_SYMBOL="MNFTB";
  const TOKEN_URI="https://example.com/";

  before(async function () {
    [owner, address1, address2, address3, address4, address5] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // eslint-disable-next-line camelcase
    const baseNftFactory: BaseNft__factory = await ethers.getContractFactory("BaseNft");
    contract = (await upgrades.deployProxy(baseNftFactory, [CONTRACT_NAME, CONTRACT_SYMBOL, TOKEN_URI], {
      initializer: "initialize",
      kind: "uups",
    })) as BaseNft;
    contract = await contract.deployed();
  });

  it("Should have the correct name and symbol", async function () {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const uri = await contract.baseURI();

    expect(name).to.equal(CONTRACT_NAME);
    expect(symbol).to.equal(CONTRACT_SYMBOL);
    expect(uri).to.equal(TOKEN_URI);
  });

  it("Should have right roles", async function () {

  });

  it("Should be upgradeable", async function () {
    const baseNftFactory: BaseNftTestV2__factory = await ethers.getContractFactory("BaseNftTestV2");
    let version = await contract.version();
    expect(version).to.equal(BigNumber.from(1));

    let v2contract = (await upgrades.upgradeProxy(contract, baseNftFactory)) as BaseNftTestV2;
    version = await v2contract.version();
    expect(version).to.equal(BigNumber.from(2));

    // test access same fuction from old contract should reflect the contract of the new one
    version = await contract.version();
    expect(version).to.equal(BigNumber.from(3));
  });
});
