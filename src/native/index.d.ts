/**
 * Native implementations for the @open-game-system/store-bridge package
 */
import type { BridgeConfig, NativeBridge, StoreDefinition } from '../types';
/**
 * Store configuration for native bridge
 */
export interface StoreConfig<State, Event> {
  initialState?: State;
  reducer?: (state: State, event: Event) => State;
}
/**
 * Enhanced configuration for native bridge
 */
export interface NativeBridgeConfig<TStores extends Record<string, StoreDefinition<any, any>>>
  extends BridgeConfig {
  /**
   * Store definitions to initialize with the bridge
   */
  stores?: {
    [K in keyof TStores]?: StoreConfig<TStores[K]['state'], TStores[K]['events']>;
  };
}
/**
 * Creates a native bridge (host environment)
 *
 * @param config Configuration options for the bridge, including initial store definitions
 * @returns A native bridge instance
 */
export declare function createNativeBridge<
  TStores extends Record<string, StoreDefinition<any, any>>,
>(config?: NativeBridgeConfig<TStores>): NativeBridge<TStores>;
