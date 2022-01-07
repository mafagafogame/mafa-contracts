// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./BaseNft.sol";

contract MafagafoAvatarBase is BaseNft {
    mapping(uint256 => Mafagafo) public mafagafo;

    struct Mafagafo {
        // version
        uint16 version;
        // number or distance of parents to the g0.
        uint32 generation;
        // reference to the parents
        uint256 parent1Id;
        // reference to the parents
        uint256 parent2Id;
        // When it was born
        uint64 birthTime;
        // number of times it reproduced
        uint256 matings;
        // date time to be available to reproduce again
        uint64 cooldown;
        //
        uint8 rarity;
        //
        uint8 breed;
        // genetic code
        bytes32 genes;
    
        uint256[50] private __gap;
    }

    function _createMafagafo(
        address _to,
        uint256 _id,
        uint16 _version,
        bytes32 _genes,
        uint32 _generation,
        uint256 _parent1Id,
        uint256 _parent2Id
    ) internal virtual {
        mafagafo[_id] = Mafagafo({
            version: _version,
            genes: _genes,
            generation: _generation,
            parent1Id: _parent1Id,
            parent2Id: _parent2Id,
            birthTime: uint64(block.timestamp),
            cooldown: 0,
            matings: 0
        });

        emit Birth(_to, _id, _version, _genes, _generation, [_parent1Id, _parent2Id], uint64(block.timestamp));
    }

    // EVENTS
    event Birth(
        address indexed to,
        uint256 nftID,
        uint16 version,
        bytes32 genes,
        uint32 generation,
        uint256[2] parentsIDs,
        uint64 birthTime
    );
}
