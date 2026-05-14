import type { ExtensionSettings } from './types';

export function createDefaultSettings(): ExtensionSettings {
  return {
    enabled: true,
    rpcUrl: 'http://localhost:6800/jsonrpc',
    rpcToken: '',
    rules: {
      extensions: ['zip', '7z', 'rar', 'tar', 'gz', 'iso', 'mp4', 'mkv'],
      minSizeMb: 10,
      includedDomains: [],
      excludedDomains: []
    },
    requestContext: {
      sendCookies: true,
      sendReferer: true,
      sendUserAgent: true
    },
    lastResult: null
  };
}
