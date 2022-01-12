// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../NFTs/BaseERC1155.sol";

contract BrooderNft is BaseERC1155 {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;

    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    struct Brooder {
        uint256 breedTime;
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
    function createBrooder(uint256 id, uint256 breedTime) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        brooder[id] = Brooder(breedTime);

        emit BrooderCreated(id, breedTime);
    }

    /**
     * @dev returns the breed time of a brooder
     * @param id ID of the brooder
     */
    function getBrooder(uint256 id) external view virtual returns (uint256) {
        return (brooder[id].breedTime);
    }

    /**
     * @dev burns a brooder that have been used
     * @param from User who used the brooder
     * @param id ID of the brooder
     */
    function onUse(address from, uint256 id) external virtual onlyRole(BURNER_ROLE) {
        super._burn(from, id, 1);
    }

    // EVENTS
    event BrooderCreated(uint256 id, uint256 time);

    // this should be the latest space to allocate. do not add anything bellow this
    uint256[50] private __gap;
}
