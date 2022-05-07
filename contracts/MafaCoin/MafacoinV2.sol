// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

import "./WithdrawableOwnable.sol";

// @dev Custom errors
error DefaultPairUpdated();
error SettingZeroAddress();
error AddressAlreadySet();
error TransferFromZeroAddress();
error TransferToZeroAddress();
error NoAmount();
error MaxSellAmountExceeded(uint256 amount);
error MaxBuyFeeExceeded(uint256 amount);
error MaxSellFeeExceeded(uint256 amount);
error MaxSellAmountTooLow(uint256 amount);

contract MafaCoinV2 is ERC20, WithdrawableOwnable {
    // @dev the fee the development takes on buy txs.
    uint256 public developmentBuyFee = 0;

    // @dev the fee the development takes on sell txs.
    uint256 public developmentSellFee = 3 * 10**16; // 3%

    // @dev which wallet will receive the development fee
    address public developmentAddress = 0x056f3E1B30797a122447581d0F34CD69E9A26690;

    // @dev the fee the liquidity takes on buy txs.
    uint256 public liquidityBuyFee = 1 * 10**16; // 1%

    // @dev the fee the liquidity takes on sell txs.
    uint256 public liquiditySellFee = 1 * 10**16; // 1%

    // @dev which wallet will receive the cake tokens from liquidity.
    address public liquidityAddress = 0xc76280a36743E1266dC73F114bB1c9950ee37E7c;

    // @dev the fee the marketing takes on buy txs.
    uint256 public marketingBuyFee = 0;

    // @dev the fee the marketing takes on sell txs.
    uint256 public marketingSellFee = 3 * 10**16; // 3%

    // @dev which wallet will receive the marketing fee
    address public marketingAddress = 0x272C14981F2Ff4fF06F5EF326940E7F067b4b5D6;

    // @dev maximum amount that buy fees added together can be raised to
    uint256 public constant MAX_BUY_FEE = 14 * 10**16; // 14%;

    // @dev maximum amount that sell fees added together can be raised to
    uint256 public constant MAX_SELL_FEE = 14 * 10**16; // 14%;

    // @dev maximum amount of tokens a user can sell on a single transaction (antidump mechanism)
    uint256 public maxSellAmount = 100000 * 10**18;

    // @dev minimum value that can be set for antidump mechanism
    uint256 public constant MIN_ANTI_DUMP_LIMIT = 10000 * 10**18;

    // @dev minumum amount of tokens the contract can hold to send fees in BNB to the fee recipient
    uint256 public minTokensToTakeFeeInBNB = 1000 * 10**18;

    // @dev the defauld dex router
    IUniswapV2Router02 public immutable dexRouter;

    // @dev the dex factory address
    address public immutable dexFactory;

    // @dev the default dex pair
    address public immutable dexPair;

    // @dev mapping of excluded from fees elements
    mapping(address => bool) public isExcludedFromFees;

    // @dev what pairs are allowed to work in the token
    mapping(address => bool) public automatedMarketMakerPairs;

    constructor(
        string memory name,
        string memory symbol,
        uint256 tSupply // totalSupply
    ) ERC20(name, symbol) {
        isExcludedFromFees[address(this)] = true;
        isExcludedFromFees[owner()] = true;

        _mint(owner(), tSupply);

        // Create a uniswap pair for this new token
        dexRouter = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E);
        dexFactory = address(0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73);

        dexPair = IUniswapV2Factory(dexRouter.factory()).createPair(address(this), dexRouter.WETH());
        _setAutomatedMarketMakerPair(dexPair, true);
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

    function setDevelopmentAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert SettingZeroAddress();
        if (developmentAddress == newAddress) revert AddressAlreadySet();

        developmentAddress = newAddress;
        emit DevelopmentAddressUpdated(newAddress);
    }

    function setDevelopmentBuyFee(uint256 newFee) external onlyOwner {
        checkBuyFeesChanged(newFee, developmentBuyFee);

        developmentBuyFee = newFee;
        emit DevelopmentFeeUpdated(newFee);
    }

    function setDevelopmentSellFee(uint256 newFee) external onlyOwner {
        checkSellFeesChanged(newFee, developmentSellFee);

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
        checkBuyFeesChanged(newFee, marketingBuyFee);

        marketingBuyFee = newFee;
        emit MarketingFeeUpdated(newFee);
    }

    function setMarketingSellFee(uint256 newFee) external onlyOwner {
        checkSellFeesChanged(newFee, marketingSellFee);

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
        checkBuyFeesChanged(newFee, liquidityBuyFee);

        liquidityBuyFee = newFee;
        emit LiquidityFeeUpdated(newFee);
    }

    function setLiquiditySellFee(uint256 newFee) external onlyOwner {
        checkSellFeesChanged(newFee, liquiditySellFee);

        liquiditySellFee = newFee;
        emit LiquidityFeeUpdated(newFee);
    }

    function checkBuyFeesChanged(uint256 newFee, uint256 oldFee) internal view {
        uint256 fees = totalBuyFees() + newFee - oldFee;

        if (fees > MAX_BUY_FEE) revert MaxBuyFeeExceeded(fees);
    }

    function checkSellFeesChanged(uint256 newFee, uint256 oldFee) internal view {
        uint256 fees = totalSellFees() + newFee - oldFee;

        if (fees > MAX_SELL_FEE) revert MaxSellFeeExceeded(fees);
    }

    // @dev just to simplify to the user, the total fees on buy
    function totalBuyFees() public view returns (uint256) {
        return developmentBuyFee + liquidityBuyFee + marketingBuyFee;
    }

    // @dev just to simplify to the user, the total fees on sell
    function totalSellFees() public view returns (uint256) {
        return developmentSellFee + liquiditySellFee + marketingSellFee;
    }

    function setMaxSellAmount(uint256 amount) external onlyOwner {
        if (amount < MIN_ANTI_DUMP_LIMIT) revert MaxSellAmountTooLow(amount);

        maxSellAmount = amount;
        emit MaxSellAmountUpdated(amount);
    }

    function setMinTokensToTakeFeeInBNB(uint256 amount) external onlyOwner {
        minTokensToTakeFeeInBNB = amount;
        emit MinTokensToTakeFeeInBNBUpdated(amount);
    }

    function _takeFeeInBNB(
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
                    _takeFeeInBNB(from, developmentAddress, tokensToDevelopment);
                }

                uint256 liquidityFee = liquiditySellFee;
                if (liquidityFee > 0) {
                    tokensToLiquidity = (amount * liquidityFee) / 10**decimals();
                    _takeFeeInBNB(from, liquidityAddress, tokensToLiquidity);
                }

                uint256 marketingFee = marketingSellFee;
                if (marketingFee > 0) {
                    tokensToMarketing = (amount * marketingFee) / 10**decimals();
                    _takeFeeInBNB(from, marketingAddress, tokensToMarketing);
                }
            } else if (automatedMarketMakerPairs[from]) {
                uint256 developmentFee = developmentBuyFee;
                if (developmentFee > 0) {
                    tokensToDevelopment = (amount * developmentFee) / 10**decimals();
                    super._transfer(from, developmentAddress, tokensToDevelopment);
                }

                uint256 liquidityFee = liquidityBuyFee;
                if (liquidityFee > 0) {
                    tokensToLiquidity = (amount * liquidityFee) / 10**decimals();
                    super._transfer(from, liquidityAddress, tokensToLiquidity);
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

    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);
    event DevelopmentAddressUpdated(address indexed developmentAddress);
    event DevelopmentFeeUpdated(uint256 indexed fee);
    event LiquidityAddressUpdated(address indexed liquidityAddress);
    event LiquidityFeeUpdated(uint256 indexed fee);
    event MarketingAddressUpdated(address indexed marketingAddress);
    event MarketingFeeUpdated(uint256 indexed fee);
    event MaxSellAmountUpdated(uint256 indexed amount);
    event MinTokensToTakeFeeInBNBUpdated(uint256 indexed amount);
}
