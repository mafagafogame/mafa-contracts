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

interface ERC721 is IERC721 {
    function safeMint(address to, string memory uri) external returns (uint256);
}

contract NftStore is Initializable, PausableUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeMath for uint256;

    IERC20 public acceptedToken;

    struct Order {
        // NFT registry address
        address nftAddress;
        // Price (in wei) for the published item
        uint256 price;
        // Quantity of an item to be sold
        uint256 quantity;
    }

    mapping(string => Order) public orders;

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
     * @dev Open a quantity of orders.
     *  Can only be opened by contract owner
     * @param item NFT item to be sold
     * @param nftAddress Non fungible registry address
     * @param price Price in Wei for the supported coin
     * @param quantity Quantity of orders to be opened
     */
    function openOrders(
        string memory item,
        address nftAddress,
        uint256 price,
        uint256 quantity
    ) external onlyOwner {
        _openOrders(item, nftAddress, price, quantity);
    }

    /**
     * @dev Cancel a quantity of published orders.
     *  Can only be canceled by contract owner
     * @param item NFT item to be sold
     * @param quantity Quantity of orders to be canceled
     */
    function cancelOrders(string memory item, uint256 quantity) external onlyOwner {
        _cancelOrders(item, quantity);
    }

    /**
     * @dev Executes the sale for a order.
     * @param item NFT item to be sold
     * @param uri URI for the new minted token
     */
    function executeOrder(string memory item, string memory uri) external whenNotPaused {
        _executeOrder(item, uri);
    }

    function _openOrders(
        string memory item,
        address nftAddress,
        uint256 price,
        uint256 quantity
    ) internal {
        Order memory order = orders[item];
        require(order.quantity == 0, "Order has already been opened");
        require(quantity > 0, "Order must have at least 1 item");
        _requireERC721(nftAddress);
        require(price > 0, "Order price should be bigger than 0");
        require(keccak256(abi.encodePacked(item)) != keccak256(abi.encodePacked("")), "Item must have some value");

        orders[item] = Order({ nftAddress: nftAddress, price: price, quantity: quantity });

        emit OrdersOpened(item, nftAddress, price, quantity);
    }

    function _cancelOrders(string memory item, uint256 quantity) internal returns (Order memory) {
        Order memory order = orders[item];
        require(order.quantity != 0, "Order is not open");

        if (quantity >= order.quantity) {
            orders[item].quantity = 0;
        } else {
            orders[item].quantity = order.quantity.sub(quantity);
        }

        address orderNftAddress = order.nftAddress;
        uint256 newQuantity = orders[item].quantity;

        emit OrdersCanceled(item, orderNftAddress, newQuantity);

        return order;
    }

    function _executeOrder(string memory item, string memory uri) internal returns (Order memory) {
        Order memory order = orders[item];
        require(order.quantity != 0, "Order is not open");
        _requireERC721(order.nftAddress);

        address sender = _msgSender();

        uint256 allowance = acceptedToken.allowance(sender, address(this));
        require(allowance >= order.price, "Check the token allowance");

        ERC721 nftRegistry = ERC721(order.nftAddress);

        // Transfer sale amount to seller
        require(
            acceptedToken.transferFrom(sender, owner(), order.price),
            "Transfering the sale amount to the seller failed"
        );

        // Mint new asset to sender
        uint256 assetId = nftRegistry.safeMint(sender, uri);

        orders[item].quantity = order.quantity.sub(1);
        uint256 newQuantity = orders[item].quantity;

        emit OrderExecuted(item, assetId, uri, owner(), order.nftAddress, order.price, sender, newQuantity);

        return order;
    }

    function _requireERC721(address nftAddress) internal view {
        IERC721 nftRegistry = IERC721(nftAddress);
        require(
            nftRegistry.supportsInterface(ERC721_Interface),
            "The NFT contract has an invalid ERC721 implementation"
        );
    }

    // EVENTS
    event OrdersOpened(string item, address nftAddress, uint256 price, uint256 quantity);
    event OrdersCanceled(string item, address nftAddress, uint256 newQuantity);
    event OrderExecuted(
        string item,
        uint256 indexed assetId,
        string uri,
        address indexed seller,
        address nftAddress,
        uint256 totalPrice,
        address indexed buyer,
        uint256 newQuantity
    );

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
