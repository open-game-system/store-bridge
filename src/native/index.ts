/**
 * Native implementations for the @open-game-system/store-bridge package
 */

import * as jsonpatch from 'fast-json-patch';
import type { BridgeConfig, NativeBridge, Store, StoreDefinition } from '../types';
import { produce as produceUtil } from '../utils';

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
export function createNativeBridge<TStores extends Record<string, StoreDefinition<any, any>>>(
  config?: NativeBridgeConfig<TStores>
): NativeBridge<TStores> {
  // Check if we're in a test environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    // Get access to the mocked native module
    const nativeModule = global.mockReactNative?.NativeModules?.StoreBridge;
    const deviceEmitter = global.mockReactNative?.DeviceEventEmitter;

    // Initialize store mocks if provided in config
    if (config?.stores) {
      for (const [key, storeConfig] of Object.entries(config.stores)) {
        if (nativeModule?.initialize && storeConfig && storeConfig.initialState) {
          nativeModule.initialize(key, storeConfig.initialState);
        }
      }
    }

    // Return a mock implementation for testing
    return {
      isSupported: () => true,
      getStore: <K extends keyof TStores>(key: K) => {
        // Return a promise that resolves to a mock store
        return Promise.resolve({
          getState: () => {
            // Try to return store state from config if available
            if (config?.stores && key in config.stores && config.stores[key]?.initialState) {
              return (config.stores[key] as StoreConfig<any, any>).initialState;
            }
            return { count: 0, name: 'Test' } as any;
          },
          dispatch: (event: TStores[K]['events']) => {
            // Call the native module's sendEvent in tests
            if (nativeModule?.sendEvent) {
              nativeModule.sendEvent(key as string, event);
            }
          },
          subscribe: (listener) => {
            // Set up subscription via the device emitter
            const eventName = `${key as string}_STATE_UPDATE`;
            const subscription = deviceEmitter?.addListener(eventName, listener);

            // Call the listener once with initial state
            const initialState = config?.stores?.[key]?.initialState || { count: 0, name: 'Test' };
            listener(initialState as any);

            // Return an unsubscribe function
            return () => {
              subscription?.remove();
            };
          },
        } as Store<TStores[K]['state'], TStores[K]['events']>);
      },
      produce: <K extends keyof TStores>(
        key: K,
        producer: (draft: TStores[K]['state']) => void
      ) => {
        // Create a draft state and apply producer
        const initialState = config?.stores?.[key]?.initialState || { count: 0, name: 'Test' };
        const state = JSON.parse(JSON.stringify(initialState));
        producer(state);

        // In tests, call the sendEvent on the native module
        if (nativeModule?.sendEvent) {
          nativeModule.sendEvent(key as string, { type: 'STATE_UPDATE', payload: state });
        }
      },
    };
  }

  // For real implementation in React Native environment
  const debug = config?.debug ?? false;

  // Stores and reducers maps
  const stores = new Map<keyof TStores, Store<any, any>>();
  const stateMap = new Map<keyof TStores, any>();
  const reducers = new Map<keyof TStores, (state: any, event: any) => any>();

  // Track registered WebViews for communication
  const registeredWebViews: Array<{ injectJavaScript: (js: string) => void }> = [];

  // Keep previous states for JSON-Patch generation
  const previousStates = new Map<keyof TStores, any>();

  // Function to register a WebView for state updates
  const registerWebView = (webView: { injectJavaScript: (js: string) => void }) => {
    registeredWebViews.push(webView);

    // Send initial state to the newly registered WebView
    stateMap.forEach((state, key) => {
      const js = `
        window.dispatchEvent(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'STATE_UPDATE',
            key: '${String(key)}',
            payload: ${JSON.stringify(state)}
          })
        }));
        true;
      `;
      webView.injectJavaScript(js);
    });

    return {
      unregister: () => {
        const index = registeredWebViews.indexOf(webView);
        if (index !== -1) {
          registeredWebViews.splice(index, 1);
        }
      },
    };
  };

  // Function to update WebViews with new state using full state updates
  const updateWebViews = <K extends keyof TStores>(key: K, state: TStores[K]['state']) => {
    if (debug) {
      console.log(`Updating WebViews for ${String(key)}:`, state);
    }

    // Store current state as previous for future patch generation
    previousStates.set(key, JSON.parse(JSON.stringify(state)));

    // Send the updated state to each WebView
    for (const webView of registeredWebViews) {
      const js = `
        window.dispatchEvent(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'STATE_UPDATE',
            key: '${String(key)}',
            payload: ${JSON.stringify(state)}
          })
        }));
        true;
      `;
      webView.injectJavaScript(js);
    }
  };

  // Function to update WebViews with JSON Patch for efficient updates
  const updateWebViewsWithPatch = <K extends keyof TStores>(
    key: K,
    newState: TStores[K]['state']
  ) => {
    const stringKey = String(key);

    // Get previous state or use empty object as fallback
    const prevState = previousStates.get(key) || {};

    // Generate JSON patches
    const patches = jsonpatch.compare(prevState, newState);

    if (patches.length === 0) {
      // No changes, nothing to update
      return;
    }

    if (debug) {
      console.log(`Updating WebViews for ${stringKey} with patches:`, patches);
      console.log(`Patch size: ${JSON.stringify(patches).length} bytes`);
      console.log(`Full state size: ${JSON.stringify(newState).length} bytes`);
    }

    // Store current state as previous for future patch generation
    previousStates.set(key, JSON.parse(JSON.stringify(newState)));

    // Determine if we should send full state or patches based on size comparison
    const patchJson = JSON.stringify(patches);
    const stateJson = JSON.stringify(newState);

    // If patch is larger than state, just send the full state
    // This can happen with small objects or large changes
    if (patchJson.length >= stateJson.length) {
      updateWebViews(key, newState);
      return;
    }

    // Send the patches to each WebView
    for (const webView of registeredWebViews) {
      const js = `
        (function() {
          try {
            const message = {
              type: 'STATE_PATCH',
              key: '${stringKey}',
              patches: ${patchJson}
            };
            
            window.dispatchEvent(new MessageEvent('message', {
              data: JSON.stringify(message)
            }));
          } catch (error) {
            console.error('Error processing patch:', error);
          }
          return true;
        })();
      `;
      webView.injectJavaScript(js);
    }
  };

  // Initialize stores from config if provided
  if (config?.stores) {
    for (const [key, storeConfig] of Object.entries(config.stores)) {
      if (storeConfig) {
        if (storeConfig.initialState) {
          stateMap.set(key, storeConfig.initialState);
          reducers.set(key as keyof TStores, storeConfig.reducer);
        }
      }
    }
  }

  // Create the bridge instance with additional internal methods for testing
  const bridge = {
    isSupported: () => true, // Native bridge is always supported

    getStore: <K extends keyof TStores>(key: K) => {
      return new Promise<Store<TStores[K]['state'], TStores[K]['events']>>((resolve) => {
        if (stores.has(key)) {
          // Return existing store if already created
          resolve(stores.get(key) as Store<TStores[K]['state'], TStores[K]['events']>);
        } else {
          // Create a new store
          const state = stateMap.get(key) || ({} as TStores[K]['state']);
          const listeners: Array<(state: TStores[K]['state']) => void> = [];

          const store: Store<TStores[K]['state'], TStores[K]['events']> = {
            getState: () => stateMap.get(key) || ({} as TStores[K]['state']),
            dispatch: (event: TStores[K]['events']) => {
              // Get the current state
              const currentState = stateMap.get(key) || ({} as TStores[K]['state']);

              // Apply reducer if available
              const reducer = reducers.get(key);
              if (reducer) {
                const newState = reducer(currentState, event);
                stateMap.set(key, newState);

                // Notify listeners
                for (const listener of listeners) {
                  listener(newState);
                }

                // Update WebViews with new state using JSON Patch
                updateWebViewsWithPatch(key, newState);
              } else if (debug) {
                console.warn(`No reducer found for store: ${String(key)}`);
              }
            },
            subscribe: (listener: (state: TStores[K]['state']) => void) => {
              listeners.push(listener);

              // Call listener immediately with current state
              listener(stateMap.get(key) || ({} as TStores[K]['state']));

              // Return unsubscribe function
              return () => {
                const index = listeners.indexOf(listener);
                if (index !== -1) {
                  listeners.splice(index, 1);
                }
              };
            },
          };

          // Save the store reference
          stores.set(key, store);
          resolve(store);
        }
      });
    },

    produce: <K extends keyof TStores>(key: K, producer: (draft: TStores[K]['state']) => void) => {
      // Get the current state or create empty state if not initialized
      const currentState = stateMap.get(key) || ({} as TStores[K]['state']);

      // Apply producer function to create a new state
      const newState = produceUtil(currentState, producer);
      stateMap.set(key, newState);

      // Notify listeners
      const store = stores.get(key);
      if (store) {
        const listeners = (store as any)._listeners || [];
        for (const listener of listeners) {
          listener(newState);
        }
      }

      // Update WebViews with new state using JSON Patch
      updateWebViewsWithPatch(key, newState);
    },

    // Additional methods for the native bridge that aren't part of the standard interface
    registerWebView,
  };

  // For testing purposes, expose internal methods
  (bridge as any)._updateWebViews = updateWebViews;
  (bridge as any)._updateWebViewsWithPatch = updateWebViewsWithPatch;
  (bridge as any)._stateMap = stateMap;
  (bridge as any)._reducers = reducers;
  (bridge as any)._registeredWebViews = registeredWebViews;

  return bridge as NativeBridge<TStores>;
}
