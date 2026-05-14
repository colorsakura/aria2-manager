import { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { sendRuntimeMessage } from '../shared/messages';
import type {
  Aria2ActiveTask,
  ExtensionSettings,
  RpcStatus,
  RuleSettings
} from '../shared/types';

interface PopupState {
  status: 'loading' | 'error' | 'ok';
  settings: ExtensionSettings | null;
  rpcStatus: RpcStatus | null;
  tasks: Aria2ActiveTask[] | null;
  errorMessage?: string;
}

const POPUP_REFRESH_INTERVAL_MS = 1000;

export function PopupApp() {
  const [state, setState] = useState<PopupState>({
    status: 'loading',
    settings: null,
    rpcStatus: null,
    tasks: null
  });

  const refresh = useCallback(async () => {
    try {
      const response = await sendRuntimeMessage(
        { type: 'popup:getState' },
        'popupState'
      );
      setState({
        status: 'ok',
        settings: response.settings,
        rpcStatus: response.rpcStatus,
        tasks: response.tasks
      });
    } catch (caught) {
      setState({
        status: 'error',
        settings: null,
        rpcStatus: null,
        tasks: null,
        errorMessage:
          caught instanceof Error ? caught.message : 'Failed to load popup state'
      });
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
    if (!state.settings) return;
    setState({
      ...state,
      settings: { ...state.settings, enabled }
    });
    await sendRuntimeMessage({ type: 'settings:setEnabled', enabled }, 'ok');
  }

  async function updateRules(rules: RuleSettings) {
    if (!state.settings) return;
    const newSettings = { ...state.settings, rules };
    setState({ ...state, settings: newSettings });
    await sendRuntimeMessage({ type: 'settings:save', settings: newSettings }, 'ok');
  }

  if (state.status === 'loading') {
    return (
      <main className="w-96 bg-background p-3 text-foreground">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Aria2 Manager</CardTitle>
            <CardDescription>Loading popup state...</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="w-96 bg-background p-3 text-foreground">
        <Card className="border-destructive/40">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Aria2 Manager</CardTitle>
            <CardDescription className="text-destructive">
              {state.errorMessage}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  // From here, state.status === 'ok'
  const { settings, rpcStatus, tasks } = state;
  if (!settings || !rpcStatus || !tasks) {
    // Should be unreachable if status is 'ok'
    return null;
  }

  return (
    <main className="w-96 space-y-3 bg-background p-3 text-sm text-foreground">
      <Card>
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <CardTitle className="text-lg leading-none">Aria2 Manager</CardTitle>
              <div className="flex flex-wrap gap-1.5">
                <RpcStatusBadge status={rpcStatus} />
                <Badge variant={settings.enabled ? 'default' : 'secondary'}>
                  {settings.enabled ? 'Enabled' : 'Paused'}
                </Badge>
              </div>
            </div>
            <Button
              aria-label="Settings"
              size="icon"
              variant="outline"
              onClick={() => {
                void browser.runtime.openOptionsPage();
              }}
            >
              <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92l-.03.08a2 2 0 0 1-3.86 0l-.03-.08A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1l-.08-.03a2 2 0 0 1 0-3.86l.08-.03A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92l.03-.08a2 2 0 0 1 3.86 0l.03.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06A2 2 0 1 1 22.63 7l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .92 1l.08.03a2 2 0 0 1 0 3.86l-.08.03a1.7 1.7 0 0 0-.92 1Z" />
              </svg>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SwitchRow
            label="Enable interception"
            checked={settings.enabled}
            onChange={(enabled) => void toggleEnabled(enabled)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Interception rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SwitchRow
            label="Extension rule"
            checked={settings.rules.extensionsEnabled}
            onChange={(extensionsEnabled) =>
              void updateRules({ ...settings.rules, extensionsEnabled })
            }
          />
          <SwitchRow
            label="Minimum size rule"
            checked={settings.rules.minSizeEnabled}
            onChange={(minSizeEnabled) =>
              void updateRules({ ...settings.rules, minSizeEnabled })
            }
          />
          <SwitchRow
            label="Included domains rule"
            checked={settings.rules.includedDomainsEnabled}
            onChange={(includedDomainsEnabled) =>
              void updateRules({
                ...settings.rules,
                includedDomainsEnabled
              })
            }
          />
          <SwitchRow
            label="Excluded domains rule"
            checked={settings.rules.excludedDomainsEnabled}
            onChange={(excludedDomainsEnabled) =>
              void updateRules({
                ...settings.rules,
                excludedDomainsEnabled
              })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Latest result</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{formatLastResult(settings)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Active tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground">No active tasks</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task, index) => (
                <li key={task.gid} className="space-y-2">
                  {index > 0 ? <Separator /> : null}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium">{task.name}</span>
                      <span className="text-muted-foreground">{task.progress}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {task.status} · {formatSpeed(task.downloadSpeed)}
                    </div>
                    <Progress
                      aria-label={`${task.name} progress`}
                      value={task.progress}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function RpcStatusBadge({ status }: { status: RpcStatus }) {
  if (status.ok) {
    return <Badge>Connected: aria2 {status.version}</Badge>;
  }

  return <Badge variant="destructive">Disconnected: {status.message}</Badge>;
}

function SwitchRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = label.toLowerCase().replaceAll(' ', '-');

  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
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
