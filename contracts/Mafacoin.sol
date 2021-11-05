// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
//import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMap.sol";
//import "@openzeppelin/contracts-upgradeable/utils/math/SignedSafeMathUpgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";

interface IDEXFactory {
    function createPair(address tokenA, address tokenB)
        external
        returns (address pair);
}

interface IDEXRouter {
    function factory() external pure returns (address);

    function WETH() external pure returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        );

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    )
        external
        payable
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        );

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable;

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;
}

contract MafaCoin is ERC20, Ownable {
    using SafeMath for uint256;

    bool private swapping;
    bool public tradingIsEnabled = false;

    IDEXRouter public dexRouter;
    address dexPair;

    address deadAddress = 0x000000000000000000000000000000000000dEaD;

    address public teamWallet;
    address public lotteryWallet;

    uint256 public liquidityFee = 0;
    uint256 public burnFee = 0;
    uint256 public teamBuyFee = 0;
    uint256 public teamSellFee = 0;
    uint256 public lotteryFee = 0;

    uint256 public totalBuyFee = 0;
    uint256 public totalSellFee = 0;

    uint256 public tSupply = 1000000000 * (10**18);

    mapping(address => bool) public isExcludedFromFees;
    mapping(address => bool) public automatedMarketMakerPairs;
    mapping(address => bool) isBlacklisted;

    constructor() ERC20("MafaCoin", "MAFA") {
        excludeFromFees(address(this), true);
        excludeFromFees(owner(), true);

        _mint(owner(), tSupply);
    }

    function afterPreSale() external onlyOwner {
        setLiquidyFee(3);
        setBurnFee(1);
        setTeamBuyFee(1);
        setTeamSellFee(5);
        setLotteryFee(1);

        tradingIsEnabled = true;
    }

    function setAutomatedMarketMakerPair(address pair, bool value)
        public
        onlyOwner
    {
        require(pair != dexPair, "cannot be removed");

        _setAutomatedMarketMakerPair(pair, value);
    }

    function _setAutomatedMarketMakerPair(address pair, bool value)
        private
        onlyOwner
    {
        automatedMarketMakerPairs[pair] = value;

        emit SetAutomatedMarketMakerPair(pair, value);
    }

    receive() external payable {}

    function excludeFromFees(address account, bool excluded) public onlyOwner {
        require(isExcludedFromFees[account] != excluded, "Already excluded");
        isExcludedFromFees[account] = excluded;

        emit ExcludeFromFees(account, excluded);
    }

    function setTeamWallet(address _newWallet) external onlyOwner {
        excludeFromFees(_newWallet, true);
        teamWallet = _newWallet;
    }

    function setLotteryWallet(address _newWallet) external onlyOwner {
        excludeFromFees(_newWallet, true);
        lotteryWallet = _newWallet;
    }

    function setLiquidyFee(uint256 newFee) public onlyOwner {
        liquidityFee = newFee;
        _updateTotalBuyFee();
        _updateTotalSellFee();
    }

    function setBurnFee(uint256 newFee) public onlyOwner {
        burnFee = newFee;
        _updateTotalBuyFee();
        _updateTotalSellFee();
    }

    function setTeamBuyFee(uint256 newFee) public onlyOwner {
        teamBuyFee = newFee;
        _updateTotalBuyFee();
    }

    function setTeamSellFee(uint256 newFee) public onlyOwner {
        teamSellFee = newFee;
        _updateTotalSellFee();
    }

    function setLotteryFee(uint256 newFee) public onlyOwner {
        lotteryFee = newFee;
        _updateTotalSellFee();
    }

    function _updateTotalBuyFee() internal {
        totalBuyFee = liquidityFee.add(burnFee).add(teamBuyFee);
    }

    function _updateTotalSellFee() internal {
        totalSellFee = liquidityFee.add(burnFee).add(teamSellFee).add(
            lotteryFee
        );
    }

    function startLiquidity(address router) external onlyOwner {
        IDEXRouter _dexRouter = IDEXRouter(router);

        address _dexPair = IDEXFactory(_dexRouter.factory()).createPair(
            address(this),
            _dexRouter.WETH()
        );

        dexRouter = _dexRouter;
        dexPair = _dexPair;

        _setAutomatedMarketMakerPair(_dexPair, true);
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

//    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlUpgradeable, ERC721Upgradeable) returns (bool) {
//        return
//            interfaceId == type(IERC165Upgradeable).interfaceId ||
//            interfaceId == type(IERC721Upgradeable).interfaceId ||
//            interfaceId == type(IERC721MetadataUpgradeable).interfaceId ||
//            interfaceId == type(IAccessControlUpgradeable).interfaceId ||
//        super.supportsInterface(interfaceId);
//    }

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

        dexRouter.addLiquidityETH{value: bnbAmount}(
            address(this),
            tokenAmount,
            0,
            0,
            address(this),
            block.timestamp.add(300)
        );
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "zero address");
        require(to != address(0), "zero address");
        require(amount > 0, "Transfer amount must be greater than zero");
        require(!isBlacklisted[from], "Address is blacklisted");
        require(
            tradingIsEnabled ||
                (isExcludedFromFees[from] || isExcludedFromFees[to]),
            "Trading not started"
        );

        bool excludedAccount = isExcludedFromFees[from] ||
            isExcludedFromFees[to];

        if (!swapping) {
            swapping = true;

            if (excludedAccount) {
                uint256 burnedTokens = balanceOf(deadAddress);
                if (burnedTokens >= tSupply.div(2)) {
                    setBurnFee(0);
                    emit BurnFeeStopped(burnedTokens, burnFee);
                }

                super._transfer(from, to, amount);
            } else {
                if (burnFee > 0) {
                    uint256 burnedTokens = balanceOf(deadAddress);
                    if (burnedTokens >= tSupply.div(2)) {
                        setBurnFee(0);
                        emit BurnFeeStopped(burnedTokens, burnFee);
                    }
                    uint256 tokensToBurn = amount.mul(burnFee).div(100);
                    super._transfer(from, deadAddress, tokensToBurn);
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

            swapping = false;
        }
    }

    event ExcludeFromFees(address indexed account, bool isExcluded);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);
    event SwapAndLiquify(
        uint256 tokensSwapped,
        uint256 bnbReceived,
        uint256 tokensIntoLiqudity
    );
    event BurnFeeStopped(uint256 burnedTokens, uint256 burnFee);
}
