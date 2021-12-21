// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "./LibRoyaltiesV2.sol";
import "./RoyaltiesV2.sol";

abstract contract RoyaltiesV2Upgradeable is ERC165Upgradeable, RoyaltiesV2 {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES || super.supportsInterface(interfaceId);
    }
}
