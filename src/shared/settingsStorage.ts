import browser from 'webextension-polyfill';
import { createDefaultSettings } from './defaultSettings';
import type { ExtensionSettings, LastResult } from './types';

const SETTINGS_KEY = 'settings';

export async function loadSettings(): Promise<ExtensionSettings> {
  const stored = await browser.storage.local.get(SETTINGS_KEY);
  return mergeSettings(stored[SETTINGS_KEY]);
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function updateEnabled(enabled: boolean): Promise<ExtensionSettings> {
  const settings = await loadSettings();
  const next = { ...settings, enabled };
  await saveSettings(next);
  return next;
}

export async function updateLastResult(lastResult: LastResult): Promise<ExtensionSettings> {
  const settings = await loadSettings();
  const next = { ...settings, lastResult };
  await saveSettings(next);
  return next;
}

function mergeSettings(value: unknown): ExtensionSettings {
  const defaults = createDefaultSettings();
  if (!isObject(value)) {
    return defaults;
  }

  const partial = value as Partial<ExtensionSettings>;
  return {
    ...defaults,
    ...partial,
    rules: {
      ...defaults.rules,
      ...(isObject(partial.rules) ? partial.rules : {})
    },
    requestContext: {
      ...defaults.requestContext,
      ...(isObject(partial.requestContext) ? partial.requestContext : {})
    },
    lastResult: partial.lastResult ?? defaults.lastResult
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
