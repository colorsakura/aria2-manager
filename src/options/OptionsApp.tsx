import { type FormEvent, useEffect, useState } from 'react';
import { sendRuntimeMessage } from '../shared/messages';
import type { ExtensionSettings, RpcStatus } from '../shared/types';

export function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [status, setStatus] = useState<RpcStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await sendRuntimeMessage({ type: 'settings:get' }, 'settings');
      setSettings(response.settings);
    }

    void load();
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    await sendRuntimeMessage({ type: 'settings:save', settings: normalizeSettings(settings) }, 'ok');
    setMessage('Settings saved');
  }

  async function testConnection() {
    if (!settings) return;
    await sendRuntimeMessage({ type: 'settings:save', settings: normalizeSettings(settings) }, 'ok');
    const response = await sendRuntimeMessage({ type: 'aria2:test' }, 'rpcStatus');
    setStatus(response.status);
  }

  if (!settings) {
    return <main className="p-6 text-sm text-slate-600">Loading settings...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <form className="mx-auto max-w-3xl space-y-6" onSubmit={event => void save(event)}>
        <header>
          <h1 className="text-2xl font-semibold">Aria2 Manager Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Configure local aria2 RPC, interception rules, and request context forwarding.</p>
        </header>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-medium">RPC settings</h2>
          <label className="block space-y-1">
            <span>RPC URL</span>
            <input
              className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
              aria-label="RPC URL"
              value={settings.rpcUrl}
              onChange={event => setSettings({ ...settings, rpcUrl: event.currentTarget.value })}
            />
          </label>
          <label className="block space-y-1">
            <span>RPC token</span>
            <input
              className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
              aria-label="RPC token"
              type="password"
              value={settings.rpcToken}
              onChange={event => setSettings({ ...settings, rpcToken: event.currentTarget.value })}
            />
          </label>
          <button type="button" className="rounded bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900" onClick={() => void testConnection()}>
            Test connection
          </button>
          {status ? <p>{status.ok ? `Connected: aria2 ${status.version}` : `Disconnected: ${status.message}`}</p> : null}
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-medium">Rules</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={event => setSettings({ ...settings, enabled: event.currentTarget.checked })}
            />
            <span>Enable interception</span>
          </label>
          <TextAreaField
            label="Extensions"
            value={settings.rules.extensions.join(', ')}
            onChange={value => setSettings({ ...settings, rules: { ...settings.rules, extensions: splitList(value) } })}
          />
          <label className="block space-y-1">
            <span>Minimum size MB</span>
            <input
              className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
              aria-label="Minimum size MB"
              type="number"
              min="0"
              value={settings.rules.minSizeMb}
              onChange={event => setSettings({ ...settings, rules: { ...settings.rules, minSizeMb: Number(event.currentTarget.value) } })}
            />
          </label>
          <TextAreaField
            label="Included domains"
            value={settings.rules.includedDomains.join('\n')}
            onChange={value => setSettings({ ...settings, rules: { ...settings.rules, includedDomains: splitList(value) } })}
          />
          <TextAreaField
            label="Excluded domains"
            value={settings.rules.excludedDomains.join('\n')}
            onChange={value => setSettings({ ...settings, rules: { ...settings.rules, excludedDomains: splitList(value) } })}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-medium">Request context and privacy</h2>
          <p className="text-sm text-slate-500">Enabled values are sent only to your configured aria2 instance for downloads that match your rules.</p>
          <Toggle label="Send cookies" checked={settings.requestContext.sendCookies} onChange={sendCookies => setSettings({ ...settings, requestContext: { ...settings.requestContext, sendCookies } })} />
          <Toggle label="Send Referer" checked={settings.requestContext.sendReferer} onChange={sendReferer => setSettings({ ...settings, requestContext: { ...settings.requestContext, sendReferer } })} />
          <Toggle label="Send User-Agent" checked={settings.requestContext.sendUserAgent} onChange={sendUserAgent => setSettings({ ...settings, requestContext: { ...settings.requestContext, sendUserAgent } })} />
        </section>

        <div className="flex items-center gap-3">
          <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">
            Save settings
          </button>
          {message ? <span className="text-sm text-emerald-600">{message}</span> : null}
        </div>
      </form>
    </main>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1">
      <span>{label}</span>
      <textarea
        className="min-h-20 w-full rounded border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
        aria-label={label}
        value={value}
        onChange={event => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.currentTarget.checked)} />
      <span>{label}</span>
    </label>
  );
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeSettings(settings: ExtensionSettings): ExtensionSettings {
  return {
    ...settings,
    rpcUrl: settings.rpcUrl.trim(),
    rpcToken: settings.rpcToken.trim(),
    rules: {
      extensions: settings.rules.extensions.map(item => item.trim()).filter(Boolean),
      minSizeMb: Number.isFinite(settings.rules.minSizeMb) ? settings.rules.minSizeMb : 0,
      includedDomains: settings.rules.includedDomains.map(item => item.trim()).filter(Boolean),
      excludedDomains: settings.rules.excludedDomains.map(item => item.trim()).filter(Boolean)
    }
  };
}
