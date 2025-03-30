import type { MockReactNative } from './tests/types';

declare global {
  // Need to use var for global augmentation
  // biome-ignore lint/style/noVar: This is a declaration file where var is required for global augmentation
  var mockReactNative: MockReactNative;
}
