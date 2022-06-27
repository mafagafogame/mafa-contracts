// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../NFTs/MafagafoAvatarNft.sol";
import "../utils/WithdrawableOwnableUpgradeable.sol";

contract Burner is Initializable, UUPSUpgradeable, PausableUpgradeable, WithdrawableOwnableUpgradeable {
    using AddressUpgradeable for address;

    MafagafoAvatarNft public mafagafoContract;

    uint256 public constant MINT_LIMIT = 10000;
    uint256 public totalMinted;

    function initialize(address _mafagafoContract) public initializer {
        require(_mafagafoContract.isContract(), "Avatar NFT address must be a contract");
        mafagafoContract = MafagafoAvatarNft(_mafagafoContract);
        totalMinted = 0;

        __Pausable_init();
        __WithdrawableOwnable_init();
        __UUPSUpgradeable_init();
    }

    function burnMafagolds(uint256[] memory tokenIds) external virtual whenNotPaused {
        require(tokenIds.length > 0, "No mafagolds to burn");
        require(tokenIds.length % 3 == 0, "Amount of mafagolds must be multiple of 3");
        require(totalMinted + tokenIds.length / 3 <= MINT_LIMIT, "Mint limit exceeded");

        address sender = _msgSender();

        require(mafagafoContract.isApprovedForAll(sender, address(this)), "Check the approval of your avatars");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                mafagafoContract.ownerOf(tokenIds[i]) == sender,
                "You have to own this avatar to be able to burn it"
            );

            (uint16 mafaVersion, , uint32 generation, , , , , , ) = mafagafoContract.getMafagafo(tokenIds[i]);
            require(mafaVersion == 0, "You can only burn avatars from version 0");
            require(generation == 1, "You can only burn avatars from generation 1");

            mafagafoContract.burn(tokenIds[i]);
        }

        uint256 amountToMint = tokenIds.length / 3;

        require(mintEgg(sender, amountToMint), "Failed to mint eggs");

        emit MafagoldsBurned(sender, tokenIds.length, totalMinted);
    }

    function burnMafagafos(uint256[] memory tokenIds) external virtual whenNotPaused {
        require(tokenIds.length > 0, "No mafagafos to burn");
        require(tokenIds.length % 12 == 0, "Amount of mafagafos must be multiple of 12");
        require(totalMinted + tokenIds.length / 12 <= MINT_LIMIT, "Mint limit exceeded");

        address sender = _msgSender();

        require(mafagafoContract.isApprovedForAll(sender, address(this)), "Check the approval of your avatars");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                mafagafoContract.ownerOf(tokenIds[i]) == sender,
                "You have to own this avatar to be able to burn it"
            );

            (uint16 mafaVersion, , uint32 generation, , , , , uint256 matings, ) = mafagafoContract.getMafagafo(
                tokenIds[i]
            );
            require(mafaVersion == 0, "You can only burn avatars from version 0");
            require(generation == 0, "You can only burn avatars from generation 0");
            require(matings == 0, "You can only burn avatars that have not been mated");

            mafagafoContract.burn(tokenIds[i]);
        }

        uint256 amountToMint = tokenIds.length / 12;

        require(mintEgg(sender, amountToMint), "Failed to mint eggs");

        emit MafagafosBurned(sender, tokenIds.length, totalMinted);
    }

    function mintEgg(address sender, uint256 amount) internal virtual returns (bool) {
        for (uint256 i = 0; i < amount; i++) {
            mafagafoContract.mint(sender, mafagafoContract.mafaVersion(), bytes32(_random()), 2, 0, 0, 0x00000000);

            totalMinted += 1;
        }

        return true;
    }

    /**
     * @dev Generate a random number between 8 and 15
     */
    function _random() internal view virtual returns (uint256 randomNumber) {
        randomNumber = uint256(keccak256(abi.encodePacked(block.difficulty, _msgSender(), totalMinted))) % 8;

        randomNumber += 8;
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

    event MafagoldsBurned(address indexed burner, uint256 indexed amount, uint256 indexed totalMinted);
    event MafagafosBurned(address indexed burner, uint256 indexed amount, uint256 indexed totalMinted);

    uint256[50] private __gap;
}

contract BurnerMock is Burner {
    function burnMafagolds(uint256[] memory tokenIds) external override {
        require(tokenIds.length > 0, "No mafagolds to burn");
        require(tokenIds.length % 3 == 0, "Amount of mafagolds must be multiple of 3");
        require(totalMinted + tokenIds.length / 3 <= 100, "Mint limit exceeded");

        address sender = _msgSender();

        require(mafagafoContract.isApprovedForAll(sender, address(this)), "Check the approval of your avatars");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                mafagafoContract.ownerOf(tokenIds[i]) == sender,
                "You have to own this avatar to be able to burn it"
            );

            (uint16 mafaVersion, , uint32 generation, , , , , , ) = mafagafoContract.getMafagafo(tokenIds[i]);
            require(mafaVersion == 0, "You can only burn avatars from version 0");
            require(generation == 1, "You can only burn avatars from generation 1");

            mafagafoContract.burn(tokenIds[i]);
        }

        uint256 amountToMint = tokenIds.length / 3;

        require(mintEgg(sender, amountToMint), "Failed to mint eggs");

        emit MafagoldsBurned(sender, tokenIds.length, totalMinted);
    }

    function burnMafagafos(uint256[] memory tokenIds) external override {
        require(tokenIds.length > 0, "No mafagafos to burn");
        require(tokenIds.length % 12 == 0, "Amount of mafagafos must be multiple of 12");
        require(totalMinted + tokenIds.length / 12 <= 25, "Mint limit exceeded");

        address sender = _msgSender();

        require(mafagafoContract.isApprovedForAll(sender, address(this)), "Check the approval of your avatars");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                mafagafoContract.ownerOf(tokenIds[i]) == sender,
                "You have to own this avatar to be able to burn it"
            );

            (uint16 mafaVersion, , uint32 generation, , , , , uint256 matings, ) = mafagafoContract.getMafagafo(
                tokenIds[i]
            );
            require(mafaVersion == 0, "You can only burn avatars from version 0");
            require(generation == 0, "You can only burn avatars from generation 0");
            require(matings == 0, "You can only burn avatars that have not been mated");

            mafagafoContract.burn(tokenIds[i]);
        }

        uint256 amountToMint = tokenIds.length / 12;

        require(mintEgg(sender, amountToMint), "Failed to mint eggs");

        emit MafagafosBurned(sender, tokenIds.length, totalMinted);
    }
}
