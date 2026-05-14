import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestContextSettings } from '../shared/types';
import { RequestContextTracker } from './requestContext';

const settings: RequestContextSettings = {
  sendCookies: true,
  sendReferer: true,
  sendUserAgent: true
};

describe('RequestContextTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('captures referer and user-agent from request headers', async () => {
    const tracker = new RequestContextTracker(async () => []);

    tracker.recordHeaders({
      url: 'https://example.com/file.zip',
      requestHeaders: [
        { name: 'Referer', value: 'https://example.com/page' },
        { name: 'User-Agent', value: 'Firefox Test' }
      ]
    });

    await expect(tracker.collect('https://example.com/file.zip', settings)).resolves.toEqual({
      referer: 'https://example.com/page',
      userAgent: 'Firefox Test'
    });
  });

  it('includes cookies when enabled', async () => {
    const tracker = new RequestContextTracker(async () => [
      { name: 'sid', value: '1' },
      { name: 'theme', value: 'dark' }
    ]);

    await expect(tracker.collect('https://example.com/file.zip', settings)).resolves.toEqual({
      cookie: 'sid=1; theme=dark'
    });
  });

  it('honors disabled context settings', async () => {
    const tracker = new RequestContextTracker(async () => [{ name: 'sid', value: '1' }]);

    tracker.recordHeaders({
      url: 'https://example.com/file.zip',
      requestHeaders: [
        { name: 'Referer', value: 'https://example.com/page' },
        { name: 'User-Agent', value: 'Firefox Test' }
      ]
    });

    await expect(
      tracker.collect('https://example.com/file.zip', {
        sendCookies: false,
        sendReferer: false,
        sendUserAgent: false
      })
    ).resolves.toEqual({});
  });

  it('expires old header records', async () => {
    const tracker = new RequestContextTracker(async () => [], 1000);

    tracker.recordHeaders({
      url: 'https://example.com/file.zip',
      requestHeaders: [{ name: 'Referer', value: 'https://example.com/page' }]
    });
    vi.advanceTimersByTime(1001);

    await expect(tracker.collect('https://example.com/file.zip', settings)).resolves.toEqual({});
  });
});
