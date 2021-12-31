// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./MafaBase.sol";
import "./BaseNft.sol";
import "./Egg.sol";

contract MafagafoNft is MafaBase, BaseNft {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    Egg public eggContract;

    modifier onlyOwnerOf(uint256 parent1, uint256 parent2) {
        require(ownerOf(parent1) == _msgSender(), "Sender must be the owner of 1st parent");
        require(ownerOf(parent2) == _msgSender(), "Sender must be the owner of 2nd parent");
        _;
    }

    function initialize(address eggAddress) public initializer {
        require(eggAddress.isContract(), "NFT address must be a contract");
        eggContract = Egg(eggAddress);

        super.initialize("MafagafoNft", "MAFA", "");
    }

    function mint2(
        address _to,
        bytes32 _version,
        bytes32 _genes,
        uint16 _generation,
        uint32[] memory _parentsIDs
    ) public virtual onlyRole(MINTER_ROLE) {
        super.mint(_to);

        _createMafagafo(_to, _tokenIdTracker.current(), _version, _genes, _generation, _parentsIDs);

        _tokenIdTracker.increment();
    }

    function mate(
        address _to,
        uint32 id1,
        uint32 id2
    ) public virtual onlyOwnerOf(id1, id2) {
        Mafagafo memory parent1 = mafagafo[id1];
        Mafagafo memory parent2 = mafagafo[id2];

        require(parent1.matings < 1, "1st parent has already mated");
        require(parent2.matings < 1, "2nd parent has already mated");

        parent1.matings.add(1);
        parent2.matings.add(1);

        bytes32 childGenes = mixGenes(parent1.genes, parent2.genes);

        eggContract.mint2(_to, 0, childGenes, 0, [id1, id2]);
    }

    // TODO: genetic mix logic
    function mixGenes(bytes32 _genes1, bytes32 _genes2) internal returns (bytes32) {
        return "";
    }
}
