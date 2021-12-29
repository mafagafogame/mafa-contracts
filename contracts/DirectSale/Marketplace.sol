// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "hardhat/console.sol";

import "../NFTs/BaseERC1155.sol";
import "../NFTs/MafaBox.sol";
import "../NFTs/Breeder.sol";

contract Marketplace is
    Initializable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeMath for uint256;

    IERC20 public acceptedToken;
    address[] private _acceptedNFTs;

    mapping(address => mapping(uint256 => uint256)) public itemPrices;

    /**
     * @param _acceptedToken accepted ERC20 token address
     */
    function initialize(address _acceptedToken) public initializer {
        acceptedToken = IERC20(_acceptedToken);

        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function pause() public virtual onlyOwner {
        _pause();
    }

    function unpause() public virtual onlyOwner {
        _unpause();
    }

    /**
     * @dev Set the price of an item.
     *  Can only be called by contract owner
     * @param nftAddress Address of ERC1155 inventory of items
     * @param id Type of the item
     * @param price Price of the item
     */
    function setItemPrice(
        address nftAddress,
        uint256 id,
        uint256 price
    ) external virtual onlyOwner {
        _setItemPrice(nftAddress, id, price);
    }

    /**
     * @dev Buy amounts of an item.
     * @param nftAddress Address of ERC1155 inventory of items
     * @param id Type of the item
     * @param amounts Amounts of items to be sold
     */
    function buyItem(
        address nftAddress,
        uint256 id,
        uint256 amounts
    ) external virtual whenNotPaused nonReentrant {
        _buyItem(nftAddress, id, amounts);
    }

    function _setItemPrice(
        address nftAddress,
        uint256 id,
        uint256 price
    ) internal virtual {
        if (!exists(nftAddress)) {
            _acceptedNFTs.push(nftAddress);
        }
        require(price > 0, "Item price can't be 0");

        itemPrices[nftAddress][id] = price;

        emit ItemPriceUpdated(nftAddress, id, price);
    }

    function _buyItem(
        address nftAddress,
        uint256 id,
        uint256 amounts
    ) internal virtual {
        require(exists(nftAddress), "NFT address is not acceptable");
        require(itemPrices[nftAddress][id] > 0, "Item doesn't have a price");

        address sender = _msgSender();

        uint256 allowance = acceptedToken.allowance(sender, address(this));
        require(allowance >= itemPrices[nftAddress][id], "Check the token allowance");

        // Transfer sale amount to seller
        require(
            acceptedToken.transferFrom(sender, owner(), itemPrices[nftAddress][id]),
            "Transfering the sale amount to the seller failed"
        );

        BaseERC1155 nftRegistry = BaseERC1155(nftAddress);

        nftRegistry.mint(sender, id, amounts, "");

        emit ProductBought(nftAddress, id, owner(), sender, itemPrices[nftAddress][id], amounts);
    }

    function exists(address nftAddress) internal view returns (bool exist) {
        for (uint256 i; i < _acceptedNFTs.length; i++) {
            if (_acceptedNFTs[i] == nftAddress) return true;
        }
    }

    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    uint256[50] private __gap;

    // EVENTS
    event ItemPriceUpdated(address indexed nftAddress, uint256 id, uint256 price);
    event ProductBought(
        address indexed nftAddress,
        uint256 id,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 amounts
    );
}

contract MarketplaceTestV2 is Marketplace {
    function version() public pure virtual override returns (string memory) {
        return "2.0.0";
    }
}
