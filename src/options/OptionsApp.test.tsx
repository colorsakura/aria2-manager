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
});
