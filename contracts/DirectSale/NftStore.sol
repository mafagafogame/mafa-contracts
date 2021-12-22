// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../NFTs/BaseNft.sol";

contract NftStore is Initializable, PausableUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeMath for uint256;

    IERC20 public acceptedToken;

    struct Product {
        // NFT registry address
        address nftAddress;
        // Price (in wei) for the published item
        uint256 price;
        // Quantity of an item to be sold
        uint256 quantity;
    }

    mapping(string => Product) public inventory;

    bytes4 private constant ERC721_Interface = 0x80ac58cd;

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

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Add new item to inventory.
     *  Can only be added by contract owner
     * @param item NFT item to be sold
     * @param nftAddress Non fungible registry address
     * @param price Price in Wei for the supported coin
     * @param quantity Quantity of products to be added
     */
    function addItem(
        string memory item,
        address nftAddress,
        uint256 price,
        uint256 quantity
    ) external onlyOwner {
        _addItem(item, nftAddress, price, quantity);
    }

    /**
     * @dev Remove a quantity of published products.
     *  Can only be removed by contract owner
     * @param item NFT item to be sold
     * @param quantity Quantity of products to be removed
     */
    function removeProducts(string memory item, uint256 quantity) external onlyOwner {
        _removeProducts(item, quantity);
    }

    /**
     * @dev Buy a single product on inventory.
     * @param item NFT item to be sold
     */
    function buyProduct(string memory item) external whenNotPaused {
        _buyProduct(item);
    }

    // TODO: buy multiple products

    function _addItem(
        string memory item,
        address nftAddress,
        uint256 price,
        uint256 quantity
    ) internal {
        Product memory product = inventory[item];
        require(product.quantity == 0, "Item has already been added");
        require(quantity > 0, "Must add at least one product");
        _requireERC721(nftAddress);
        require(price > 0, "Item price should be bigger than 0");
        require(keccak256(abi.encodePacked(item)) != keccak256(abi.encodePacked("")), "Item must have some name");

        inventory[item] = Product({ nftAddress: nftAddress, price: price, quantity: quantity });

        emit ItemAdded(item, nftAddress, price, quantity);
    }

    function _removeProducts(string memory item, uint256 quantity) internal returns (Product memory) {
        Product memory product = inventory[item];
        require(product.quantity != 0, "Item has not been added");

        if (quantity >= product.quantity) {
            inventory[item].quantity = 0;
        } else {
            inventory[item].quantity = product.quantity.sub(quantity);
        }

        address productNftAddress = product.nftAddress;
        uint256 newQuantity = inventory[item].quantity;

        emit ProductsRemoved(item, productNftAddress, newQuantity);

        return product;
    }

    function _buyProduct(string memory item) internal returns (Product memory) {
        Product memory product = inventory[item];
        require(product.quantity != 0, "Item has not been added");
        _requireERC721(product.nftAddress);

        address sender = _msgSender();

        uint256 allowance = acceptedToken.allowance(sender, address(this));
        require(allowance >= product.price, "Check the token allowance");

        BaseNft nftRegistry = BaseNft(
            product.nftAddress
        );

        // Transfer sale amount to seller
        require(
            acceptedToken.transferFrom(sender, owner(), product.price),
            "Transfering the sale amount to the seller failed"
        );

        // Mint new asset to sender
        nftRegistry.mint(sender);

        inventory[item].quantity = product.quantity.sub(1);
        uint256 newQuantity = inventory[item].quantity;
        string memory uri = nftRegistry.baseURI();

        emit ProductBought(item, owner(), uri, product.nftAddress, product.price, sender, newQuantity);

        return product;
    }

    function _requireERC721(address nftAddress) internal view {
        IERC721 nftRegistry = IERC721(nftAddress);
        require(
            nftRegistry.supportsInterface(ERC721_Interface),
            "The NFT contract has an invalid ERC721 implementation"
        );
    }

    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    // EVENTS
    event ItemAdded(string item, address nftAddress, uint256 price, uint256 quantity);
    event ProductsRemoved(string item, address nftAddress, uint256 newQuantity);
    event ProductBought(
        string item,
        address indexed seller,
        string uri,
        address nftAddress,
        uint256 totalPrice,
        address indexed buyer,
        uint256 newQuantity
    );

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    uint256[50] private __gap;
}
