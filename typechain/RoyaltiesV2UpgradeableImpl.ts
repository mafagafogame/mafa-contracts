/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export type PartStruct = { account: string; value: BigNumberish };

export type PartStructOutput = [string, BigNumber] & {
  account: string;
  value: BigNumber;
};

export interface RoyaltiesV2UpgradeableImplInterface extends utils.Interface {
  functions: {
    "getRaribleV2Royalties(uint256)": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "getRaribleV2Royalties",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "getRaribleV2Royalties",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;

  events: {
    "RoyaltiesSet(uint256,tuple[])": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "RoyaltiesSet"): EventFragment;
}

export type RoyaltiesSetEvent = TypedEvent<
  [BigNumber, PartStructOutput[]],
  { tokenId: BigNumber; royalties: PartStructOutput[] }
>;

export type RoyaltiesSetEventFilter = TypedEventFilter<RoyaltiesSetEvent>;

export interface RoyaltiesV2UpgradeableImpl extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: RoyaltiesV2UpgradeableImplInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    getRaribleV2Royalties(
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[PartStructOutput[]]>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;
  };

  getRaribleV2Royalties(
    id: BigNumberish,
    overrides?: CallOverrides
  ): Promise<PartStructOutput[]>;

  supportsInterface(
    interfaceId: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  callStatic: {
    getRaribleV2Royalties(
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PartStructOutput[]>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {
    "RoyaltiesSet(uint256,tuple[])"(
      tokenId?: null,
      royalties?: null
    ): RoyaltiesSetEventFilter;
    RoyaltiesSet(tokenId?: null, royalties?: null): RoyaltiesSetEventFilter;
  };

  estimateGas: {
    getRaribleV2Royalties(
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getRaribleV2Royalties(
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
