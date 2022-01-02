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
import "../NFTs/MafaBox.sol";
import "../NFTs/Breeder.sol";

contract Marketplace is
    Initializable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;

    IERC20 public acceptedToken;

    address[] internal _acceptedNFTs;

    IUniswapV2Pair internal _mafaBnb;
    IUniswapV2Pair internal _bnbBusd;

    /**
     * @dev Price of the items in BUSD. Mapping of nft addres to another mapping of nft id to price.
     */
    mapping(address => mapping(uint256 => uint256)) public itemPrices;

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
        _mafaBnb = IUniswapV2Pair(mafaBnb);
        _bnbBusd = IUniswapV2Pair(bnbBusd);

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
        require(nftAddress.isContract(), "NFT address must be a contract");
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
        require(nftAddress.isContract(), "NFT address must be a contract");
        require(exists(nftAddress), "NFT address is not acceptable");
        require(itemPrices[nftAddress][id] > 0, "Item doesn't have a price");

        address sender = _msgSender();

        uint256 mafaBusdPrice = getMAFABUSDprice();
        uint256 itemPriceInMafa = (itemPrices[nftAddress][id].div(mafaBusdPrice)).mul(10**18);

        uint256 allowance = acceptedToken.allowance(sender, address(this));
        require(allowance >= itemPriceInMafa, "Check the token allowance");

        // Transfer sale amount to seller
        require(
            acceptedToken.transferFrom(sender, owner(), itemPriceInMafa),
            "Transfering the sale amount to the seller failed"
        );

        BaseERC1155 nftRegistry = BaseERC1155(nftAddress);

        nftRegistry.mint(sender, id, amounts, "");

        emit ProductBought(nftAddress, id, owner(), sender, itemPriceInMafa, amounts);
    }

    /**
     * @dev Checks if an address exists on acceptedNFTs list.
     * @param nftAddress Address to be checked
     */
    function exists(address nftAddress) internal view virtual returns (bool exist) {
        for (uint256 i; i < _acceptedNFTs.length; i++) {
            if (_acceptedNFTs[i] == nftAddress) return true;
        }
    }

    /**
     * @dev gets the price of MAFA per BUSD.
     */
    function getMAFABUSDprice() public view virtual returns (uint256 price) {
        (uint256 reserves0LP0, uint256 reserves1LP0, ) = _mafaBnb.getReserves();
        (uint256 reserves0LP1, uint256 reserves1LP1, ) = _bnbBusd.getReserves();

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
