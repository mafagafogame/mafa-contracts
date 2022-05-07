/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "AccessControlEnumerableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AccessControlEnumerableUpgradeable__factory>;
    getContractFactory(
      name: "AccessControlUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AccessControlUpgradeable__factory>;
    getContractFactory(
      name: "IAccessControlEnumerableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IAccessControlEnumerableUpgradeable__factory>;
    getContractFactory(
      name: "IAccessControlUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IAccessControlUpgradeable__factory>;
    getContractFactory(
      name: "OwnableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OwnableUpgradeable__factory>;
    getContractFactory(
      name: "IERC1822ProxiableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1822ProxiableUpgradeable__factory>;
    getContractFactory(
      name: "IBeaconUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IBeaconUpgradeable__factory>;
    getContractFactory(
      name: "ERC1967UpgradeUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1967UpgradeUpgradeable__factory>;
    getContractFactory(
      name: "Initializable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Initializable__factory>;
    getContractFactory(
      name: "UUPSUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UUPSUpgradeable__factory>;
    getContractFactory(
      name: "PausableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.PausableUpgradeable__factory>;
    getContractFactory(
      name: "ReentrancyGuardUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ReentrancyGuardUpgradeable__factory>;
    getContractFactory(
      name: "ERC1155Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155Upgradeable__factory>;
    getContractFactory(
      name: "ERC1155BurnableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155BurnableUpgradeable__factory>;
    getContractFactory(
      name: "ERC1155SupplyUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155SupplyUpgradeable__factory>;
    getContractFactory(
      name: "IERC1155MetadataURIUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155MetadataURIUpgradeable__factory>;
    getContractFactory(
      name: "IERC1155ReceiverUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155ReceiverUpgradeable__factory>;
    getContractFactory(
      name: "IERC1155Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155Upgradeable__factory>;
    getContractFactory(
      name: "ERC1155ReceiverUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155ReceiverUpgradeable__factory>;
    getContractFactory(
      name: "ERC721Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721Upgradeable__factory>;
    getContractFactory(
      name: "ERC721BurnableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721BurnableUpgradeable__factory>;
    getContractFactory(
      name: "ERC721EnumerableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721EnumerableUpgradeable__factory>;
    getContractFactory(
      name: "ERC721PausableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721PausableUpgradeable__factory>;
    getContractFactory(
      name: "ERC721URIStorageUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721URIStorageUpgradeable__factory>;
    getContractFactory(
      name: "IERC721EnumerableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721EnumerableUpgradeable__factory>;
    getContractFactory(
      name: "IERC721MetadataUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721MetadataUpgradeable__factory>;
    getContractFactory(
      name: "IERC721ReceiverUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721ReceiverUpgradeable__factory>;
    getContractFactory(
      name: "IERC721Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721Upgradeable__factory>;
    getContractFactory(
      name: "ContextUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ContextUpgradeable__factory>;
    getContractFactory(
      name: "ERC165Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC165Upgradeable__factory>;
    getContractFactory(
      name: "IERC165Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC165Upgradeable__factory>;
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "IERC1155",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155__factory>;
    getContractFactory(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20__factory>;
    getContractFactory(
      name: "IERC20Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Metadata__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "ERC721",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721__factory>;
    getContractFactory(
      name: "IERC721Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721Metadata__factory>;
    getContractFactory(
      name: "IERC721",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721__factory>;
    getContractFactory(
      name: "IERC721Receiver",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721Receiver__factory>;
    getContractFactory(
      name: "ERC165",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC165__factory>;
    getContractFactory(
      name: "IERC165",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC165__factory>;
    getContractFactory(
      name: "IUniswapV2Factory",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapV2Factory__factory>;
    getContractFactory(
      name: "IUniswapV2Pair",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapV2Pair__factory>;
    getContractFactory(
      name: "IUniswapV2Router01",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapV2Router01__factory>;
    getContractFactory(
      name: "IUniswapV2Router02",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapV2Router02__factory>;
    getContractFactory(
      name: "MafaStore",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MafaStore__factory>;
    getContractFactory(
      name: "MafaStoreTestV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MafaStoreTestV2__factory>;
    getContractFactory(
      name: "MafaCoin",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MafaCoin__factory>;
    getContractFactory(
      name: "MafaCoinV1",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MafaCoinV1__factory>;
    getContractFactory(
      name: "MafaCoinV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MafaCoinV2__factory>;
    getContractFactory(
      name: "WithdrawableOwnable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.WithdrawableOwnable__factory>;
    getContractFactory(
      name: "BaseERC1155",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BaseERC1155__factory>;
    getContractFactory(
      name: "BaseNft",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BaseNft__factory>;
    getContractFactory(
      name: "BaseNftTestV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BaseNftTestV2__factory>;
    getContractFactory(
      name: "BrooderNft",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BrooderNft__factory>;
    getContractFactory(
      name: "EggBase",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.EggBase__factory>;
    getContractFactory(
      name: "EggNft",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.EggNft__factory>;
    getContractFactory(
      name: "ERC721PresetMinterPauserAutoIdUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721PresetMinterPauserAutoIdUpgradeable__factory>;
    getContractFactory(
      name: "MafaBox",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MafaBox__factory>;
    getContractFactory(
      name: "MafagafoAvatarBase",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MafagafoAvatarBase__factory>;
    getContractFactory(
      name: "MafagafoAvatarNft",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MafagafoAvatarNft__factory>;
    getContractFactory(
      name: "LibMintable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.LibMintable__factory>;
    getContractFactory(
      name: "LibPart",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.LibPart__factory>;
    getContractFactory(
      name: "LibRoyaltiesV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.LibRoyaltiesV2__factory>;
    getContractFactory(
      name: "RoyaltiesV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.RoyaltiesV2__factory>;
    getContractFactory(
      name: "RoyaltiesV2Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.RoyaltiesV2Upgradeable__factory>;
    getContractFactory(
      name: "RoyaltiesV2UpgradeableImpl",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.RoyaltiesV2UpgradeableImpl__factory>;
    getContractFactory(
      name: "TimeLockedWallet",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TimeLockedWallet__factory>;

    getContractAt(
      name: "AccessControlEnumerableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.AccessControlEnumerableUpgradeable>;
    getContractAt(
      name: "AccessControlUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.AccessControlUpgradeable>;
    getContractAt(
      name: "IAccessControlEnumerableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IAccessControlEnumerableUpgradeable>;
    getContractAt(
      name: "IAccessControlUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IAccessControlUpgradeable>;
    getContractAt(
      name: "OwnableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OwnableUpgradeable>;
    getContractAt(
      name: "IERC1822ProxiableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1822ProxiableUpgradeable>;
    getContractAt(
      name: "IBeaconUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IBeaconUpgradeable>;
    getContractAt(
      name: "ERC1967UpgradeUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1967UpgradeUpgradeable>;
    getContractAt(
      name: "Initializable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Initializable>;
    getContractAt(
      name: "UUPSUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UUPSUpgradeable>;
    getContractAt(
      name: "PausableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.PausableUpgradeable>;
    getContractAt(
      name: "ReentrancyGuardUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ReentrancyGuardUpgradeable>;
    getContractAt(
      name: "ERC1155Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155Upgradeable>;
    getContractAt(
      name: "ERC1155BurnableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155BurnableUpgradeable>;
    getContractAt(
      name: "ERC1155SupplyUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155SupplyUpgradeable>;
    getContractAt(
      name: "IERC1155MetadataURIUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155MetadataURIUpgradeable>;
    getContractAt(
      name: "IERC1155ReceiverUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155ReceiverUpgradeable>;
    getContractAt(
      name: "IERC1155Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155Upgradeable>;
    getContractAt(
      name: "ERC1155ReceiverUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155ReceiverUpgradeable>;
    getContractAt(
      name: "ERC721Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721Upgradeable>;
    getContractAt(
      name: "ERC721BurnableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721BurnableUpgradeable>;
    getContractAt(
      name: "ERC721EnumerableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721EnumerableUpgradeable>;
    getContractAt(
      name: "ERC721PausableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721PausableUpgradeable>;
    getContractAt(
      name: "ERC721URIStorageUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721URIStorageUpgradeable>;
    getContractAt(
      name: "IERC721EnumerableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721EnumerableUpgradeable>;
    getContractAt(
      name: "IERC721MetadataUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721MetadataUpgradeable>;
    getContractAt(
      name: "IERC721ReceiverUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721ReceiverUpgradeable>;
    getContractAt(
      name: "IERC721Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721Upgradeable>;
    getContractAt(
      name: "ContextUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ContextUpgradeable>;
    getContractAt(
      name: "ERC165Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC165Upgradeable>;
    getContractAt(
      name: "IERC165Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC165Upgradeable>;
    getContractAt(
      name: "Ownable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable>;
    getContractAt(
      name: "IERC1155",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155>;
    getContractAt(
      name: "ERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20>;
    getContractAt(
      name: "IERC20Metadata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Metadata>;
    getContractAt(
      name: "IERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "ERC721",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721>;
    getContractAt(
      name: "IERC721Metadata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721Metadata>;
    getContractAt(
      name: "IERC721",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721>;
    getContractAt(
      name: "IERC721Receiver",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721Receiver>;
    getContractAt(
      name: "ERC165",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC165>;
    getContractAt(
      name: "IERC165",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC165>;
    getContractAt(
      name: "IUniswapV2Factory",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapV2Factory>;
    getContractAt(
      name: "IUniswapV2Pair",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapV2Pair>;
    getContractAt(
      name: "IUniswapV2Router01",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapV2Router01>;
    getContractAt(
      name: "IUniswapV2Router02",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapV2Router02>;
    getContractAt(
      name: "MafaStore",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MafaStore>;
    getContractAt(
      name: "MafaStoreTestV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MafaStoreTestV2>;
    getContractAt(
      name: "MafaCoin",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MafaCoin>;
    getContractAt(
      name: "MafaCoinV1",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MafaCoinV1>;
    getContractAt(
      name: "MafaCoinV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MafaCoinV2>;
    getContractAt(
      name: "WithdrawableOwnable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.WithdrawableOwnable>;
    getContractAt(
      name: "BaseERC1155",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BaseERC1155>;
    getContractAt(
      name: "BaseNft",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BaseNft>;
    getContractAt(
      name: "BaseNftTestV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BaseNftTestV2>;
    getContractAt(
      name: "BrooderNft",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BrooderNft>;
    getContractAt(
      name: "EggBase",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.EggBase>;
    getContractAt(
      name: "EggNft",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.EggNft>;
    getContractAt(
      name: "ERC721PresetMinterPauserAutoIdUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721PresetMinterPauserAutoIdUpgradeable>;
    getContractAt(
      name: "MafaBox",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MafaBox>;
    getContractAt(
      name: "MafagafoAvatarBase",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MafagafoAvatarBase>;
    getContractAt(
      name: "MafagafoAvatarNft",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MafagafoAvatarNft>;
    getContractAt(
      name: "LibMintable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.LibMintable>;
    getContractAt(
      name: "LibPart",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.LibPart>;
    getContractAt(
      name: "LibRoyaltiesV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.LibRoyaltiesV2>;
    getContractAt(
      name: "RoyaltiesV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.RoyaltiesV2>;
    getContractAt(
      name: "RoyaltiesV2Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.RoyaltiesV2Upgradeable>;
    getContractAt(
      name: "RoyaltiesV2UpgradeableImpl",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.RoyaltiesV2UpgradeableImpl>;
    getContractAt(
      name: "TimeLockedWallet",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TimeLockedWallet>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
