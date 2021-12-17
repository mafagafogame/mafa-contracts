// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ERC721 is IERC721 {
    function safeMint(address to, string memory uri) external returns (uint256);
}

contract NftCrowdSale is Ownable, Pausable {
    using SafeMath for uint256;
    using Address for address;

    IERC20 public acceptedToken;

    struct Order {
        // NFT registry address
        address nftAddress;
        // Price (in wei) for the published item
        uint256 price;
        // Status of the order (Open, Executed, Cancelled)
        bytes32 status;
    }

    // From ERC721 registry assetId to Order (to avoid asset collision)
    mapping(uint256 => Order) public orders;
    uint256 public orderCounter;

    bytes4 private constant ERC721_Interface = 0x80ac58cd;

    constructor(address _acceptedToken) {
        require(_acceptedToken.isContract(), "The accepted token address must be a deployed contract");
        acceptedToken = IERC20(_acceptedToken);
        orderCounter = 0;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Creates a new order
     * @param nftAddress - Non fungible registry address
     * @param price - Price in Wei for the supported coin
     */
    function createOrder(address nftAddress, uint256 price) external whenNotPaused onlyOwner {
        _createOrder(nftAddress, price);
    }

    /**
     * @dev Cancel an already published order
     *  can only be canceled by seller or the contract owner
     * @param id - ID of the order
     */
    function cancelOrder(uint256 id) external whenNotPaused onlyOwner {
        _cancelOrder(id);
    }

    /**
     * @dev Executes the sale for a published NFT
     * @param nftAddress - Address of the NFT registry
     * @param id - ID of the order
     * @param price - Order price
     * @param uri - URI for the new minted token
     */
    function executeOrder(
        address nftAddress,
        uint256 id,
        uint256 price,
        string memory uri
    ) external whenNotPaused {
        _executeOrder(nftAddress, id, price, uri);
    }

    /**
     * @dev Creates a new order
     * @param nftAddress - Non fungible registry address
     * @param price - Price in Wei for the supported coin
     */
    function _createOrder(address nftAddress, uint256 price) internal {
        _requireERC721(nftAddress);
        require(price > 0, "Price should be bigger than 0");

        orders[orderCounter] = Order({ nftAddress: nftAddress, price: price, status: "Open" });
        orderCounter += 1;

        emit OrderCreated(orderCounter - 1, nftAddress, price);
    }

    /**
     * @dev Cancel an already published order
     *  can only be canceled by seller or the contract owner
     * @param id - ID of the order
     */
    function _cancelOrder(uint256 id) internal returns (Order memory) {
        Order memory order = orders[id];
        require(order.status == "Open", "Order is not Open");

        orders[id].status = "Cancelled";
        address orderNftAddress = order.nftAddress;

        emit OrderCancelled(id, orderNftAddress);

        return order;
    }

    /**
     * @dev Executes the sale for a published NFT
     * @param nftAddress - Address of the NFT registry
     * @param id - ID of the order
     * @param price - Order price
     * @param uri - URI for the new minted token
     */
    function _executeOrder(
        address nftAddress,
        uint256 id,
        uint256 price,
        string memory uri
    ) internal returns (Order memory) {
        _requireERC721(nftAddress);

        Order memory order = orders[id];
        require(order.status == "Open", "Order is not Open");
        require(order.price == price, "The price is not correct");

        address sender = _msgSender();

        ERC721 nftRegistry = ERC721(nftAddress);

        // Transfer sale amount to seller
        require(acceptedToken.transferFrom(sender, owner(), price), "Transfering the sale amount to the seller failed");

        // Transfer asset owner
        uint256 assetId = nftRegistry.safeMint(sender, uri);

        orders[id].status = "Executed";

        emit OrderExecuted(id, assetId, uri, owner(), nftAddress, price, sender);

        return order;
    }

    function _requireERC721(address nftAddress) internal view {
        require(nftAddress.isContract(), "The NFT Address should be a contract");

        IERC721 nftRegistry = IERC721(nftAddress);
        require(
            nftRegistry.supportsInterface(ERC721_Interface),
            "The NFT contract has an invalid ERC721 implementation"
        );
    }

    // EVENTS
    event OrderCreated(uint256 id, address nftAddress, uint256 price);
    event OrderCancelled(uint256 id, address nftAddress);
    event OrderExecuted(
        uint256 id,
        uint256 indexed assetId,
        string uri,
        address indexed seller,
        address nftAddress,
        uint256 totalPrice,
        address indexed buyer
    );
}
