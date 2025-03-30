/**
 * @open-game-system/store-bridge
 * A universal bridge that connects web games and the OpenGame App through a shared state store.
 */
export type { Store, StoreDefinition, Bridge, NativeBridge, BridgeConfig } from './types';
import * as clientExports from './client';
export declare const client: typeof clientExports;
import * as nativeExports from './native';
export declare const native: typeof nativeExports;
import * as reactExports from './react';
export declare const react: typeof reactExports;
import * as testingExports from './testing';
export declare const testing: typeof testingExports;
export { produce, createDefaultState, isWebViewEnvironment } from './utils';
