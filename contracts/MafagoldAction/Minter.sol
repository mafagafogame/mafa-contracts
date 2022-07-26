// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

import "./Mafagafo.sol";

contract Minter is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    bytes32 public merkleRoot1;
    bytes32 public merkleRoot2;

    address public firstReceiver;
    address public secondReceiver;
    uint256 public firstAmount;
    uint256 public secondAmount;

    Mafagafo public mafagafo;

    mapping(address => uint256) public totalClaimed;
    mapping(address => uint256) public totalClaimed2;

    error AlreadyClaimed(address account);
    error InvalidProof();
    error PriceMismatch(uint256 value, uint256 price);
    error QuantityError(uint256 quantity);
    error TransferError();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        bytes32 _merkleRoot1,
        bytes32 _merkleRoot2,
        address _mafagafo,
        address _firstReceiver,
        address _secondReceiver,
        uint256 _firstAmount,
        uint256 _secondAmount
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();

        merkleRoot1 = _merkleRoot1;
        merkleRoot2 = _merkleRoot2;

        firstReceiver = _firstReceiver;
        secondReceiver = _secondReceiver;
        firstAmount = _firstAmount;
        secondAmount = _secondAmount;

        mafagafo = Mafagafo(_mafagafo);
    }

    function setMerkleRoot1(bytes32 _merkleRoot1) external onlyOwner {
        merkleRoot1 = _merkleRoot1;
    }

    function setMerkleRoot2(bytes32 _merkleRoot2) external onlyOwner {
        merkleRoot2 = _merkleRoot2;
    }

    function setFirstReceiver(address _firstReceiver) external onlyOwner {
        firstReceiver = _firstReceiver;
    }

    function setSecondReceiver(address _secondReceiver) external onlyOwner {
        secondReceiver = _secondReceiver;
    }

    function setFirstAmount(uint256 _firstAmount) external onlyOwner {
        firstAmount = _firstAmount;
    }

    function setSecondAmount(uint256 _secondAmount) external onlyOwner {
        secondAmount = _secondAmount;
    }

    function claim1(
        address account,
        uint256 quantity,
        uint256 totalQuantity,
        bytes32[] calldata merkleProof
    ) external {
        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(account, totalQuantity));

        if (!MerkleProofUpgradeable.verify(merkleProof, merkleRoot1, node)) revert InvalidProof();
        if (totalClaimed[account] + quantity > totalQuantity) revert AlreadyClaimed(account);

        totalClaimed[account] += quantity;

        mafagafo.safeMint(account, quantity);

        emit Claimed(account, quantity);
    }

    function claim2(
        address account,
        uint256 quantity,
        bytes32[] calldata merkleProof
    ) external payable {
        if (quantity > 3 || quantity == 0) revert QuantityError(quantity);
        if (totalClaimed2[account] + quantity > 3) revert AlreadyClaimed(account);
        uint256 _firstAmount = firstAmount * quantity;
        uint256 _secondAmount = secondAmount * quantity;
        if (msg.value != _firstAmount + _secondAmount) revert PriceMismatch(msg.value, _firstAmount + _secondAmount);

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(account));

        if (!MerkleProofUpgradeable.verify(merkleProof, merkleRoot2, node)) revert InvalidProof();

        totalClaimed2[account] += quantity;

        (bool firstSent, ) = firstReceiver.call{ value: _firstAmount }("");
        if (!firstSent) revert TransferError();

        (bool secondSent, ) = secondReceiver.call{ value: _secondAmount }("");
        if (!secondSent) revert TransferError();

        mafagafo.safeMint(account, quantity);

        emit Claimed(account, quantity);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    event Claimed(address indexed account, uint256 indexed quantity);
}
