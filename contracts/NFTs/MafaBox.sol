// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./BaseERC1155.sol";
import "./MafagafoAvatarNft.sol";

contract MafaBox is BaseERC1155 {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _totalOpen;
    uint256[] public probabilities;

    MafagafoAvatarNft public mafagafoContract;

    /**
     * @param _mafagafo MafagafoAvatarNft address
     * @param _probabilities array of probabilities for each mafagafo
     */
    function initialize(address _mafagafo, uint256[] memory _probabilities) public initializer {
        require(_mafagafo.isContract(), "NFT address must be a contract");
        _requireProbabilitiesMatch(_probabilities);

        mafagafoContract = MafagafoAvatarNft(_mafagafo);
        probabilities = _probabilities;

        // TODO migrate to cloudflare
        __BaseERC1155_init("");
    }

    /**
     * @dev Update the mafagafo contract
     * @param addr of the NFT
     */
    function setMafagafoAddress(address addr) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(addr.isContract(), "Mafagafo NFT address must be a contract");
        mafagafoContract = MafagafoAvatarNft(addr);

        emit MafagafoAddressChanged(addr);
    }

    /**
     * @dev Update the array of probabilities
     * @param newProbabilities new probabilities array
     */
    function setProbabilities(uint256[] memory newProbabilities) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _requireProbabilitiesMatch(newProbabilities);
        probabilities = newProbabilities;

        emit ProbabilitiesChanged(newProbabilities);
    }

    /**
     * @dev Open an amount mystery box and mint a random mafagafo (from generation 0) to sender
     * @param id box type
     * @param amount Amount of boxes to open
     */
    function openBox(uint256 id, uint256 amount) external virtual {
        require(amount > 0, "You must open at least 1 box");
        require(amount <= 150, "You can only open at most 150 box at a time");
        require(balanceOf(_msgSender(), id) > 0, "You don't have any box to open");
        super._burn(_msgSender(), id, amount);

        uint256[] memory mafagafoTypes = new uint256[](amount);
        for (uint256 i = 0; i < amount; i++) {
            uint256 randomNumber = _random();

            uint256 mafagafoType = 0;
            uint256 maxValue = 0;
            for (uint256 j = 0; j < probabilities.length; j++) {
                maxValue = maxValue.add(probabilities[j]);
                if (randomNumber < maxValue) {
                    mafagafoContract.mint(_msgSender(), mafagafoContract.mafaVersion(), bytes32(j), 0, 0, 0);
                    mafagafoType = j;
                    mafagafoTypes[i] = mafagafoType;
                    break;
                }
            }

            _totalOpen.increment();
        }

        emit BoxOpened(id, _msgSender(), mafagafoTypes);
    }

    /**
     * @dev requires that probabilities array sum equals 10**18
     * @param _probabilities array of probabilities
     */
    function _requireProbabilitiesMatch(uint256[] memory _probabilities) internal pure virtual {
        uint256 sum = 0;

        for (uint256 i = 0; i < _probabilities.length; i++) {
            sum = sum.add(_probabilities[i]);
        }

        require(sum == 10**18, "probabilities values sum must equal 10**18");
    }

    /**
     * @dev generates a random number between 0 and 10000
     */
    function _random() internal view virtual returns (uint256 randomNumber) {
        return
            uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _msgSender(), _totalOpen.current())))
                .mod(10**18);
    }

    // EVENTS
    event BoxOpened(uint256 boxID, address sender, uint256[] mafagafoTypes);
    event MafagafoAddressChanged(address indexed addr);
    event ProbabilitiesChanged(uint256[] newProbabilities);

    // this should be the latest space to allocate. do not add anything bellow this
    uint256[50] private __gap;
}
