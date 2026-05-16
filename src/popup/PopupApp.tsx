import { type TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { Button, Card, Label, Switch } from '@heroui/react';
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
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<PopupState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await sendRuntimeMessage(
        { type: 'popup:getState' },
        'popupState'
      );
      if (response.settings.language) {
        await i18n.changeLanguage(response.settings.language);
      }
      setState({
        settings: response.settings,
        rpcStatus: response.rpcStatus,
        tasks: response.tasks
      });
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t('Failed to load popup state')
      );
    }
  }, [i18n, t]);

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
    return (
      <main className="w-96 p-4 text-sm text-slate-600">{t('Loading...')}</main>
    );
  }

  return (
    <Card className="w-96 space-y-4 p-4 text-sm">
      <Card.Header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Card.Title className="text-lg font-semibold">
            {t('Aria2 Manager')}
          </Card.Title>
          <span
            aria-label={
              state.rpcStatus.ok ? t('RPC connected') : t('RPC disconnected')
            }
            className={
              state.rpcStatus.ok
                ? 'size-2.5 rounded-full bg-emerald-500'
                : 'size-2.5 rounded-full bg-red-500'
            }
            title={
              state.rpcStatus.ok ? t('RPC connected') : t('RPC disconnected')
            }
          />
        </div>
        <span
          className={
            state.settings.enabled ? 'text-emerald-600' : 'text-slate-500'
          }
        >
          {state.settings.enabled ? t('Enabled') : t('Paused')}
        </span>
      </Card.Header>

      <Switch
        isSelected={state.settings.enabled}
        onChange={(v) => toggleEnabled(v)}
      >
        <Switch.Content>
          <Label>{t('Enable interception')}</Label>
        </Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>

      <Card>
        <Card.Header>
          <Card.Title className="font-medium">
            {t('Interception rules')}
          </Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col">
          <Switch
            isSelected={state.settings.rules.extensionsEnabled}
            onChange={(extensionsEnabled) =>
              updateRules({ ...state.settings.rules, extensionsEnabled })
            }
          >
            <Switch.Content>
              <Label>{t('Extension rule')}</Label>
            </Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
          <Switch
            isSelected={state.settings.rules.minSizeEnabled}
            onChange={(minSizeEnabled) =>
              updateRules({ ...state.settings.rules, minSizeEnabled })
            }
          >
            <Switch.Content>
              <Label>{t('Minimum size rule')}</Label>
            </Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
          <Switch
            isSelected={state.settings.rules.includedDomainsEnabled}
            onChange={(includedDomainsEnabled) =>
              updateRules({
                ...state.settings.rules,
                includedDomainsEnabled
              })
            }
          >
            <Switch.Content>
              <Label>{t('Included domains rule')}</Label>
            </Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
          <Switch
            isSelected={state.settings.rules.excludedDomainsEnabled}
            onChange={(excludedDomainsEnabled) =>
              updateRules({
                ...state.settings.rules,
                excludedDomainsEnabled
              })
            }
          >
            <Switch.Content>
              <Label>{t('Excluded domains rule')}</Label>
            </Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="mb-2 font-medium">
            {t('Latest result')}
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <p>{formatLastResult(state.settings, t)}</p>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="mb-2 font-medium">
            {t('Active tasks')}
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {state.tasks.length === 0 ? (
            <p className="text-slate-500">{t('No active tasks')}</p>
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
        </Card.Content>
      </Card>

      <div className="flex justify-end">
        <Button
          aria-label={t('Settings')}
          variant="primary"
          onPress={() => {
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
        </Button>
      </div>
    </Card>
  );
}

function formatLastResult(settings: ExtensionSettings, t: TFunction): string {
  const result = settings.lastResult;
  if (!result) {
    return t('No intercepted downloads yet');
  }

  const label = result.filename ?? result.url;
  if (result.status === 'success') {
    return t('Last: {{label}} sent to aria2', { label });
  }

  return t('Last failed: {{label}} — {{message}}', {
    label,
    message: result.message
  });
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
