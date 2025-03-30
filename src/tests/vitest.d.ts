/// <reference types="vitest" />

import type { MockReactNative } from './types';

declare global {
  // eslint-disable-next-line no-var
  let mockReactNative: MockReactNative;

  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
