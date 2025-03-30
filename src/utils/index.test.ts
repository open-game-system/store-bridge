import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultState, createPatch, isWebViewEnvironment, produce } from './index';

/**
 * Tests for utilities
 */

// Augment window with ReactNativeWebView property
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

describe('Utils', () => {
  describe('isWebViewEnvironment', () => {
    const originalWindow = global.window;

    beforeEach(() => {
      // Mock the window object
      Object.defineProperty(global, 'window', {
        value: {
          ReactNativeWebView: undefined,
        },
        writable: true,
      });
    });

    afterEach(() => {
      // Restore original window
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      });
    });

    it('should return true when ReactNativeWebView exists', () => {
      // Add ReactNativeWebView to the mocked window
      global.window.ReactNativeWebView = {
        postMessage: () => {},
      };

      expect(isWebViewEnvironment()).toBe(true);
    });

    it('should return false when ReactNativeWebView does not exist', () => {
      // Remove ReactNativeWebView from the mocked window
      global.window.ReactNativeWebView = undefined;

      expect(isWebViewEnvironment()).toBe(false);
    });
  });

  describe('createDefaultState', () => {
    it('should return an empty object by default', () => {
      const state = createDefaultState({});
      expect(state).toEqual({});
    });

    it('should return the provided state', () => {
      const initialState = { foo: 'bar' };
      const state = createDefaultState(initialState);
      expect(state).toEqual(initialState);
    });
  });

  describe('produce', () => {
    it('should apply changes to state immutably', () => {
      const initialState = { count: 0, name: 'test' };

      const newState = produce(initialState, (draft) => {
        draft.count = 1;
      });

      expect(newState).not.toBe(initialState);
      expect(newState.count).toBe(1);
      expect(newState.name).toBe('test');
    });

    it('should handle nested objects', () => {
      const initialState = {
        user: {
          name: 'John',
          settings: {
            theme: 'light',
            notifications: true,
          },
        },
      };

      const newState = produce(initialState, (draft) => {
        draft.user.name = 'Jane';
        draft.user.settings.theme = 'dark';
      });

      // Should have updated values
      expect(newState.user.name).toBe('Jane');
      expect(newState.user.settings.theme).toBe('dark');
      expect(newState.user.settings.notifications).toBe(true);

      // Original state should not be modified
      expect(initialState.user.name).toBe('John');
      expect(initialState.user.settings.theme).toBe('light');
    });

    it('should handle arrays', () => {
      interface Todo {
        id: number;
        text: string;
        completed: boolean;
      }

      const initialState: { todos: Todo[] } = {
        todos: [
          { id: 1, text: 'Todo 1', completed: false },
          { id: 2, text: 'Todo 2', completed: false },
        ],
      };

      const newState = produce(initialState, (draft) => {
        draft.todos[0].completed = true;
        draft.todos.push({ id: 3, text: 'Todo 3', completed: false });
      });

      // Should have updated values
      expect(newState.todos[0].completed).toBe(true);
      expect(newState.todos.length).toBe(3);
      expect(newState.todos[2].id).toBe(3);

      // Original state should not be modified
      expect(initialState.todos[0].completed).toBe(false);
      expect(initialState.todos.length).toBe(2);
    });
  });

  describe('createPatch', () => {
    it('should return the new object (simplified implementation)', () => {
      const oldState = { count: 0, name: 'Test' };
      const newState = { count: 5, name: 'Updated' };

      const patch = createPatch(oldState, newState);

      // For the simplified implementation, it just returns the full new object
      expect(patch).toEqual(newState);
    });

    it('should handle nested objects (simplified implementation)', () => {
      const oldState = {
        user: {
          name: 'John',
          settings: {
            theme: 'light',
          },
        },
      };

      const newState = {
        user: {
          name: 'Jane',
          settings: {
            theme: 'dark',
          },
        },
      };

      const patch = createPatch(oldState, newState);

      // For the simplified implementation, it just returns the full new object
      expect(patch).toEqual(newState);
    });

    it('should handle array modifications (simplified implementation)', () => {
      interface Todo {
        id: number;
        text: string;
        completed: boolean;
      }

      const oldState: { todos: Todo[] } = {
        todos: [
          { id: 1, text: 'Todo 1', completed: false },
          { id: 2, text: 'Todo 2', completed: false },
        ],
      };

      const newState: { todos: Todo[] } = {
        todos: [
          { id: 1, text: 'Todo 1', completed: true },
          { id: 2, text: 'Todo 2', completed: false },
          { id: 3, text: 'Todo 3', completed: false },
        ],
      };

      const patch = createPatch(oldState, newState);

      // For the simplified implementation, it just returns the full new object
      expect(patch).toEqual(newState);
    });
  });
});
