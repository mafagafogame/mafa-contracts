// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./MafagafoAvatarBase.sol";
import "./BaseNft.sol";
import "./EggNft.sol";

contract MafagafoAvatarNft is MafagafoAvatarBase {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    EggNft public eggContract;

    modifier onlyOwnerOf(uint256 parent1Id, uint256 parent2Id) {
        require(ownerOf(parent1Id) == _msgSender(), "Sender must be the owner of 1st parent");
        require(ownerOf(parent2Id) == _msgSender(), "Sender must be the owner of 2nd parent");
        _;
    }

    function initialize(address eggAddress) public initializer {
        require(eggAddress.isContract(), "NFT address must be a contract");
        eggContract = EggNft(eggAddress);

        // todo: add address
        super.initialize("Mafagafo Avatar Nft", "MAN", "");
    }

    function mint(
        address _to,
        uint16 _version,
        bytes32 _genes,
        uint32 _generation,
        uint256 _parent1Id,
        uint256 _parent2Id
    ) public virtual onlyRole(MINTER_ROLE) {
        super.mint(_to);

        _createMafagafo(_to, _tokenIdTracker.current(), _version, _genes, _generation, _parent1Id, _parent2Id);

        _tokenIdTracker.increment();
    }

    function mate(uint256 parent1Id, uint256 parent2Id) public virtual onlyOwnerOf(parent1Id, parent2Id) {
        Mafagafo memory parent1 = mafagafo[parent1Id];
        Mafagafo memory parent2 = mafagafo[parent2Id];

        require(parent1.matings < 1, "1st parent has already mated");
        require(parent2.matings < 1, "2nd parent has already mated");

        parent1.matings.add(1);
        parent2.matings.add(1);

        bytes32 childGenes = mixGenes(parent1.genes, parent2.genes);

        // TODO: update version and generation
        eggContract.mint(_msgSender(), 0, childGenes, 0, parent1Id, parent2Id);

        emit Mate(_msgSender(), parent1Id, parent2Id, 0, childGenes, 0);
    }

    // TODO: genetic mix logic
    function mixGenes(bytes32 _genes1, bytes32 _genes2) internal returns (bytes32) {
        return "";
    }

    // EVENTS
    event Mate(
        address to,
        uint256 parent1Id,
        uint256 parent2Id,
        uint16 eggVersion,
        bytes32 eggGenes,
        uint32 eggGeneration
    );
}
