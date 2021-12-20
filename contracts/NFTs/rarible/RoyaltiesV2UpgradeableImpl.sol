// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./AbstractRoyalties.sol";
import "./RoyaltiesV2.sol";
import "./RoyaltiesV2Upgradeable.sol";

contract RoyaltiesV2UpgradeableImpl is AbstractRoyalties, RoyaltiesV2Upgradeable {
    function getRaribleV2Royalties(uint256 id) override external view returns (LibPart.Part[] memory) {
        return royalties[id];
    }

    function _onRoyaltiesSet(uint256 id, LibPart.Part[] memory _royalties) override internal {
        emit RoyaltiesSet(id, _royalties);
    }
}
