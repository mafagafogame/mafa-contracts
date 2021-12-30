// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./BaseERC1155.sol";
import "./MafagafoNft.sol";

contract MafaBox is BaseERC1155 {
    using SafeMath for uint256;
    using Address for address;

    uint256[] private probabilities;

    MafagafoNft public mafagafo;
    uint256 private totalOpen;

    uint256 public numberOfMafagafos;

    function initialize(address mafagafoAddress) public initializer {
        mafagafo = MafagafoNft(mafagafoAddress);
        probabilities = [50, 100, 150, 300, 400];
        numberOfMafagafos = probabilities.length;

        // TODO migrate to cloudflare
        super.initialize("https://ipfs.io/ipfs/QmWaurhfmT8df3tadivGyqErCR5bhu9wSB59GpLm192mLh/metadata/{id}.json");
    }

    function openBox(uint256 id) external {
        totalOpen = totalOpen.add(1);

        super._burn(_msgSender(), id, 1);

        uint256 randomNumber = random();

        // TODO: mint a random mafagafo to msg sender
        uint256 maxValue = 0;
        for (uint256 i = 0; i < probabilities.length; i++) {
            maxValue = maxValue.add(probabilities[i]);
            if (randomNumber < maxValue) {
                mafagafo.mint(_msgSender(), i);
            }
        }
    }

    function random() internal view returns (uint256 randomNumber) {
        return
            uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _msgSender(), totalOpen))).mod(1000);
    }
}
