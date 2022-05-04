// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

// @dev Custom errors
error DefaultPairUpdated();
error AccountAlreadyExcluded();
error AccountAlreadyIncluded();
error SettingZeroAddress();
error AddressAlreadySet();
error TransferFromZeroAddress();
error TransferToZeroAddress();
error NoAmount();
error MaxSellAmountExceeded(uint256 amount);
error MaxWalletAmountExceeded(uint256 amount);

contract MafaCoinV2 is ERC20, Ownable {
    // @dev the fee the development takes on buy txs.
    uint256 public developmentBuyFee;

    // @dev the fee the development takes on sell txs.
    uint256 public developmentSellFee;

    // @dev which wallet will receive the development fee
    address public developmentAddress;

    // @dev the fee the liquidity takes on buy txs.
    uint256 public liquidityBuyFee;

    // @dev the fee the liquidity takes on sell txs.
    uint256 public liquiditySellFee;

    // @dev which wallet will receive the cake tokens from liquidity.
    address public liquidityAddress;

    // @dev the fee the marketing takes on buy txs.
    uint256 public marketingBuyFee;

    // @dev the fee the marketing takes on sell txs.
    uint256 public marketingSellFee;

    // @dev which wallet will receive the marketing fee
    address public marketingAddress;

    // @dev maximum amount of tokens a user can hold
    uint256 public maxWalletAmount;

    // @dev max amount of tokens a user can sell on a single transaction
    uint256 public maxSellAmount;

    // @dev the defauld dex router
    IUniswapV2Router02 public immutable dexRouter;

    // @dev the dex factory address
    address public immutable dexFactory;

    // @dev mapping of excluded from fees elements
    mapping(address => bool) public isExcludedFromFees;

    // @dev the default dex pair
    address public immutable dexPair;

    // @dev what pairs are allowed to work in the token
    mapping(address => bool) public automatedMarketMakerPairs;

    constructor(
        string memory name,
        string memory symbol,
        uint256 tSupply // totalSupply
    ) ERC20(name, symbol) {
        excludeFromFees(address(this));
        excludeFromFees(owner());

        developmentAddress = owner();
        marketingAddress = owner();
        liquidityAddress = owner();

        _mint(owner(), tSupply);

        // Create a uniswap pair for this new token
        dexRouter = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E);
        dexFactory = address(0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73);

        dexPair = IUniswapV2Factory(dexRouter.factory()).createPair(address(this), dexRouter.WETH());
        _setAutomatedMarketMakerPair(dexPair, true);

        // 5% buy fee
        marketingBuyFee = 1 * 10**16; // 1%
        developmentBuyFee = 3 * 10**16; // 3%
        liquidityBuyFee = 1 * 10**16; // 1%

        // 5% sell fee
        marketingSellFee = 2 * 10**16; // 2%
        developmentSellFee = 2 * 10**16; // 2%
        liquiditySellFee = 1 * 10**16; // 1%

        maxWalletAmount = (tSupply * 3) / 10**3; // 0.3% of total supply
        maxSellAmount = (tSupply * 3) / 10**4; // 0.05% of total supply
    }

    receive() external payable {}

    // @dev sets an AMM pair to check fees upon
    function setAutomatedMarketMakerPair(address pair, bool value) external onlyOwner {
        if (pair == dexPair) revert DefaultPairUpdated();

        _setAutomatedMarketMakerPair(pair, value);
    }

    function _setAutomatedMarketMakerPair(address pair, bool value) private onlyOwner {
        automatedMarketMakerPairs[pair] = value;

        emit SetAutomatedMarketMakerPair(pair, value);
    }

    // @dev exclude an account from fees
    function excludeFromFees(address account) public onlyOwner {
        if (isExcludedFromFees[account]) revert AccountAlreadyExcluded();

        isExcludedFromFees[account] = true;
        emit ExcludeFromFees(account);
    }

    // @dev include an account in fees
    function includeInFees(address account) public onlyOwner {
        if (!isExcludedFromFees[account]) revert AccountAlreadyIncluded();

        isExcludedFromFees[account] = false;
        emit IncludeInFees(account);
    }

    function setDevelopmentAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert SettingZeroAddress();
        if (developmentAddress == newAddress) revert AddressAlreadySet();

        developmentAddress = newAddress;
        emit DevelopmentAddressUpdated(newAddress);
    }

    function setDevelopmentBuyFee(uint256 newFee) external onlyOwner {
        developmentBuyFee = newFee;

        emit DevelopmentFeeUpdated(newFee);
    }

    function setDevelopmentSellFee(uint256 newFee) external onlyOwner {
        developmentSellFee = newFee;

        emit DevelopmentFeeUpdated(newFee);
    }

    function setMarketingAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert SettingZeroAddress();
        if (marketingAddress == newAddress) revert AddressAlreadySet();

        marketingAddress = newAddress;
        emit MarketingAddressUpdated(newAddress);
    }

    function setMarketingBuyFee(uint256 newFee) external onlyOwner {
        marketingBuyFee = newFee;

        emit MarketingFeeUpdated(newFee);
    }

    function setMarketingSellFee(uint256 newFee) external onlyOwner {
        marketingSellFee = newFee;

        emit MarketingFeeUpdated(newFee);
    }

    function setLiquidityAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert SettingZeroAddress();
        if (liquidityAddress == newAddress) revert AddressAlreadySet();

        liquidityAddress = newAddress;
        emit LiquidityAddressUpdated(newAddress);
    }

    function setLiquidityBuyFee(uint256 newFee) external onlyOwner {
        liquidityBuyFee = newFee;

        emit LiquidityFeeUpdated(newFee);
    }

    function setLiquiditySellFee(uint256 newFee) external onlyOwner {
        liquiditySellFee = newFee;

        emit LiquidityFeeUpdated(newFee);
    }

    // @dev just to simplify to the user, the total fees on buy
    function totalBuyFees() external view returns (uint256) {
        return developmentBuyFee + liquidityBuyFee + marketingBuyFee;
    }

    // @dev just to simplify to the user, the total fees on sell
    function totalSellFees() external view returns (uint256) {
        return developmentSellFee + liquiditySellFee + marketingSellFee;
    }

    function setMaxWalletAmount(uint256 amount) external onlyOwner {
        maxWalletAmount = amount;

        emit MaxWalletAmountUpdated(amount);
    }

    function setMaxSellAmount(uint256 amount) external onlyOwner {
        maxSellAmount = amount;

        emit MaxSellAmountUpdated(amount);
    }

    function _swapAndLiquify(uint256 amount, address cakeReceiver) private {
        uint256 half = amount / 2; // this token
        uint256 otherHalf = amount - half;

        uint256 initialAmount = address(this).balance;

        _swapTokensForBNB(half);

        uint256 newAmount = address(this).balance - initialAmount; // chain token

        _addLiquidity(otherHalf, newAmount, cakeReceiver);

        emit SwapAndLiquify(half, newAmount, otherHalf);
    }

    function _swapTokensForBNB(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = dexRouter.WETH();

        _approve(address(this), address(dexRouter), tokenAmount);

        dexRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }

    function _addLiquidity(
        uint256 tokenAmount,
        uint256 bnbAmount,
        address cakeReceiver
    ) private {
        _approve(address(this), address(dexRouter), tokenAmount);

        dexRouter.addLiquidityETH{ value: bnbAmount }(address(this), tokenAmount, 0, 0, cakeReceiver, block.timestamp);
    }

    function _takeFee(
        address from,
        address to,
        uint256 amount
    ) private {
        if (amount == 0) return;

        super._transfer(from, address(this), amount);

        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = dexRouter.WETH();

        _approve(address(this), address(dexRouter), amount);

        dexRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(amount, 0, path, to, block.timestamp);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from == address(0)) revert TransferFromZeroAddress();
        if (to == address(0)) revert TransferToZeroAddress();
        if (amount == 0) revert NoAmount();

        if (isExcludedFromFees[from] || isExcludedFromFees[to]) {
            super._transfer(from, to, amount);
        } else {
            uint256 tokensToDevelopment = 0;
            uint256 tokensToLiquidity = 0;
            uint256 tokensToMarketing = 0;
            uint256 finalAmount = 0;

            // automatedMarketMakerPairs[from] -> buy tokens on dex
            // automatedMarketMakerPairs[to]   -> sell tokens on dex
            if (automatedMarketMakerPairs[to]) {
                if (amount > maxSellAmount) revert MaxSellAmountExceeded(amount);

                uint256 developmentFee = developmentSellFee;
                if (developmentFee > 0) {
                    tokensToDevelopment = (amount * developmentFee) / 10**decimals();
                    _takeFee(from, developmentAddress, tokensToDevelopment);
                }

                uint256 liquidityFee = liquiditySellFee;
                if (liquidityFee > 0) {
                    tokensToLiquidity = (amount * liquidityFee) / 10**decimals();
                    super._transfer(from, address(this), tokensToLiquidity);
                    _swapAndLiquify(balanceOf(address(this)), liquidityAddress);
                }

                uint256 marketingFee = marketingSellFee;
                if (marketingFee > 0) {
                    tokensToMarketing = (amount * marketingFee) / 10**decimals();
                    _takeFee(from, marketingAddress, tokensToMarketing);
                }
            } else {
                uint256 balancePlusAmount = balanceOf(to) + amount;
                if (automatedMarketMakerPairs[from] && balancePlusAmount > maxWalletAmount) {
                    revert MaxWalletAmountExceeded(balancePlusAmount);
                } 

                uint256 developmentFee = developmentBuyFee;
                if (developmentFee > 0) {
                    tokensToDevelopment = (amount * developmentFee) / 10**decimals();
                    super._transfer(from, developmentAddress, tokensToDevelopment);
                }

                uint256 liquidityFee = liquidityBuyFee;
                if (liquidityFee > 0) {
                    tokensToLiquidity = (amount * liquidityFee) / 10**decimals();
                    super._transfer(from, address(this), tokensToLiquidity);
                }

                uint256 marketingFee = marketingBuyFee;
                if (marketingFee > 0) {
                    tokensToMarketing = (amount * marketingFee) / 10**decimals();
                    super._transfer(from, marketingAddress, tokensToMarketing);
                }
            }

            finalAmount = amount - tokensToDevelopment - tokensToLiquidity - tokensToMarketing;
            super._transfer(from, to, finalAmount);
        }
    }

    event ExcludeFromFees(address indexed account);
    event IncludeInFees(address indexed account);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);
    event DevelopmentAddressUpdated(address indexed developmentAddress);
    event DevelopmentFeeUpdated(uint256 indexed fee);
    event LiquidityAddressUpdated(address indexed liquidityAddress);
    event LiquidityFeeUpdated(uint256 indexed fee);
    event MarketingAddressUpdated(address indexed marketingAddress);
    event MarketingFeeUpdated(uint256 indexed fee);
    event MaxWalletAmountUpdated(uint256 indexed amount);
    event MaxSellAmountUpdated(uint256 indexed amount);
    event SwapAndLiquify(
        uint256 indexed tokensSwapped,
        uint256 indexed bnbReceived,
        uint256 indexed tokensIntoLiqudity
    );
}
