import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextArea,
  TextField
} from '@heroui/react';
import { sendRuntimeMessage } from '../shared/messages';
import type { ExtensionSettings, RpcStatus } from '../shared/types';

export function OptionsApp() {
  const { t, i18n } = useTranslation();
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
      if (response.settings.language) {
        await i18n.changeLanguage(response.settings.language);
      }
    }

    void load();
  }, [i18n]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    await sendRuntimeMessage(
      { type: 'settings:save', settings: normalizeSettings(settings) },
      'ok'
    );
    if (settings.language) {
      await i18n.changeLanguage(settings.language);
    }
    setMessage(t('Settings saved'));
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
      <main className="p-6 text-sm text-slate-600">
        {t('Loading settings...')}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <form
        className="mx-auto max-w-3xl space-y-6"
        onSubmit={(event) => void save(event)}
      >
        <header>
          <h1 className="text-2xl font-semibold">
            {t('Aria2 Manager Settings')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t(
              'Configure local aria2 RPC, interception rules, and request context forwarding.'
            )}
          </p>
        </header>

        <Card>
          <Card.Header>
            <Card.Title className="text-lg font-medium">
              {t('General')}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <Select
              aria-label={t('Language')}
              selectedKey={settings.language ?? 'en'}
              onSelectionChange={(key) =>
                setSettings({
                  ...settings,
                  language: key as string
                })
              }
            >
              <Label>{t('Language')}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="en">{t('English')}</ListBox.Item>
                  <ListBox.Item id="zh">{t('Chinese')}</ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="text-lg font-medium">
              {t('RPC settings')}
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <TextField
              aria-label={t('RPC URL')}
              value={settings.rpcUrl}
              onChange={(value) => setSettings({ ...settings, rpcUrl: value })}
            >
              <Label>{t('RPC URL')}</Label>
              <Input />
            </TextField>
            <TextField
              aria-label={t('RPC token')}
              type="password"
              value={settings.rpcToken}
              onChange={(value) =>
                setSettings({ ...settings, rpcToken: value })
              }
            >
              <Label>{t('RPC token')}</Label>
              <Input />
            </TextField>
            <Button variant="secondary" onPress={() => void testConnection()}>
              {t('Test connection')}
            </Button>
            {status ? (
              <p>
                {status.ok
                  ? t('Connected: aria2 {{version}}', {
                      version: status.version
                    })
                  : t('Disconnected: {{message}}', {
                      message: status.message
                    })}
              </p>
            ) : null}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="text-lg font-medium">
              {t('Rules')}
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Switch
              isSelected={settings.enabled}
              onChange={(v) => setSettings({ ...settings, enabled: v })}
            >
              <Switch.Content>
                <Label>{t('Enable interception')}</Label>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <Switch
              isSelected={settings.rules.extensionsEnabled}
              onChange={(extensionsEnabled) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, extensionsEnabled }
                })
              }
            >
              <Switch.Content>
                <Label>{t('Enable extension rule')}</Label>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <TextField
              aria-label={t('Extensions')}
              value={settings.rules.extensions.join(', ')}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, extensions: splitList(value) }
                })
              }
            >
              <Label>{t('Extensions')}</Label>
              <Input />
            </TextField>
            <Switch
              isSelected={settings.rules.minSizeEnabled}
              onChange={(minSizeEnabled) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, minSizeEnabled }
                })
              }
            >
              <Switch.Content>
                <Label>{t('Enable minimum size rule')}</Label>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <TextField
              aria-label={t('Minimum size MB')}
              type="number"
              value={String(settings.rules.minSizeMb)}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    minSizeMb: Number(value)
                  }
                })
              }
            >
              <Label>{t('Minimum size MB')}</Label>
              <Input min={0} />
            </TextField>
            <Switch
              isSelected={settings.rules.includedDomainsEnabled}
              onChange={(includedDomainsEnabled) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, includedDomainsEnabled }
                })
              }
            >
              <Switch.Content>
                <Label>{t('Enable included domains rule')}</Label>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <TextField
              aria-label={t('Included domains')}
              value={settings.rules.includedDomains.join('\\n')}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    includedDomains: splitList(value)
                  }
                })
              }
            >
              <Label>{t('Included domains')}</Label>
              <TextArea />
            </TextField>
            <Switch
              isSelected={settings.rules.excludedDomainsEnabled}
              onChange={(excludedDomainsEnabled) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, excludedDomainsEnabled }
                })
              }
            >
              <Switch.Content>
                <Label>{t('Enable excluded domains rule')}</Label>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <TextField
              aria-label={t('Excluded domains')}
              value={settings.rules.excludedDomains.join('\\n')}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  rules: {
                    ...settings.rules,
                    excludedDomains: splitList(value)
                  }
                })
              }
            >
              <Label>{t('Excluded domains')}</Label>
              <TextArea />
            </TextField>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="text-lg font-medium">
              {t('Request context and privacy')}
            </Card.Title>
            <Card.Description>
              {t(
                'Enabled values are sent only to your configured aria2 instance for downloads that match your rules.'
              )}
            </Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Switch
              isSelected={settings.requestContext.sendCookies}
              onChange={(sendCookies) =>
                setSettings({
                  ...settings,
                  requestContext: { ...settings.requestContext, sendCookies }
                })
              }
            >
              <Switch.Content>
                <Label>{t('Send cookies')}</Label>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <Switch
              isSelected={settings.requestContext.sendReferer}
              onChange={(sendReferer) =>
                setSettings({
                  ...settings,
                  requestContext: { ...settings.requestContext, sendReferer }
                })
              }
            >
              <Switch.Content>
                <Label>{t('Send Referer')}</Label>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <Switch
              isSelected={settings.requestContext.sendUserAgent}
              onChange={(sendUserAgent) =>
                setSettings({
                  ...settings,
                  requestContext: { ...settings.requestContext, sendUserAgent }
                })
              }
            >
              <Switch.Content>
                <Label>{t('Send User-Agent')}</Label>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </Card.Content>
        </Card>

        <div className="flex items-center gap-3">
          <Button variant="primary" type="submit">
            {t('Save settings')}
          </Button>
          {message ? (
            <span className="text-sm text-emerald-600">{message}</span>
          ) : null}
        </div>
      </form>
    </main>
  );
}

function splitList(value: string): string[] {
  return value
    .split(/[\\n,]/)
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
