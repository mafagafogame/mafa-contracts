// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../NFTs/BaseERC1155.sol";

contract BrooderNft is BaseERC1155 {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;

    struct Brooder {
        uint64 breedTime;
    }

    mapping(uint256 => Brooder) public brooder;

    function initialize() public initializer {
        // TODO: change this uri to IPFS cloudflare gateway
        __BaseERC1155_init("");
    }

    /**
     * @dev creates a new brooder (or updates an existing one)
     * @param id ID of the brooder
     * @param breedTime time to breed an egg with this brooder
     */
    function createBrooder(uint256 id, uint64 breedTime) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        brooder[id] = Brooder(breedTime);

        emit BrooderCreated(id, breedTime);
    }

    /**
     * @dev returns the breed time of a brooder
     * @param id ID of the brooder
     */
    function getBrooder(uint256 id) external virtual returns (uint64) {
        return (brooder[id].breedTime);
    }

    // EVENTS
    event BrooderCreated(uint256 id, uint64 time);
}
