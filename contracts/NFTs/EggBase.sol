// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./BaseNft.sol";

contract EggBase is BaseNft {
    mapping(uint256 => Egg) public egg;

    uint256 public hatchTime;

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

    /**
     * @dev Update the hatch time
     * @param _hatchTime New hatch time (unix timestamp)
     */
    function setHatchTime(uint256 _hatchTime) public onlyRole(DEFAULT_ADMIN_ROLE) {
        hatchTime = _hatchTime;

        emit HatchTimeChanged(_hatchTime);
    }

    /**
     * @dev Create a new egg using parent characteristics
     * @param _to user that will receive the new egg
     * @param _id NFT id of the new egg
     * @param _version mafagafo version
     * @param _genes genes to pass to the newborn mafagafo
     * @param _generation generation of the newborn mafagafo
     * @param _parent1Id NFT id of the 1st parent
     * @param _parent2Id NFT id of the 2nd parent
     */
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
            hatchDate: block.timestamp + hatchTime,
            breeding: false,
            brooderType: bytes32("none")
        });

        emit Layed(_to, _id, _version, _genes, _generation, [_parent1Id, _parent2Id], block.timestamp + hatchTime);
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
    event HatchTimeChanged(uint256 hatchTime);

    // this should be the latest space to allocate. do not add anything bellow this
    uint256[50] private __gap;
}
