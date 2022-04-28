// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

contract MafaCoinV2 is ERC20, Ownable {
    using SafeMath for uint256;

    // @dev dead address
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // @dev the fee the team takes on buy txs.
    uint256 public teamBuyFee;

    // @dev the fee the team takes on sell txs.
    uint256 public teamSellFee;

    // @dev which wallet will receive the team fee
    address public teamAddress;

    // @dev the fee the liquidity takes on buy txs.
    uint256 public liquidityBuyFee;

    // @dev the fee the liquidity takes on sell txs.
    uint256 public liquiditySellFee;

    // @dev which wallet will receive the cake tokens from liquidity.
    address public liquidityAddress;

    // @dev the fee the burn takes on buy txs.
    uint256 public burnBuyFee;

    // @dev the fee the burn takes on sell txs.
    uint256 public burnSellFee;

    // @dev the defauld dex router
    IUniswapV2Router02 public dexRouter;

    // @dev the dex factory address
    address public dexFactory;

    // @dev mapping of excluded from fees elements
    mapping(address => bool) public isExcludedFromFees;

    // @dev the default dex pair
    address public dexPair;

    // @dev what pairs are allowed to work in the token
    mapping(address => bool) public automatedMarketMakerPairs;

    // @dev checks if transfer is allowed for non excluded from fees users
    bool public tradingIsEnabled = false;

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) ERC20(name, symbol) {
        excludeFromFees(address(this), true);
        excludeFromFees(owner(), true);
        excludeFromFees(DEAD_ADDRESS, true);

        teamAddress = owner();
        liquidityAddress = owner();

        _mint(owner(), totalSupply);

        // Create a uniswap pair for this new token
        dexRouter = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E);
        dexFactory = address(0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73);

        dexPair = IUniswapV2Factory(dexRouter.factory()).createPair(address(this), dexRouter.WETH());
        _setAutomatedMarketMakerPair(dexPair, true);
    }

    function afterPreSale() external onlyOwner {
        teamBuyFee = 1 * 10**16; // 2%
        liquidityBuyFee = 3 * 10**16; // 4%
        burnBuyFee = 1 * 10**16; // 1%

        teamSellFee = 5 * 10**16; // 2%
        liquiditySellFee = 3 * 10**16; // 4%
        burnSellFee = 1 * 10**16; // 1%

        tradingIsEnabled = true;
    }

    receive() external payable {}

    // @dev sets an AMM pair to check fees upon
    function setAutomatedMarketMakerPair(address pair, bool value) external onlyOwner {
        require(pair != dexPair, "Default pair cannot be changed");
        _setAutomatedMarketMakerPair(pair, value);
    }

    function _setAutomatedMarketMakerPair(address pair, bool value) private onlyOwner {
        automatedMarketMakerPairs[pair] = value;

        emit SetAutomatedMarketMakerPair(pair, value);
    }

    // @dev exclude/include an account on fees
    function excludeFromFees(address account, bool excluded) public onlyOwner {
        require(isExcludedFromFees[account] != excluded, "Already set");
        isExcludedFromFees[account] = excluded;

        emit ExcludeFromFees(account, excluded);
    }

    function setTeamAddress(address newAddress) public onlyOwner {
        require(teamAddress != newAddress, "Team address already setted");
        teamAddress = newAddress;

        emit TeamAddressUpdated(newAddress);
    }

    function setTeamBuyFee(uint256 newFee) public onlyOwner {
        teamBuyFee = newFee;

        emit TeamFeeUpdated(newFee);
    }

    function setTeamSellFee(uint256 newFee) public onlyOwner {
        teamSellFee = newFee;

        emit TeamFeeUpdated(newFee);
    }

    function setLiquidityAddress(address newAddress) public onlyOwner {
        require(liquidityAddress != newAddress, "Liquidity address already setted");
        liquidityAddress = newAddress;

        emit LiquidityAddressUpdated(newAddress);
    }

    function setLiquidityBuyFee(uint256 newFee) public onlyOwner {
        liquidityBuyFee = newFee;

        emit LiquidityFeeUpdated(newFee);
    }

    function setLiquiditySellFee(uint256 newFee) public onlyOwner {
        liquiditySellFee = newFee;

        emit LiquidityFeeUpdated(newFee);
    }

    function setBurnBuyFee(uint256 newFee) public onlyOwner {
        burnBuyFee = newFee;

        emit BurnFeeUpdated(newFee);
    }

    function setBurnSellFee(uint256 newFee) public onlyOwner {
        burnSellFee = newFee;

        emit BurnFeeUpdated(newFee);
    }

    // @dev just to simplify to the user, the total fees on buy
    function totalBuyFees() external view returns (uint256) {
        return teamBuyFee.add(liquidityBuyFee).add(burnBuyFee);
    }

    // @dev just to simplify to the user, the total fees on sell
    function totalSellFees() external view returns (uint256) {
        return teamSellFee.add(liquiditySellFee).add(burnSellFee);
    }

    function _swapAndLiquify(uint256 amount, address cakeReceiver) private {
        uint256 half = amount.div(2); // this token
        uint256 otherHalf = amount.sub(half);

        uint256 initialAmount = address(this).balance;

        _swapTokensForBNB(half);

        uint256 newAmount = address(this).balance.sub(initialAmount); // chain token

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
            block.timestamp.add(300)
        );
    }

    function _addLiquidity(
        uint256 tokenAmount,
        uint256 bnbAmount,
        address cakeReceiver
    ) private {
        _approve(address(this), address(dexRouter), tokenAmount);

        dexRouter.addLiquidityETH{ value: bnbAmount }(
            address(this),
            tokenAmount,
            0,
            0,
            cakeReceiver,
            block.timestamp.add(300)
        );
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

        dexRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(amount, 0, path, to, block.timestamp.add(300));
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(amount > 0, "Transfer amount must be greater than zero");
        require(tradingIsEnabled || (isExcludedFromFees[from] || isExcludedFromFees[to]), "Trading has not started");

        if (isExcludedFromFees[from] || isExcludedFromFees[to]) {
            super._transfer(from, to, amount);
        } else {
            uint256 tokensToTeam = 0;
            uint256 tokensToLiquidity = 0;
            uint256 tokensToBurn = 0;
            uint256 finalAmount = 0;

            // automatedMarketMakerPairs[from] -> buy tokens on dex
            // automatedMarketMakerPairs[to]   -> sell tokens on dex
            if (automatedMarketMakerPairs[to]) {
                if (teamSellFee > 0) {
                    tokensToTeam = amount.mul(teamSellFee).div(10**decimals());
                    _takeFee(from, teamAddress, tokensToTeam);
                }

                if (liquiditySellFee > 0) {
                    tokensToLiquidity = amount.mul(liquiditySellFee).div(10**decimals());
                    super._transfer(from, address(this), tokensToLiquidity);
                    _swapAndLiquify(balanceOf(address(this)), liquidityAddress);
                }

                if (burnSellFee > 0 && balanceOf(DEAD_ADDRESS) < totalSupply().div(2)) {
                    tokensToBurn = amount.mul(burnSellFee).div(10**decimals());
                    super._transfer(from, DEAD_ADDRESS, tokensToBurn);
                }
            } else {
                if (teamBuyFee > 0) {
                    tokensToTeam = amount.mul(teamBuyFee).div(10**decimals());
                    super._transfer(from, teamAddress, tokensToTeam);
                }

                if (liquidityBuyFee > 0) {
                    tokensToLiquidity = amount.mul(liquidityBuyFee).div(10**decimals());
                    super._transfer(from, address(this), tokensToLiquidity);
                }

                if (burnBuyFee > 0 && balanceOf(DEAD_ADDRESS) < totalSupply().div(2)) {
                    tokensToBurn = amount.mul(burnBuyFee).div(10**decimals());
                    super._transfer(from, DEAD_ADDRESS, tokensToBurn);
                }
            }

            finalAmount = amount.sub(tokensToTeam).sub(tokensToLiquidity).sub(tokensToBurn);
            super._transfer(from, to, finalAmount);
        }
    }

    event ExcludeFromFees(address indexed account, bool indexed value);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);
    event TeamAddressUpdated(address indexed ecoSystemAddress);
    event TeamFeeUpdated(uint256 indexed fee);
    event LiquidityAddressUpdated(address indexed liquidityAddress);
    event LiquidityFeeUpdated(uint256 indexed fee);
    event BurnFeeUpdated(uint256 indexed fee);
    event SwapAndLiquify(
        uint256 indexed tokensSwapped,
        uint256 indexed bnbReceived,
        uint256 indexed tokensIntoLiqudity
    );
}
