// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./EggBase.sol";
import "./MafagafoNft.sol";

contract Egg is EggBase {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    MafagafoNft public mafagafoContract;

    function initialize(address mafagafoAddress) public initializer {
        require(mafagafoAddress.isContract(), "NFT address must be a contract");
        mafagafoContract = MafagafoNft(mafagafoAddress);

        // todo: add the correct urlbase
        super.initialize("Egg", "EGG", "");
    }

    function mint(
        address _to,
        bytes32 _version, // todo: review this: I guess a uint16 should be enough
        bytes32 _genes,
        uint16 _generation,
        uint32[] memory _parentsIDs // todo: review this: should be uint256 we can potentially have more than 4294967295 mafagafos
    ) public virtual onlyRole(MINTER_ROLE) {
        super.mint(_to);
        // todo: missing code

        _layEgg(_to, _tokenIdTracker.current(), _version, _genes, _generation, _parentsIDs);
        _tokenIdTracker.increment();
    }

    // hatch an egg after timer has passed
    function hatchEgg(uint256 id) public virtual onlyRole(MINTER_ROLE) {
        require(ownerOf(id) == _msgSender(), "Sender must be the owner of the egg");

        Egg memory _egg = egg[id];
        require(block.timestamp < _egg.timer, "Egg is not in time to hatch");

        mafagafoContract.mint2(_msgSender(), _egg.version, _egg.genes, _egg.generation, _egg.parentsIDs);
    }

    // lower the timer to hatch an egg when on a breeder
    function lowerTimer() public virtual {}
}
