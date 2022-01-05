// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

import "../NFTs/BaseERC1155.sol";
import "../NFTs/MafagafoAvatarNft.sol";

contract MafaStore is
    Initializable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC1155ReceiverUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;

    struct Item {
        address nftAddress;
        uint256 nftId;
        uint256 price;
    }

    IERC20 public acceptedToken;
    MafagafoAvatarNft public avatarContract;

    IUniswapV2Pair internal _mafaBnbPair;
    IUniswapV2Pair internal _bnbBusdPair;

    Item[] public items;

    /**
     * @param _acceptedToken accepted ERC20 token address
     * @param avatarAddress accepted avatar address to sell to the mafastore
     * @param mafaBnb LP token address of MAFA/BNB pair
     * @param bnbBusd LP token address of BNB/BUSD pair
     */
    function initialize(
        address _acceptedToken,
        address avatarAddress,
        address mafaBnb,
        address bnbBusd
    ) public initializer {
        require(_acceptedToken.isContract(), "ERC20 token address must be a contract");
        require(avatarAddress.isContract(), "Avatar NFT address must be a contract");
        acceptedToken = IERC20(_acceptedToken);
        avatarContract = MafagafoAvatarNft(avatarAddress);
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
     * @dev Update the price of an item
     *  Can only be called by contract owner
     * @param id Id of the item
     * @param newPrice New price of the item
     */
    function updateItemPrice(uint256 id, uint256 newPrice) external virtual onlyOwner {
        _updateItemPrice(id, newPrice);
    }

    /**
     * @dev Buy amounts of an item.
     * @param id ID on items array
     * @param amounts Amounts of items to be sold
     */
    function buyItem(uint256 id, uint256 amounts) external virtual whenNotPaused nonReentrant {
        _buyItem(id, amounts);
    }

    /**
     * @dev Sell an avatar to this contract
     * @param tokenId ERC721 token ID of the avatar to be sold
     */
    function sellAvatar(uint256 tokenId) external virtual whenNotPaused nonReentrant {
        _sellAvatar(tokenId);
    }

    function _createItem(
        address nftAddress,
        uint256 nftId,
        uint256 price
    ) internal virtual {
        require(nftAddress.isContract(), "NFT address must be a contract");
        require(price > 0, "Item price can't be 0");

        items.push(Item(nftAddress, nftId, price));

        emit ItemCreated(nftAddress, items.length - 1, nftId, price);
    }

    function _updateItemPrice(uint256 id, uint256 newPrice) internal virtual {
        require(id < items.length, "Item doesn't exists");
        require(newPrice > 0, "Item price can't be 0");

        Item storage item = items[id];

        item.price = newPrice;

        emit ItemPriceUpdated(id, newPrice);
    }

    function _buyItem(uint256 id, uint256 amounts) internal virtual {
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

    function _sellAvatar(uint256 tokenId) internal virtual {
        require(
            acceptedToken.balanceOf(address(this)) >= 300,
            "The mafastore is unable to receive new avatars for the moment"
        );

        address sender = _msgSender();
        require(avatarContract.ownerOf(tokenId) == sender, "You have to own this avatar to be able to sell it");
        require(avatarContract.getApproved(tokenId) == address(this), "Check the token approval for this token ID");

        avatarContract.transferFrom(sender, address(this), tokenId);

        emit AvatarSold(sender, tokenId);
    }

    /**
     * @dev Withdraw BNB from this contract
     * @param to receiver address
     * @param amount amount to withdraw  
     */
    function withdraw(address payable to, uint256 amount) external virtual onlyOwner {
        require(amount <= payable(address(this)).balance, "You are trying to withdraw more funds than available");
        to.transfer(amount);
    }

    /**
     * @dev Withdraw any ERC20 token from this contract
     * @param tokenAddress ERC20 token to withdraw
     * @param to receiver address
     * @param amount amount to withdraw  
     */
    function withdrawERC20(
        address tokenAddress,
        address to,
        uint256 amount
    ) external virtual onlyOwner {
        require(tokenAddress.isContract(), "ERC20 token address must be a contract");

        IERC20 tokenContract = IERC20(tokenAddress);
        require(
            tokenContract.balanceOf(address(this)) >= amount,
            "You are trying to withdraw more funds than available"
        );

        tokenContract.transfer(to, amount);
    }

    /**
     * @dev Withdraw any ERC721 token from this contract
     * @param tokenAddress ERC721 token to withdraw
     * @param to receiver address
     * @param tokenId ID of the NFT to withdraw 
     */
    function withdrawERC721(
        address tokenAddress,
        address to,
        uint256 tokenId
    ) external virtual onlyOwner {
        require(tokenAddress.isContract(), "ERC721 token address must be a contract");

        IERC721 tokenContract = IERC721(tokenAddress);
        require(
            tokenContract.ownerOf(tokenId) == address(this),
            "Mafastore doesn't own the NFT you are trying to withdraw"
        );

        tokenContract.safeTransferFrom(address(this), to, tokenId);
    }

    /**
     * @dev Withdraw any ERC1155 token from this contract
     * @param tokenAddress ERC1155 token to withdraw
     * @param to receiver address
     * @param id ID of the token to withdraw 
     * @param amount amount to withdraw
     */
    function withdrawERC1155(
        address tokenAddress,
        address to,
        uint256 id,
        uint256 amount
    ) external virtual onlyOwner {
        require(tokenAddress.isContract(), "ERC1155 token address must be a contract");

        IERC1155 tokenContract = IERC1155(tokenAddress);
        require(
            tokenContract.balanceOf(address(this), id) >= amount,
            "Mafastore doesn't own the amount of tokens to withdraw"
        );

        tokenContract.safeTransferFrom(address(this), to, id, amount, "");
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

    // MUST IMPLEMENT TO BE ABLE TO RECEIVE TOKENS
    receive() external payable {}

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // EVENTS
    event ItemCreated(address indexed nftAddress, uint256 id, uint256 nftId, uint256 price);
    event ItemPriceUpdated(uint256 id, uint256 price);
    event ItemBought(
        address indexed nftAddress,
        uint256 id,
        uint256 nftId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 amounts
    );
    event AvatarSold(address indexed seller, uint256 tokenId);

    uint256[50] private __gap;
}

contract MafaStoreTestV2 is MafaStore {
    function version() public pure virtual override returns (string memory) {
        return "2.0.0";
    }
}
