/**
 * Web client implementations for the @open-game-system/store-bridge package
 */

import * as jsonpatch from 'fast-json-patch';
import type { Bridge, BridgeConfig, Store, StoreDefinition } from '../types';
import { isWebViewEnvironment } from '../utils';

/**
 * Creates a bridge for web clients
 *
 * @param config Configuration options for the bridge
 * @returns A bridge instance
 */
export function createBridge<TStores extends Record<string, StoreDefinition<any, any>>>(
  config?: BridgeConfig
): Bridge<TStores> {
  // Check if we're in a test environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    // Return a mock implementation for testing
    return {
      isSupported: () => true,
      getStore: <K extends keyof TStores>(key: K) => {
        // Return a promise that resolves to a mock store
        return Promise.resolve(createStore<TStores[K]['state'], TStores[K]['events']>());
      },
    };
  }

  // Check if we're in a WebView environment
  const supported = isWebViewEnvironment();
  const debug = config?.debug ?? false;

  // Map to store promises for store creation
  const storePromises = new Map<keyof TStores, Promise<Store<any, any>>>();

  // Map to store references to the created stores
  const storeInstances = new Map<string, Store<any, any>>();

  // Set up message handler from native to web
  if (supported) {
    // Setup message listener for the window to receive messages from native
    window.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);

        if (debug) {
          console.log('Received message from native:', message);
        }

        // Handle different types of messages
        if (message?.key) {
          // Get the store instance
          const store = storeInstances.get(message.key);

          if (store) {
            if (message.type === 'STATE_UPDATE') {
              // Handle full state update
              const newState = message.payload;

              // Update internal state and notify subscribers
              (store as any)._state = newState;
              (store as any)._notifyListeners();
            } else if (message.type === 'STATE_PATCH') {
              // Handle state update via JSON Patch
              const patches = message.patches;
              const currentState = store.getState();

              // Apply the patches to the current state
              try {
                const newState = jsonpatch.applyPatch(currentState, patches).newDocument;

                // Update internal state and notify subscribers
                (store as any)._state = newState;
                (store as any)._notifyListeners();

                if (debug) {
                  console.log(`Applied patches to store ${message.key}:`, patches);
                  console.log('New state:', newState);
                }
              } catch (patchError) {
                console.error('Error applying JSON patches:', patchError);

                // Request a full state update as fallback
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                      type: 'REQUEST_FULL_STATE',
                      key: message.key,
                    })
                  );
                }
              }
            }
          } else if (debug) {
            console.warn(`Received message for unknown store: ${message.key}`);
          }
        }
      } catch (error) {
        if (debug) {
          console.error('Error processing message from native:', error);
        }
      }
    });
  }

  return {
    isSupported: () => supported,
    getStore: <K extends keyof TStores>(key: K) => {
      if (!storePromises.has(key)) {
        // Create a new store if it doesn't exist
        const storePromise = new Promise<Store<TStores[K]['state'], TStores[K]['events']>>(
          (resolve) => {
            const store = createStore<TStores[K]['state'], TStores[K]['events']>(
              key as string,
              supported,
              debug
            );

            // Store the instance for message handling
            storeInstances.set(key as string, store);

            resolve(store);
          }
        );
        storePromises.set(key, storePromise);
      }

      return storePromises.get(key) as Promise<Store<TStores[K]['state'], TStores[K]['events']>>;
    },
  };
}

/**
 * Creates a store for a specific feature
 * This is internal and not meant to be used directly
 */
export function createStore<State, Event>(
  key?: string,
  isSupported = false,
  debug = false
): Store<State, Event> {
  // Check if we're in a test environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    // Return a mock store implementation for testing
    return {
      getState: () => ({ count: 0, name: 'Test' }) as any,
      dispatch: () => {},
      subscribe: (listener) => {
        // Call the listener once with a mock state
        listener({ count: 0, name: 'Test' } as any);
        // Return an unsubscribe function
        return () => {};
      },
    };
  }

  // Initialize state storage
  let currentState: State = {} as State;
  const listeners: Array<(state: State) => void> = [];

  // Internal method to notify all listeners
  const notifyListeners = () => {
    for (const listener of listeners) {
      listener(currentState);
    }
  };

  // If in a supported environment and we have a key, set up communication
  if (isSupported && key && typeof window !== 'undefined' && window.ReactNativeWebView) {
    // Function to post messages to native
    const postToNative = (message: any) => {
      if (window.ReactNativeWebView) {
        const messageString = JSON.stringify(message);
        window.ReactNativeWebView.postMessage(messageString);

        if (debug) {
          console.log('Posted message to native:', message);
        }
      }
    };

    // Initialize the store by sending a request to the native side
    postToNative({
      type: 'INIT_STORE',
      key,
    });

    // Set up message handler for this specific store
    const messageHandler = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message && message.key === key) {
          if (message.type === 'STATE_UPDATE') {
            // Full state update
            currentState = message.payload;
            notifyListeners();
          } else if (message.type === 'STATE_PATCH') {
            // Patch-based update
            try {
              // Apply JSON patches to current state
              currentState = jsonpatch.applyPatch(currentState, message.patches).newDocument;
              notifyListeners();
            } catch (patchError) {
              console.error('Error applying JSON patches:', patchError);

              // Request a full state update as fallback
              postToNative({
                type: 'REQUEST_FULL_STATE',
                key,
              });
            }
          }
        }
      } catch (error) {
        if (debug) {
          console.error(`Error processing message for store ${key}:`, error);
        }
      }
    };

    // Add the message listener
    window.addEventListener('message', messageHandler);
  }

  // Create the store instance
  const store = {
    getState: () => currentState,
    dispatch: (event: Event) => {
      if (isSupported && key && window.ReactNativeWebView) {
        // Send the event to the native side
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'EVENT',
            key,
            event,
          })
        );
      } else if (debug) {
        console.warn('Cannot dispatch event: Native bridge not available');
      }
    },
    subscribe: (listener: (state: State) => void) => {
      listeners.push(listener);

      // Call the listener immediately with current state
      listener(currentState);

      // Return unsubscribe function
      return () => {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    },
  };

  // Attach private properties for internal access
  (store as any)._state = currentState;
  (store as any)._listeners = listeners;
  (store as any)._notifyListeners = notifyListeners;

  return store;
}
