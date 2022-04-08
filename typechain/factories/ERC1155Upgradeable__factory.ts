/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  ERC1155Upgradeable,
  ERC1155UpgradeableInterface,
} from "../ERC1155Upgradeable";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
    ],
    name: "TransferBatch",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "TransferSingle",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "value",
        type: "string",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "URI",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
    ],
    name: "balanceOfBatch",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeBatchTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "uri",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506114e0806100206000396000f3fe608060405234801561001057600080fd5b50600436106100875760003560e01c80634e1273f41161005b5780634e1273f41461010a578063a22cb4651461012a578063e985e9c51461013d578063f242432a1461017957600080fd5b8062fdd58e1461008c57806301ffc9a7146100b25780630e89341c146100d55780632eb2c2d6146100f5575b600080fd5b61009f61009a366004610de4565b61018c565b6040519081526020015b60405180910390f35b6100c56100c0366004610e27565b610237565b60405190151581526020016100a9565b6100e86100e3366004610e4b565b610289565b6040516100a99190610eb1565b610108610103366004611010565b61031d565b005b61011d6101183660046110ba565b6103bf565b6040516100a991906111c0565b6101086101383660046111d3565b6104fd565b6100c561014b36600461120f565b6001600160a01b03918216600090815260666020908152604080832093909416825291909152205460ff1690565b610108610187366004611242565b61050c565b60006001600160a01b03831661020f5760405162461bcd60e51b815260206004820152602b60248201527f455243313135353a2062616c616e636520717565727920666f7220746865207a60448201527f65726f206164647265737300000000000000000000000000000000000000000060648201526084015b60405180910390fd5b5060009081526065602090815260408083206001600160a01b03949094168352929052205490565b60006001600160e01b03198216636cdb3d1360e11b148061026857506001600160e01b031982166303a24d0760e21b145b8061028357506301ffc9a760e01b6001600160e01b03198316145b92915050565b606060678054610298906112a7565b80601f01602080910402602001604051908101604052809291908181526020018280546102c4906112a7565b80156103115780601f106102e657610100808354040283529160200191610311565b820191906000526020600020905b8154815290600101906020018083116102f457829003601f168201915b50505050509050919050565b6001600160a01b0385163314806103395750610339853361014b565b6103ab5760405162461bcd60e51b815260206004820152603260248201527f455243313135353a207472616e736665722063616c6c6572206973206e6f742060448201527f6f776e6572206e6f7220617070726f76656400000000000000000000000000006064820152608401610206565b6103b885858585856105a7565b5050505050565b606081518351146104385760405162461bcd60e51b815260206004820152602960248201527f455243313135353a206163636f756e747320616e6420696473206c656e67746860448201527f206d69736d6174636800000000000000000000000000000000000000000000006064820152608401610206565b6000835167ffffffffffffffff81111561045457610454610ec4565b60405190808252806020026020018201604052801561047d578160200160208202803683370190505b50905060005b84518110156104f5576104c88582815181106104a1576104a16112e2565b60200260200101518583815181106104bb576104bb6112e2565b602002602001015161018c565b8282815181106104da576104da6112e2565b60209081029190910101526104ee8161130e565b9050610483565b509392505050565b61050833838361081d565b5050565b6001600160a01b0385163314806105285750610528853361014b565b61059a5760405162461bcd60e51b815260206004820152602960248201527f455243313135353a2063616c6c6572206973206e6f74206f776e6572206e6f7260448201527f20617070726f76656400000000000000000000000000000000000000000000006064820152608401610206565b6103b88585858585610912565b815183511461061e5760405162461bcd60e51b815260206004820152602860248201527f455243313135353a2069647320616e6420616d6f756e7473206c656e6774682060448201527f6d69736d617463680000000000000000000000000000000000000000000000006064820152608401610206565b6001600160a01b0384166106825760405162461bcd60e51b815260206004820152602560248201527f455243313135353a207472616e7366657220746f20746865207a65726f206164604482015264647265737360d81b6064820152608401610206565b3360005b84518110156107af5760008582815181106106a3576106a36112e2565b6020026020010151905060008583815181106106c1576106c16112e2565b60209081029190910181015160008481526065835260408082206001600160a01b038e1683529093529190912054909150818110156107555760405162461bcd60e51b815260206004820152602a60248201527f455243313135353a20696e73756666696369656e742062616c616e636520666f60448201526939103a3930b739b332b960b11b6064820152608401610206565b60008381526065602090815260408083206001600160a01b038e8116855292528083208585039055908b16825281208054849290610794908490611329565b92505081905550505050806107a89061130e565b9050610686565b50846001600160a01b0316866001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb87876040516107ff929190611341565b60405180910390a4610815818787878787610abd565b505050505050565b816001600160a01b0316836001600160a01b031614156108a55760405162461bcd60e51b815260206004820152602960248201527f455243313135353a2073657474696e6720617070726f76616c2073746174757360448201527f20666f722073656c6600000000000000000000000000000000000000000000006064820152608401610206565b6001600160a01b03838116600081815260666020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b6001600160a01b0384166109765760405162461bcd60e51b815260206004820152602560248201527f455243313135353a207472616e7366657220746f20746865207a65726f206164604482015264647265737360d81b6064820152608401610206565b3361098f81878761098688610c72565b6103b888610c72565b60008481526065602090815260408083206001600160a01b038a16845290915290205483811015610a155760405162461bcd60e51b815260206004820152602a60248201527f455243313135353a20696e73756666696369656e742062616c616e636520666f60448201526939103a3930b739b332b960b11b6064820152608401610206565b60008581526065602090815260408083206001600160a01b038b8116855292528083208785039055908816825281208054869290610a54908490611329565b909155505060408051868152602081018690526001600160a01b03808916928a821692918616917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a4610ab4828888888888610cbd565b50505050505050565b6001600160a01b0384163b156108155760405163bc197c8160e01b81526001600160a01b0385169063bc197c8190610b01908990899088908890889060040161136f565b602060405180830381600087803b158015610b1b57600080fd5b505af1925050508015610b4b575060408051601f3d908101601f19168201909252610b48918101906113cd565b60015b610c0157610b576113ea565b806308c379a01415610b915750610b6c611406565b80610b775750610b93565b8060405162461bcd60e51b81526004016102069190610eb1565b505b60405162461bcd60e51b815260206004820152603460248201527f455243313135353a207472616e7366657220746f206e6f6e204552433131353560448201527f526563656976657220696d706c656d656e7465720000000000000000000000006064820152608401610206565b6001600160e01b0319811663bc197c8160e01b14610ab45760405162461bcd60e51b815260206004820152602860248201527f455243313135353a204552433131353552656365697665722072656a656374656044820152676420746f6b656e7360c01b6064820152608401610206565b60408051600180825281830190925260609160009190602080830190803683370190505090508281600081518110610cac57610cac6112e2565b602090810291909101015292915050565b6001600160a01b0384163b156108155760405163f23a6e6160e01b81526001600160a01b0385169063f23a6e6190610d019089908990889088908890600401611490565b602060405180830381600087803b158015610d1b57600080fd5b505af1925050508015610d4b575060408051601f3d908101601f19168201909252610d48918101906113cd565b60015b610d5757610b576113ea565b6001600160e01b0319811663f23a6e6160e01b14610ab45760405162461bcd60e51b815260206004820152602860248201527f455243313135353a204552433131353552656365697665722072656a656374656044820152676420746f6b656e7360c01b6064820152608401610206565b80356001600160a01b0381168114610ddf57600080fd5b919050565b60008060408385031215610df757600080fd5b610e0083610dc8565b946020939093013593505050565b6001600160e01b031981168114610e2457600080fd5b50565b600060208284031215610e3957600080fd5b8135610e4481610e0e565b9392505050565b600060208284031215610e5d57600080fd5b5035919050565b6000815180845260005b81811015610e8a57602081850181015186830182015201610e6e565b81811115610e9c576000602083870101525b50601f01601f19169290920160200192915050565b602081526000610e446020830184610e64565b634e487b7160e01b600052604160045260246000fd5b601f8201601f1916810167ffffffffffffffff81118282101715610f0057610f00610ec4565b6040525050565b600067ffffffffffffffff821115610f2157610f21610ec4565b5060051b60200190565b600082601f830112610f3c57600080fd5b81356020610f4982610f07565b604051610f568282610eda565b83815260059390931b8501820192828101915086841115610f7657600080fd5b8286015b84811015610f915780358352918301918301610f7a565b509695505050505050565b600082601f830112610fad57600080fd5b813567ffffffffffffffff811115610fc757610fc7610ec4565b604051610fde601f8301601f191660200182610eda565b818152846020838601011115610ff357600080fd5b816020850160208301376000918101602001919091529392505050565b600080600080600060a0868803121561102857600080fd5b61103186610dc8565b945061103f60208701610dc8565b9350604086013567ffffffffffffffff8082111561105c57600080fd5b61106889838a01610f2b565b9450606088013591508082111561107e57600080fd5b61108a89838a01610f2b565b935060808801359150808211156110a057600080fd5b506110ad88828901610f9c565b9150509295509295909350565b600080604083850312156110cd57600080fd5b823567ffffffffffffffff808211156110e557600080fd5b818501915085601f8301126110f957600080fd5b8135602061110682610f07565b6040516111138282610eda565b83815260059390931b850182019282810191508984111561113357600080fd5b948201945b838610156111585761114986610dc8565b82529482019490820190611138565b9650508601359250508082111561116e57600080fd5b5061117b85828601610f2b565b9150509250929050565b600081518084526020808501945080840160005b838110156111b557815187529582019590820190600101611199565b509495945050505050565b602081526000610e446020830184611185565b600080604083850312156111e657600080fd5b6111ef83610dc8565b91506020830135801515811461120457600080fd5b809150509250929050565b6000806040838503121561122257600080fd5b61122b83610dc8565b915061123960208401610dc8565b90509250929050565b600080600080600060a0868803121561125a57600080fd5b61126386610dc8565b945061127160208701610dc8565b93506040860135925060608601359150608086013567ffffffffffffffff81111561129b57600080fd5b6110ad88828901610f9c565b600181811c908216806112bb57607f821691505b602082108114156112dc57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b6000600019821415611322576113226112f8565b5060010190565b6000821982111561133c5761133c6112f8565b500190565b6040815260006113546040830185611185565b82810360208401526113668185611185565b95945050505050565b60006001600160a01b03808816835280871660208401525060a0604083015261139b60a0830186611185565b82810360608401526113ad8186611185565b905082810360808401526113c18185610e64565b98975050505050505050565b6000602082840312156113df57600080fd5b8151610e4481610e0e565b600060033d11156114035760046000803e5060005160e01c5b90565b600060443d10156114145790565b6040516003193d81016004833e81513d67ffffffffffffffff816024840111818411171561144457505050505090565b828501915081518181111561145c5750505050505090565b843d87010160208285010111156114765750505050505090565b61148560208286010187610eda565b509095945050505050565b60006001600160a01b03808816835280871660208401525084604083015283606083015260a060808301526114c860a0830184610e64565b97965050505050505056fea164736f6c6343000809000a";

type ERC1155UpgradeableConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ERC1155UpgradeableConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ERC1155Upgradeable__factory extends ContractFactory {
  constructor(...args: ERC1155UpgradeableConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ERC1155Upgradeable> {
    return super.deploy(overrides || {}) as Promise<ERC1155Upgradeable>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ERC1155Upgradeable {
    return super.attach(address) as ERC1155Upgradeable;
  }
  connect(signer: Signer): ERC1155Upgradeable__factory {
    return super.connect(signer) as ERC1155Upgradeable__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC1155UpgradeableInterface {
    return new utils.Interface(_abi) as ERC1155UpgradeableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC1155Upgradeable {
    return new Contract(address, _abi, signerOrProvider) as ERC1155Upgradeable;
  }
}
