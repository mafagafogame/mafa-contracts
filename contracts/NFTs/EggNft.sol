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

    function initialize(address mafagafoAddress, address brooderAddress) public initializer {
        require(mafagafoAddress.isContract(), "Mafagafo NFT address must be a contract");
        require(brooderAddress.isContract(), "Brooder NFT address must be a contract");
        mafagafoContract = MafagafoAvatarNft(mafagafoAddress);
        brooderContract = BrooderNft(brooderAddress);

        // todo: add the correct urlbase
        super.initialize("Egg", "EGG", "");
    }

    function mint(
        address _to,
        uint16 _version,
        bytes32 _genes,
        uint32 _generation,
        uint256 _parent1Id,
        uint256 _parent2Id
    ) public virtual onlyRole(MINTER_ROLE) {
        super.mint(_to);

        _layEgg(_to, _tokenIdTracker.current(), _version, _genes, _generation, _parent1Id, _parent2Id);

        _tokenIdTracker.increment();
    }

    // hatch an egg after timer has passed
    function hatchEgg(uint256 id) public virtual onlyRole(MINTER_ROLE) {
        require(ownerOf(id) == _msgSender(), "Sender must be the owner of the egg");

        Egg memory _egg = egg[id];
        require(block.timestamp < _egg.timer, "Egg is not in time to hatch");

        mafagafoContract.mint(_msgSender(), _egg.version, _egg.genes, _egg.generation, _egg.parent1Id, _egg.parent2Id);
    }

    function breedEgg(uint256 id, uint256 brooderId) public virtual {
        require(ownerOf(id) == _msgSender(), "Sender must be the owner of the egg");
        require(brooderContract.balanceOf(_msgSender(), brooderId) > 0, "You don't own any of this brooder");

        uint64 time = brooderContract.getBrooder(brooderId);
        egg[id].timer = egg[id].timer - time;

        brooderContract.burn(_msgSender(), brooderId, 1);
    }
}
