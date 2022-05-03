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
    "c_0xa0896c75(bytes32)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "_INTERFACE_ID_ROYALTIES",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "c_0xa0896c75",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "_INTERFACE_ID_ROYALTIES",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "c_0xa0896c75",
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

    c_0xa0896c75(
      c__0xa0896c75: BytesLike,
      overrides?: CallOverrides
    ): Promise<[void]>;
  };

  _INTERFACE_ID_ROYALTIES(overrides?: CallOverrides): Promise<string>;

  c_0xa0896c75(
    c__0xa0896c75: BytesLike,
    overrides?: CallOverrides
  ): Promise<void>;

  callStatic: {
    _INTERFACE_ID_ROYALTIES(overrides?: CallOverrides): Promise<string>;

    c_0xa0896c75(
      c__0xa0896c75: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    _INTERFACE_ID_ROYALTIES(overrides?: CallOverrides): Promise<BigNumber>;

    c_0xa0896c75(
      c__0xa0896c75: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    _INTERFACE_ID_ROYALTIES(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    c_0xa0896c75(
      c__0xa0896c75: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
