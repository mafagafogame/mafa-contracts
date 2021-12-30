// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./BaseNft.sol";

// Types: breeder, eggs, mafagafo, item, replay
// quebrar em mais contratos

contract MafagafoNft is BaseNft {
    function initialize() public initializer {
        super.initialize("MafagafoNft", "MAFA", "");
    }

    function mint(address to, uint256 mafagafoID) public virtual onlyRole(MINTER_ROLE) {
        super.mint(to);
    }
}
