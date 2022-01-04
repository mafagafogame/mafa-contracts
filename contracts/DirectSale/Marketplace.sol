// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

import "../NFTs/BaseERC1155.sol";

contract Marketplace is
    Initializable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;

    struct Item {
        address nftAddress;
        uint256 nftId;
        uint256 price;
    }

    IERC20 public acceptedToken;

    IUniswapV2Pair internal _mafaBnbPair;
    IUniswapV2Pair internal _bnbBusdPair;

    Item[] public items;

    /**
     * @param _acceptedToken accepted ERC20 token address
     * @param mafaBnb LP token address of MAFA/BNB pair
     * @param bnbBusd LP token address of BNB/BUSD pair
     */
    function initialize(
        address _acceptedToken,
        address mafaBnb,
        address bnbBusd
    ) public initializer {
        acceptedToken = IERC20(_acceptedToken);
        _mafaBnbPair = IUniswapV2Pair(mafaBnb);
        _bnbBusdPair = IUniswapV2Pair(bnbBusd);

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
     * @dev Create a new item
     *  Can only be called by contract owner
     * @param nftAddress Address of ERC1155 inventory of items
     * @param nftId ID of the ERC1155 NFT
     * @param price Price of the item
     */
    function createItem(
        address nftAddress,
        uint256 nftId,
        uint256 price
    ) external virtual onlyOwner {
        _createItem(nftAddress, nftId, price);
    }

    /**
     * @dev Buy amounts of an item.
     * @param id ID on items array
     * @param amounts Amounts of items to be sold
     */
    function buyItem(
        uint256 id,
        uint256 amounts
    ) external virtual whenNotPaused nonReentrant {
        _buyItem(id, amounts);
    }

    function _createItem(
        address nftAddress,
        uint256 nftId,
        uint256 price
    ) internal virtual {
        require(nftAddress.isContract(), "NFT address must be a contract");
        require(price > 0, "Item price can't be 0");

        items.push(Item(nftAddress, nftId, price));

        emit ItemCreated(nftAddress, items.length-1, nftId, price);
    }

    function _buyItem(
        uint256 id,
        uint256 amounts
    ) internal virtual {
        require(id < items.length, "Item doesn't exists");
        Item memory item = items[id];

        address sender = _msgSender();

        uint256 mafaBusdPrice = getMAFAtoBUSDprice();
        uint256 itemPriceInMafa = (item.price.mul(amounts).div(mafaBusdPrice)).mul(10**18);

        uint256 allowance = acceptedToken.allowance(sender, address(this));
        require(allowance >= itemPriceInMafa, "Check the token allowance");

        // Transfer sale amount to seller
        require(
            acceptedToken.transferFrom(sender, owner(), itemPriceInMafa),
            "Fail transferring the sale amount to the seller"
        );

        BaseERC1155 nftRegistry = BaseERC1155(item.nftAddress);

        nftRegistry.mint(sender, item.nftId, amounts, "");

        emit ItemBought(item.nftAddress, id, item.nftId, owner(), sender, itemPriceInMafa, amounts);
    }

    /**
     * @dev gets the price of MAFA per BUSD.
     */
    function getMAFAtoBUSDprice() public view virtual returns (uint256 price) {
        (uint256 reserves0LP0, uint256 reserves1LP0, ) = _mafaBnbPair.getReserves();
        (uint256 reserves0LP1, uint256 reserves1LP1, ) = _bnbBusdPair.getReserves();

        return (reserves1LP1.mul(reserves1LP0).mul(10**18)).div(reserves0LP1.mul(reserves0LP0));
    }

    /**
     * @dev upgradable version
     */
    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    uint256[50] private __gap;

    // EVENTS
    event ItemCreated(address indexed nftAddress, uint256 id, uint256 nftId, uint256 price);
    event ItemBought(
        address indexed nftAddress,
        uint256 id,
        uint256 nftId,
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
