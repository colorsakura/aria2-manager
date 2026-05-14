# shadcn UI Redesign Design

## Goal

Redesign the Aria2 Manager browser extension UI with shadcn/ui while preserving the existing behavior of the popup, options page, settings model, aria2 RPC flow, and tests.

The redesign covers both UI entry points:

- Popup UI
- Options settings UI

The visual direction is compact: clear hierarchy, high information density, and controls sized for a browser extension.

## Non-goals

- Do not change the aria2 RPC implementation.
- Do not change extension storage or settings message protocols.
- Do not add routing, new pages, or i18n.
- Do not add a manual theme toggle.
- Do not redesign background interception behavior.

## Dependencies and project setup

Use shadcn/ui as source-generated local components rather than a traditional runtime component library.

Add shadcn configuration for a Vite React TypeScript project:

- Add `components.json`.
- Configure aliases for `@/components`, `@/components/ui`, `@/lib`, and `@/hooks`.
- Update `tsconfig.json` and `vite.config.ts` so `@` resolves to `src`.
- Add `src/lib/utils.ts` with the shadcn `cn()` helper.
- Update `src/styles.css` to use shadcn CSS variables and Tailwind-compatible base styles.

Generate and use these local shadcn components:

- `button`
- `card`
- `input`
- `textarea`
- `label`
- `switch`
- `badge`
- `progress`
- `separator`

Preserve system-driven light and dark themes using CSS variables.

## Popup design

Keep the popup width compact at approximately the current `w-96` size.

Layout:

1. Header
   - Show `Aria2 Manager` as the primary title.
   - Show RPC connection state with a `Badge`.
   - Show interception enabled/paused state with a `Badge`.
   - Keep the settings button in the header area and continue opening the options page.
2. Main interception control
   - Use a prominent `Card` row with `Label` and `Switch` for `Enable interception`.
   - Keep the existing immediate save behavior.
3. Interception rules
   - Use a compact `Card` with four rows.
   - Each row uses a `Label` and `Switch`.
   - Keep the existing quick-save behavior for every rule.
4. Latest result
   - Use a `Card` with subdued text.
   - Continue showing success and failure messages from the current settings state.
5. Active tasks
   - Use a `Card` list.
   - Each task shows filename, status, speed, percentage, and a `Progress` bar.
   - Show a consistent empty state when there are no active tasks.

Loading and error states should use the same visual system instead of bare text.

## Options design

Keep the options page as a single form without navigation.

Use a centered container with compact cards and a maximum width around `max-w-4xl`.

Sections:

1. RPC settings
   - RPC URL field using `Input`.
   - RPC token field using password `Input`.
   - `Test connection` button using `Button`.
   - Connection result shown as a concise status line with a `Badge`.
2. Interception rules
   - Overall interception switch.
   - Extension rule switch and textarea/list field.
   - Minimum size rule switch and numeric input.
   - Included domains switch and textarea.
   - Excluded domains switch and textarea.
3. Request context and privacy
   - Keep the existing privacy explanation.
   - Use switches for cookies, Referer, and User-Agent.
4. Save actions
   - Primary `Save settings` button.
   - Inline success message after saving.

Keep existing English labels and form behavior.

## Data flow and behavior

The redesign is UI-only.

Popup behavior remains unchanged:

- Load popup state through `popup:getState`.
- Refresh popup state every second.
- Toggle interception through `settings:setEnabled`.
- Save rule changes through `settings:save`.
- Open the options page through `browser.runtime.openOptionsPage()`.

Options behavior remains unchanged:

- Load settings through `settings:get`.
- Save settings through `settings:save` after `normalizeSettings()`.
- Test connection by saving normalized settings, then sending `aria2:test`.
- Preserve current list splitting and settings normalization behavior.

## Error handling

Do not add new business-level fallback behavior.

- Popup keeps its current error handling around state loading.
- Options keeps the current optimistic save/test flow.
- UI states should render consistently for loading, error, empty task list, connected RPC, and disconnected RPC.

## Testing and verification

Update existing React Testing Library tests to match the redesigned markup while preserving behavior checks.

Popup tests must continue to verify:

- Title renders.
- Enable interception switch reflects state and sends the correct message.
- RPC status renders.
- Latest result renders.
- Active task name, progress, and speed render.
- Periodic refresh updates task progress.
- Rule switches save updated settings.

Options tests must continue to verify:

- Settings load into the form.
- Saving sends normalized settings.
- Testing connection saves settings and renders the RPC result.

Verification commands:

- `npm test`
- `npm run lint`
- `npm run build`

Manual UI verification:

- Start the Vite dev server.
- Check popup and options pages in light and dark system themes where practical.
- Check loading, error, empty task list, active task, save, and test-connection paths.

## Success criteria

- shadcn/ui is configured for the existing Vite React TypeScript project.
- Popup and options pages share the same compact visual language.
- Existing behavior and message protocols are unchanged.
- Tests, lint, and build pass.
- The UI remains suitable for a browser extension popup and settings page.
