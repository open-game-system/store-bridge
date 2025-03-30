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
export function createMockStore<State, Event>(config: MockStoreConfig<State>): Store<State, Event> {
  const currentState = { ...config.initialState };
  const listeners: Array<(state: State) => void> = [];

  return {
    getState: () => currentState,
    dispatch: (_event: Event) => {
      // In a real implementation, this would apply events to state
      // For testing, we just notify listeners that something happened
      for (const listener of listeners) {
        listener(currentState);
      }
    },
    subscribe: (listener: (state: State) => void) => {
      listeners.push(listener);
      // Call listener immediately with current state
      listener(currentState);

      // Return unsubscribe function
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    },
  };
}

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
export function createMockStoreWithReducer<State, Event>(config: {
  initialState: State;
  reducer?: (state: State, event: Event) => State;
}): Store<State, Event> {
  // Use a mutable copy of the initial state
  const state = { ...config.initialState };
  const listeners: Array<(state: State) => void> = [];

  return {
    getState: () => state,
    dispatch: (event: Event) => {
      // Apply reducer if available
      if (config.reducer) {
        // Generate a new state using the reducer
        const newState = config.reducer(state as State, event);

        // Update state properties - safe approach for any type
        if (typeof newState === 'object' && newState !== null) {
          // Copy all properties from newState to state
          for (const key in newState) {
            if (Object.prototype.hasOwnProperty.call(newState, key)) {
              (state as any)[key] = (newState as any)[key];
            }
          }
        } else {
          // For primitive types, just replace the whole state
          return newState as any;
        }
      }

      // Notify listeners
      for (const listener of listeners) {
        listener(state as State);
      }
    },
    subscribe: (listener: (state: State) => void) => {
      listeners.push(listener);
      // Call listener immediately with current state
      listener(state as State);

      // Return unsubscribe function
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    },
  };
}

/**
 * Creates a mock bridge for testing
 *
 * @param config Configuration for the mock bridge
 * @returns A mock bridge instance
 */
export function createMockBridge<TStores extends Record<string, StoreDefinition<any, any>>>(
  config: MockBridgeConfig<TStores> = {}
): Bridge<TStores> {
  const supported = config.isSupported ?? true;
  const storeCache = new Map<keyof TStores, Store<any, any>>();

  return {
    isSupported: () => supported,
    getStore: <K extends keyof TStores>(key: K) => {
      if (!storeCache.has(key)) {
        // Create a new store if it doesn't exist in the cache
        const storeConfig = config.stores?.[key];

        if (storeConfig) {
          const store = storeConfig.reducer
            ? createMockStoreWithReducer<TStores[K]['state'], TStores[K]['events']>({
                initialState: storeConfig.initialState as TStores[K]['state'],
                reducer: storeConfig.reducer as (
                  state: TStores[K]['state'],
                  event: TStores[K]['events']
                ) => TStores[K]['state'],
              })
            : createMockStore<TStores[K]['state'], TStores[K]['events']>({
                initialState: storeConfig.initialState as TStores[K]['state'],
              });

          storeCache.set(key, store);
        } else {
          // Fallback to empty state if no config provided
          const store = createMockStore<TStores[K]['state'], TStores[K]['events']>({
            initialState: {} as TStores[K]['state'],
          });
          storeCache.set(key, store);
        }
      }
      return Promise.resolve(
        storeCache.get(key) as Store<TStores[K]['state'], TStores[K]['events']>
      );
    },
  };
}

/**
 * Creates a mock native bridge for testing
 *
 * @param config Configuration for the mock native bridge
 * @returns A mock native bridge instance
 */
export function createMockNativeBridge<TStores extends Record<string, StoreDefinition<any, any>>>(
  config: MockBridgeConfig<TStores> = {}
): NativeBridge<TStores> {
  const bridge = createMockBridge<TStores>(config);
  const storeCache = new Map<keyof TStores, Store<any, any>>();

  return {
    ...bridge,
    produce: async <K extends keyof TStores>(
      key: K,
      producer: (draft: TStores[K]['state']) => void
    ) => {
      // Get the store
      let store: Store<TStores[K]['state'], TStores[K]['events']>;

      if (!storeCache.has(key)) {
        store = await bridge.getStore(key);
        storeCache.set(key, store);
      } else {
        store = storeCache.get(key) as Store<TStores[K]['state'], TStores[K]['events']>;
      }

      // Apply the producer to a draft of the state
      const currentState = store.getState();
      const draft = JSON.parse(JSON.stringify(currentState));
      producer(draft);

      // Since we don't have a real reducer in tests, manually update the state
      // and trigger a notification by dispatching a dummy event
      Object.assign(currentState, draft);
      store.dispatch({ type: 'STATE_UPDATE', payload: draft } as any);
    },
  };
}
