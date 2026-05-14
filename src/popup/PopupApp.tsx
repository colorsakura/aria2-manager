import { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { sendRuntimeMessage } from '../shared/messages';
import type {
  Aria2ActiveTask,
  ExtensionSettings,
  RpcStatus,
  RuleSettings
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

  async function updateRules(rules: RuleSettings) {
    if (!state) return;
    const settings = { ...state.settings, rules };
    setState({ ...state, settings });
    await sendRuntimeMessage({ type: 'settings:save', settings }, 'ok');
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

      <section className="space-y-2 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
        <h2 className="font-medium">Interception rules</h2>
        <RuleToggle
          label="Extension rule"
          checked={state.settings.rules.extensionsEnabled}
          onChange={(extensionsEnabled) =>
            void updateRules({ ...state.settings.rules, extensionsEnabled })
          }
        />
        <RuleToggle
          label="Minimum size rule"
          checked={state.settings.rules.minSizeEnabled}
          onChange={(minSizeEnabled) =>
            void updateRules({ ...state.settings.rules, minSizeEnabled })
          }
        />
        <RuleToggle
          label="Included domains rule"
          checked={state.settings.rules.includedDomainsEnabled}
          onChange={(includedDomainsEnabled) =>
            void updateRules({
              ...state.settings.rules,
              includedDomainsEnabled
            })
          }
        />
        <RuleToggle
          label="Excluded domains rule"
          checked={state.settings.rules.excludedDomainsEnabled}
          onChange={(excludedDomainsEnabled) =>
            void updateRules({
              ...state.settings.rules,
              excludedDomainsEnabled
            })
          }
        />
      </section>

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

      <div className="flex justify-end">
        <button
          aria-label="Settings"
          className="inline-flex size-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          title="Settings"
          onClick={() => {
            void browser.runtime.openOptionsPage();
          }}
        >
          <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92l-.03.08a2 2 0 0 1-3.86 0l-.03-.08A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1l-.08-.03a2 2 0 0 1 0-3.86l.08-.03A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92l.03-.08a2 2 0 0 1 3.86 0l.03.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .92 1l.08.03a2 2 0 0 1 0 3.86l-.08.03a1.7 1.7 0 0 0-.92 1Z" />
          </svg>
        </button>
      </div>
    </main>
  );
}

function RuleToggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <input
        aria-label={label}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </label>
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
