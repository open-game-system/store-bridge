declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
/**
 * A simpler immutable state updater inspired by Immer
 *
 * @param state Current state
 * @param recipe Function that modifies a draft state
 * @returns New state with the changes applied
 */
export declare function produce<T>(state: T, recipe: (draft: T) => void): T;
/**
 * Creates a default state by deep-merging optional properties onto a base state
 *
 * @param baseState Base state to start with
 * @param optionalProperties Optional properties to merge onto the base state
 * @returns A new state with all properties merged
 */
export declare function createDefaultState<T>(baseState: T, optionalProperties?: Partial<T>): T;
/**
 * Detects if code is running in a WebView environment
 *
 * @returns True if running in a WebView, false otherwise
 */
export declare function isWebViewEnvironment(): boolean;
/**
 * Creates a JSON patch representing the differences between two objects
 * This is a simple implementation - in production, you might use a library like fast-json-patch
 *
 * @param oldObj The old object state
 * @param newObj The new object state
 * @returns A patch object describing the changes
 */
export declare function createPatch<T>(oldObj: T, newObj: T): T;
