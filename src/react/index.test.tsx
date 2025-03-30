/**
 * Tests for React integration
 */
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import type { Bridge, Store, StoreDefinition } from '../types';
import { createBridgeContext } from './index';

// Test types
interface TestState {
  count: number;
  name: string;
}

interface TestEvents {
  type: 'INCREMENT' | 'SET_NAME';
  payload?: any;
}

// Fix the interface to satisfy Record constraint
interface TestStores extends Record<string, StoreDefinition<any, any>> {
  test: StoreDefinition<TestState, TestEvents>;
}

// Mock objects for testing
const createMockStore = (): Store<TestState, TestEvents> => ({
  getState: () => ({ count: 0, name: 'Test' }),
  dispatch: () => {},
  subscribe: (listener) => {
    listener({ count: 0, name: 'Test' });
    return () => {};
  },
});

const createMockBridge = (): Bridge<TestStores> => ({
  isSupported: () => true,
  getStore: async () => createMockStore(),
});

describe('createBridgeContext', () => {
  it('creates a bridge context with Provider', () => {
    const BridgeContext = createBridgeContext<TestStores>();

    const { container } = render(
      <BridgeContext.Provider>
        <div>Bridge Provider Content</div>
      </BridgeContext.Provider>,
    );

    expect(container.textContent).toContain('Bridge Provider Content');
  });

  it('creates a bridge context with Supported component', () => {
    const BridgeContext = createBridgeContext<TestStores>();
    const mockBridge = createMockBridge();

    const { container } = render(
      <BridgeContext.Provider bridge={mockBridge}>
        <BridgeContext.Supported>
          <div>Supported Content</div>
        </BridgeContext.Supported>
      </BridgeContext.Provider>,
    );

    expect(container.textContent).toContain('Supported Content');
  });
});
