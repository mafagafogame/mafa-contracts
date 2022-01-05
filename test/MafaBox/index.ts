/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BrooderNft,
  BrooderNft__factory,
  EggNft,
  EggNft__factory,
  MafaBox,
  MafaBox__factory,
  MafaCoin,
  MafagafoAvatarNft,
  MafagafoAvatarNft__factory,
  MafaStore,
  MafaStore__factory,
} from "../../typechain";
import { deployMafaCoin, expandTo18Decimals } from "../shared/utilities";

describe("Unit tests", function () {
  let mafastore: MafaStore;
  let mafacoin: MafaCoin;
  let brooder: BrooderNft;
  let egg: EggNft;
  let mafagafoAvatar: MafagafoAvatarNft;
  let mafaBox: MafaBox;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  const MAFA_BNB = "0xC53C7F4736F4a6DA25e950e25c58011Fe26B4a93";
  const BNB_BUSD = "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16";

  before(async function () {
    [owner, account1] = await ethers.getSigners();
  });

  describe("MafaBox", function () {
    beforeEach(async function () {
      mafacoin = await deployMafaCoin(owner);
      await mafacoin.transfer(account1.address, expandTo18Decimals(100000));

      const brooderFactory = <BrooderNft__factory>await ethers.getContractFactory("BrooderNft");
      brooder = <BrooderNft>await upgrades.deployProxy(brooderFactory, [], {
        initializer: "initialize",
        kind: "uups",
      });

      const eggFactory = <EggNft__factory>await ethers.getContractFactory("EggNft");
      egg = <EggNft>await upgrades.deployProxy(eggFactory, [brooder.address], {
        initializer: "initialize",
        kind: "uups",
      });

      const mafagafoAvatarFactory = <MafagafoAvatarNft__factory>await ethers.getContractFactory("MafagafoAvatarNft");
      mafagafoAvatar = <MafagafoAvatarNft>await upgrades.deployProxy(mafagafoAvatarFactory, [egg.address], {
        initializer: "initialize",
        kind: "uups",
      });

      egg.setMafagafoContract(mafagafoAvatar.address);

      const mafaBoxFactory = <MafaBox__factory>await ethers.getContractFactory("MafaBox");
      mafaBox = <MafaBox>await upgrades.deployProxy(
        mafaBoxFactory,
        [mafagafoAvatar.address, [500, 1500, 2000, 2500, 3500]],
        {
          initializer: "initialize",
          kind: "uups",
        },
      );

      await mafagafoAvatar.grantRole(ethers.utils.id("MINTER_ROLE"), mafaBox.address);
    });

    it("should be deployed with correct values", async function () {
      expect(await mafaBox.mafagafoContract()).to.equal(mafagafoAvatar.address);
      expect(await mafaBox.probabilities(0)).to.equal(500);
      expect(await mafaBox.probabilities(1)).to.equal(1500);
      expect(await mafaBox.probabilities(2)).to.equal(2000);
      expect(await mafaBox.probabilities(3)).to.equal(2500);
      expect(await mafaBox.probabilities(4)).to.equal(3500);
    });

    it("user shouldn't be able to open a box if he doesn't have any", async function () {
      await expect(mafaBox.connect(account1).openBox(0)).to.be.revertedWith("You don't have any box to open");
    });

    it("user should be able to open a box and receive a random mafagafo", async function () {
      await mafaBox.mint(account1.address, 0, 3, ethers.utils.id(""));

      expect(await mafaBox.balanceOf(account1.address, 0)).to.equal(3);

      await expect(mafaBox.connect(account1).openBox(0)).to.emit(mafaBox, "BoxOpened");

      expect(await mafaBox.balanceOf(account1.address, 0)).to.equal(2);
      expect(await mafagafoAvatar.balanceOf(account1.address)).to.equal(1);
    });
  });
});
