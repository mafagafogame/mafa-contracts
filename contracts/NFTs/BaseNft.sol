// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/presets/ERC721PresetMinterPauserAutoIdUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "./rarible/RoyaltiesV2Upgradeable.sol";
import "./rarible/RoyaltiesV2UpgradeableImpl.sol";
import "./mintable/LibMintable.sol";
//import "../DirectSale/NftCrowdSale.sol";

// Types: breeder, eggs, mafagafo, item, replay
// quebrar em mais contratos

// reference: https://medium.com/aisthisi/aisthisi-technical-deep-dive-part-2-5250b0d71ee

contract BaseNft is ERC721PresetMinterPauserAutoIdUpgradeable, RoyaltiesV2UpgradeableImpl {
    function initialize(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) public virtual initializer override(ERC721PresetMinterPauserAutoIdUpgradeable) {
        super.initialize(name, symbol, baseTokenURI);
    }

//    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
//    internal
//    whenNotPaused
//    override(ERC721, ERC721EnumerableUpgradeable)
//    {
//        super._beforeTokenTransfer(from, to, tokenId);
//    }

    // todo: stress test burn scenarios
//    // The following functions are overrides required by Solidity.
//    function burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
//        super.burn(tokenId);
//    }

//    function tokenURI(uint256 tokenId)
//    public
//    view
//    override(ERC721Upgradeable)
//    returns (string memory)
//    {
//        return super.tokenURI(tokenId);
//    }

    // todo: stress test this
    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721PresetMinterPauserAutoIdUpgradeable, RoyaltiesV2Upgradeable)
    returns (bool) {
        if(interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES) {
            return true;
        }
        if(interfaceId == LibMintable._INTERFACE_ID_ERC2981) {
            return true;
        }
        return super.supportsInterface(interfaceId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return super._baseURI();
    }

    // todo: probably it is unuseful
//    function pause() public onlyRole(PAUSER_ROLE) {
//        super.pause();
//    }
//    function unpause() public onlyRole(PAUSER_ROLE) {
//        super.unpause();
//    }

    function setRoyalties(uint _tokenId, address payable _royaltiesReceipientAddress, uint96 _percentageBasisPoints) public onlyRole(MINTER_ROLE) {
        LibPart.Part[] memory _royalties = new LibPart.Part[](1);
        _royalties[0].value = _percentageBasisPoints;
        _royalties[0].account = _royaltiesReceipientAddress;
        _saveRoyalties(_tokenId, _royalties);
    }

    // mintable
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        LibPart.Part[] memory _royalties = royalties[_tokenId];
        if(_royalties.length > 0) {
            return (_royalties[0].account, (_salePrice * _royalties[0].value)/10000);
        }
        return (address(0), 0);
    }

    // todo: probably not useful
//    function mint(address _to) public override(ERC721PresetMinterPauserAutoId) onlyRole(MINTER_ROLE) {
//        super.mint(_to);
//    }


    // todo: override
    // _saveRoyalties(uint256 id, LibPart.Part[] memory _royalties)
    // _updateAccount(uint256 _id, address _from, address _to)
}
