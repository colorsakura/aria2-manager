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

    await waitFor(() => {
      expect(screen.getByText('Connected: aria2 1.37.0')).toBeInTheDocument();
    });
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Enable interception' })
    ).toBeChecked();
    expect(screen.getByText('Last: file.zip sent to aria2')).toBeInTheDocument();
    expect(screen.getByText('file.zip')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'file.zip progress' })
    ).toHaveAttribute('aria-valuenow', '50');
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
