import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { sendRuntimeMessage } from '../shared/messages';
import type { ExtensionSettings, RpcStatus } from '../shared/types';

export function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [status, setStatus] = useState<RpcStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await sendRuntimeMessage(
        { type: 'settings:get' },
        'settings'
      );
      setSettings(response.settings);
    }

    void load();
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    await sendRuntimeMessage(
      { type: 'settings:save', settings: normalizeSettings(settings) },
      'ok'
    );
    setMessage('Settings saved');
  }

  async function testConnection() {
    if (!settings) return;
    await sendRuntimeMessage(
      { type: 'settings:save', settings: normalizeSettings(settings) },
      'ok'
    );
    const response = await sendRuntimeMessage(
      { type: 'aria2:test' },
      'rpcStatus'
    );
    setStatus(response.status);
  }

  if (!settings) {
    return (
      <main className="p-6 text-sm text-slate-600">Loading settings...</main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <form
        className="mx-auto max-w-3xl space-y-8"
        onSubmit={(event) => void save(event)}
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Aria2 Manager Settings
          </h1>
          <p className="text-muted-foreground">
            Configure local aria2 RPC, interception rules, and request context
            forwarding.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>RPC settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rpc-url">RPC URL</Label>
              <Input
                id="rpc-url"
                aria-label="RPC URL"
                value={settings.rpcUrl}
                onChange={(event) =>
                  setSettings({ ...settings, rpcUrl: event.currentTarget.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpc-token">RPC token</Label>
              <Input
                id="rpc-token"
                aria-label="RPC token"
                type="password"
                value={settings.rpcToken}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    rpcToken: event.currentTarget.value
                  })
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void testConnection()}
              >
                Test connection
              </Button>
              {status ? (
                <p className="text-sm">
                  {status.ok
                    ? `Connected: aria2 ${status.version}`
                    : `Disconnected: ${status.message}`}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-interception" className="flex flex-col gap-1.5">
                <span>Enable interception</span>
                <span className="font-normal text-muted-foreground">
                  Master switch to enable or disable all download interception.
                </span>
              </Label>
              <Switch
                id="enable-interception"
                checked={settings.enabled}
                onCheckedChange={(enabled) =>
                  setSettings({
                    ...settings,
                    enabled
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="enable-extension-rule"
                className="flex flex-col gap-1.5"
              >
                <span>Enable extension rule</span>
                <span className="font-normal text-muted-foreground">
                  Intercept downloads based on file extension.
                </span>
              </Label>
              <Switch
                id="enable-extension-rule"
                checked={settings.rules.extensionsEnabled}
                onCheckedChange={(extensionsEnabled) =>
                  setSettings({
                    ...settings,
                    rules: { ...settings.rules, extensionsEnabled }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extensions">Extensions</Label>
              <Textarea
                id="extensions"
                placeholder="zip, rar, 7z, tar, gz"
                value={settings.rules.extensions.join(', ')}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    rules: {
                      ...settings.rules,
                      extensions: splitList(event.currentTarget.value)
                    }
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="enable-min-size-rule"
                className="flex flex-col gap-1.5"
              >
                <span>Enable minimum size rule</span>
                <span className="font-normal text-muted-foreground">
                  Only intercept downloads larger than a certain size.
                </span>
              </Label>
              <Switch
                id="enable-min-size-rule"
                checked={settings.rules.minSizeEnabled}
                onCheckedChange={(minSizeEnabled) =>
                  setSettings({
                    ...settings,
                    rules: { ...settings.rules, minSizeEnabled }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-size-mb">Minimum size (MB)</Label>
              <Input
                id="min-size-mb"
                type="number"
                min="0"
                value={settings.rules.minSizeMb}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    rules: {
                      ...settings.rules,
                      minSizeMb: Number(event.currentTarget.value)
                    }
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="enable-included-domains-rule"
                className="flex flex-col gap-1.5"
              >
                <span>Enable included domains rule</span>
                <span className="font-normal text-muted-foreground">
                  Only intercept downloads from these specific domains.
                </span>
              </Label>
              <Switch
                id="enable-included-domains-rule"
                checked={settings.rules.includedDomainsEnabled}
                onCheckedChange={(includedDomainsEnabled) =>
                  setSettings({
                    ...settings,
                    rules: { ...settings.rules, includedDomainsEnabled }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="included-domains">Included domains</Label>
              <Textarea
                id="included-domains"
                placeholder="example.com, another.org"
                value={settings.rules.includedDomains.join('\n')}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    rules: {
                      ...settings.rules,
                      includedDomains: splitList(event.currentTarget.value)
                    }
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="enable-excluded-domains-rule"
                className="flex flex-col gap-1.5"
              >
                <span>Enable excluded domains rule</span>
                <span className="font-normal text-muted-foreground">
                  Never intercept downloads from these domains.
                </span>
              </Label>
              <Switch
                id="enable-excluded-domains-rule"
                checked={settings.rules.excludedDomainsEnabled}
                onCheckedChange={(excludedDomainsEnabled) =>
                  setSettings({
                    ...settings,
                    rules: { ...settings.rules, excludedDomainsEnabled }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excluded-domains">Excluded domains</Label>
              <Textarea
                id="excluded-domains"
                placeholder="bad.com, worse.net"
                value={settings.rules.excludedDomains.join('\n')}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    rules: {
                      ...settings.rules,
                      excludedDomains: splitList(event.currentTarget.value)
                    }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request context and privacy</CardTitle>
            <CardDescription>
              Enabled values are sent only to your configured aria2 instance for
              downloads that match your rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="send-cookies" className="flex flex-col gap-1.5">
                <span>Send cookies</span>
                <span className="font-normal text-muted-foreground">
                  Allow sending cookies with download requests.
                </span>
              </Label>
              <Switch
                id="send-cookies"
                checked={settings.requestContext.sendCookies}
                onCheckedChange={(sendCookies) =>
                  setSettings({
                    ...settings,
                    requestContext: {
                      ...settings.requestContext,
                      sendCookies
                    }
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="send-referer" className="flex flex-col gap-1.5">
                <span>Send Referer header</span>
                <span className="font-normal text-muted-foreground">
                  Allow sending the Referer header with download requests.
                </span>
              </Label>
              <Switch
                id="send-referer"
                checked={settings.requestContext.sendReferer}
                onCheckedChange={(sendReferer) =>
                  setSettings({
                    ...settings,
                    requestContext: {
                      ...settings.requestContext,
                      sendReferer
                    }
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="send-user-agent" className="flex flex-col gap-1.5">
                <span>Send User-Agent header</span>
                <span className="font-normal text-muted-foreground">
                  Allow sending the User-Agent header with download requests.
                </span>
              </Label>
              <Switch
                id="send-user-agent"
                checked={settings.requestContext.sendUserAgent}
                onCheckedChange={(sendUserAgent) =>
                  setSettings({
                    ...settings,
                    requestContext: {
                      ...settings.requestContext,
                      sendUserAgent
                    }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit">Save settings</Button>
          {message ? (
            <span className="text-sm text-muted-foreground">{message}</span>
          ) : null}
        </div>
      </form>
    </main>
  );
}


function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSettings(settings: ExtensionSettings): ExtensionSettings {
  return {
    ...settings,
    rpcUrl: settings.rpcUrl.trim(),
    rpcToken: settings.rpcToken.trim(),
    rules: {
      extensionsEnabled: settings.rules.extensionsEnabled,
      extensions: settings.rules.extensions
        .map((item) => item.trim())
        .filter(Boolean),
      minSizeEnabled: settings.rules.minSizeEnabled,
      minSizeMb: Number.isFinite(settings.rules.minSizeMb)
        ? settings.rules.minSizeMb
        : 0,
      includedDomainsEnabled: settings.rules.includedDomainsEnabled,
      includedDomains: settings.rules.includedDomains
        .map((item) => item.trim())
        .filter(Boolean),
      excludedDomainsEnabled: settings.rules.excludedDomainsEnabled,
      excludedDomains: settings.rules.excludedDomains
        .map((item) => item.trim())
        .filter(Boolean)
    }
  };
}
