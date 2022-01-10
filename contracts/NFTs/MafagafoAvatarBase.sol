// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./BaseNft.sol";

contract MafagafoAvatarBase is BaseNft {
    mapping(uint256 => Mafagafo) public mafagafo;

    struct Mafagafo {
        // how rare a mafagafo is
        uint8 rarity;
        // the breed
        uint8 breed;
        // version
        uint16 version;
        // emblem position
        uint16 emblem;
        // number or distance of parents to the g0.
        uint32 generation;
        // When it was born
        uint64 birthTime;
        // date time to be available to reproduce again
        uint64 cooldown;
        // experience points
        uint64 experience;
        // reference to the parents
        uint256 parent1Id;
        // reference to the parents
        uint256 parent2Id;
        // number of times it reproduced
        uint256 matings;
        // genetic code
        bytes32 genes;

        // uint256[50] __gap;
    }

    function _createMafagafo(
        address _to,
        uint256 _id,
        uint16 _version,
        bytes32 _genes,
        uint32 _generation,
        uint256 _parent1Id,
        uint256 _parent2Id,
        uint8 _rarity,
        uint8 _breed,
        bytes32 _genes
    ) internal virtual {
        mafagafo[_id] = Mafagafo({
            version: _version,
            generation: _generation,
            parent1Id: _parent1Id,
            parent2Id: _parent2Id,
            birthTime: uint64(block.timestamp),
            cooldown: 0,
            matings: 0,
            rarity: _rarity,
            breed: _breed,
            genes: _genes
        });

        emit Birth(_to, _id, _version, _genes, _generation, [_parent1Id, _parent2Id], uint64(block.timestamp),  0, 0, _rarity, _breed, _genes);
    }

    // EVENTS
    event Birth(
        address indexed to,
        uint256 nftID,
        uint16 version,
        bytes32 genes,
        uint32 generation,
        uint256[2] parentsIDs,
        uint64 birthTime,
        uint256 matings,
        uint64 cooldown,
        uint8 rarity,
        uint8 breed,
        bytes32 genes
    );
}
