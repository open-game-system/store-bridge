/**
 * Testing utilities for the @open-game-system/store-bridge package
 */
import type { Bridge, NativeBridge, Store, StoreDefinition } from '../types';
/**
 * Configuration for creating a mock store
 */
export interface MockStoreConfig<State> {
  initialState: State;
}
/**
 * Creates a mock store for testing
 *
 * @param config Configuration for the mock store
 * @returns A mock store instance
 */
export declare function createMockStore<State, Event>(
  config: MockStoreConfig<State>,
): Store<State, Event>;
/**
 * Configuration for creating a mock bridge
 */
export interface MockBridgeConfig<TStores extends Record<string, StoreDefinition<any, any>>> {
  isSupported?: boolean;
  stores?: {
    [K in keyof TStores]?: {
      initialState: TStores[K]['state'];
      reducer?: (state: TStores[K]['state'], event: TStores[K]['events']) => TStores[K]['state'];
    };
  };
}
/**
 * Creates a mock store with a reducer for testing
 *
 * @param config Configuration for the mock store with reducer
 * @returns A mock store instance with reducer capability
 */
export declare function createMockStoreWithReducer<State, Event>(config: {
  initialState: State;
  reducer?: (state: State, event: Event) => State;
}): Store<State, Event>;
/**
 * Creates a mock bridge for testing
 *
 * @param config Configuration for the mock bridge
 * @returns A mock bridge instance
 */
export declare function createMockBridge<TStores extends Record<string, StoreDefinition<any, any>>>(
  config?: MockBridgeConfig<TStores>,
): Bridge<TStores>;
/**
 * Creates a mock native bridge for testing
 *
 * @param config Configuration for the mock native bridge
 * @returns A mock native bridge instance
 */
export declare function createMockNativeBridge<
  TStores extends Record<string, StoreDefinition<any, any>>,
>(config?: MockBridgeConfig<TStores>): NativeBridge<TStores>;
