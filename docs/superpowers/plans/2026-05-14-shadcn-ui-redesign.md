# shadcn UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shadcn/ui to the existing Vite React extension and redesign both popup and options UIs with a compact, system-themed component style while preserving behavior.

**Architecture:** shadcn/ui components will be generated into `src/components/ui` and imported by the two existing React entry points. Business logic remains in `PopupApp.tsx` and `OptionsApp.tsx`; the redesign changes rendering, styling, and accessibility roles only. Tailwind CSS variables in `src/styles.css` provide shared light/dark tokens using the system color scheme.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui generated components, Radix UI primitives, React Testing Library, Vitest.

---

## File Structure

Create:

- `components.json` — shadcn/ui project configuration for Vite, TSX, Tailwind CSS, aliases, and lucide icon library.
- `src/lib/utils.ts` — shared `cn()` helper used by generated shadcn components.
- `src/components/ui/button.tsx` — generated shadcn button component.
- `src/components/ui/card.tsx` — generated shadcn card component.
- `src/components/ui/input.tsx` — generated shadcn input component.
- `src/components/ui/textarea.tsx` — generated shadcn textarea component.
- `src/components/ui/label.tsx` — generated shadcn label component.
- `src/components/ui/switch.tsx` — generated shadcn switch component.
- `src/components/ui/badge.tsx` — generated shadcn badge component.
- `src/components/ui/progress.tsx` — generated shadcn progress component.
- `src/components/ui/separator.tsx` — generated shadcn separator component.

Modify:

- `package.json` — add dependencies installed by `shadcn add`, such as Radix primitives, `class-variance-authority`, `clsx`, `tailwind-merge`, and `lucide-react` if the CLI adds it.
- `package-lock.json` — lock dependency changes.
- `tsconfig.json` — add `baseUrl` and `paths` so `@/*` resolves to `src/*`.
- `vite.config.ts` — add Vite alias `@` to `src`.
- `src/styles.css` — replace current minimal base with shadcn CSS variables and system light/dark theme tokens.
- `src/popup/PopupApp.test.tsx` — update behavior tests to target shadcn switch/progress markup while preserving assertions.
- `src/popup/PopupApp.tsx` — replace Tailwind-only markup with compact shadcn cards, badges, switches, progress, and buttons.
- `src/options/OptionsApp.test.tsx` — update behavior tests to target shadcn switch/input/button markup while preserving assertions.
- `src/options/OptionsApp.tsx` — replace form markup with compact shadcn cards, inputs, textareas, switches, badges, and buttons.

Do not modify:

- `src/shared/messages.ts`
- `src/shared/types.ts`
- `src/shared/defaultSettings.ts`
- background script or extension interception logic

---

### Task 1: Add shadcn Project Setup

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/switch.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/progress.tsx`
- Create: `src/components/ui/separator.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Modify: `vite.config.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Create shadcn configuration**

Create `components.json` with this exact content:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 2: Add TypeScript path aliases**

Replace `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client", "vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts", "eslint.config.js"]
}
```

- [ ] **Step 3: Add Vite path alias**

Replace `vite.config.ts` with:

```ts
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { build as buildWithEsbuild } from 'esbuild';
import { defineConfig, type Plugin } from 'vite';

const root = import.meta.dirname;

