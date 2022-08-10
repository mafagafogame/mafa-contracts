// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

import "./Mafagafo.sol";

contract Minter is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    bytes32 public merkleRoot1;

    address public firstReceiver;
    address public secondReceiver;
    uint256 public firstOptionAmount;
    uint256 public secondOptionAmount;
    uint256 public thirdOptionAmount;

    bool public isFirstOptionOn;
    bool public isSecondOptionOn;
    bool public isThirdOptionOn;

    Mafagafo public mafagafo;

    mapping(address => uint256) public totalClaimed;
    mapping(address => uint256) public totalClaimed2;

    uint256 totalMintedPhase2;

    error AlreadyClaimed(address account);
    error InvalidProof();
    error PriceMismatch(uint256 value, uint256 price);
    error QuantityError(uint256 quantity);
    error TransferError();
    error InvalidOption();
    error SoldOut();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        bytes32 _merkleRoot1,
        address _mafagafo,
        address _firstReceiver,
        address _secondReceiver,
        uint256 _firstOptionAmount,
        uint256 _secondOptionAmount,
        uint256 _thirdOptionAmount
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();

        merkleRoot1 = _merkleRoot1;

        firstReceiver = _firstReceiver;
        secondReceiver = _secondReceiver;
        firstOptionAmount = _firstOptionAmount;
        secondOptionAmount = _secondOptionAmount;
        thirdOptionAmount = _thirdOptionAmount;

        totalMintedPhase2 = 0;

        isFirstOptionOn = true;
        isSecondOptionOn = true;
        isThirdOptionOn = true;

        mafagafo = Mafagafo(_mafagafo);
    }

    function setMerkleRoot1(bytes32 _merkleRoot1) external onlyOwner {
        merkleRoot1 = _merkleRoot1;
    }

    function setFirstReceiver(address _firstReceiver) external onlyOwner {
        firstReceiver = _firstReceiver;
    }

    function setSecondReceiver(address _secondReceiver) external onlyOwner {
        secondReceiver = _secondReceiver;
    }

    function setFirstOptionAmount(uint256 _firstOptionAmount) external onlyOwner {
        firstOptionAmount = _firstOptionAmount;
    }

    function setSecondOptionAmount(uint256 _secondOptionAmount) external onlyOwner {
        secondOptionAmount = _secondOptionAmount;
    }

    function setThirdOptionAmount(uint256 _thirdOptionAmount) external onlyOwner {
        thirdOptionAmount = _thirdOptionAmount;
    }

    function setFirstOption(bool _flag) external onlyOwner {
        isFirstOptionOn = _flag;
    }

    function setSecondOption(bool _flag) external onlyOwner {
        isSecondOptionOn = _flag;
    }

    function setThirdOption(bool _flag) external onlyOwner {
        isThirdOptionOn = _flag;
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

    function claim2(address account, uint256 quantity) external payable {
        if (!(quantity == 1 || quantity == 3 || quantity == 5)) revert QuantityError(quantity);
        if (totalClaimed2[account] > 0) revert AlreadyClaimed(account);
        if (quantity + totalMintedPhase2 > 411) revert SoldOut();

        totalClaimed2[account] += quantity;
        totalMintedPhase2 += quantity;

        uint256 firstAmount;
        uint256 secondAmount;
        uint256 _firstOptionAmount = firstOptionAmount;
        uint256 _secondOptionAmount = secondOptionAmount;
        uint256 _thirdOptionAmount = thirdOptionAmount;
        if (quantity == 1) {
            if (!isFirstOptionOn) revert InvalidOption();
            if (msg.value != _firstOptionAmount) revert PriceMismatch(msg.value, _firstOptionAmount);

            firstAmount = (_firstOptionAmount * 70) / 100;
            secondAmount = (_firstOptionAmount * 30) / 100;
        } else if (quantity == 3) {
            if (!isSecondOptionOn) revert InvalidOption();
            if (msg.value != _secondOptionAmount) revert PriceMismatch(msg.value, _secondOptionAmount);

            firstAmount = (_secondOptionAmount * 70) / 100;
            secondAmount = (_secondOptionAmount * 30) / 100;
        } else if (quantity == 5) {
            if (!isThirdOptionOn) revert InvalidOption();
            if (msg.value != _thirdOptionAmount) revert PriceMismatch(msg.value, _thirdOptionAmount);

            firstAmount = (_thirdOptionAmount * 70) / 100;
            secondAmount = (_thirdOptionAmount * 30) / 100;
        }

        (bool firstSent, ) = firstReceiver.call{ value: firstAmount }("");
        if (!firstSent) revert TransferError();

        (bool secondSent, ) = secondReceiver.call{ value: secondAmount }("");
        if (!secondSent) revert TransferError();

        mafagafo.safeMint(account, quantity);

        emit Claimed(account, quantity);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    event Claimed(address indexed account, uint256 indexed quantity);
}
