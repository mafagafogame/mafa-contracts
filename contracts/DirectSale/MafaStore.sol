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

import "../NFTs/BaseNft.sol";
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
        // token contract
        address tokenContract;
        // token id
        uint256 tokenId;
        // item title
        bytes32 title;
        // price in USD. Value is multiplied by 10**18.
        uint256 price;
    }

    struct SellVolume {
        uint256 date;
        uint256 amount;
    }

    IERC20 public acceptedToken;
    MafagafoAvatarNft public avatarContract;

    IUniswapV2Pair internal _mafaBnbPair;
    IUniswapV2Pair internal _bnbBusdPair;

    // list of items available to sell
    Item[] public items;

    // 10**18 data. The value is in USD and converted to MAFA. The store pays it in return when it receives a mafagafo.
    uint256 public avatarPrice;

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
        require(mafaBnb.isContract(), "MafaBnbPair address must be a contract");
        require(bnbBusd.isContract(), "BnbBusdPair address must be a contract");

        acceptedToken = IERC20(_acceptedToken);
        avatarContract = MafagafoAvatarNft(avatarAddress);
        _mafaBnbPair = IUniswapV2Pair(mafaBnb);
        _bnbBusdPair = IUniswapV2Pair(bnbBusd);

        avatarPrice = 300 * 10**18;

        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Update the accepted token
     * @param addr of the token
     */
    function setAcceptedToken(address addr) external virtual onlyOwner {
        require(addr.isContract(), "ERC20 token address must be a contract");
        acceptedToken = IERC20(addr);

        emit AcceptedTokenChanged(addr);
    }

    /**
     * @dev Update the avatar token
     * @param addr of the token
     */
    function setAvatarAddress(address addr) external virtual onlyOwner {
        require(addr.isContract(), "Avatar NFT address must be a contract");
        avatarContract = MafagafoAvatarNft(addr);

        emit AvatarAddressChanged(addr);
    }

    /**
     * @dev Update the mafa bnb pair token
     * @param addr of the token
     */
    function setMafaBnbPair(address addr) external virtual onlyOwner {
        require(addr.isContract(), "MafaBnbPair address must be a contract");
        _mafaBnbPair = IUniswapV2Pair(addr);

        emit MafaBnbPairChanged(addr);
    }

    /**
     * @dev Update the bnb busd pair token
     * @param addr of the token
     */
    function setBnbBusdPair(address addr) external virtual onlyOwner {
        require(addr.isContract(), "BnbBusdPair address must be a contract");
        _bnbBusdPair = IUniswapV2Pair(addr);

        emit BnbBusdPairChanged(addr);
    }

    /**
     * @dev Update the USD price of the avatar
     * @param price new price
     */
    function setAvatarPrice(uint256 price) external virtual onlyOwner {
        require(price != 0, "New price cannot be 0");
        avatarPrice = price;

        emit AvatarPriceChanged(price);
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    /**
     * @dev pause the contract
     */
    function pause() external virtual onlyOwner {
        _pause();
    }

    /**
     * @dev unpause the contract
     */
    function unpause() external virtual onlyOwner {
        _unpause();
    }

    /**
     * @dev Add a new item.
     *  Can only be called by contract owner
     * @param tokenContract Address of ERC1155 inventory of items
     * @param tokenId of the ERC1155 contract. it is the item category.
     * @param title Item title name
     * @param price Price of the item
     */
    function addItemToBeSold(
        address tokenContract,
        uint256 tokenId,
        bytes32 title,
        uint256 price
    ) external virtual onlyOwner {
        require(tokenContract.isContract(), "NFT address must be a contract");
        require(price > 0, "Item price can't be 0");

        items.push(Item(tokenContract, tokenId, title, price));

        emit ItemAdded(tokenContract, items.length - 1, tokenId, title, price);
    }

    /**
     * @dev Remove an item
     *  When we delete an item, we move the last item to the deleted position
     * @param toDeleteIndex The array ID from items to be removed
     */
    function removeItemFromStore(uint256 toDeleteIndex) external virtual onlyOwner {
        require(toDeleteIndex < items.length, "Id should be between 0 and items length");

        Item memory toDelete = items[toDeleteIndex];

        uint256 lastIndex = items.length - 1;
        if (lastIndex != toDeleteIndex) {
            // Move the last value to the index where the value to delete is
            items[toDeleteIndex] = items[lastIndex];
        }

        // Delete the slot where the moved value was stored
        items.pop();

        emit ItemDeleted(toDeleteIndex, toDelete.tokenContract, toDelete.tokenId, toDelete.price);
    }

    /**
     * @dev list all items. to be used on the frontend
     */
    function listItems() external view returns (Item[] memory) {
        return items;
    }

    /**
     * @dev Update the price of an item.
     *  Can only be called by contract owner
     * @param id Id of the item
     * @param newPrice New price of the item
     */
    function updateItemPrice(uint256 id, uint256 newPrice) external virtual onlyOwner {
        require(id < items.length, "Item doesn't exists");
        require(newPrice != 0, "Item price can't be 0");

        Item storage item = items[id];

        item.price = newPrice;

        emit ItemPriceUpdated(id, newPrice);
    }

    /**
     * @dev Buy amounts of an item.
     * @param id ID on items array
     * @param title Item title name
     * @param amounts Amounts of items to be sold
     */
    function buyItem(
        uint256 id,
        bytes32 title,
        uint256 amounts
    ) external virtual whenNotPaused nonReentrant {
        require(amounts > 0, "Amounts must be greater than zero");
        require(id < items.length, "Item doesn't exists");
        Item memory item = items[id];
        require(item.title == title, "Title argument must match requested item title");

        address sender = _msgSender();

        uint256 mafaBusdPrice = getMAFAtoBUSDprice();
        uint256 itemPriceInMAFA = (item.price.mul(amounts).mul(10**18).div(mafaBusdPrice));

        uint256 allowance = acceptedToken.allowance(sender, address(this));
        require(allowance >= itemPriceInMAFA, "Check the token allowance");

        // Transfer item price amount to owner
        require(
            acceptedToken.transferFrom(sender, owner(), itemPriceInMAFA),
            "Fail transferring the item price amount to owner"
        );

        BaseERC1155 nftRegistry = BaseERC1155(item.tokenContract);

        nftRegistry.mint(sender, item.tokenId, amounts, "");

        emit ItemBought(item.tokenContract, id, item.tokenId, owner(), sender, itemPriceInMAFA, amounts);
    }

    /**
     * @dev Sell an avatar to this contract
     * @param tokenIds ERC721 token IDs of the avatars to be sold
     */
    function sellAvatar(uint256[] memory tokenIds) external virtual whenNotPaused nonReentrant {
        require(tokenIds.length > 0, "You must sell at least one avatar");
        require(tokenIds.length <= 500, "You can sell at most 500 avatars at a time");

        address sender = _msgSender();

        require(avatarContract.isApprovedForAll(sender, address(this)), "Check the approval of your avatars");

        uint256 priceInBUSD = tokenIds.length.mul(avatarPrice);
        uint256 mafaBusdPrice = getMAFAtoBUSDprice();
        uint256 sellPriceInMAFA = (priceInBUSD.mul(10**18).div(mafaBusdPrice));

        uint256 storeBalance = acceptedToken.balanceOf(address(this));
        require(storeBalance >= sellPriceInMAFA, "Amount exceeds mafastore balance");
        if (tokenIds.length > 1) {
            require(sellPriceInMAFA <= storeBalance.div(100), "Price exceedes your maximum sell amount for the day");
        }

        SellVolume[] storage sellVolumes = dailyVolumes[sender];

        uint256 accumulator = 0;
        for (uint256 i = 0; i < sellVolumes.length; i++) {
            if (sellVolumes[i].date + 1 days >= block.timestamp) {
                accumulator += sellVolumes[i].amount;
            } else {
                remove(sellVolumes, i);
            }
        }

        if (accumulator > 0) {
            require(
                accumulator + sellPriceInMAFA <= storeBalance.div(100),
                "You already exceeded your maximum sell amount for the day"
            );
        }

        sellVolumes.push(SellVolume({ date: block.timestamp, amount: sellPriceInMAFA }));

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(avatarContract.ownerOf(tokenIds[i]) == sender, "You have to own this avatar to be able to sell it");

            (uint16 mafaVersion, , uint32 generation, , , , , , ) = avatarContract.getMafagafo(tokenIds[i]);
            require(mafaVersion == 0, "You can only sell avatars from version 0");
            require(generation == 1, "You can only sell avatars from generation 1");

            avatarContract.transferFrom(sender, address(this), tokenIds[i]);
        }

        emit AvatarSold(sender, tokenIds, sellPriceInMAFA, tokenIds.length);

        require(acceptedToken.transfer(sender, sellPriceInMAFA), "Fail transferring the amount to the seller");
    }

    function remove(SellVolume[] storage array, uint256 index) internal returns (bool success) {
        if (index >= array.length) return false;

        array[index] = array[array.length - 1];
        array.pop();

        return true;
    }

    /**
     * @dev Withdraw BNB from this contract
     * @param to receiver address
     * @param amount amount to withdraw
     */
    function withdraw(address payable to, uint256 amount) external virtual onlyOwner {
        require(to != address(0), "transfer to the zero address");
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

        require(tokenContract.transfer(to, amount), "Fail on transfer");
    }

    /**
     * @dev Withdraw any ERC721 token from this contract
     * @param tokenAddress ERC721 token to withdraw
     * @param to receiver address
     * @param tokenIds IDs of the NFTs to withdraw
     */
    function withdrawERC721(
        address tokenAddress,
        address to,
        uint256[] memory tokenIds
    ) external virtual onlyOwner {
        require(tokenIds.length <= 550, "You can withdraw at most 550 avatars at a time");
        require(tokenAddress.isContract(), "ERC721 token address must be a contract");

        IERC721 tokenContract = IERC721(tokenAddress);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                tokenContract.ownerOf(tokenIds[i]) == address(this),
                "Mafastore doesn't own the NFT you are trying to withdraw"
            );

            tokenContract.safeTransferFrom(address(this), to, tokenIds[i]);
        }
    }

    /**
     * @dev Withdraw any ERC721 token from this contract
     * @param tokenAddress ERC721 token to withdraw
     * @param to receiver address
     * @param amount amount to withdraw
     */
    function withdrawNFTs(
        address tokenAddress,
        address to,
        uint256 amount
    ) external virtual onlyOwner {
        require(amount <= 500, "You can withdraw at most 500 avatars at a time");
        require(tokenAddress.isContract(), "ERC721 token address must be a contract");

        BaseNft tokenContract = BaseNft(tokenAddress);
        uint256[] memory tokenIds = tokenContract.listMyNftIds();
        require(tokenIds.length >= amount, "Mafastore doesn't own the amount of NFTs");
        for (uint256 i = 0; i < amount; i++) {
            require(
                tokenContract.ownerOf(tokenIds[i]) == address(this),
                "Mafastore doesn't own the NFT you are trying to withdraw"
            );

            tokenContract.safeTransferFrom(address(this), to, tokenIds[i]);
        }
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
        uint256 reserves0LP0 = 0;
        uint256 reserves1LP0 = 0;
        uint256 reserves0LP1 = 0;
        uint256 reserves1LP1 = 0;

        if (_mafaBnbPair.token1() == _bnbBusdPair.token0()) {
            (reserves0LP0, reserves1LP0, ) = _mafaBnbPair.getReserves();
            (reserves0LP1, reserves1LP1, ) = _bnbBusdPair.getReserves();

            return (reserves1LP1.mul(reserves1LP0).mul(10**18)).div(reserves0LP1.mul(reserves0LP0));
        } else if (_mafaBnbPair.token1() == _bnbBusdPair.token1()) {
            (reserves0LP0, reserves1LP0, ) = _mafaBnbPair.getReserves();
            (reserves1LP1, reserves0LP1, ) = _bnbBusdPair.getReserves();

            return (reserves1LP1.mul(reserves1LP0).mul(10**18)).div(reserves0LP1.mul(reserves0LP0));
        } else if (_mafaBnbPair.token0() == _bnbBusdPair.token0()) {
            (reserves1LP0, reserves0LP0, ) = _mafaBnbPair.getReserves();
            (reserves0LP1, reserves1LP1, ) = _bnbBusdPair.getReserves();

            return (reserves1LP1.mul(reserves1LP0).mul(10**18)).div(reserves0LP1.mul(reserves0LP0));
        } else {
            (reserves1LP0, reserves0LP0, ) = _mafaBnbPair.getReserves();
            (reserves1LP1, reserves0LP1, ) = _bnbBusdPair.getReserves();

            return (reserves1LP1.mul(reserves1LP0).mul(10**18)).div(reserves0LP1.mul(reserves0LP0));
        }
    }

    /**
     * @dev gets the price in MAFA of an item.
     * @param id ID on items array
     * @param amounts Amounts of the items
     */
    function getItemPriceInMAFA(uint256 id, uint256 amounts) external view virtual returns (uint256 price) {
        require(amounts > 0, "Amounts must be greater than zero");
        require(id < items.length, "Item doesn't exists");
        Item memory item = items[id];

        uint256 mafaBusdPrice = getMAFAtoBUSDprice();

        return (item.price.mul(amounts).mul(10**18).div(mafaBusdPrice));
    }

    /**
     * @dev upgradable version
     */
    function version() external pure virtual returns (string memory) {
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
    event ItemAdded(address indexed tokenContract, uint256 id, uint256 tokenId, bytes32 title, uint256 price);
    event ItemDeleted(uint256 toDeleteIndex, address indexed tokenContract, uint256 itemId, uint256 price);
    event ItemPriceUpdated(uint256 id, uint256 price);
    event ItemBought(
        address indexed tokenContract,
        uint256 id,
        uint256 tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 amounts
    );
    event AvatarSold(address indexed seller, uint256[] tokenId, uint256 price, uint256 amounts);
    event AcceptedTokenChanged(address indexed addr);
    event AvatarAddressChanged(address indexed addr);
    event MafaBnbPairChanged(address indexed addr);
    event BnbBusdPairChanged(address indexed addr);
    event AvatarPriceChanged(uint256 price);

    uint256[50] private __gap;

    mapping(address => SellVolume[]) public dailyVolumes;
}

contract MafaStoreTestV2 is MafaStore {
    function version() external pure virtual override returns (string memory) {
        return "2.0.0";
    }
}