function bundleBackground(): Plugin {
  return {
    name: 'bundle-background-iife',
    apply: 'build',
    closeBundle: async () => {
      await buildWithEsbuild({
        entryPoints: [resolve(root, 'src/background/main.ts')],
        bundle: true,
        outfile: resolve(root, 'dist/background.js'),
        format: 'iife',
        target: 'es2022'
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), bundleBackground()],
  resolve: {
    alias: {
      '@': resolve(root, 'src')
    }
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(root, 'src/popup/index.html'),
        options: resolve(root, 'src/options/index.html')
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
```

- [ ] **Step 4: Install generated shadcn components**

Run:

```bash
npx shadcn@latest add button card input textarea label switch badge progress separator
```

Expected:

- `src/components/ui/*.tsx` files are created.
- `src/lib/utils.ts` is created or updated.
- `package.json` and `package-lock.json` include the dependencies required by the generated components.

- [ ] **Step 5: Verify `src/lib/utils.ts` content**

If the CLI did not create `src/lib/utils.ts`, create it with:

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

If the CLI created the same helper with double quotes or semicolon differences, keep the generated version and do not churn formatting.

- [ ] **Step 6: Replace global styles with shadcn tokens**

Replace `src/styles.css` with:

```css
@import 'tailwindcss';

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  color-scheme: light dark;
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.129 0.042 264.695);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.129 0.042 264.695);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.129 0.042 264.695);
  --primary: oklch(0.208 0.042 265.755);
  --primary-foreground: oklch(0.984 0.003 247.858);
  --secondary: oklch(0.968 0.007 247.896);
  --secondary-foreground: oklch(0.208 0.042 265.755);
  --muted: oklch(0.968 0.007 247.896);
  --muted-foreground: oklch(0.554 0.046 257.417);
  --accent: oklch(0.968 0.007 247.896);
  --accent-foreground: oklch(0.208 0.042 265.755);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.984 0.003 247.858);
  --border: oklch(0.929 0.013 255.508);
  --input: oklch(0.929 0.013 255.508);
  --ring: oklch(0.704 0.04 256.788);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.129 0.042 264.695);
    --foreground: oklch(0.984 0.003 247.858);
    --card: oklch(0.208 0.042 265.755);
    --card-foreground: oklch(0.984 0.003 247.858);
    --popover: oklch(0.208 0.042 265.755);
    --popover-foreground: oklch(0.984 0.003 247.858);
    --primary: oklch(0.929 0.013 255.508);
    --primary-foreground: oklch(0.208 0.042 265.755);
    --secondary: oklch(0.279 0.041 260.031);
    --secondary-foreground: oklch(0.984 0.003 247.858);
    --muted: oklch(0.279 0.041 260.031);
    --muted-foreground: oklch(0.704 0.04 256.788);
    --accent: oklch(0.279 0.041 260.031);
    --accent-foreground: oklch(0.984 0.003 247.858);
    --destructive: oklch(0.704 0.191 22.216);
    --destructive-foreground: oklch(0.984 0.003 247.858);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.551 0.027 264.364);
  }
}

* {
  border-color: var(--border);
}

body {
  margin: 0;
  min-width: 320px;
  background: var(--background);
  color: var(--foreground);
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

button,
input,
textarea {
  font: inherit;
}
```

- [ ] **Step 7: Run setup verification**

Run:

```bash
npm run lint
```

Expected: PASS.

If lint fails in generated shadcn files due to style differences, make the smallest formatting-only adjustment required by the repository linter.

- [ ] **Step 8: Commit setup**

Run:

```bash
git add components.json package.json package-lock.json tsconfig.json vite.config.ts src/styles.css src/lib/utils.ts src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/input.tsx src/components/ui/textarea.tsx src/components/ui/label.tsx src/components/ui/switch.tsx src/components/ui/badge.tsx src/components/ui/progress.tsx src/components/ui/separator.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add shadcn component foundation

Configure shadcn/ui for the Vite extension so popup and options can share generated local components and theme tokens.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Update Popup Tests First

**Files:**
- Modify: `src/popup/PopupApp.test.tsx`

- [ ] **Step 1: Replace popup tests with behavior-focused shadcn expectations**

Replace `src/popup/PopupApp.test.tsx` with:

```tsx
import { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings } from '../shared/defaultSettings';
import { sendRuntimeMessage } from '../shared/messages';
import { PopupApp } from './PopupApp';

vi.mock('../shared/messages', () => ({
  sendRuntimeMessage: vi.fn()
}));

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      openOptionsPage: vi.fn()
    }
  }
}));

const mockedSend = vi.mocked(sendRuntimeMessage);

describe('PopupApp', () => {
  beforeEach(() => {
    mockedSend.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders enabled state, rpc status, latest result, and active task', async () => {
    mockedSend.mockResolvedValueOnce({
      type: 'popupState',
      settings: {
        ...createDefaultSettings(),
        lastResult: {
          status: 'success',
          url: 'https://example.com/file.zip',
          filename: 'file.zip',
          gid: '1',
          timestamp: 1
        }
      },
      rpcStatus: { ok: true, version: '1.37.0' },
      tasks: [
        {
          gid: '1',
          name: 'file.zip',
          status: 'active',
          progress: 50,
          downloadSpeed: 1024
        }
      ]
    });

    render(<PopupApp />);

    expect(await screen.findByText('Aria2 Manager')).toBeInTheDocument();
    expect(screen.getByText('Connected: aria2 1.37.0')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Enable interception' })
    ).toBeChecked();
    expect(screen.getByText('Last: file.zip sent to aria2')).toBeInTheDocument();
    expect(screen.getByText('file.zip')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'file.zip progress' })).toHaveAttribute(
      'aria-valuenow',
      '50'
    );
  });

  it('refreshes popup state periodically', async () => {
    vi.useFakeTimers();
    mockedSend
      .mockResolvedValueOnce({
        type: 'popupState',
        settings: createDefaultSettings(),
        rpcStatus: { ok: true, version: '1.37.0' },
        tasks: [
          {
            gid: '1',
            name: 'file.zip',
            status: 'active',
            progress: 50,
            downloadSpeed: 1024
          }
        ]
      })
      .mockResolvedValueOnce({
        type: 'popupState',
        settings: createDefaultSettings(),
        rpcStatus: { ok: true, version: '1.37.0' },
        tasks: [
          {
            gid: '1',
            name: 'file.zip',
            status: 'active',
            progress: 75,
            downloadSpeed: 2048
          }
        ]
      });

    render(<PopupApp />);

    await act(async () => {});
    expect(screen.getByText('50%')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('active · 2.0 KB/s')).toBeInTheDocument();
  });

  it('toggles interception', async () => {
    const user = userEvent.setup();
    mockedSend.mockResolvedValue({
      type: 'popupState',
      settings: createDefaultSettings(),
      rpcStatus: { ok: false, message: 'offline' },
      tasks: []
    });

    render(<PopupApp />);

    await user.click(
      await screen.findByRole('switch', { name: 'Enable interception' })
    );

    await waitFor(() => {
      expect(mockedSend).toHaveBeenCalledWith(
        { type: 'settings:setEnabled', enabled: false },
        'ok'
      );
    });
  });

  it('toggles interception rules from popup', async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
    mockedSend.mockResolvedValue({
      type: 'popupState',
      settings,
      rpcStatus: { ok: false, message: 'offline' },
      tasks: []
    });

    render(<PopupApp />);

    await user.click(
      await screen.findByRole('switch', { name: 'Extension rule' })
    );

    await waitFor(() => {
      expect(mockedSend).toHaveBeenCalledWith(
        {
          type: 'settings:save',
          settings: {
            ...settings,
            rules: { ...settings.rules, extensionsEnabled: false }
          }
        },
        'ok'
      );
    });
  });
});
```

- [ ] **Step 2: Run popup tests to verify they fail before implementation**

Run:

```bash
npm test -- src/popup/PopupApp.test.tsx
```

Expected: FAIL because the current popup uses checkboxes instead of shadcn switches and does not render the new progressbar accessible name.

---

### Task 3: Implement Popup shadcn Redesign

**Files:**
- Modify: `src/popup/PopupApp.tsx`
- Test: `src/popup/PopupApp.test.tsx`

- [ ] **Step 1: Replace popup implementation**

Replace `src/popup/PopupApp.tsx` with:

```tsx
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
    return (
      <main className="w-96 bg-background p-3 text-foreground">
        <Card className="border-destructive/40">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Aria2 Manager</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!state) {
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

  return (
    <main className="w-96 space-y-3 bg-background p-3 text-sm text-foreground">
      <Card>
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <CardTitle className="text-lg leading-none">Aria2 Manager</CardTitle>
              <div className="flex flex-wrap gap-1.5">
                <RpcStatusBadge status={state.rpcStatus} />
                <Badge variant={state.settings.enabled ? 'default' : 'secondary'}>
                  {state.settings.enabled ? 'Enabled' : 'Paused'}
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
            checked={state.settings.enabled}
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
            checked={state.settings.rules.extensionsEnabled}
            onChange={(extensionsEnabled) =>
              void updateRules({ ...state.settings.rules, extensionsEnabled })
            }
          />
          <SwitchRow
            label="Minimum size rule"
            checked={state.settings.rules.minSizeEnabled}
            onChange={(minSizeEnabled) =>
              void updateRules({ ...state.settings.rules, minSizeEnabled })
            }
          />
          <SwitchRow
            label="Included domains rule"
            checked={state.settings.rules.includedDomainsEnabled}
            onChange={(includedDomainsEnabled) =>
              void updateRules({
                ...state.settings.rules,
                includedDomainsEnabled
              })
            }
          />
          <SwitchRow
            label="Excluded domains rule"
            checked={state.settings.rules.excludedDomainsEnabled}
            onChange={(excludedDomainsEnabled) =>
              void updateRules({
                ...state.settings.rules,
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
          <p className="text-muted-foreground">{formatLastResult(state.settings)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Active tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {state.tasks.length === 0 ? (
            <p className="text-muted-foreground">No active tasks</p>
          ) : (
            <ul className="space-y-3">
              {state.tasks.map((task, index) => (
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
```

- [ ] **Step 2: Run popup tests**

Run:

```bash
npm test -- src/popup/PopupApp.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run lint for popup changes**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit popup redesign**

Run:

```bash
git add src/popup/PopupApp.tsx src/popup/PopupApp.test.tsx
git commit -m "$(cat <<'EOF'
feat(popup): redesign with shadcn components

Refresh the popup with compact cards, badges, switches, and task progress while preserving existing extension behavior.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Update Options Tests First

**Files:**
- Modify: `src/options/OptionsApp.test.tsx`

- [ ] **Step 1: Replace options tests with behavior-focused shadcn expectations**

Replace `src/options/OptionsApp.test.tsx` with:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings } from '../shared/defaultSettings';
import { sendRuntimeMessage } from '../shared/messages';
import { OptionsApp } from './OptionsApp';

vi.mock('../shared/messages', () => ({
  sendRuntimeMessage: vi.fn()
}));

const mockedSend = vi.mocked(sendRuntimeMessage);

describe('OptionsApp', () => {
  beforeEach(() => {
    mockedSend.mockReset();
  });

  it('loads and saves settings', async () => {
    const user = userEvent.setup();
    mockedSend
      .mockResolvedValueOnce({
        type: 'settings',
        settings: createDefaultSettings()
      })
      .mockResolvedValueOnce({ type: 'ok' });

    render(<OptionsApp />);

    const rpcUrl = await screen.findByLabelText('RPC URL');
    await user.clear(rpcUrl);
    await user.type(rpcUrl, 'http://localhost:6801/jsonrpc');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => {
      expect(mockedSend).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: 'settings:save',
          settings: expect.objectContaining({
            rpcUrl: 'http://localhost:6801/jsonrpc'
          })
        }),
        'ok'
      );
    });
    expect(screen.getByText('Settings saved')).toBeInTheDocument();
  });

  it('tests connection', async () => {
    const user = userEvent.setup();
    mockedSend
      .mockResolvedValueOnce({
        type: 'settings',
        settings: createDefaultSettings()
      })
      .mockResolvedValueOnce({ type: 'ok' })
      .mockResolvedValueOnce({
        type: 'rpcStatus',
        status: { ok: true, version: '1.37.0' }
      });

    render(<OptionsApp />);

    await user.click(
      await screen.findByRole('button', { name: 'Test connection' })
    );

    expect(
      await screen.findByText('Connected: aria2 1.37.0')
    ).toBeInTheDocument();
  });

  it('updates rule switches and list fields before saving', async () => {
    const user = userEvent.setup();
    mockedSend
      .mockResolvedValueOnce({
        type: 'settings',
        settings: createDefaultSettings()
      })
      .mockResolvedValueOnce({ type: 'ok' });

    render(<OptionsApp />);

    await user.click(await screen.findByRole('switch', { name: 'Send cookies' }));
    await user.clear(screen.getByLabelText('Included domains'));
    await user.type(screen.getByLabelText('Included domains'), 'example.com\ncdn.example.com');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => {
      expect(mockedSend).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: 'settings:save',
          settings: expect.objectContaining({
            requestContext: expect.objectContaining({ sendCookies: false }),
            rules: expect.objectContaining({
              includedDomains: ['example.com', 'cdn.example.com']
            })
          })
        }),
        'ok'
      );
    });
  });
});
```

- [ ] **Step 2: Run options tests to verify they fail before implementation**

Run:

```bash
npm test -- src/options/OptionsApp.test.tsx
```

Expected: FAIL because the current options page uses checkboxes instead of shadcn switches and does not include the new compact status presentation.

---

### Task 5: Implement Options shadcn Redesign

**Files:**
- Modify: `src/options/OptionsApp.tsx`
- Test: `src/options/OptionsApp.test.tsx`

- [ ] **Step 1: Replace options implementation**

Replace `src/options/OptionsApp.tsx` with:

```tsx
import { type FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
      <main className="min-h-screen bg-background p-6 text-foreground">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Aria2 Manager Settings</CardTitle>
            <CardDescription>Loading settings...</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <form
        className="mx-auto max-w-4xl space-y-5"
        onSubmit={(event) => void save(event)}
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Aria2 Manager Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure local aria2 RPC, interception rules, and request context
            forwarding.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>RPC settings</CardTitle>
            <CardDescription>
              Connect the extension to your local aria2 JSON-RPC endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              label="RPC URL"
              value={settings.rpcUrl}
              onChange={(rpcUrl) => setSettings({ ...settings, rpcUrl })}
            />
            <TextField
              label="RPC token"
              type="password"
              value={settings.rpcToken}
              onChange={(rpcToken) => setSettings({ ...settings, rpcToken })}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => void testConnection()}>
                Test connection
              </Button>
              {status ? <RpcStatusBadge status={status} /> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interception rules</CardTitle>
            <CardDescription>
              Decide which downloads should be sent to aria2.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SwitchRow
              label="Enable interception"
              checked={settings.enabled}
              onChange={(enabled) => setSettings({ ...settings, enabled })}
            />
            <SwitchRow
              label="Enable extension rule"
              checked={settings.rules.extensionsEnabled}
              onChange={(extensionsEnabled) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, extensionsEnabled }
                })
              }
            />
            <TextAreaField
              label="Extensions"
              value={settings.rules.extensions.join(', ')}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, extensions: splitList(value) }
                })
              }
            />
            <SwitchRow
              label="Enable minimum size rule"
              checked={settings.rules.minSizeEnabled}
              onChange={(minSizeEnabled) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, minSizeEnabled }
                })
              }
            />
            <TextField
              label="Minimum size MB"
              min="0"
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
            />
            <SwitchRow
              label="Enable included domains rule"
              checked={settings.rules.includedDomainsEnabled}
              onChange={(includedDomainsEnabled) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, includedDomainsEnabled }
                })
              }
            />
            <TextAreaField
              label="Included domains"
              value={settings.rules.includedDomains.join('\n')}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, includedDomains: splitList(value) }
                })
              }
            />
            <SwitchRow
              label="Enable excluded domains rule"
              checked={settings.rules.excludedDomainsEnabled}
              onChange={(excludedDomainsEnabled) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, excludedDomainsEnabled }
                })
              }
            />
            <TextAreaField
              label="Excluded domains"
              value={settings.rules.excludedDomains.join('\n')}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  rules: { ...settings.rules, excludedDomains: splitList(value) }
                })
              }
            />
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
          <CardContent className="space-y-4">
            <SwitchRow
              label="Send cookies"
              checked={settings.requestContext.sendCookies}
              onChange={(sendCookies) =>
                setSettings({
                  ...settings,
                  requestContext: { ...settings.requestContext, sendCookies }
                })
              }
            />
            <SwitchRow
              label="Send Referer"
              checked={settings.requestContext.sendReferer}
              onChange={(sendReferer) =>
                setSettings({
                  ...settings,
                  requestContext: { ...settings.requestContext, sendReferer }
                })
              }
            />
            <SwitchRow
              label="Send User-Agent"
              checked={settings.requestContext.sendUserAgent}
              onChange={(sendUserAgent) =>
                setSettings({
                  ...settings,
                  requestContext: { ...settings.requestContext, sendUserAgent }
                })
              }
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit">Save settings</Button>
          {message ? (
            <span className="text-sm text-emerald-600">{message}</span>
          ) : null}
        </div>
      </form>
    </main>
  );
}

function RpcStatusBadge({ status }: { status: RpcStatus }) {
  if (status.ok) {
    return <Badge>Connected: aria2 {status.version}</Badge>;
  }

  return <Badge variant="destructive">Disconnected: {status.message}</Badge>;
}

function TextField({
  label,
  value,
  onChange,
  min,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  type?: 'number' | 'password' | 'text';
}) {
  const id = label.toLowerCase().replaceAll(' ', '-');

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        min={min}
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replaceAll(' ', '-');

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        className="min-h-20"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
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
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
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
```

- [ ] **Step 2: Run options tests**

Run:

```bash
npm test -- src/options/OptionsApp.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run all tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit options redesign**

Run:

```bash
git add src/options/OptionsApp.tsx src/options/OptionsApp.test.tsx
git commit -m "$(cat <<'EOF'
feat(options): redesign settings with shadcn components

Refresh the settings form with compact cards, inputs, switches, and status badges while preserving save and test behavior.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Final Verification and Manual UI Check

**Files:**
- Verify all changed files from Tasks 1-5.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and `dist/` is rebuilt.

- [ ] **Step 4: Start dev server for manual UI check**

Run:

```bash
npm run dev
```

Expected: Vite starts on `127.0.0.1` and prints local URLs for the popup and options HTML entry points.

- [ ] **Step 5: Manually inspect popup UI**

Open the popup HTML entry from the Vite server, usually the `src/popup/index.html` route shown by Vite.

Verify:

- Loading state appears in a card.
- Header shows `Aria2 Manager`.
- RPC status appears as a badge.
- Enabled/paused state appears as a badge.
- `Enable interception` switch is visible and compact.
- Four rule switches are visible and compact.
- Latest result card is visible.
- Active tasks card shows empty state or task progress without layout overflow.
- Settings button remains visible in the header area.

- [ ] **Step 6: Manually inspect options UI**

Open the options HTML entry from the Vite server, usually the `src/options/index.html` route shown by Vite.

Verify:

- Page uses a centered compact form.
- RPC settings card contains RPC URL, RPC token, and `Test connection` button.
- Interception rules card contains all existing switches and fields.
- Request context card contains cookies, Referer, and User-Agent switches.
- Save action area contains `Save settings` and success text after saving.
- System light/dark mode changes preserve readable foreground/background contrast.

- [ ] **Step 7: Stop the dev server**

Stop the foreground dev server with `Ctrl+C`, or stop the background task if the command was started in the background.

Expected: no dev server remains running.

- [ ] **Step 8: Inspect final diff**

Run:

```bash
git status --short
git diff --stat HEAD
```

Expected:

- Only intended files from this plan are changed.
- `dist/` changes are present only if this repository tracks build output and `npm run build` changed it.

- [ ] **Step 9: Commit final verification artifacts if needed**

If `npm run build` changed tracked `dist/` files, commit them:

```bash
git add dist
git commit -m "$(cat <<'EOF'
build: update extension output

Refresh built extension assets after the shadcn UI redesign.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

If `dist/` is untracked or unchanged, do not create this commit.

---

## Self-Review

Spec coverage:

- shadcn configuration: Task 1 covers `components.json`, aliases, generated components, `cn()`, CSS variables, and system theme tokens.
- Popup redesign: Tasks 2 and 3 cover header badges, settings button, main switch, rule switches, latest result, active tasks, progress, loading, and error UI.
- Options redesign: Tasks 4 and 5 cover the single-form card layout, RPC fields, test button, connection badge, rule fields, privacy switches, save button, and success message.
- Behavior preservation: Tasks 2-5 keep the same message calls, refresh interval, save/test flows, `splitList()`, and `normalizeSettings()`.
- Verification: Task 6 covers tests, lint, build, and manual UI checks.

Placeholder scan:

- The plan contains no `TBD`, `TODO`, deferred implementation steps, or undefined helper names.
- Generated shadcn component internals are delegated to the official CLI command because shadcn/ui is source-generated by design; all app-owned code changes are shown explicitly.

Type consistency:

- `RpcStatus`, `ExtensionSettings`, `RuleSettings`, and `Aria2ActiveTask` imports match existing app types.
- `SwitchRow`, `TextField`, `TextAreaField`, `splitList`, and `normalizeSettings` are defined in the files that use them.
- Tests use accessible roles and labels rendered by the planned shadcn components.
