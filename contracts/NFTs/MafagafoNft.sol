// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./BaseNft.sol";

contract MafagafoNft is BaseNft {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct Characteristics {
        uint256[] parents;
        uint256[] sons;
        uint256 matings;
        bytes32 genetics;
    }

    CountersUpgradeable.Counter private _tokenIdTracker;

    mapping(uint256 => Characteristics) public mafagafoCharacteristics;

    function initialize() public initializer {
        super.initialize("MafagafoNft", "MAFA", "");
    }

    function mint(address to, uint256 mafagafoID) public virtual onlyRole(MINTER_ROLE) {
        super.mint(to);

        mafagafoCharacteristics[_tokenIdTracker.current()] = Characteristics({
            parents: new uint256[](2),
            sons: new uint256[](0),
            matings: 0,
            genetics: ""
        });

        emit MafagafoMinted(to, _tokenIdTracker.current(), mafagafoID);

        _tokenIdTracker.increment();
    }

    // EVENTS
    event MafagafoMinted(address to, uint256 nftID, uint256 mafagafoID);
}
