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
        // custom flags for external use
        uint32 flags;
        // When it was born
        uint64 birthTime;
        // date time to be available to reproduce again
        uint64 cooldown;
        // number of times it reproduced
        uint256 matings;
        // reference to the parents
        uint256 parent1Id;
        // reference to the parents
        uint256 parent2Id;
        // genetic code
        bytes32 genes;
    }

    /**
     * @dev Create a new mafagafo
     * @param _to user that will receive the new mafagafo
     * @param _id NFT id of the new mafagafo
     * @param _version mafagafo version
     * @param _genes genes passed from parents
     * @param _generation generation of the mafagafo
     * @param _parent1Id NFT id of the 1st parent
     * @param _parent2Id NFT id of the 2nd parent
     * @param _flags custom flags
     */
    function _createMafagafo(
        address _to,
        uint256 _id,
        uint16 _version,
        bytes32 _genes,
        uint32 _generation,
        uint256 _parent1Id,
        uint256 _parent2Id,
        uint32 _flags
    ) internal virtual {
        mafagafo[_id] = Mafagafo({
            version: _version,
            genes: _genes,
            generation: _generation,
            parent1Id: _parent1Id,
            parent2Id: _parent2Id,
            birthTime: uint64(block.timestamp),
            cooldown: 0,
            matings: 0,
            flags: _flags
        });

        emit Birth(_to, _id, _version, _genes, _generation, [_parent1Id, _parent2Id], uint64(block.timestamp), _flags);
    }

    /**
     * @dev Gets a mafagafo by id
     * @param id unique ID of the mafagafo
     */
    function getMafagafo(uint256 id)
        public
        view
        virtual
        returns (
            uint16 version,
            bytes32 genes,
            uint32 generation,
            uint256 parent1Id,
            uint256 parent2Id,
            uint64 birthTime,
            uint64 cooldown,
            uint256 matings,
            uint32 flags
        )
    {
        Mafagafo memory _mafagafo = mafagafo[id];

        return (
            _mafagafo.version,
            _mafagafo.genes,
            _mafagafo.generation,
            _mafagafo.parent1Id,
            _mafagafo.parent2Id,
            _mafagafo.birthTime,
            _mafagafo.cooldown,
            _mafagafo.matings,
            _mafagafo.flags
        );
    }

    function getNftData(uint256 id) external view returns (Mafagafo memory) {
        return mafagafo[id];
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
        uint32 flags
    );

    // this should be the latest space to allocate. do not add anything bellow this
    uint256[50] private __gap;
}
