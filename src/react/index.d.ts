/**
 * React integration for the @open-game-system/store-bridge package
 */
import React, { type ReactNode } from 'react';
import type { Bridge, Store } from '../types';
/**
 * Creates a bridge context with helper components and hooks
 */
export declare function createBridgeContext<
  TBridgeStores extends Record<
    string,
    {
      state: any;
      events: any;
    }
  >,
>(): {
  Provider: ({
    children,
    bridge,
  }: {
    children: ReactNode;
    bridge?: Bridge<TBridgeStores>;
  }) => React.FunctionComponentElement<React.ProviderProps<Bridge<TBridgeStores> | null>>;
  Supported: ({
    children,
  }: {
    children: ReactNode;
  }) => React.FunctionComponentElement<{
    children?: ReactNode | undefined;
  }> | null;
  Unsupported: ({
    children,
  }: {
    children: ReactNode;
  }) => React.FunctionComponentElement<{
    children?: ReactNode | undefined;
  }> | null;
  useBridge: () => Bridge<TBridgeStores>;
  createStoreContext: <TKey extends keyof TBridgeStores>(
    key: TKey,
  ) => {
    Provider: ({
      children,
      store,
    }: {
      children: ReactNode;
      store: Store<TBridgeStores[TKey]['state'], TBridgeStores[TKey]['events']>;
    }) => React.FunctionComponentElement<
      React.ProviderProps<Store<TBridgeStores[TKey]['state'], TBridgeStores[TKey]['events']> | null>
    >;
    StoreConnector: ({
      children,
    }: {
      children: ReactNode;
    }) => React.FunctionComponentElement<
      React.ProviderProps<Store<TBridgeStores[TKey]['state'], TBridgeStores[TKey]['events']> | null>
    >;
    useStore: () => Store<TBridgeStores[TKey]['state'], TBridgeStores[TKey]['events']>;
    useSelector: <T>(selector: (state: TBridgeStores[TKey]['state']) => T) => T;
    Initialized: ({
      children,
    }: {
      children: ReactNode;
    }) => React.FunctionComponentElement<{
      children?: ReactNode | undefined;
    }> | null;
    Initializing: ({
      children,
    }: {
      children: ReactNode;
    }) => React.FunctionComponentElement<{
      children?: ReactNode | undefined;
    }> | null;
  };
};
