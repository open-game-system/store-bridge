/**
 * Utility functions for the @open-game-system/store-bridge package
 */
import deepMerge from 'deepmerge';
import * as jsonpatch from 'fast-json-patch';

// Declare ReactNativeWebView property on Window interface
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
export function produce<T>(state: T, recipe: (draft: T) => void): T {
  // Create a deep clone of the state
  const draft = JSON.parse(JSON.stringify(state)) as T;

  // Apply the recipe function to the draft
  recipe(draft);

  // Return the new state
  return draft;
}

/**
 * Creates a default state by deep-merging optional properties onto a base state
 *
 * @param baseState Base state to start with
 * @param optionalProperties Optional properties to merge onto the base state
 * @returns A new state with all properties merged
 */
export function createDefaultState<T>(baseState: T, optionalProperties?: Partial<T>): T {
  if (!optionalProperties) {
    return { ...baseState };
  }

  return deepMerge(baseState, optionalProperties);
}

/**
 * Detects if code is running in a WebView environment
 *
 * @returns True if running in a WebView, false otherwise
 */
export function isWebViewEnvironment(): boolean {
  return typeof window !== 'undefined' && window.ReactNativeWebView !== undefined;
}

/**
 * Creates a JSON patch representing the differences between two objects
 * This is a simple implementation - in production, you might use a library like fast-json-patch
 *
 * @param oldObj The old object state
 * @param newObj The new object state
 * @returns A patch object describing the changes
 */
export function createPatch<T>(oldObj: T, newObj: T): T {
  // For this simplified implementation, we just return the full new object
  // In a real implementation, this would calculate only the changed parts
  return newObj;
}
