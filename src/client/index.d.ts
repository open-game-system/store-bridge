/**
 * Web client implementations for the @open-game-system/store-bridge package
 */
import type { Bridge, BridgeConfig, Store, StoreDefinition } from '../types';
/**
 * Creates a bridge for web clients
 *
 * @param config Configuration options for the bridge
 * @returns A bridge instance
 */
export declare function createBridge<TStores extends Record<string, StoreDefinition<any, any>>>(
  config?: BridgeConfig,
): Bridge<TStores>;
/**
 * Creates a store for a specific feature
 * This is internal and not meant to be used directly
 */
export declare function createStore<State, Event>(
  key?: string,
  isSupported?: boolean,
  debug?: boolean,
): Store<State, Event>;
