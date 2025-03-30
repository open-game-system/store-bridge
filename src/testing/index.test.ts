import { describe, expect, it, vi } from 'vitest';
import type { StoreDefinition } from '../types';
import {
  createMockBridge,
  createMockNativeBridge,
  createMockStore,
  createMockStoreWithReducer,
} from './index';

// Define test types
interface TestState {
  count: number;
  name: string;
}

interface TestEvent {
  type: 'INCREMENT' | 'DECREMENT' | 'SET_NAME';
  payload?: any;
}

// Use Record to satisfy the constraint
type TestBridgeStores = Record<string, StoreDefinition<any, any>> & {
  testFeature: {
    state: TestState;
    events: TestEvent;
  };
};

describe('Testing Utils', () => {
  describe('createMockStore', () => {
    it('should create a store with the standard interface', () => {
      const initialState: TestState = { count: 0, name: 'Test' };
      const store = createMockStore<TestState, TestEvent>({ initialState });

      expect(store).toBeDefined();
      expect(typeof store.getState).toBe('function');
      expect(typeof store.dispatch).toBe('function');
      expect(typeof store.subscribe).toBe('function');
    });

    it('should initialize with provided state', () => {
      const initialState: TestState = { count: 5, name: 'Custom' };
      const store = createMockStore<TestState, TestEvent>({ initialState });

      expect(store.getState()).toEqual(initialState);
    });

    it('should notify subscribers when dispatching events', () => {
      const initialState: TestState = { count: 0, name: 'Test' };
      const store = createMockStore<TestState, TestEvent>({ initialState });

      const listener = vi.fn();
      store.subscribe(listener);

      // Dispatch an event
      store.dispatch({ type: 'INCREMENT' });

      // Should have called the listener twice - once on subscribe and once on dispatch
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenCalledWith(initialState);
    });

    it('should provide unsubscribe function that works', () => {
      const initialState: TestState = { count: 0, name: 'Test' };
      const store = createMockStore<TestState, TestEvent>({ initialState });

      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      // Remove the listener
      unsubscribe();

      // Dispatch an event
      store.dispatch({ type: 'INCREMENT' });

      // Should have only called the listener once, during subscription
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('createMockStoreWithReducer', () => {
    it('should create a store with the standard interface', () => {
      const initialState: TestState = { count: 0, name: 'Test' };
      const store = createMockStoreWithReducer<TestState, TestEvent>({ initialState });

      expect(store).toBeDefined();
      expect(typeof store.getState).toBe('function');
      expect(typeof store.dispatch).toBe('function');
      expect(typeof store.subscribe).toBe('function');
    });

    it('should initialize with provided state', () => {
      const initialState: TestState = { count: 5, name: 'Custom' };
      const store = createMockStoreWithReducer<TestState, TestEvent>({ initialState });

      expect(store.getState()).toEqual(initialState);
    });

    it('should update state when dispatching with a reducer', () => {
      const initialState: TestState = { count: 0, name: 'Test' };
      const reducer = (state: TestState, event: TestEvent): TestState => {
        switch (event.type) {
          case 'INCREMENT':
            return { ...state, count: state.count + 1 };
          case 'DECREMENT':
            return { ...state, count: state.count - 1 };
          case 'SET_NAME':
            return { ...state, name: event.payload || 'Unknown' };
          default:
            return state;
        }
      };

      const store = createMockStoreWithReducer<TestState, TestEvent>({
        initialState,
        reducer,
      });

      // Dispatch events
      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState().count).toBe(1);

      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState().count).toBe(2);

      store.dispatch({ type: 'DECREMENT' });
      expect(store.getState().count).toBe(1);

      store.dispatch({ type: 'SET_NAME', payload: 'New Name' });
      expect(store.getState().name).toBe('New Name');
    });

    it('should notify subscribers when state changes', () => {
      const initialState: TestState = { count: 0, name: 'Test' };
      const reducer = (state: TestState, event: TestEvent): TestState => {
        return event.type === 'INCREMENT' ? { ...state, count: state.count + 1 } : state;
      };

      const store = createMockStoreWithReducer<TestState, TestEvent>({
        initialState,
        reducer,
      });

      const listener = vi.fn();
      store.subscribe(listener);

      // Dispatch an event
      store.dispatch({ type: 'INCREMENT' });

      // Should have called the listener twice - once on subscribe and once on state change
      expect(listener).toHaveBeenCalledTimes(2);
      // The second call should have the updated state
      expect(listener).toHaveBeenLastCalledWith({ count: 1, name: 'Test' });
    });
  });

  describe('createMockBridge', () => {
    it('should create a bridge with the standard interface', () => {
      const bridge = createMockBridge<TestBridgeStores>();

      expect(bridge).toBeDefined();
      expect(typeof bridge.isSupported).toBe('function');
      expect(typeof bridge.getStore).toBe('function');
    });

    it('should return isSupported based on config', () => {
      // Default is true
      const bridge1 = createMockBridge<TestBridgeStores>();
      expect(bridge1.isSupported()).toBe(true);

      // Explicitly true
      const bridge2 = createMockBridge<TestBridgeStores>({ isSupported: true });
      expect(bridge2.isSupported()).toBe(true);

      // Explicitly false
      const bridge3 = createMockBridge<TestBridgeStores>({ isSupported: false });
      expect(bridge3.isSupported()).toBe(false);
    });

    it('should provide stores with initial state', async () => {
      const initialState: TestState = { count: 5, name: 'Custom' };
      const bridge = createMockBridge<TestBridgeStores>({
        stores: {
          testFeature: {
            initialState,
          },
        },
      });

      const store = await bridge.getStore('testFeature');
      expect(store.getState()).toEqual(initialState);
    });

    it('should create stores with empty state when no config is provided', async () => {
      const bridge = createMockBridge<TestBridgeStores>();

      const store = await bridge.getStore('testFeature');
      expect(store.getState()).toEqual({});
    });

    it('should create stores with reducers when provided', async () => {
      const initialState: TestState = { count: 0, name: 'Test' };
      const reducer = (state: TestState, event: TestEvent): TestState => {
        return event.type === 'INCREMENT' ? { ...state, count: state.count + 1 } : state;
      };

      const bridge = createMockBridge<TestBridgeStores>({
        stores: {
          testFeature: {
            initialState,
            reducer,
          },
        },
      });

      const store = await bridge.getStore('testFeature');

      // Dispatch an event
      store.dispatch({ type: 'INCREMENT' });

      // Check state was updated
      expect(store.getState().count).toBe(1);
    });
  });

  describe('createMockNativeBridge', () => {
    it('should create a native bridge with standard interface plus produce', () => {
      const bridge = createMockNativeBridge<TestBridgeStores>();

      expect(bridge).toBeDefined();
      expect(typeof bridge.isSupported).toBe('function');
      expect(typeof bridge.getStore).toBe('function');
      expect(typeof bridge.produce).toBe('function');
    });

    it('should allow state updates via produce method', async () => {
      const initialState: TestState = { count: 0, name: 'Test' };
      const bridge = createMockNativeBridge<TestBridgeStores>({
        stores: {
          testFeature: {
            initialState,
          },
        },
      });

      // Update state using produce
      await bridge.produce('testFeature', (draft) => {
        draft.count = 10;
        draft.name = 'Updated';
      });

      // Get the store and check state
      const store = await bridge.getStore('testFeature');
      expect(store.getState()).toEqual({ count: 10, name: 'Updated' });
    });

    it('should notify subscribers when state changes via produce', async () => {
      const initialState: TestState = { count: 0, name: 'Test' };
      const bridge = createMockNativeBridge<TestBridgeStores>({
        stores: {
          testFeature: {
            initialState,
          },
        },
      });

      // Get the store and add a listener
      const store = await bridge.getStore('testFeature');
      const listener = vi.fn();
      store.subscribe(listener);

      // Clear initial call
      vi.clearAllMocks();

      // Update state using produce
      await bridge.produce('testFeature', (draft) => {
        draft.count = 10;
      });

      // Listener should have been called with new state
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ count: 10 }));
    });
  });
});
