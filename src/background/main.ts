import browser from 'webextension-polyfill';
import { getActiveTasks, testConnection } from '../shared/aria2Client';
import {
  loadSettings,
  saveSettings,
  updateEnabled
} from '../shared/settingsStorage';
import type {
  DownloadCandidate,
  RuntimeRequest,
  RuntimeResponse
} from '../shared/types';
import {
  createDefaultInterceptorDependencies,
  handleDownloadCreated
} from './interceptor';
import { RequestContextTracker } from './requestContext';

const requestContextTracker = new RequestContextTracker((url) =>
  browser.cookies.getAll({ url })
);

browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    requestContextTracker.recordHeaders({
      url: details.url,
      requestHeaders: details.requestHeaders?.map((header) => ({
        name: header.name,
        value: header.value
      }))
    });
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

browser.downloads.onCreated.addListener((downloadItem) => {
  const download: DownloadCandidate = {
    id: downloadItem.id,
    url: downloadItem.url,
    filename: downloadItem.filename,
    totalBytes:
      downloadItem.totalBytes > 0 ? downloadItem.totalBytes : undefined
  };

  void handleDownloadCreated(
    download,
    createDefaultInterceptorDependencies(
      (id) => browser.downloads.cancel(id),
      async (id) => {
        await browser.downloads.erase({ id });
      },
      (url, settings) => requestContextTracker.collect(url, settings),
      notify
    )
  );
});

browser.runtime.onMessage.addListener((request: unknown) =>
  handleRuntimeMessage(request as RuntimeRequest)
);

async function handleRuntimeMessage(
  request: RuntimeRequest
): Promise<RuntimeResponse> {
  if (request.type === 'settings:get') {
    return { type: 'settings', settings: await loadSettings() };
  }

  if (request.type === 'settings:save') {
    await saveSettings(request.settings);
    return { type: 'ok' };
  }

  if (request.type === 'settings:setEnabled') {
    await updateEnabled(request.enabled);
    return { type: 'ok' };
  }

  if (request.type === 'aria2:test') {
    return {
      type: 'rpcStatus',
      status: await testConnection(await loadSettings())
    };
  }

  if (request.type === 'aria2:activeTasks') {
    const settings = await loadSettings();
    const status = await testConnection(settings);
    const tasks = status.ok ? await getActiveTasks(settings) : [];
    return { type: 'activeTasks', tasks, status };
  }

  if (request.type === 'popup:getState') {
    const settings = await loadSettings();
    const rpcStatus = await testConnection(settings);
    const tasks = rpcStatus.ok ? await getActiveTasks(settings) : [];
    return { type: 'popupState', settings, rpcStatus, tasks };
  }

  return { type: 'ok' };
}

async function notify(title: string, message: string): Promise<void> {
  await browser.notifications.create({
    type: 'basic',
    title,
    message
  });
}
