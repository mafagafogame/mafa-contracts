// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract MafaBase {
    struct Mafagafo {
        bytes32 version;
        bytes32 genes;
        uint16 generation;
        uint32[] parentsIDs;
        uint64 birthTime;
        uint64 cooldown;
        uint256 matings;
    }

    mapping(uint256 => Mafagafo) public mafagafo;

    function _createMafagafo(
        address _to,
        uint256 _id,
        bytes32 _version,
        bytes32 _genes,
        uint16 _generation,
        uint32[] memory _parentsIDs
    ) internal virtual {
        mafagafo[_id] = Mafagafo({
            version: _version,
            genes: _genes,
            generation: _generation,
            parentsIDs: _parentsIDs,
            birthTime: uint64(block.timestamp),
            cooldown: 0,
            matings: 0
        });

        emit Birth(_to, _id, _version, _genes, _generation, _parentsIDs, uint64(block.timestamp));
    }

    // EVENTS
    event Birth(
        address indexed to,
        uint256 nftID,
        bytes32 version,
        bytes32 genes,
        uint16 generation,
        uint32[] parentsIDs,
        uint64 birthTime
    );
}
