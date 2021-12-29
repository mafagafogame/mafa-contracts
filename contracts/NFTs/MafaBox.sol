// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "../NFTs/BaseERC1155.sol";
import "../NFTs/MafagafoNft.sol";

contract MafaBox is BaseERC1155 {
    using SafeMath for uint256;
    using Address for address;

    MafagafoNft public mafagafo;
    uint256 private totalOpen;

    function initialize() public initializer {
        super.initialize("https://ipfs.io/ipfs/QmWaurhfmT8df3tadivGyqErCR5bhu9wSB59GpLm192mLh/metadata/{id}.json");
    }

    function openBox(uint256 id) external {
        totalOpen = totalOpen.add(1);

        super._burn(_msgSender(), id, 1);

        // TODO: mint a random mafagafo to msg sender
    }

    function random() internal view returns (uint256 randomNumber) {
        return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _msgSender(), totalOpen)));
    }
}
