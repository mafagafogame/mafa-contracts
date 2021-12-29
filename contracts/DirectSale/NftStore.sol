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

import "../NFTs/BaseNft.sol";
import "../NFTs/MafaBox.sol";
import "../NFTs/Breeder.sol";

contract NftStore is
    Initializable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeMath for uint256;

    IERC20 public acceptedToken;

    mapping(address => mapping(uint256 => uint256)) public itemPrices;

    bytes4 private constant _INTERFACE_ID_ERC1155 = 0xd9b67a26;

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
    ) external virtual nonReentrant {
        _buyItem(nftAddress, id, amounts);
    }

    function _setItemPrice(
        address nftAddress,
        uint256 id,
        uint256 price
    ) internal virtual {
        require(_supportERC1155(nftAddress), "NFT address must be a valid ERC1155 implementation");
        require(price > 0, "Item price can't be 0");

        itemPrices[nftAddress][id] = price;
    }

    function _buyItem(
        address nftAddress,
        uint256 id,
        uint256 amounts
    ) internal virtual {
        require(_supportERC1155(nftAddress), "NFT address must be a valid ERC1155 implementation");
        require(itemPrices[nftAddress][id] > 0, "Item doesn't exists");

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

        emit ProductBought(nftAddress, id, owner(), sender, amounts);
    }

    /**
     * @dev Check if address supports ERC1155
     * @param nftAddress ERC1155 address
     */
    function _supportERC1155(address nftAddress) internal view returns (bool) {
        return ERC165Upgradeable(nftAddress).supportsInterface(_INTERFACE_ID_ERC1155);
    }

    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    uint256[50] private __gap;

    // EVENTS
    event ProductBought(
        address indexed nftAddress,
        uint256 id,
        address indexed seller,
        address indexed buyer,
        uint256 amounts
    );
}

contract NftStoreTestV2 is NftStore {
    function version() public pure virtual override returns (string memory) {
        return "2.0.0";
    }
}
