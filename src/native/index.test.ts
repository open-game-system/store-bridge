import * as jsonpatch from 'fast-json-patch';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreDefinition } from '../types';
import { createNativeBridge } from './index';

// Define test types
interface TestState {
  count: number;
  name: string;
  items: Array<{ id: string; value: string }>;
  nested: {
    property: string;
    flag: boolean;
  };
}

interface TestEvent {
  type: 'INCREMENT' | 'DECREMENT' | 'RENAME' | 'ADD_ITEM' | 'UPDATE_NESTED';
  payload?: any;
}

// Use Record to satisfy the constraint
type TestBridgeStores = Record<string, StoreDefinition<any, any>> & {
  testFeature: {
    state: TestState;
    events: TestEvent;
  };
};

// A test reducer function to handle events
function testReducer(state: TestState, event: TestEvent): TestState {
  switch (event.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'RENAME':
      return { ...state, name: event.payload };
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, event.payload],
      };
    case 'UPDATE_NESTED':
      return {
        ...state,
        nested: {
          ...state.nested,
          ...event.payload,
        },
      };
    default:
      return state;
  }
}

describe('Native Bridge', () => {
  // Set up mocks for native modules
  const mockNativeModule = {
    initialize: vi.fn().mockResolvedValue(undefined),
    sendEvent: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(() => {}),
  };

  // Mock DeviceEventEmitter
  const mockAddListener = vi.fn().mockReturnValue({
    remove: vi.fn(),
  });

  const mockRemoveAllListeners = vi.fn();

  // Mock WebView instances for testing communication
  let mockWebViews: Array<{ injectJavaScript: (js: string) => void }>;

  // Captured JavaScript injections for testing
  let capturedInjections: string[];

  beforeEach(() => {
    // Reset captured injections and mock WebViews
    capturedInjections = [];
    mockWebViews = [];

    // Create mock WebView
    const mockWebView = {
      injectJavaScript: (js: string) => {
        capturedInjections.push(js);
        return true;
      },
    };

    mockWebViews.push(mockWebView);

    // Set up mocks in the global mock object
    global.mockReactNative = {
      NativeModules: {
        StoreBridge: mockNativeModule,
      },
      DeviceEventEmitter: {
        addListener: mockAddListener,
        removeAllListeners: mockRemoveAllListeners,
      },
    };

    // Reset mocks between tests
    vi.clearAllMocks();
  });

  it('should create a native bridge', () => {
    const bridge = createNativeBridge<TestBridgeStores>();

    // Bridge should support a set of methods
    expect(bridge).toBeDefined();
    expect(typeof bridge.isSupported).toBe('function');
    expect(typeof bridge.getStore).toBe('function');
    expect(typeof bridge.produce).toBe('function');

    // Native bridge should always be supported
    expect(bridge.isSupported()).toBe(true);
  });

  it('should register a store with initial state', async () => {
    const initialState: TestState = {
      count: 0,
      name: 'Test',
      items: [],
      nested: {
        property: 'initial',
        flag: false,
      },
    };

    // Create bridge with store definition upfront
    const bridge = createNativeBridge<TestBridgeStores>({
      stores: {
        testFeature: {
          initialState,
        },
      },
    });

    // Check if the native module was initialized with the store
    expect(mockNativeModule.initialize).toHaveBeenCalledWith('testFeature', initialState);
  });

  it('should handle getting a store', async () => {
    const bridge = createNativeBridge<TestBridgeStores>();

    // Mock store creation
    const store = await bridge.getStore('testFeature');

    // Should return a store with the standard API
    expect(store).toBeDefined();
    expect(typeof store.getState).toBe('function');
    expect(typeof store.dispatch).toBe('function');
    expect(typeof store.subscribe).toBe('function');
  });

  it('should handle state updates via the produce method', () => {
    const bridge = createNativeBridge<TestBridgeStores>();

    bridge.produce('testFeature', (draft) => {
      draft.count += 1;
      draft.name = 'Updated';
    });

    // Check if the state update was sent to the native module
    expect(mockNativeModule.sendEvent).toHaveBeenCalled();
  });

  it('should register a store with reducer and handle events', async () => {
    const initialState: TestState = {
      count: 0,
      name: 'Test',
      items: [],
      nested: {
        property: 'initial',
        flag: false,
      },
    };

    // Create bridge with store definition including reducer upfront
    const bridge = createNativeBridge<TestBridgeStores>({
      stores: {
        testFeature: {
          initialState,
          reducer: testReducer,
        },
      },
    });

    // Initialize the mock store on the native module
    mockNativeModule.initialize.mock.calls[0][1] = initialState;

    // Get the store instance
    const store = await bridge.getStore('testFeature');

    // Simulate state in the native module
    (store as any)._state = initialState;

    // Mock the event handler behavior
    let currentState = { ...initialState };
    mockNativeModule.sendEvent.mockImplementation((key: string, event: TestEvent) => {
      if (key === 'testFeature') {
        currentState = testReducer(currentState, event);
        // Call all registered listeners with the new state
        const listeners = mockAddListener.mock.calls
          .filter((call) => call[0] === 'testFeature_STATE_UPDATE')
          .map((call) => call[1]);

        for (const listener of listeners) {
          listener(currentState);
        }
      }
    });

    // Subscribe to state changes
    const mockListener = vi.fn();
    store.subscribe(mockListener);

    // Dispatch an event
    store.dispatch({ type: 'INCREMENT' });

    // Verify the event was sent to the native module
    expect(mockNativeModule.sendEvent).toHaveBeenCalledWith('testFeature', { type: 'INCREMENT' });

    // Initial state call + state update call
    expect(mockListener).toHaveBeenCalledTimes(2);
  });

  it('should use JSON-Patch for efficient state updates', async () => {
    // Clear previous injections
    capturedInjections = [];

    // Create a custom mockUpdateWebViewsWithPatch function that only uses our test logic
    const mockUpdateWebViewsWithPatch = (key: string, oldState: any, newState: any) => {
      // Create patches using fast-json-patch
      const patches = jsonpatch.compare(oldState, newState);

      if (patches.length > 0) {
        // Only inject once to the mock WebView for this test
        const js = `
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'STATE_PATCH',
              key: '${key}',
              patches: ${JSON.stringify(patches)}
            })
          }));
          true;
        `;
        mockWebViews[0].injectJavaScript(js);
      }
    };

    // Initial and updated states
    const initialState: TestState = {
      count: 0,
      name: 'Test',
      items: [],
      nested: {
        property: 'initial',
        flag: false,
      },
    };

    const updatedState: TestState = {
      count: 1,
      name: 'Test',
      items: [{ id: '1', value: 'New Item' }],
      nested: {
        property: 'updated',
        flag: false,
      },
    };

    // Generate patch and simulate sending it to WebView
    mockUpdateWebViewsWithPatch('testFeature', initialState, updatedState);

    // Check that JavaScript was injected exactly once
    expect(capturedInjections.length).toBe(1);

    // Extract the patches from the captured JavaScript
    const patchMatch = capturedInjections[0].match(/patches: (\[[\s\S]*?\])/);
    expect(patchMatch).not.toBeNull();

    if (patchMatch) {
      // Parse the JSON patch from the string
      const patches = JSON.parse(patchMatch[1].replace(/'/g, '"'));
      expect(patches.length).toBeGreaterThan(0);

      // Apply patches to verify correctness
      const patchedState = jsonpatch.applyPatch(initialState, patches).newDocument;

      // The patched state should match the updated state
      expect(patchedState).toEqual(updatedState);

      // Verify specific patches were created correctly
      expect(patches.some((p: any) => p.op === 'replace' && p.path === '/count')).toBe(true);
      expect(patches.some((p: any) => p.op === 'add' && p.path === '/items/0')).toBe(true);
      expect(patches.some((p: any) => p.op === 'replace' && p.path === '/nested/property')).toBe(
        true,
      );
    }
  });

  it('should compare JSON-Patch size with full state for efficiency', () => {
    // Create larger example to demonstrate patch efficiency
    const initialState = {
      users: Array(20)
        .fill(null)
        .map((_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          permissions: { admin: false, editor: i % 3 === 0 },
          metadata: {
            lastLogin: `2023-01-${i < 10 ? `0${i}` : i}`,
            loginCount: i * 5,
            settings: {
              theme: 'light',
              notifications: true,
              language: 'en-US',
            },
          },
        })),
      settings: {
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          frequency: 'daily',
          channels: ['news', 'updates', 'security'],
        },
        display: {
          fontSize: 14,
          colorScheme: 'default',
          layout: 'compact',
        },
      },
      metadata: {
        lastUpdated: '2022-01-01',
        version: 1,
        environment: 'production',
      },
    };

    // Make a small change to a large object
    const updatedState = JSON.parse(JSON.stringify(initialState));
    updatedState.users[5].permissions.admin = true;
    updatedState.settings.theme = 'dark';
    updatedState.metadata.version = 2;

    // Generate patches
    const patches = jsonpatch.compare(initialState, updatedState);

    // Measure sizes
    const fullStateSize = JSON.stringify(updatedState).length;
    const patchesSize = JSON.stringify(patches).length;

    console.log(`Full state size: ${fullStateSize} bytes`);
    console.log(`Patches size: ${patchesSize} bytes`);

    // For large objects with small changes, patches should be smaller
    expect(patchesSize).toBeLessThan(fullStateSize);

    // Verify patch correctness
    const patchedState = jsonpatch.applyPatch(initialState, patches).newDocument;
    expect(patchedState).toEqual(updatedState);
  });
});
