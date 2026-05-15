export type LastResult =
  | {
      status: 'success';
      url: string;
      filename?: string;
      gid: string;
      timestamp: number;
    }
  | {
      status: 'failure';
      url: string;
      filename?: string;
      message: string;
      timestamp: number;
    };

export interface RuleSettings {
  extensionsEnabled: boolean;
  extensions: string[];
  minSizeEnabled: boolean;
  minSizeMb: number;
  includedDomainsEnabled: boolean;
  includedDomains: string[];
  excludedDomainsEnabled: boolean;
  excludedDomains: string[];
}

export interface RequestContextSettings {
  sendCookies: boolean;
  sendReferer: boolean;
  sendUserAgent: boolean;
}

export interface ExtensionSettings {
  enabled: boolean;
  rpcUrl: string;
  rpcToken: string;
  rules: RuleSettings;
  requestContext: RequestContextSettings;
  language?: string;
  lastResult: LastResult | null;
}

export interface DownloadCandidate {
  id: number;
  url: string;
  filename?: string;
  totalBytes?: number;
}

export interface RuleDecision {
  shouldIntercept: boolean;
  reason: string;
}

export interface RequestContextHeaders {
  cookie?: string;
  referer?: string;
  userAgent?: string;
}

export interface Aria2ActiveTask {
  gid: string;
  name: string;
  status: string;
  progress: number;
  downloadSpeed: number;
}

export type RpcStatus =
  | { ok: true; version: string }
  | { ok: false; message: string };

export type RuntimeRequest =
  | { type: 'settings:get' }
  | { type: 'settings:save'; settings: ExtensionSettings }
  | { type: 'settings:setEnabled'; enabled: boolean }
  | { type: 'aria2:test' }
  | { type: 'aria2:activeTasks' }
  | { type: 'popup:getState' };

export type RuntimeResponse =
  | { type: 'settings'; settings: ExtensionSettings }
  | { type: 'ok' }
  | { type: 'rpcStatus'; status: RpcStatus }
  | { type: 'activeTasks'; tasks: Aria2ActiveTask[]; status: RpcStatus }
  | {
      type: 'popupState';
      settings: ExtensionSettings;
      rpcStatus: RpcStatus;
      tasks: Aria2ActiveTask[];
    };
