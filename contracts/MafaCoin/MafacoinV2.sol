// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

import "./WithdrawableOwnable.sol";

// @dev Custom errors
error DefaultPairUpdated();
error AccountAlreadyExcluded(address account);
error AccountAlreadyIncluded(address account);
error SettingZeroAddress();
error AddressAlreadySet();
error TransferFromZeroAddress();
error TransferToZeroAddress();
error NoAmount();
error MaxSellAmountExceeded(uint256 amount);
error MaxWalletAmountExceeded(uint256 amount);
error MaxBuyFeeExceeded(uint256 amount);
error MaxSellFeeExceeded(uint256 amount);
error MaxFeeExceeded(uint256 amount);
error MaxSellAmountTooLow(uint256 amount);

contract MafaCoinV2 is ERC20, WithdrawableOwnable {
    // @dev the fee the team takes on buy txs.
    uint256 public buyFee = 5 * 10**16; // 5%

    // @dev the fee the team takes on buy txs.
    uint256 public sellFee = 5 * 10**16; // 5%

    // @dev which wallet will receive all the fees
    address public feeRecipient;

    // @dev maximum amount that buy fee can be raised to
    uint256 public constant MAX_BUY_FEE = 14 * 10**16; // 14%;

    // @dev maximum amount that sell fee can be raised to
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
        excludeFromFees(address(this));
        excludeFromFees(owner());

        feeRecipient = owner();

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

    // @dev exclude an account from fees
    function excludeFromFees(address account) public onlyOwner {
        if (isExcludedFromFees[account]) revert AccountAlreadyExcluded(account);

        isExcludedFromFees[account] = true;
        emit ExcludeFromFees(account);
    }

    // @dev include an account in fees
    function includeInFees(address account) public onlyOwner {
        if (!isExcludedFromFees[account]) revert AccountAlreadyIncluded(account);

        isExcludedFromFees[account] = false;
        emit IncludeInFees(account);
    }

    function setFeeRecipientAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert SettingZeroAddress();
        if (feeRecipient == newAddress) revert AddressAlreadySet();

        feeRecipient = newAddress;
        emit FeeRecipientAddressUpdated(newAddress);
    }

    function setBuyFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_BUY_FEE) revert MaxBuyFeeExceeded(newFee);

        buyFee = newFee;
        emit BuyFeeUpdated(newFee);
    }

    function setSellFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_SELL_FEE) revert MaxSellFeeExceeded(newFee);

        sellFee = newFee;
        emit SellFeeUpdated(newFee);
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

    function _takeFeeInBNB(address to, uint256 amount) private {
        if (amount == 0) return;

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
            uint256 feeAmount = 0;

            // automatedMarketMakerPairs[from] -> buy tokens on dex
            // automatedMarketMakerPairs[to]   -> sell tokens on dex
            if (automatedMarketMakerPairs[to]) {
                if (amount > maxSellAmount) revert MaxSellAmountExceeded(amount);

                uint256 fee = sellFee;
                if (fee > 0) {
                    feeAmount = (amount * fee) / 10**decimals();
                    super._transfer(from, address(this), feeAmount);

                    uint256 contractBalance = balanceOf(address(this));
                    if (contractBalance > minTokensToTakeFeeInBNB) _takeFeeInBNB(feeRecipient, contractBalance);
                }
            } else {
                uint256 fee = buyFee;
                if (fee > 0) {
                    feeAmount = (amount * fee) / 10**decimals();
                    super._transfer(from, feeRecipient, feeAmount);
                }
            }

            super._transfer(from, to, amount - feeAmount);
        }
    }

    event ExcludeFromFees(address indexed account);
    event IncludeInFees(address indexed account);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);
    event FeeRecipientAddressUpdated(address indexed feeRecipientAddress);
    event BuyFeeUpdated(uint256 indexed fee);
    event SellFeeUpdated(uint256 indexed fee);
    event MaxSellAmountUpdated(uint256 indexed amount);
    event MinTokensToTakeFeeInBNBUpdated(uint256 indexed amount);
}
