import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock ResizeObserver for Radix UI components
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserver);

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn(),
      openOptionsPage: vi.fn(),
      onMessage: { addListener: vi.fn() }
    },
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn()
      }
    },
    cookies: {
      getAll: vi.fn()
    },
    downloads: {
      cancel: vi.fn(),
      onCreated: { addListener: vi.fn() }
    },
    notifications: {
      create: vi.fn()
    },
    webRequest: {
      onBeforeSendHeaders: { addListener: vi.fn() }
    }
  }
}));
