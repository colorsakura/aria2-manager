import type { ExtensionSettings } from './types';

export function createDefaultSettings(): ExtensionSettings {
  return {
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
  };
}
