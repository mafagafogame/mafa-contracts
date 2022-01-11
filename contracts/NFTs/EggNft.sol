// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./EggBase.sol";
import "./MafagafoAvatarNft.sol";
import "./BrooderNft.sol";

contract EggNft is EggBase {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    MafagafoAvatarNft public mafagafoContract;
    BrooderNft public brooderContract;

    function initialize(address brooderAddress) public initializer {
        require(brooderAddress.isContract(), "Brooder NFT address must be a contract");
        brooderContract = BrooderNft(brooderAddress);

        // TODO: add the correct urlbase
        __BaseNft_init("Egg", "EGG", "");
    }

    /**
     * @dev Update the mafagafo contract
     * @param addr of the NFT
     */
    function setMafagafoAddress(address addr) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(addr.isContract(), "Mafagafo NFT address must be a contract");
        mafagafoContract = MafagafoAvatarNft(addr);
        grantRole(MINTER_ROLE, addr);

        emit MafagafoAddressChanged(addr);
    }

    /**
     * @dev Update the brooder contract
     * @param addr of the brooder
     */
    function setBrooderAddress(address addr) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(addr.isContract(), "Brooder address must be a contract");
        brooderContract = BrooderNft(addr);

        emit BrooderAddressChanged(addr);
    }

    function mint(
        address _to,
        uint16 _version,
        bytes32 _genes,
        uint32 _generation,
        uint256 _parent1Id,
        uint256 _parent2Id
    ) public virtual onlyRole(MINTER_ROLE) {
        _layEgg(_to, _tokenIdTracker.current(), _version, _genes, _generation, _parent1Id, _parent2Id);

        super.mint(_to);
    }

    // todo: hatch multiple eggs at the same time

    // hatch an egg after enough time has passed
    function hatchEgg(uint256 id) public virtual {
        require(ownerOf(id) == _msgSender(), "Sender must be the owner of the egg");

        Egg memory _egg = egg[id];
        require(block.timestamp >= _egg.hatchDate, "Egg is not in time to hatch");

        super._burn(id);
        mafagafoContract.mint(_msgSender(), _egg.version, _egg.genes, _egg.generation, _egg.parent1Id, _egg.parent2Id);

        emit EggHatched(
            id,
            block.timestamp,
            _egg.version,
            _egg.genes,
            _egg.generation,
            [_egg.parent1Id, _egg.parent2Id]
        );
    }

    function breedEgg(uint256 id, uint256 brooderId) public virtual {
        require(ownerOf(id) == _msgSender(), "Sender must be the owner of the egg");
        require(brooderContract.balanceOf(_msgSender(), brooderId) > 0, "You don't own any of this brooder");

        Egg storage _egg = egg[id];

        uint256 newTimer = block.timestamp + brooderContract.getBrooder(brooderId);
        _egg.hatchDate = newTimer;
        _egg.breeding = true;
        _egg.brooderType = bytes32(brooderId);

        brooderContract.onUse(_msgSender(), brooderId);

        emit EggBreeded(id, brooderId, newTimer);
    }

    function breedEgg(uint256[] memory ids, uint256[] memory brooderIds) public virtual {
        require(ids.length == brooderIds.length, "ids and brooderIds arrays must be equal");
        require(ids.length <= 600, "You can only breed at most 600 eggs at a time");

        for (uint256 i = 0; i < ids.length; i++) {
            breedEgg(ids[i], brooderIds[i]);
        }
    }

    // EVENTS
    event EggHatched(
        uint256 id,
        uint256 hatchDate,
        uint16 version,
        bytes32 genes,
        uint32 generation,
        uint256[2] parentsIDs
    );
    event EggBreeded(uint256 id, uint256 brooderId, uint256 newTimer);
    event MafagafoAddressChanged(address indexed addr);
    event BrooderAddressChanged(address indexed addr);

    // this should be the latest space to allocate. do not add anything bellow this
    uint256[50] private __gap;
}
