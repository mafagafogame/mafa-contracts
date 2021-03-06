/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  LibRoyaltiesV2,
  LibRoyaltiesV2Interface,
} from "../LibRoyaltiesV2";

const _abi = [
  {
    inputs: [],
    name: "_INTERFACE_ID_ROYALTIES",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x6087610038600b82828239805160001a607314602b57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe730000000000000000000000000000000000000000301460806040526004361060335760003560e01c806339f63b2c146038575b600080fd5b604563656cb66560e11b81565b6040517fffffffff00000000000000000000000000000000000000000000000000000000909116815260200160405180910390f3fea164736f6c6343000809000a";

type LibRoyaltiesV2ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: LibRoyaltiesV2ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class LibRoyaltiesV2__factory extends ContractFactory {
  constructor(...args: LibRoyaltiesV2ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<LibRoyaltiesV2> {
    return super.deploy(overrides || {}) as Promise<LibRoyaltiesV2>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): LibRoyaltiesV2 {
    return super.attach(address) as LibRoyaltiesV2;
  }
  connect(signer: Signer): LibRoyaltiesV2__factory {
    return super.connect(signer) as LibRoyaltiesV2__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): LibRoyaltiesV2Interface {
    return new utils.Interface(_abi) as LibRoyaltiesV2Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): LibRoyaltiesV2 {
    return new Contract(address, _abi, signerOrProvider) as LibRoyaltiesV2;
  }
}
