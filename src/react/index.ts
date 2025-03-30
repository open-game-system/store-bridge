/**
 * React integration for the @open-game-system/store-bridge package
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createBridge } from '../client';
import type { Bridge, Store, StoreDefinition } from '../types';

/**
 * Default equality function using Object.is
 */
function defaultCompare<T>(a: T, b: T): boolean {
  return Object.is(a, b);
}

/**
 * Enhanced implementation of useSyncExternalStoreWithSelector with memoization
 */
function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  isEqual: (a: Selection, b: Selection) => boolean = defaultCompare
): Selection {
  // Memoize selector logic
  const [getSelection, getServerSelection] = useMemo(() => {
    let hasMemo = false;
    let memoizedSnapshot: Snapshot;
    let memoizedSelection: Selection;

    const memoizedSelector = (nextSnapshot: Snapshot) => {
      // First call initialization
      if (!hasMemo) {
        hasMemo = true;
        memoizedSnapshot = nextSnapshot;
        memoizedSelection = selector(nextSnapshot);
        return memoizedSelection;
      }

      // Fast path if snapshot reference hasn't changed
      if (Object.is(memoizedSnapshot, nextSnapshot)) {
        return memoizedSelection;
      }

      // Calculate new selection
      const nextSelection = selector(nextSnapshot);

      // Skip updates if selected values are equal
      if (isEqual(memoizedSelection, nextSelection)) {
        memoizedSnapshot = nextSnapshot;
        return memoizedSelection;
      }

      // Update memoized values
      memoizedSnapshot = nextSnapshot;
      memoizedSelection = nextSelection;
      return nextSelection;
    };

    // Create getter functions for useSyncExternalStore
    const getSnapshotWithSelector = () => memoizedSelector(getSnapshot());
    const getServerSnapshotWithSelector = getServerSnapshot
      ? () => memoizedSelector(getServerSnapshot())
      : undefined;

    return [getSnapshotWithSelector, getServerSnapshotWithSelector];
  }, [getSnapshot, getServerSnapshot, selector, isEqual]);

  // Create subscribe function that only notifies on meaningful changes
  const subscribeWithSelector = useCallback(
    (onStoreChange: () => void) => {
      let previousSelection = getSelection();
      return subscribe(() => {
        const nextSelection = getSelection();
        if (!isEqual(previousSelection, nextSelection)) {
          previousSelection = nextSelection;
          onStoreChange();
        }
      });
    },
    [subscribe, getSelection, isEqual]
  );

  // Use React's useSyncExternalStore with our optimized functions
  return useSyncExternalStore(subscribeWithSelector, getSelection, getServerSelection as any);
}

/**
 * Creates a bridge context with helper components and hooks
 */
export function createBridgeContext<
  TBridgeStores extends Record<string, { state: any; events: any }>,
>() {
  // Create the context for the bridge
  const BridgeContext = createContext<Bridge<TBridgeStores> | null>(null);
  BridgeContext.displayName = 'BridgeContext';

  // Main provider component - this is the only way to provide the bridge
  const Provider = ({
    children,
    bridge,
  }: {
    children: ReactNode;
    bridge?: Bridge<TBridgeStores>;
  }) => {
    // If no bridge is provided, create one automatically
    const actualBridge = useMemo(() => bridge || createBridge<TBridgeStores>(), [bridge]);

    return React.createElement(BridgeContext.Provider, { value: actualBridge }, children);
  };

  // Helper components
  const Supported = ({ children }: { children: ReactNode }) => {
    const bridge = useContext(BridgeContext);
    if (bridge?.isSupported()) {
      return React.createElement(React.Fragment, null, children);
    }
    return null;
  };

  const Unsupported = ({ children }: { children: ReactNode }) => {
    const bridge = useContext(BridgeContext);
    if (!bridge || !bridge.isSupported()) {
      return React.createElement(React.Fragment, null, children);
    }
    return null;
  };

  // Helper hook to access the bridge
  function useBridge(): Bridge<TBridgeStores> {
    const bridge = useContext(BridgeContext);
    if (!bridge) {
      throw new Error('useBridge must be used within a BridgeProvider');
    }
    return bridge;
  }

  // Store context factory function
  function createStoreContext<TKey extends keyof TBridgeStores>(key: TKey) {
    type State = TBridgeStores[TKey]['state'];
    type Event = TBridgeStores[TKey]['events'];

    // Base context creation - private, not exposed to users
    const StoreContext = createContext<Store<State, Event> | null>(null);
    const displayName = `${String(key)}Context`;
    StoreContext.displayName = displayName;

    // Provider component that gets a store from a bridge
    const Provider = ({
      children,
      store,
    }: {
      children: ReactNode;
      store: Store<State, Event>;
    }) => {
      return React.createElement(StoreContext.Provider, { value: store }, children);
    };

    // Connector component that connects to the bridge
    const StoreConnector = ({ children }: { children: ReactNode }) => {
      const bridge = useContext(BridgeContext);
      const [store, setStore] = useState<Store<State, Event> | null>(null);

      useEffect(() => {
        if (bridge?.isSupported()) {
          let isMounted = true;

          bridge
            .getStore(key as any)
            .then((storeInstance) => {
              if (isMounted) {
                setStore(storeInstance);
              }
            })
            .catch((error) => {
              console.error(`Error getting store for ${String(key)}:`, error);
            });

          return () => {
            isMounted = false;
          };
        }

        return undefined;
      }, [bridge, key]);

      return React.createElement(StoreContext.Provider, { value: store }, children);
    };

    // Define state components
    const Initialized = ({ children }: { children: ReactNode }) => {
      const store = useContext(StoreContext);
      const bridge = useContext(BridgeContext);

      if (bridge?.isSupported() && store) {
        return React.createElement(React.Fragment, null, children);
      }
      return null;
    };

    const Initializing = ({ children }: { children: ReactNode }) => {
      const store = useContext(StoreContext);
      const bridge = useContext(BridgeContext);

      if (bridge?.isSupported() && !store) {
        return React.createElement(React.Fragment, null, children);
      }
      return null;
    };

    // Define hooks with error handling
    function useStore(): Store<State, Event> {
      const store = useContext(StoreContext);

      // Always throw if store is not available - both in dev and prod
      if (!store) {
        throw new Error(
          `Cannot use ${displayName}.useStore() outside of a <${displayName}.Initialized> component.`
        );
      }

      return store;
    }

    function useSelector<T>(selector: (state: State) => T): T {
      const store = useContext(StoreContext);

      // Always throw if store is not available - both in dev and prod
      if (!store) {
        throw new Error(
          `Cannot use ${displayName}.useSelector() outside of a <${displayName}.Initialized> component.`
        );
      }

      // Use the optimized implementation
      return useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getState,
        null,
        selector,
        defaultCompare
      );
    }

    // Return the public API - notice we don't expose the raw context
    return {
      Provider,
      StoreConnector,
      useStore,
      useSelector,
      Initialized,
      Initializing,
    };
  }

  // Return the public API with nested createStoreContext
  return {
    Provider,
    Supported,
    Unsupported,
    useBridge,
    createStoreContext,
  };
}
