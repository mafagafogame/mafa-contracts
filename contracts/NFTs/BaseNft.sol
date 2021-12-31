// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./ERC721PresetMinterPauserAutoIdUpgradeable.sol";
import "./rarible/RoyaltiesV2Upgradeable.sol";
import "./rarible/RoyaltiesV2UpgradeableImpl.sol";
import "./mintable/LibMintable.sol";

// Types: breeder, eggs, mafagafo, item, replay
// quebrar em mais contratos

// reference: https://medium.com/aisthisi/aisthisi-technical-deep-dive-part-2-5250b0d71ee
contract BaseNft is
    ERC721PresetMinterPauserAutoIdUpgradeable,
    RoyaltiesV2UpgradeableImpl,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    function initialize(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) public virtual override(ERC721PresetMinterPauserAutoIdUpgradeable) initializer {
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        super.initialize(name, symbol, baseTokenURI);
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

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
        returns (bool)
    {
        return
            interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES ||
            interfaceId == LibMintable._INTERFACE_ID_ERC2981 ||
            super.supportsInterface(interfaceId);
    }

    //    function _baseURI
    //    () internal view virtual override returns (string memory) {
    //        return super._baseURI();
    //    }

    function baseURI() external view returns (string memory) {
        return super._baseURI();
    }

    // todo: probably it is unuseful
    //    function pause() public onlyRole(PAUSER_ROLE) {
    //        super.pause();
    //    }
    //    function unpause() public onlyRole(PAUSER_ROLE) {
    //        super.unpause();
    //    }

    function setRoyalties(
        uint256 _tokenId,
        address payable _royaltiesReceipientAddress,
        uint96 _percentageBasisPoints
    ) public onlyRole(MINTER_ROLE) {
        LibPart.Part[] memory _royalties = new LibPart.Part[](1);
        _royalties[0].value = _percentageBasisPoints;
        _royalties[0].account = _royaltiesReceipientAddress;
        _saveRoyalties(_tokenId, _royalties);
    }

    // mintable
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        LibPart.Part[] memory _royalties = royalties[_tokenId];
        if (_royalties.length > 0) {
            return (_royalties[0].account, (_salePrice * _royalties[0].value) / 10000);
        }
        return (address(0), 0);
    }

    // todo: probably not useful
    //    function mint(address _to) public override(ERC721PresetMinterPauserAutoId) onlyRole(MINTER_ROLE) {
    //        super.mint(_to);
    //    }

    // todo: override and expose
    // _saveRoyalties(uint256 id, LibPart.Part[] memory _royalties)
    // _updateAccount(uint256 _id, address _from, address _to)

    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    uint256[50] private __gap;
}

contract BaseNftTestV2 is BaseNft {
    function version() public pure virtual override returns (string memory) {
        return "2.0.0";
    }
}
