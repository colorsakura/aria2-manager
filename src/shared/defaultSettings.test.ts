import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from './defaultSettings';

describe('createDefaultSettings', () => {
  it('returns the MVP defaults from the design spec', () => {
    expect(createDefaultSettings()).toEqual({
      enabled: true,
      rpcUrl: 'http://localhost:6800/jsonrpc',
      rpcToken: '',
      rules: {
        extensionsEnabled: true,
        extensions: ['zip', '7z', 'rar', 'tar', 'gz', 'iso', 'mp4', 'mkv'],
        minSizeEnabled: true,
        minSizeMb: 10,
        includedDomainsEnabled: false,
        includedDomains: [],
        excludedDomainsEnabled: false,
        excludedDomains: []
      },
      requestContext: {
        sendCookies: true,
        sendReferer: true,
        sendUserAgent: true
      },
      lastResult: null
    });
  });

  it('returns a fresh object each time', () => {
    const first = createDefaultSettings();
    const second = createDefaultSettings();

    first.rules.extensions.push('exe');

    expect(second.rules.extensions).not.toContain('exe');
  });
});
