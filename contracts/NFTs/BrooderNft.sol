// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../NFTs/BaseERC1155.sol";

contract BrooderNft is BaseERC1155 {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;

    struct Brooder {
        uint64 time;
    }

    mapping(uint256 => Brooder) public brooder;

    function initialize() public initializer {
        __BaseERC1155_init("");
    }

    function createBrooder(uint256 id, uint64 time) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        brooder[id] = Brooder(time);

        emit BrooderCreated(id, time);
    }

    function getBrooder(uint256 id) external virtual returns (uint64) {
        return (brooder[id].time);
    }

    // EVENTS
    event BrooderCreated(uint256 id, uint64 time);
}
