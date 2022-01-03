// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./BaseNft.sol";

contract MafagafoAvatarBase is BaseNft {
    mapping(uint256 => Mafagafo) public mafagafo;

    struct Mafagafo {
        bytes32 version; // todo: review this: I guess a uint16 should be enough
        bytes32 genes;
        uint16 generation; // todo: review this: I guess a uint32 should be better dunno
        uint32[] parentsIDs; // todo: review this: should be uint256 we can potentially have more than 4294967295 mafagafos
        uint64 birthTime;
        uint64 cooldown;
        uint256 matings;
    }

    function _createMafagafo(
        address _to,
        uint256 _id,
        bytes32 _version, // todo: review this: I guess a uint16 should be enough
        bytes32 _genes,
        uint16 _generation, // todo: review this: I guess a uint32 should be better dunno
        uint32[] memory _parentsIDs // todo: review this: should be uint256 we can potentially have more than 4294967295 mafagafos
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
