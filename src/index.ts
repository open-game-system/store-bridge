/**
 * @open-game-system/store-bridge
 * A universal bridge that connects web games and the OpenGame App through a shared state store.
 */

// Re-export from types
export type {
  Store,
  StoreDefinition,
  Bridge,
  NativeBridge,
  BridgeConfig,
} from './types';

// Client exports
import * as clientExports from './client';
export const client = clientExports;

// Native exports
import * as nativeExports from './native';
export const native = nativeExports;

// React exports
import * as reactExports from './react';
export const react = reactExports;

// Testing exports
import * as testingExports from './testing';
export const testing = testingExports;

// Utils exports
export { produce, createDefaultState, isWebViewEnvironment } from './utils';
