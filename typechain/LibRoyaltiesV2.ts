/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface LibRoyaltiesV2Interface extends utils.Interface {
  functions: {
    "_INTERFACE_ID_ROYALTIES()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "_INTERFACE_ID_ROYALTIES",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "_INTERFACE_ID_ROYALTIES",
    data: BytesLike
  ): Result;

  events: {};
}

export interface LibRoyaltiesV2 extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: LibRoyaltiesV2Interface;

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
    _INTERFACE_ID_ROYALTIES(overrides?: CallOverrides): Promise<[string]>;
  };

  _INTERFACE_ID_ROYALTIES(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    _INTERFACE_ID_ROYALTIES(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    _INTERFACE_ID_ROYALTIES(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    _INTERFACE_ID_ROYALTIES(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}