// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

import "./ERC721PresetMinterPauserAutoIdUpgradeable.sol";
import "./rarible/RoyaltiesV2Upgradeable.sol";
import "./rarible/RoyaltiesV2UpgradeableImpl.sol";
import "./mintable/LibMintable.sol";

contract BaseNft is
    ERC721PresetMinterPauserAutoIdUpgradeable,
    RoyaltiesV2UpgradeableImpl,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeMathUpgradeable for uint256;

    function __BaseNft_init(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) internal onlyInitializing {
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        __ERC721PresetMinterPauserAutoId_init(name, symbol, baseTokenURI);
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

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

    function setBaseURI(string memory _baseURI) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = _baseURI;
        emit UriBaseChanged(_baseURI);
    }

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
    ) external onlyRole(MINTER_ROLE) {
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

    function version() external pure virtual returns (string memory) {
        return "1.0.0";
    }

    event UriBaseChanged(string to);

    function listMyNftIds() public view virtual returns (uint256[] memory) {
        uint256 balance = balanceOf(_msgSender());
        uint256[] memory nfts = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) nfts[i] = (tokenOfOwnerByIndex(_msgSender(), i));
        return nfts;
    }

    function listMyNftIdsPaginated(uint256 offset, uint256 limit) public view virtual returns (uint256[] memory) {
        uint256 balance = balanceOf(_msgSender());
        uint256 initialIndex = limit.mul(offset);
        if (initialIndex > balance) {
            return new uint256[](0);
        }

        if (initialIndex.add(limit) > balance) {
            uint256 partialLimit = balance.sub(initialIndex);
            uint256[] memory nfts = new uint256[](partialLimit);
            for (uint256 i = 0; i < partialLimit; i++)
                nfts[i] = (tokenOfOwnerByIndex(_msgSender(), initialIndex.add(i)));
            return nfts;
        } else {
            uint256[] memory nfts = new uint256[](limit);
            for (uint256 i = 0; i < limit; i++) nfts[i] = (tokenOfOwnerByIndex(_msgSender(), initialIndex.add(i)));
            return nfts;
        }
    }

    function listNftsOwnedBy(address owner) public view virtual returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory nfts = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) nfts[i] = (tokenOfOwnerByIndex(owner, i));
        return nfts;
    }

    function listNftsOwnedByPaginated(
        address owner,
        uint256 offset,
        uint256 limit
    ) public view virtual returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256 initialIndex = limit.mul(offset);
        if (initialIndex > balance) {
            return new uint256[](0);
        }

        if (initialIndex.add(limit) > balance) {
            uint256 partialLimit = balance.sub(initialIndex);
            uint256[] memory nfts = new uint256[](partialLimit);
            for (uint256 i = 0; i < partialLimit; i++) nfts[i] = (tokenOfOwnerByIndex(owner, initialIndex.add(i)));
            return nfts;
        } else {
            uint256[] memory nfts = new uint256[](limit);
            for (uint256 i = 0; i < limit; i++) nfts[i] = (tokenOfOwnerByIndex(owner, initialIndex.add(i)));
            return nfts;
        }
    }

    uint256[50] private __gap;
}

contract BaseNftTestV2 is BaseNft {
    function version() external pure virtual override returns (string memory) {
        return "2.0.0";
    }
}
