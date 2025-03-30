import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Run cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock for the WebView environment detection
Object.defineProperty(window, 'ReactNativeWebView', {
  value: {
    postMessage: vi.fn(),
  },
  writable: true,
});

// This handles the React Native specific APIs we need to test
// without requiring a full React Native environment
global.mockReactNative = {
  // Mock NativeModules for native bridge communication
  NativeModules: {
    StoreBridge: {
      initialize: vi.fn(),
      sendEvent: vi.fn(),
      subscribe: vi.fn(),
    },
  },
  // Mock for DeviceEventEmitter
  DeviceEventEmitter: {
    addListener: vi.fn().mockReturnValue({
      remove: vi.fn(),
    }),
    removeAllListeners: vi.fn(),
  },
};

// Mock global.console to catch and potentially suppress expected warnings during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out specific expected warnings if needed
  const suppressPatterns = [
    // Add patterns here to suppress specific known messages
    /Warning: ReactDOM.render is no longer supported/,
  ];

  const shouldSuppress = suppressPatterns.some((pattern) =>
    args.some((arg) => typeof arg === 'string' && pattern.test(arg))
  );

  if (!shouldSuppress) {
    originalConsoleError(...args);
  }
};
