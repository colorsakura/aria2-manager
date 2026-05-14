import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings } from './defaultSettings';
import { loadSettings, saveSettings, updateEnabled, updateLastResult } from './settingsStorage';

const storage = new Map<string, unknown>();

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storage.get(key) })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(items)) storage.set(key, value);
        })
      }
    }
  }
}));

describe('settingsStorage', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('loads defaults when storage is empty', async () => {
    await expect(loadSettings()).resolves.toEqual(createDefaultSettings());
  });

  it('merges stored partial settings with defaults', async () => {
    storage.set('settings', { rpcUrl: 'http://localhost:6801/jsonrpc', rules: { minSizeMb: 25 } });

    const settings = await loadSettings();

    expect(settings.rpcUrl).toBe('http://localhost:6801/jsonrpc');
    expect(settings.rules.minSizeMb).toBe(25);
    expect(settings.rules.extensions).toEqual(createDefaultSettings().rules.extensions);
  });

  it('saves complete settings', async () => {
    const settings = { ...createDefaultSettings(), enabled: false };

    await saveSettings(settings);

    expect(storage.get('settings')).toEqual(settings);
  });

  it('updates enabled without discarding other settings', async () => {
    storage.set('settings', { rpcUrl: 'http://localhost:6801/jsonrpc' });

    await updateEnabled(false);

    expect((storage.get('settings') as { enabled: boolean }).enabled).toBe(false);
    expect((storage.get('settings') as { rpcUrl: string }).rpcUrl).toBe('http://localhost:6801/jsonrpc');
  });

  it('updates last result', async () => {
    const result = {
      status: 'failure' as const,
      url: 'https://example.com/file.zip',
      message: 'RPC failed',
      timestamp: 1
    };

    await updateLastResult(result);

    expect((storage.get('settings') as { lastResult: unknown }).lastResult).toEqual(result);
  });
});
