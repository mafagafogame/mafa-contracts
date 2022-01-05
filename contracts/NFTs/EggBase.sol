// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./BaseNft.sol";

contract EggBase is BaseNft {
    mapping(uint256 => Egg) public egg;

    struct Egg {
        uint16 version;
        bytes32 genes;
        uint32 generation;
        uint256 parent1Id;
        uint256 parent2Id;
        uint256 hatchDate;
        bool breeding;
        bytes32 brooderType;
    }

    function _layEgg(
        address _to,
        uint256 _id,
        uint16 _version,
        bytes32 _genes,
        uint32 _generation,
        uint256 _parent1Id,
        uint256 _parent2Id
    ) internal virtual {
        egg[_id] = Egg({
            version: _version,
            genes: _genes,
            generation: _generation,
            parent1Id: _parent1Id,
            parent2Id: _parent2Id,
            hatchDate: block.timestamp + 30 weeks,
            breeding: false,
            brooderType: bytes32("none")
        });

        emit Layed(_to, _id, _version, _genes, _generation, [_parent1Id, _parent2Id], block.timestamp + 30 weeks);
    }

    // EVENTS
    event Layed(
        address indexed to,
        uint256 nftID,
        uint16 version,
        bytes32 genes,
        uint32 generation,
        uint256[2] parentsIDs,
        uint256 hatchDate
    );
}
