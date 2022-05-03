/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ERC721, ERC721Interface } from "../ERC721";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
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
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
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
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
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
    inputs: [],
    name: "name",
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
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
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
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
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
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
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
    inputs: [],
    name: "symbol",
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
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
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
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b506040516200276d3803806200276d8339818101604052810190620000379190620002be565b81600090805190602001906200004f92919062000071565b5080600190805190602001906200006892919062000071565b505050620003a8565b8280546200007f9062000372565b90600052602060002090601f016020900481019282620000a35760008555620000ef565b82601f10620000be57805160ff1916838001178555620000ef565b82800160010185558215620000ef579182015b82811115620000ee578251825591602001919060010190620000d1565b5b509050620000fe919062000102565b5090565b5b808211156200011d57600081600090555060010162000103565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6200018a826200013f565b810181811067ffffffffffffffff82111715620001ac57620001ab62000150565b5b80604052505050565b6000620001c162000121565b9050620001cf82826200017f565b919050565b600067ffffffffffffffff821115620001f257620001f162000150565b5b620001fd826200013f565b9050602081019050919050565b60005b838110156200022a5780820151818401526020810190506200020d565b838111156200023a576000848401525b50505050565b6000620002576200025184620001d4565b620001b5565b9050828152602081018484840111156200027657620002756200013a565b5b620002838482856200020a565b509392505050565b600082601f830112620002a357620002a262000135565b5b8151620002b584826020860162000240565b91505092915050565b60008060408385031215620002d857620002d76200012b565b5b600083015167ffffffffffffffff811115620002f957620002f862000130565b5b62000307858286016200028b565b925050602083015167ffffffffffffffff8111156200032b576200032a62000130565b5b62000339858286016200028b565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806200038b57607f821691505b60208210811415620003a257620003a162000343565b5b50919050565b6123b580620003b86000396000f3fe608060405234801561001057600080fd5b50600436106100df5760003560e01c80636352211e1161008c578063a22cb46511610066578063a22cb46514610234578063b88d4fde14610250578063c87b56dd1461026c578063e985e9c51461029c576100df565b80636352211e146101b657806370a08231146101e657806395d89b4114610216576100df565b8063095ea7b3116100bd578063095ea7b31461016257806323b872dd1461017e57806342842e0e1461019a576100df565b806301ffc9a7146100e457806306fdde0314610114578063081812fc14610132575b600080fd5b6100fe60048036038101906100f99190611439565b6102cc565b60405161010b9190611481565b60405180910390f35b61011c6103ae565b6040516101299190611535565b60405180910390f35b61014c6004803603810190610147919061158d565b610440565b60405161015991906115fb565b60405180910390f35b61017c60048036038101906101779190611642565b6104c5565b005b61019860048036038101906101939190611682565b6105dd565b005b6101b460048036038101906101af9190611682565b61063d565b005b6101d060048036038101906101cb919061158d565b61065d565b6040516101dd91906115fb565b60405180910390f35b61020060048036038101906101fb91906116d5565b61070f565b60405161020d9190611711565b60405180910390f35b61021e6107c7565b60405161022b9190611535565b60405180910390f35b61024e60048036038101906102499190611758565b610859565b005b61026a600480360381019061026591906118cd565b61086f565b005b6102866004803603810190610281919061158d565b6108d1565b6040516102939190611535565b60405180910390f35b6102b660048036038101906102b19190611950565b610978565b6040516102c39190611481565b60405180910390f35b60007f80ac58cd000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916148061039757507f5b5e139f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b806103a757506103a682610a0c565b5b9050919050565b6060600080546103bd906119bf565b80601f01602080910402602001604051908101604052809291908181526020018280546103e9906119bf565b80156104365780601f1061040b57610100808354040283529160200191610436565b820191906000526020600020905b81548152906001019060200180831161041957829003601f168201915b5050505050905090565b600061044b82610a76565b61048a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161048190611a63565b60405180910390fd5b6004600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b60006104d08261065d565b90508073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610541576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161053890611af5565b60405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16610560610ae2565b73ffffffffffffffffffffffffffffffffffffffff16148061058f575061058e81610589610ae2565b610978565b5b6105ce576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105c590611b87565b60405180910390fd5b6105d88383610aea565b505050565b6105ee6105e8610ae2565b82610ba3565b61062d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161062490611c19565b60405180910390fd5b610638838383610c81565b505050565b6106588383836040518060200160405280600081525061086f565b505050565b6000806002600084815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415610706576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106fd90611cab565b60405180910390fd5b80915050919050565b60008073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610780576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161077790611d3d565b60405180910390fd5b600360008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6060600180546107d6906119bf565b80601f0160208091040260200160405190810160405280929190818152602001828054610802906119bf565b801561084f5780601f106108245761010080835404028352916020019161084f565b820191906000526020600020905b81548152906001019060200180831161083257829003601f168201915b5050505050905090565b61086b610864610ae2565b8383610edd565b5050565b61088061087a610ae2565b83610ba3565b6108bf576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108b690611c19565b60405180910390fd5b6108cb8484848461104a565b50505050565b60606108dc82610a76565b61091b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161091290611dcf565b60405180910390fd5b60006109256110a6565b905060008151116109455760405180602001604052806000815250610970565b8061094f846110bd565b604051602001610960929190611e2b565b6040516020818303038152906040525b915050919050565b6000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b60008073ffffffffffffffffffffffffffffffffffffffff166002600084815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614159050919050565b600033905090565b816004600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff16610b5d8361065d565b73ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b6000610bae82610a76565b610bed576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610be490611ec1565b60405180910390fd5b6000610bf88361065d565b90508073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480610c6757508373ffffffffffffffffffffffffffffffffffffffff16610c4f84610440565b73ffffffffffffffffffffffffffffffffffffffff16145b80610c785750610c778185610978565b5b91505092915050565b8273ffffffffffffffffffffffffffffffffffffffff16610ca18261065d565b73ffffffffffffffffffffffffffffffffffffffff1614610cf7576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610cee90611f53565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610d67576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d5e90611fe5565b60405180910390fd5b610d7283838361121e565b610d7d600082610aea565b6001600360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610dcd9190612034565b925050819055506001600360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610e249190612068565b92505081905550816002600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4505050565b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610f4c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610f439061210a565b60405180910390fd5b80600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405161103d9190611481565b60405180910390a3505050565b611055848484610c81565b61106184848484611223565b6110a0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110979061219c565b60405180910390fd5b50505050565b606060405180602001604052806000815250905090565b60606000821415611105576040518060400160405280600181526020017f30000000000000000000000000000000000000000000000000000000000000008152509050611219565b600082905060005b60008214611137578080611120906121bc565b915050600a826111309190612234565b915061110d565b60008167ffffffffffffffff811115611153576111526117a2565b5b6040519080825280601f01601f1916602001820160405280156111855781602001600182028036833780820191505090505b5090505b600085146112125760018261119e9190612034565b9150600a856111ad9190612265565b60306111b99190612068565b60f81b8183815181106111cf576111ce612296565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350600a8561120b9190612234565b9450611189565b8093505050505b919050565b505050565b60006112448473ffffffffffffffffffffffffffffffffffffffff166113ba565b156113ad578373ffffffffffffffffffffffffffffffffffffffff1663150b7a0261126d610ae2565b8786866040518563ffffffff1660e01b815260040161128f949392919061231a565b602060405180830381600087803b1580156112a957600080fd5b505af19250505080156112da57506040513d601f19601f820116820180604052508101906112d7919061237b565b60015b61135d573d806000811461130a576040519150601f19603f3d011682016040523d82523d6000602084013e61130f565b606091505b50600081511415611355576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161134c9061219c565b60405180910390fd5b805181602001fd5b63150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149150506113b2565b600190505b949350505050565b600080823b905060008111915050919050565b6000604051905090565b600080fd5b600080fd5b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b611416816113e1565b811461142157600080fd5b50565b6000813590506114338161140d565b92915050565b60006020828403121561144f5761144e6113d7565b5b600061145d84828501611424565b91505092915050565b60008115159050919050565b61147b81611466565b82525050565b60006020820190506114966000830184611472565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b838110156114d65780820151818401526020810190506114bb565b838111156114e5576000848401525b50505050565b6000601f19601f8301169050919050565b60006115078261149c565b61151181856114a7565b93506115218185602086016114b8565b61152a816114eb565b840191505092915050565b6000602082019050818103600083015261154f81846114fc565b905092915050565b6000819050919050565b61156a81611557565b811461157557600080fd5b50565b60008135905061158781611561565b92915050565b6000602082840312156115a3576115a26113d7565b5b60006115b184828501611578565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006115e5826115ba565b9050919050565b6115f5816115da565b82525050565b600060208201905061161060008301846115ec565b92915050565b61161f816115da565b811461162a57600080fd5b50565b60008135905061163c81611616565b92915050565b60008060408385031215611659576116586113d7565b5b60006116678582860161162d565b925050602061167885828601611578565b9150509250929050565b60008060006060848603121561169b5761169a6113d7565b5b60006116a98682870161162d565b93505060206116ba8682870161162d565b92505060406116cb86828701611578565b9150509250925092565b6000602082840312156116eb576116ea6113d7565b5b60006116f98482850161162d565b91505092915050565b61170b81611557565b82525050565b60006020820190506117266000830184611702565b92915050565b61173581611466565b811461174057600080fd5b50565b6000813590506117528161172c565b92915050565b6000806040838503121561176f5761176e6113d7565b5b600061177d8582860161162d565b925050602061178e85828601611743565b9150509250929050565b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6117da826114eb565b810181811067ffffffffffffffff821117156117f9576117f86117a2565b5b80604052505050565b600061180c6113cd565b905061181882826117d1565b919050565b600067ffffffffffffffff821115611838576118376117a2565b5b611841826114eb565b9050602081019050919050565b82818337600083830152505050565b600061187061186b8461181d565b611802565b90508281526020810184848401111561188c5761188b61179d565b5b61189784828561184e565b509392505050565b600082601f8301126118b4576118b3611798565b5b81356118c484826020860161185d565b91505092915050565b600080600080608085870312156118e7576118e66113d7565b5b60006118f58782880161162d565b94505060206119068782880161162d565b935050604061191787828801611578565b925050606085013567ffffffffffffffff811115611938576119376113dc565b5b6119448782880161189f565b91505092959194509250565b60008060408385031215611967576119666113d7565b5b60006119758582860161162d565b92505060206119868582860161162d565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806119d757607f821691505b602082108114156119eb576119ea611990565b5b50919050565b7f4552433732313a20617070726f76656420717565727920666f72206e6f6e657860008201527f697374656e7420746f6b656e0000000000000000000000000000000000000000602082015250565b6000611a4d602c836114a7565b9150611a58826119f1565b604082019050919050565b60006020820190508181036000830152611a7c81611a40565b9050919050565b7f4552433732313a20617070726f76616c20746f2063757272656e74206f776e6560008201527f7200000000000000000000000000000000000000000000000000000000000000602082015250565b6000611adf6021836114a7565b9150611aea82611a83565b604082019050919050565b60006020820190508181036000830152611b0e81611ad2565b9050919050565b7f4552433732313a20617070726f76652063616c6c6572206973206e6f74206f7760008201527f6e6572206e6f7220617070726f76656420666f7220616c6c0000000000000000602082015250565b6000611b716038836114a7565b9150611b7c82611b15565b604082019050919050565b60006020820190508181036000830152611ba081611b64565b9050919050565b7f4552433732313a207472616e736665722063616c6c6572206973206e6f74206f60008201527f776e6572206e6f7220617070726f766564000000000000000000000000000000602082015250565b6000611c036031836114a7565b9150611c0e82611ba7565b604082019050919050565b60006020820190508181036000830152611c3281611bf6565b9050919050565b7f4552433732313a206f776e657220717565727920666f72206e6f6e657869737460008201527f656e7420746f6b656e0000000000000000000000000000000000000000000000602082015250565b6000611c956029836114a7565b9150611ca082611c39565b604082019050919050565b60006020820190508181036000830152611cc481611c88565b9050919050565b7f4552433732313a2062616c616e636520717565727920666f7220746865207a6560008201527f726f206164647265737300000000000000000000000000000000000000000000602082015250565b6000611d27602a836114a7565b9150611d3282611ccb565b604082019050919050565b60006020820190508181036000830152611d5681611d1a565b9050919050565b7f4552433732314d657461646174613a2055524920717565727920666f72206e6f60008201527f6e6578697374656e7420746f6b656e0000000000000000000000000000000000602082015250565b6000611db9602f836114a7565b9150611dc482611d5d565b604082019050919050565b60006020820190508181036000830152611de881611dac565b9050919050565b600081905092915050565b6000611e058261149c565b611e0f8185611def565b9350611e1f8185602086016114b8565b80840191505092915050565b6000611e378285611dfa565b9150611e438284611dfa565b91508190509392505050565b7f4552433732313a206f70657261746f7220717565727920666f72206e6f6e657860008201527f697374656e7420746f6b656e0000000000000000000000000000000000000000602082015250565b6000611eab602c836114a7565b9150611eb682611e4f565b604082019050919050565b60006020820190508181036000830152611eda81611e9e565b9050919050565b7f4552433732313a207472616e73666572206f6620746f6b656e2074686174206960008201527f73206e6f74206f776e0000000000000000000000000000000000000000000000602082015250565b6000611f3d6029836114a7565b9150611f4882611ee1565b604082019050919050565b60006020820190508181036000830152611f6c81611f30565b9050919050565b7f4552433732313a207472616e7366657220746f20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b6000611fcf6024836114a7565b9150611fda82611f73565b604082019050919050565b60006020820190508181036000830152611ffe81611fc2565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061203f82611557565b915061204a83611557565b92508282101561205d5761205c612005565b5b828203905092915050565b600061207382611557565b915061207e83611557565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156120b3576120b2612005565b5b828201905092915050565b7f4552433732313a20617070726f766520746f2063616c6c657200000000000000600082015250565b60006120f46019836114a7565b91506120ff826120be565b602082019050919050565b60006020820190508181036000830152612123816120e7565b9050919050565b7f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560008201527f63656976657220696d706c656d656e7465720000000000000000000000000000602082015250565b60006121866032836114a7565b91506121918261212a565b604082019050919050565b600060208201905081810360008301526121b581612179565b9050919050565b60006121c782611557565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8214156121fa576121f9612005565b5b600182019050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b600061223f82611557565b915061224a83611557565b92508261225a57612259612205565b5b828204905092915050565b600061227082611557565b915061227b83611557565b92508261228b5761228a612205565b5b828206905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600081519050919050565b600082825260208201905092915050565b60006122ec826122c5565b6122f681856122d0565b93506123068185602086016114b8565b61230f816114eb565b840191505092915050565b600060808201905061232f60008301876115ec565b61233c60208301866115ec565b6123496040830185611702565b818103606083015261235b81846122e1565b905095945050505050565b6000815190506123758161140d565b92915050565b600060208284031215612391576123906113d7565b5b600061239f84828501612366565b9150509291505056fea164736f6c6343000809000a";

type ERC721ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ERC721ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ERC721__factory extends ContractFactory {
  constructor(...args: ERC721ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    name_: string,
    symbol_: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ERC721> {
    return super.deploy(name_, symbol_, overrides || {}) as Promise<ERC721>;
  }
  getDeployTransaction(
    name_: string,
    symbol_: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(name_, symbol_, overrides || {});
  }
  attach(address: string): ERC721 {
    return super.attach(address) as ERC721;
  }
  connect(signer: Signer): ERC721__factory {
    return super.connect(signer) as ERC721__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC721Interface {
    return new utils.Interface(_abi) as ERC721Interface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): ERC721 {
    return new Contract(address, _abi, signerOrProvider) as ERC721;
  }
}
