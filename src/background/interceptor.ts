import { addUri as defaultAddUri } from '../shared/aria2Client';
import { shouldInterceptDownload } from '../shared/rules';
import { loadSettings, updateLastResult } from '../shared/settingsStorage';
import type {
  DownloadCandidate,
  ExtensionSettings,
  LastResult,
  RequestContextHeaders,
  RequestContextSettings
} from '../shared/types';

interface InterceptorDependencies {
  loadSettings: () => Promise<ExtensionSettings>;
  cancelDownload: (id: number) => Promise<void>;
  eraseDownload: (id: number) => Promise<void>;
  collectRequestContext: (
    url: string,
    settings: RequestContextSettings
  ) => Promise<RequestContextHeaders>;
  addUri: (
    settings: ExtensionSettings,
    url: string,
    headers: RequestContextHeaders
  ) => Promise<string>;
  saveLastResult: (result: LastResult) => Promise<void>;
  notify: (title: string, message: string) => Promise<void>;
  now: () => number;
}

export async function handleDownloadCreated(
  download: DownloadCandidate,
  dependencies: InterceptorDependencies
): Promise<void> {
  const settings = await dependencies.loadSettings();
  const decision = shouldInterceptDownload(
    download,
    settings.rules,
    settings.enabled
  );

  if (!decision.shouldIntercept) {
    return;
  }

  await dependencies.cancelDownload(download.id);
  await dependencies.eraseDownload(download.id);

  try {
    const headers = await dependencies.collectRequestContext(
      download.url,
      settings.requestContext
    );
    const gid = await dependencies.addUri(settings, download.url, headers);
    const result: LastResult = {
      status: 'success',
      url: download.url,
      filename: download.filename,
      gid,
      timestamp: dependencies.now()
    };
    await dependencies.saveLastResult(result);
    await dependencies.notify(
      'Download sent to aria2',
      download.filename ?? download.url
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const result: LastResult = {
      status: 'failure',
      url: download.url,
      filename: download.filename,
      message,
      timestamp: dependencies.now()
    };
    await dependencies.saveLastResult(result);
    await dependencies.notify('Failed to send download to aria2', message);
  }
}

export function createDefaultInterceptorDependencies(
  cancelDownload: (id: number) => Promise<void>,
  eraseDownload: (id: number) => Promise<void>,
  collectRequestContext: (
    url: string,
    settings: RequestContextSettings
  ) => Promise<RequestContextHeaders>,
  notify: (title: string, message: string) => Promise<void>
): InterceptorDependencies {
  return {
    loadSettings,
    cancelDownload,
    eraseDownload,
    collectRequestContext,
    addUri: defaultAddUri,
    saveLastResult: async (result) => {
      await updateLastResult(result);
    },
    notify,
    now: () => Date.now()
  };
}
