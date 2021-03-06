// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract BaseERC1155 is
    Initializable,
    ERC1155Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ERC1155BurnableUpgradeable,
    ERC1155SupplyUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    mapping(uint256 => string) private _uris;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function __BaseERC1155_init(string memory uri_) internal onlyInitializing {
        __ERC1155_init(uri_);
        __AccessControl_init();
        __Pausable_init();
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return (_uris[tokenId]);
    }

    function setTokenUri(uint256 tokenId, string memory _uri) external onlyRole(URI_SETTER_ROLE) {
        _uris[tokenId] = _uri;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        _mint(account, id, amount, data);
    }

    // todo: create a function that sends an airdrop of elements to a batch of users
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        _mintBatch(to, ids, amounts, data);
    }

    function multiMint(
        address[] memory addresses,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        require(addresses.length == ids.length, "addresses and ids arrays must be equal");
        require(addresses.length == amounts.length, "addresses and amounts arrays must be equal");
        require(addresses.length <= 500, "Can't mint to more than 500 addresses in one batch");

        for (uint16 i = 0; i < addresses.length; i++) {
            _mint(addresses[i], ids[i], amounts[i], data);
        }
    }

    function multiMintEqualId(
        address[] memory addresses,
        uint256 id,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        require(addresses.length == amounts.length, "addresses and amounts arrays must be equal");
        require(addresses.length <= 500, "Can't mint to more than 500 addresses in one batch");

        for (uint16 i = 0; i < addresses.length; i++) {
            _mint(addresses[i], id, amounts[i], data);
        }
    }

    function multiMintEqualAmount(
        address[] memory addresses,
        uint256[] memory ids,
        uint256 amount,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        require(addresses.length == ids.length, "addresses and ids arrays must be equal");
        require(addresses.length <= 500, "Can't mint to more than 500 addresses in one batch");

        for (uint16 i = 0; i < addresses.length; i++) {
            _mint(addresses[i], ids[i], amount, data);
        }
    }

    function multiMintEqualIdAndAmount(
        address[] memory addresses,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        require(addresses.length <= 500, "Can't mint to more than 500 addresses in one batch");

        for (uint16 i = 0; i < addresses.length; i++) {
            _mint(addresses[i], id, amount, data);
        }
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function version() external pure virtual returns (string memory) {
        return "1.0.0";
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // this should be the latest space to allocate. do not add anything bellow this
    uint256[50] private __gap;
}
