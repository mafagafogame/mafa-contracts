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
     * @dev Open a mystery box and mint a random mafagafo (from generation 0) to sender
     * @param id box type
     */
    function openBox(uint256 id) external virtual {
        require(balanceOf(_msgSender(), id) > 0, "You don't have any box to open");
        super._burn(_msgSender(), id, 1);

        uint256 randomNumber = _random();

        uint256 maxValue = 0;
        uint256 mafagafoType;
        for (uint256 i = 0; i < probabilities.length; i++) {
            maxValue = maxValue.add(probabilities[i]);
            if (randomNumber < maxValue) {
                mafagafoContract.mint(_msgSender(), mafagafoContract.mafaVersion(), bytes32(i), 0, 0, 0);
                mafagafoType = i;
                break;
            }
        }

        emit BoxOpened(id, _msgSender(), mafagafoType, _totalOpen.current());

        _totalOpen.increment();
    }

    /**
     * @dev requires that probabilities array sum equals 10000
     * @param _probabilities array of probabilities
     */
    function _requireProbabilitiesMatch(uint256[] memory _probabilities) internal pure virtual {
        uint256 sum = 0;

        for (uint256 i = 0; i < _probabilities.length; i++) {
            sum = sum.add(_probabilities[i]);
        }

        require(sum == 10000, "probabilities values sum must equal 10000");
    }

    /**
     * @dev generates a random number between 0 and 10000
     */
    function _random() internal view virtual returns (uint256 randomNumber) {
        return
            uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _msgSender(), _totalOpen.current())))
                .mod(10000);
    }

    // EVENTS
    event BoxOpened(uint256 boxID, address sender, uint256 mafagafoType, uint256 totalOpen);
}
