/// <reference types="vitest" />

interface MockReactNative {
  NativeModules: {
    StoreBridge: {
      initialize: import('vitest').Mock;
      sendEvent: import('vitest').Mock;
      subscribe: import('vitest').Mock;
    };
  };
  DeviceEventEmitter: {
    addListener: import('vitest').Mock;
    removeAllListeners: import('vitest').Mock;
  };
}

// Extend the NodeJS.Global interface to include our custom additions
declare global {
  var mockReactNative: MockReactNative;

  interface Window {
    ReactNativeWebView?: {
      postMessage: (data: string) => void;
    };
  }
}

export {};
