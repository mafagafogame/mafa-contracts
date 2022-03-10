// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./MafagafoAvatarBase.sol";
import "./BaseNft.sol";
import "./EggNft.sol";

contract MafagafoAvatarNft is MafagafoAvatarBase {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    EggNft public eggContract;

    uint16 public mafaVersion;

    modifier onlyOwnerOf(uint256 parent1Id, uint256 parent2Id) {
        require(ownerOf(parent1Id) == _msgSender(), "Sender must be the owner of 1st parent");
        require(ownerOf(parent2Id) == _msgSender(), "Sender must be the owner of 2nd parent");
        _;
    }

    function initialize(address eggAddress) public initializer {
        require(eggAddress.isContract(), "NFT address must be a contract");
        eggContract = EggNft(eggAddress);

        // TODO: add address
        __BaseNft_init("Mafagafo Avatar", "GAFO", "");

        // mint just one. this one will be the father of all g0 generation
        super.mint(0x000000000000000000000000000000000000dEaD);
    }

    /**
     * @dev Update the egg contract
     * @param addr of the NFT
     */
    function setEggAddress(address addr) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(addr.isContract(), "Egg NFT address must be a contract");
        eggContract = EggNft(addr);

        emit EggAddressChanged(addr);
    }

    /**
     * @dev Update the version of mafagafos
     * @param newVersion new version to be set
     */
    function setMafaVersion(uint16 newVersion) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        mafaVersion = newVersion;

        emit MafaVersionChanged(newVersion);
    }

    /**
     * @dev Mint a new mafagafo
     * @param _to user that will receive the new mafagafo
     * @param _version mafagafo version
     * @param _genes genes passed from parents
     * @param _generation generation of the mafagafo
     * @param _parent1Id NFT id of the 1st parent
     * @param _parent2Id NFT id of the 2nd parent
     * @param _flags custom flags
     */
    function mint(
        address _to,
        uint16 _version,
        bytes32 _genes,
        uint32 _generation,
        uint256 _parent1Id,
        uint256 _parent2Id,
        uint32 _flags
    ) public virtual onlyRole(MINTER_ROLE) {
        _createMafagafo(_to, _tokenIdTracker.current(), _version, _genes, _generation, _parent1Id, _parent2Id, _flags);

        super.mint(_to);
    }

    /**
     * @dev Mint multiple mafagafos
     * @param _to user that will receive the new mafagafo
     * @param _version mafagafo version
     * @param _genes genes passed from parents
     * @param _generation generation of the mafagafo
     * @param _parent1Id NFT id of the 1st parent
     * @param _parent2Id NFT id of the 2nd parent
     * @param _flags custom flags
     * @param amount amount of mafagafos to be minted
     */
    function multiMint(
        address _to,
        uint16 _version,
        bytes32 _genes,
        uint32 _generation,
        uint256 _parent1Id,
        uint256 _parent2Id,
        uint32 _flags,
        uint256 amount
    ) public virtual onlyRole(MINTER_ROLE) {
        require(amount <= 150, "You can mint at most 150 mafagafos at a time");

        for (uint256 i = 0; i < amount; i++) {
            mint(_to, _version, _genes, _generation, _parent1Id, _parent2Id, _flags);
        }
    }

    /**
     * @dev Mate two mafagafos to generate an egg
     *  caller must be the owner of the two mafagafos
     * @param parent1Id NFT id of the 1st parent
     * @param parent2Id NFT id of the 2nd parent
     */
    function mate(uint256 parent1Id, uint256 parent2Id) public virtual onlyOwnerOf(parent1Id, parent2Id) {
        require(parent1Id != parent2Id, "You must use different mafagafos to mate");

        Mafagafo storage parent1 = mafagafo[parent1Id];
        Mafagafo storage parent2 = mafagafo[parent2Id];

        require(parent1.generation != 1, "1st parent cannot mate");
        require(parent1.generation != 1, "2nd parent cannot mate");
        require(parent1.matings < 1, "1st parent has already mated");
        require(parent2.matings < 1, "2nd parent has already mated");

        parent1.matings = parent1.matings.add(1);
        parent2.matings = parent2.matings.add(1);

        bytes32 childGenes = mixGenes(parent1.genes, parent2.genes);
        uint32 generation = uint32(MathUpgradeable.max(parent1.generation, parent2.generation) + 1);

        emit Mate(_msgSender(), parent1Id, parent2Id, mafaVersion, childGenes, generation);

        eggContract.mint(_msgSender(), mafaVersion, childGenes, generation, parent1Id, parent2Id);
    }

    /**
     * @dev Mate N mafagafos to generate N/2 eggs
     *  caller must be the owner of all mafagafos
     * @param parentIds Array of all mafagafos to mate. Must be even and mafagafos are mated on ascending order
     */
    function mate(uint256[] memory parentIds) external virtual {
        require(parentIds.length > 0, "No mafagafos to mate");
        require(parentIds.length <= 150, "You can only mate at most 150 mafagafos at a time");
        require(parentIds.length.mod(2) == 0, "You must mate an even number of mafagafos");

        for (uint256 i = 0; i < parentIds.length; i = i.add(2)) {
            mate(parentIds[i], parentIds[i + 1]);
        }
    }

    // TODO: genetic mix logic
    function mixGenes(bytes32 _genes1, bytes32 _genes2) internal virtual returns (bytes32) {
        uint256 randomNumber = _random();

        if (randomNumber == 0) {
            return _genes1;
        } else if (randomNumber == 1) {
            return _genes2;
        } else {
            return _genes1;
        }
    }

    /**
     * @dev Draw a random number
     */
    function _random() internal view virtual returns (uint256 randomNumber) {
        return uint256(keccak256(abi.encodePacked(block.difficulty, _msgSender(), _tokenIdTracker.current()))).mod(1);
    }

    // EVENTS
    event Mate(
        address to,
        uint256 parent1Id,
        uint256 parent2Id,
        uint16 eggVersion,
        bytes32 eggGenes,
        uint32 eggGeneration
    );
    event EggAddressChanged(address indexed addr);
    event MafaVersionChanged(uint16 newVersion);

    // this should be the latest space to allocate. do not add anything bellow this
    uint256[50] private __gap;
}
