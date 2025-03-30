import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreDefinition } from '../types';
import * as utils from '../utils';
import { createBridge, createStore } from './index';

// Mock window object for tests
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

// Define test types
interface TestState {
  count: number;
  name: string;
}

interface TestEvent {
  type: 'INCREMENT' | 'DECREMENT' | 'SET_NAME';
  payload?: any;
}

type TestBridgeStores = Record<string, StoreDefinition<any, any>> & {
  testFeature: {
    state: TestState;
    events: TestEvent;
  };
};

describe('Client Module', () => {
  describe('WebView bridge', () => {
    // Save original window object
    const originalWindow = global.window;

    // Save original process.env
    const originalEnv = process.env;

    // Mock utils.isWebViewEnvironment
    const mockIsWebViewEnvironment = vi.spyOn(utils, 'isWebViewEnvironment');

    beforeEach(() => {
      // Reset mocks
      vi.resetAllMocks();

      // Default to browser environment (not WebView)
      mockIsWebViewEnvironment.mockReturnValue(false);

      // Mock window with message event capability
      global.window = {
        addEventListener: vi.fn(),
      } as any;

      // Set NODE_ENV to test
      process.env = { ...originalEnv, NODE_ENV: 'test' };
    });

    afterEach(() => {
      // Restore original window
      global.window = originalWindow;

      // Restore original process.env
      process.env = originalEnv;
    });

    describe('createBridge', () => {
      it('should create a bridge', () => {
        const bridge = createBridge();
        expect(bridge).toBeDefined();
        expect(bridge.isSupported).toBeDefined();
        expect(bridge.getStore).toBeDefined();
      });

      it('should return true for isSupported in test environment', () => {
        // In test environment, isSupported always returns true
        const bridge = createBridge<TestBridgeStores>();
        expect(bridge.isSupported()).toBe(true);
      });

      it('should not set up message handler when in test environment', () => {
        createBridge<TestBridgeStores>();

        // Should not add event listener
        expect(window.addEventListener).not.toHaveBeenCalled();
      });

      it('should create and return a store', async () => {
        const bridge = createBridge<TestBridgeStores>();

        const store = await bridge.getStore('testFeature');

        expect(store).toBeDefined();
        expect(typeof store.getState).toBe('function');
        expect(typeof store.dispatch).toBe('function');
        expect(typeof store.subscribe).toBe('function');
      });

      it('should return new mock store instances for each request in test environment', async () => {
        // In test environment, each getStore call returns a new mock store
        const bridge = createBridge<TestBridgeStores>();

        const store1 = await bridge.getStore('testFeature');
        const store2 = await bridge.getStore('testFeature');

        // In test environment, each store is a new instance
        expect(store1).not.toBe(store2);
      });
    });

    describe('createStore', () => {
      it('should create a store with standard interface methods', () => {
        const store = createStore<TestState, TestEvent>();

        expect(store).toBeDefined();
        expect(typeof store.getState).toBe('function');
        expect(typeof store.dispatch).toBe('function');
        expect(typeof store.subscribe).toBe('function');
      });

      it('should initialize store with mock state in test environment', () => {
        const store = createStore<TestState, TestEvent>('testFeature', false);

        const state = store.getState();
        expect(state).toEqual({ count: 0, name: 'Test' });
      });

      it('should notify subscriber with mock state in test environment', () => {
        const store = createStore<TestState, TestEvent>();

        const listener = vi.fn();
        store.subscribe(listener);

        // Should call listener once with mock state
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ count: 0, name: 'Test' });
      });

      it('should return unsubscribe function that removes the listener', () => {
        const store = createStore<TestState, TestEvent>();

        // Add a listener and get unsubscribe function
        const listener = vi.fn();
        const unsubscribe = store.subscribe(listener);

        // Call unsubscribe
        unsubscribe();

        // Reset mock to clear initial call
        vi.clearAllMocks();

        // Dispatch an event
        store.dispatch({ type: 'INCREMENT' });

        // Listener should not be called
        expect(listener).not.toHaveBeenCalled();
      });
    });
  });
});
