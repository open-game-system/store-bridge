export interface MockReactNative {
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
