// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../NFTs/MafagafoAvatarNft.sol";
import "../utils/WithdrawableOwnableUpgradeable.sol";

contract Burner is Initializable, UUPSUpgradeable, PausableUpgradeable, WithdrawableOwnableUpgradeable {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;

    MafagafoAvatarNft public avatarContract;

    uint256 public constant BURN_LIMIT = 16000;
    uint256 public totalBurned;

    function initialize(address _avatarContract) public initializer {
        require(_avatarContract.isContract(), "Avatar NFT address must be a contract");
        avatarContract = MafagafoAvatarNft(_avatarContract);
        totalBurned = 0;

        __Pausable_init();
        __WithdrawableOwnable_init();
        __UUPSUpgradeable_init();
    }

    function burnMafagolds(address wallet, uint256[] memory tokenIds) external virtual whenNotPaused {
        require(totalBurned + tokenIds.length <= BURN_LIMIT, "Burn limit exceeded");
        require(tokenIds.length % 2 == 0, "Amount of mafagolfs must be even");

        address sender = _msgSender();

        require(avatarContract.isApprovedForAll(sender, address(this)), "Check the approval of your avatars");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(avatarContract.ownerOf(tokenIds[i]) == sender, "You have to own this avatar to be able to burn it");

            (uint16 mafaVersion, , uint32 generation, , , , , , ) = avatarContract.getMafagafo(tokenIds[i]);
            require(mafaVersion == 0, "You can only burn avatars from version 0");
            require(generation == 1, "You can only burn avatars from generation 1");

            avatarContract.burn(tokenIds[i]);
        }

        totalBurned += tokenIds.length;

        emit MafagoldsBurned(sender, wallet, tokenIds.length, totalBurned);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    event MafagoldsBurned(address indexed burner, address indexed wallet, uint256 indexed amount, uint256 totalBurned);

    uint256[50] private __gap;
}

contract BurnerMock is Burner {
    function burnMafagolds(address wallet, uint256[] memory tokenIds) external override {
        require(totalBurned + tokenIds.length <= 500, "Burn limit exceeded");
        require(tokenIds.length % 2 == 0, "Amount of mafagolfs must be even");

        address sender = _msgSender();

        require(avatarContract.isApprovedForAll(sender, address(this)), "Check the approval of your avatars");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(avatarContract.ownerOf(tokenIds[i]) == sender, "You have to own this avatar to be able to burn it");

            (uint16 mafaVersion, , uint32 generation, , , , , , ) = avatarContract.getMafagafo(tokenIds[i]);
            require(mafaVersion == 0, "You can only burn avatars from version 0");
            require(generation == 1, "You can only burn avatars from generation 1");

            avatarContract.burn(tokenIds[i]);
        }

        totalBurned += tokenIds.length;

        emit MafagoldsBurned(sender, wallet, tokenIds.length, totalBurned);
    }
}
