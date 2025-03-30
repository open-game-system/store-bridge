/**
 * Core types for the @open-game-system/store-bridge package
 */

/**
 * Basic store interface with standard methods
 */
export interface Store<State, Event> {
  getState(): State;
  dispatch(event: Event): void;
  subscribe(listener: (state: State) => void): () => void;
}

/**
 * Store definition combining state and event types
 */
export interface StoreDefinition<State, Event> {
  state: State;
  events: Event;
}

/**
 * Bridge configuration interface
 */
export interface BridgeConfig {
  debug?: boolean;
}

/**
 * Bridge interface for communication between environments
 */
export interface Bridge<TStores extends Record<string, StoreDefinition<any, any>>> {
  isSupported(): boolean;
  getStore<K extends keyof TStores>(
    key: K,
  ): Promise<Store<TStores[K]['state'], TStores[K]['events']>>;
}

/**
 * Native bridge with additional capabilities for host environment
 * The isSupported method always returns true since the native bridge
 * is the host environment that initiates the connection.
 */
export interface NativeBridge<TStores extends Record<string, StoreDefinition<any, any>>>
  extends Bridge<TStores> {
  produce<K extends keyof TStores>(key: K, producer: (draft: TStores[K]['state']) => void): void;
}
