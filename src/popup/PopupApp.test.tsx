import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    expect(
      screen.getByRole('checkbox', { name: 'Enable interception' })
    ).toBeChecked();
    expect(screen.getByText('Connected: aria2 1.37.0')).toBeInTheDocument();
    expect(
      screen.getByText('Last: file.zip sent to aria2')
    ).toBeInTheDocument();
    expect(screen.getByText('file.zip')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('toggles interception', async () => {
    const user = userEvent.setup();
    mockedSend
      .mockResolvedValueOnce({
        type: 'popupState',
        settings: createDefaultSettings(),
        rpcStatus: { ok: false, message: 'offline' },
        tasks: []
      })
      .mockResolvedValueOnce({ type: 'ok' });

    render(<PopupApp />);

    await user.click(
      await screen.findByRole('checkbox', { name: 'Enable interception' })
    );

    await waitFor(() => {
      expect(mockedSend).toHaveBeenCalledWith(
        { type: 'settings:setEnabled', enabled: false },
        'ok'
      );
    });
  });
});
