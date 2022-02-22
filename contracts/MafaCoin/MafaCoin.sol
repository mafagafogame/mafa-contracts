// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

contract MafaCoin is ERC20, Ownable {
    using SafeMath for uint256;

    bool public tradingIsEnabled = false;

    IUniswapV2Router02 public dexRouter;
    address public dexPair;

    address public lpRecipient;

    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address public teamWallet;
    address public lotteryWallet;

    uint256 public liquidityFee = 0;
    uint256 public burnFee = 0;
    uint256 public teamBuyFee = 0;
    uint256 public teamSellFee = 0;
    uint256 public lotteryFee = 0;

    uint256 public totalBuyFee = 0;
    uint256 public totalSellFee = 0;

    uint256 public constant TOTAL_SUPPLY = 1000000000 * (10**18);

    mapping(address => bool) public isExcludedFromFees;
    mapping(address => bool) public automatedMarketMakerPairs;
    mapping(address => bool) public isBlacklisted;

    constructor() ERC20("MafaCoin", "MAFA") {
        excludeFromFees(address(this), true);
        excludeFromFees(owner(), true);

        _mint(owner(), TOTAL_SUPPLY);
    }

    function afterPreSale() external onlyOwner {
        setLiquidyFee(3);
        setBurnFee(1);
        setTeamBuyFee(1);
        setTeamSellFee(5);
        setLotteryFee(1);
        setLpRecipient(owner());

        tradingIsEnabled = true;
    }

    function setAutomatedMarketMakerPair(address pair, bool value) external onlyOwner {
        require(pair != dexPair, "cannot be removed");

        _setAutomatedMarketMakerPair(pair, value);
    }

    function _setAutomatedMarketMakerPair(address pair, bool value) private onlyOwner {
        automatedMarketMakerPairs[pair] = value;

        emit SetAutomatedMarketMakerPair(pair, value);
    }

    receive() external payable {}

    function excludeFromFees(address account, bool excluded) public onlyOwner {
        require(isExcludedFromFees[account] != excluded, "Already excluded");
        isExcludedFromFees[account] = excluded;

        emit ExcludeFromFees(account, excluded);
    }

    function blacklistAccount(address account, bool blacklisted) external onlyOwner {
        require(isBlacklisted[account] != blacklisted, "Already blacklisted");
        isBlacklisted[account] = blacklisted;

        emit AccountBlacklisted(account, blacklisted);
    }

    function setLpRecipient(address recipient) public onlyOwner {
        require(lpRecipient != recipient, "LP recipient already setted");
        lpRecipient = recipient;

        emit LpRecipientUpdated(recipient);
    }

    function setTeamWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "zero address is not allowed");

        excludeFromFees(_newWallet, true);
        teamWallet = _newWallet;

        emit TeamWalletUpdated(_newWallet);
    }

    function setLotteryWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "zero address is not allowed");
        excludeFromFees(_newWallet, true);
        lotteryWallet = _newWallet;

        emit LotteryWalletUpdated(_newWallet);
    }

    function setLiquidyFee(uint256 newFee) public onlyOwner {
        liquidityFee = newFee;
        _updateTotalBuyFee();
        _updateTotalSellFee();

        emit LiquidityFeeUpdated(newFee);
    }

    function setBurnFee(uint256 newFee) public onlyOwner {
        burnFee = newFee;
        _updateTotalBuyFee();
        _updateTotalSellFee();

        emit BurnFeeUpdated(newFee);
    }

    function setTeamBuyFee(uint256 newFee) public onlyOwner {
        teamBuyFee = newFee;
        _updateTotalBuyFee();

        emit TeamBuyFeeUpdated(newFee);
    }

    function setTeamSellFee(uint256 newFee) public onlyOwner {
        teamSellFee = newFee;
        _updateTotalSellFee();

        emit TeamSellFeeUpdated(newFee);
    }

    function setLotteryFee(uint256 newFee) public onlyOwner {
        lotteryFee = newFee;
        _updateTotalSellFee();

        emit LotteryFeeUpdated(newFee);
    }

    function _updateTotalBuyFee() internal {
        totalBuyFee = liquidityFee.add(burnFee).add(teamBuyFee);
    }

    function _updateTotalSellFee() internal {
        totalSellFee = liquidityFee.add(burnFee).add(teamSellFee).add(lotteryFee);
    }

    function startLiquidity(address router) external onlyOwner {
        require(router != address(0), "zero address is not allowed");
        
        IUniswapV2Router02 _dexRouter = IUniswapV2Router02(router);

        address _dexPair = IUniswapV2Factory(_dexRouter.factory()).createPair(address(this), _dexRouter.WETH());

        dexRouter = _dexRouter;
        dexPair = _dexPair;

        _setAutomatedMarketMakerPair(_dexPair, true);

        emit LiquidityStarted(router, _dexPair);
    }

    function _swapAndLiquify(uint256 amount) private {
        uint256 half = amount.div(2);
        uint256 otherHalf = amount.sub(half);

        uint256 initialAmount = address(this).balance;

        _swapTokensForBNB(half);

        uint256 newAmount = address(this).balance.sub(initialAmount);

        _addLiquidity(otherHalf, newAmount);

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

    function _addLiquidity(uint256 tokenAmount, uint256 bnbAmount) private {
        _approve(address(this), address(dexRouter), tokenAmount);

        dexRouter.addLiquidityETH{ value: bnbAmount }(
            address(this),
            tokenAmount,
            0,
            0,
            lpRecipient,
            block.timestamp.add(300)
        );
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(amount > 0, "Transfer amount must be greater than zero");
        require(!isBlacklisted[from], "Address is blacklisted");
        require(tradingIsEnabled || (isExcludedFromFees[from] || isExcludedFromFees[to]), "Trading not started");

        bool excludedAccount = isExcludedFromFees[from] || isExcludedFromFees[to];

        if (excludedAccount) {
            uint256 burnedTokens = balanceOf(DEAD_ADDRESS);
            if (burnedTokens >= TOTAL_SUPPLY.div(2)) {
                setBurnFee(0);
                emit BurnFeeStopped(burnedTokens, burnFee);
            }

            super._transfer(from, to, amount);
        } else {
            if (burnFee > 0) {
                uint256 burnedTokens = balanceOf(DEAD_ADDRESS);
                if (burnedTokens >= TOTAL_SUPPLY.div(2)) {
                    setBurnFee(0);
                    emit BurnFeeStopped(burnedTokens, burnFee);
                }
                uint256 tokensToBurn = amount.mul(burnFee).div(100);
                super._transfer(from, DEAD_ADDRESS, tokensToBurn);
            }

            if (automatedMarketMakerPairs[to]) {
                if (teamSellFee > 0) {
                    uint256 tokensToTeam = amount.mul(teamSellFee).div(100);
                    super._transfer(from, teamWallet, tokensToTeam);
                }

                if (lotteryFee > 0) {
                    uint256 tokensToLottery = amount.mul(lotteryFee).div(100);
                    super._transfer(from, lotteryWallet, tokensToLottery);
                }
            } else {
                if (teamBuyFee > 0) {
                    uint256 tokensToTeam = amount.mul(teamBuyFee).div(100);
                    super._transfer(from, teamWallet, tokensToTeam);
                }
            }

            if (liquidityFee > 0) {
                uint256 tokensToLiquidity = amount.mul(liquidityFee).div(100);
                super._transfer(from, address(this), tokensToLiquidity);
                _swapAndLiquify(tokensToLiquidity);
            }

            uint256 taxedAmount;
            if (automatedMarketMakerPairs[to]) {
                taxedAmount = amount.sub(amount.mul(totalSellFee).div(100));
            } else {
                taxedAmount = amount.sub(amount.mul(totalBuyFee).div(100));
            }
            super._transfer(from, to, taxedAmount);
        }
    }

    event ExcludeFromFees(address indexed account, bool isExcluded);
    event AccountBlacklisted(address indexed account, bool isBlacklisted);
    event LpRecipientUpdated(address indexed lpRecipient);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);
    event SwapAndLiquify(uint256 tokensSwapped, uint256 bnbReceived, uint256 tokensIntoLiqudity);
    event BurnFeeStopped(uint256 burnedTokens, uint256 burnFee);
    event TeamWalletUpdated(address indexed newWallet);
    event LotteryWalletUpdated(address indexed newWallet);
    event LiquidityFeeUpdated(uint256 indexed newFee);
    event BurnFeeUpdated(uint256 indexed newFee);
    event TeamBuyFeeUpdated(uint256 indexed newFee);
    event TeamSellFeeUpdated(uint256 indexed newFee);
    event LotteryFeeUpdated(uint256 indexed newFee);
    event LiquidityStarted(address indexed routerAddress, address indexed pairAddress);
}
