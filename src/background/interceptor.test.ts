import { describe, expect, it, vi } from 'vitest';
import { createDefaultSettings } from '../shared/defaultSettings';
import type {
  DownloadCandidate,
  LastResult,
  RequestContextHeaders
} from '../shared/types';
import { handleDownloadCreated } from './interceptor';

const download: DownloadCandidate = {
  id: 42,
  url: 'https://example.com/file.zip',
  filename: 'file.zip',
  totalBytes: 1024
};

function deps(
  overrides: Partial<Parameters<typeof handleDownloadCreated>[1]> = {}
) {
  const settings = createDefaultSettings();
  const savedResults: LastResult[] = [];

  return {
    loadSettings: vi.fn(async () => settings),
    cancelDownload: vi.fn(async () => undefined),
    eraseDownload: vi.fn(async () => undefined),
    collectRequestContext: vi.fn(
      async () =>
        ({ referer: 'https://example.com/page' }) as RequestContextHeaders
    ),
    addUri: vi.fn(async () => 'gid123'),
    saveLastResult: vi.fn(async (result: LastResult) => {
      savedResults.push(result);
    }),
    notify: vi.fn(async () => undefined),
    now: vi.fn(() => 1000),
    savedResults,
    ...overrides
  };
}

describe('handleDownloadCreated', () => {
  it('does nothing when disabled', async () => {
    const dependencyBag = deps({
      loadSettings: vi.fn(async () => ({
        ...createDefaultSettings(),
        enabled: false
      }))
    });

    await handleDownloadCreated(download, dependencyBag);

    expect(dependencyBag.cancelDownload).not.toHaveBeenCalled();
    expect(dependencyBag.eraseDownload).not.toHaveBeenCalled();
    expect(dependencyBag.addUri).not.toHaveBeenCalled();
  });

  it('does nothing when rules do not match', async () => {
    const settings = createDefaultSettings();
    settings.rules.extensions = ['iso'];
    settings.rules.minSizeMb = 100;
    const dependencyBag = deps({ loadSettings: vi.fn(async () => settings) });

    await handleDownloadCreated(download, dependencyBag);

    expect(dependencyBag.cancelDownload).not.toHaveBeenCalled();
    expect(dependencyBag.eraseDownload).not.toHaveBeenCalled();
    expect(dependencyBag.addUri).not.toHaveBeenCalled();
  });

  it('cancels matching download and sends it to aria2', async () => {
    const dependencyBag = deps();

    await handleDownloadCreated(download, dependencyBag);

    expect(dependencyBag.cancelDownload).toHaveBeenCalledWith(42);
    expect(dependencyBag.eraseDownload).toHaveBeenCalledWith(42);
    expect(dependencyBag.collectRequestContext).toHaveBeenCalledWith(
      'https://example.com/file.zip',
      createDefaultSettings().requestContext
    );
    expect(dependencyBag.addUri).toHaveBeenCalledWith(
      createDefaultSettings(),
      'https://example.com/file.zip',
      {
        referer: 'https://example.com/page'
      }
    );
    expect(dependencyBag.saveLastResult).toHaveBeenCalledWith({
      status: 'success',
      url: 'https://example.com/file.zip',
      filename: 'file.zip',
      gid: 'gid123',
      timestamp: 1000
    });
  });

  it('records and notifies failure without browser fallback', async () => {
    const dependencyBag = deps({
      addUri: vi.fn(async () => Promise.reject(new Error('HTTP 500')))
    });

    await handleDownloadCreated(download, dependencyBag);

    expect(dependencyBag.cancelDownload).toHaveBeenCalledWith(42);
    expect(dependencyBag.eraseDownload).toHaveBeenCalledWith(42);
    expect(dependencyBag.saveLastResult).toHaveBeenCalledWith({
      status: 'failure',
      url: 'https://example.com/file.zip',
      filename: 'file.zip',
      message: 'HTTP 500',
      timestamp: 1000
    });
    expect(dependencyBag.notify).toHaveBeenCalledWith(
      'Failed to send download to aria2',
      'HTTP 500'
    );
  });
});
