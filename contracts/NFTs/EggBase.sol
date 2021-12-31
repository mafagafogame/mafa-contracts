// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract EggBase {
    struct Egg {
        bytes32 version;
        bytes32 genes;
        uint16 generation;
        uint32[] parentsIDs;
        uint64 timer;
    }

    mapping(uint256 => Egg) public egg;

    function _layEgg(
        address _to,
        uint256 _id,
        bytes32 _version,
        bytes32 _genes,
        uint16 _generation,
        uint32[] memory _parentsIDs
    ) internal virtual {
        egg[_id] = Egg({
            version: _version,
            genes: _genes,
            generation: _generation,
            parentsIDs: _parentsIDs,
            timer: uint64(30 weeks)
        });

        emit Layed(_to, _id, _version, _genes, _generation, _parentsIDs, uint64(30 weeks));
    }

    // EVENTS
    event Layed(
        address indexed to,
        uint256 nftID,
        bytes32 version,
        bytes32 genes,
        uint16 generation,
        uint32[] parentsIDs,
        uint64 timer
    );
}
