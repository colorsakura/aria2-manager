import { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { sendRuntimeMessage } from '../shared/messages';
import type {
  Aria2ActiveTask,
  ExtensionSettings,
  RpcStatus
} from '../shared/types';

interface PopupState {
  settings: ExtensionSettings;
  rpcStatus: RpcStatus;
  tasks: Aria2ActiveTask[];
}

const POPUP_REFRESH_INTERVAL_MS = 1000;

export function PopupApp() {
  const [state, setState] = useState<PopupState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await sendRuntimeMessage(
        { type: 'popup:getState' },
        'popupState'
      );
      setState({
        settings: response.settings,
        rpcStatus: response.rpcStatus,
        tasks: response.tasks
      });
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Failed to load popup state'
      );
    }
  }, []);

  useEffect(() => {
    void refresh();
    const refreshTimer = window.setInterval(() => {
      void refresh();
    }, POPUP_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [refresh]);

  async function toggleEnabled(enabled: boolean) {
    if (!state) return;
    setState({ ...state, settings: { ...state.settings, enabled } });
    await sendRuntimeMessage({ type: 'settings:setEnabled', enabled }, 'ok');
  }

  if (error) {
    return <main className="w-96 p-4 text-sm text-red-700">{error}</main>;
  }

  if (!state) {
    return <main className="w-96 p-4 text-sm text-slate-600">Loading...</main>;
  }

  return (
    <main className="w-96 space-y-4 bg-slate-50 p-4 text-sm text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Aria2 Manager</h1>
        <span
          className={
            state.settings.enabled ? 'text-emerald-600' : 'text-slate-500'
          }
        >
          {state.settings.enabled ? 'Enabled' : 'Paused'}
        </span>
      </header>

      <label className="flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
        <input
          aria-label="Enable interception"
          type="checkbox"
          checked={state.settings.enabled}
          onChange={(event) => void toggleEnabled(event.currentTarget.checked)}
        />
        <span>Enable interception</span>
      </label>

      <section className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <p>
            {state.rpcStatus.ok
              ? `Connected: aria2 ${state.rpcStatus.version}`
              : `Disconnected: ${state.rpcStatus.message}`}
          </p>
          <button
            className="rounded bg-slate-900 px-3 py-1 text-white dark:bg-slate-100 dark:text-slate-900"
            onClick={() => void refresh()}
          >
            Test
          </button>
        </div>
      </section>

      <section className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
        <h2 className="mb-2 font-medium">Latest result</h2>
        <p>{formatLastResult(state.settings)}</p>
      </section>

      <section className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
        <h2 className="mb-2 font-medium">Active tasks</h2>
        {state.tasks.length === 0 ? (
          <p className="text-slate-500">No active tasks</p>
        ) : (
          <ul className="space-y-2">
            {state.tasks.map((task) => (
              <li
                key={task.gid}
                className="rounded border border-slate-200 p-2 dark:border-slate-700"
              >
                <div className="flex justify-between gap-2">
                  <span className="truncate font-medium">{task.name}</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="text-xs text-slate-500">
                  {task.status} · {formatSpeed(task.downloadSpeed)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        className="w-full rounded bg-blue-600 px-3 py-2 text-white"
        onClick={() => {
          void browser.runtime.openOptionsPage();
        }}
      >
        Settings
      </button>
    </main>
  );
}

function formatLastResult(settings: ExtensionSettings): string {
  const result = settings.lastResult;
  if (!result) {
    return 'No intercepted downloads yet';
  }

  const label = result.filename ?? result.url;
  if (result.status === 'success') {
    return `Last: ${label} sent to aria2`;
  }

  return `Last failed: ${label} — ${result.message}`;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond >= 1024 * 1024) {
    return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`;
  }
  if (bytesPerSecond >= 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }
  return `${bytesPerSecond} B/s`;
}
