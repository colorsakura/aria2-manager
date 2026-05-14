import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addUri, getActiveTasks, testConnection } from './aria2Client';
import type { ExtensionSettings, RequestContextHeaders } from './types';

const settings: ExtensionSettings = {
  enabled: true,
  rpcUrl: 'http://localhost:6800/jsonrpc',
  rpcToken: 'secret',
  rules: { extensions: [], minSizeMb: 0, includedDomains: [], excludedDomains: [] },
  requestContext: { sendCookies: true, sendReferer: true, sendUserAgent: true },
  lastResult: null
};

function mockFetchJson(json: unknown, ok = true) {
  globalThis.fetch = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => json
  })) as unknown as typeof fetch;
}

describe('aria2Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('tests connection with aria2.getVersion', async () => {
    mockFetchJson({ jsonrpc: '2.0', id: 'test', result: { version: '1.37.0' } });

    await expect(testConnection(settings)).resolves.toEqual({ ok: true, version: '1.37.0' });
  });

  it('adds token as first param when configured', async () => {
    mockFetchJson({ jsonrpc: '2.0', id: 'add-uri', result: 'abc123' });

    await addUri(settings, 'https://example.com/file.zip', {});

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.method).toBe('aria2.addUri');
    expect(body.params[0]).toBe('token:secret');
    expect(body.params[1]).toEqual(['https://example.com/file.zip']);
  });

  it('sends selected headers to aria2', async () => {
    mockFetchJson({ jsonrpc: '2.0', id: 'add-uri', result: 'abc123' });
    const headers: RequestContextHeaders = {
      cookie: 'sid=1',
      referer: 'https://example.com/page',
      userAgent: 'Firefox Test'
    };

    await addUri(settings, 'https://example.com/file.zip', headers);

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.params[2]).toEqual({
      header: ['Cookie: sid=1', 'Referer: https://example.com/page', 'User-Agent: Firefox Test']
    });
  });

  it('normalizes active tasks', async () => {
    mockFetchJson({
      jsonrpc: '2.0',
      id: 'active',
      result: [
        {
          gid: '1',
          status: 'active',
          totalLength: '100',
          completedLength: '25',
          downloadSpeed: '10',
          files: [{ path: '/tmp/file.zip' }]
        }
      ]
    });

    await expect(getActiveTasks(settings)).resolves.toEqual([
      { gid: '1', name: 'file.zip', status: 'active', progress: 25, downloadSpeed: 10 }
    ]);
  });

  it('returns failed status when RPC returns error', async () => {
    mockFetchJson({ jsonrpc: '2.0', id: 'test', error: { code: 1, message: 'Unauthorized' } });

    await expect(testConnection(settings)).resolves.toEqual({ ok: false, message: 'Unauthorized' });
  });
});
