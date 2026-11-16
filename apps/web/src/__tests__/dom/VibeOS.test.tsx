import { describe, expect, it } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { VibeOS } from '../../VibeOS';
import { installFetch, json, type FakeResponse } from './harness';

describe('Vibe OS surface', () => {
  it('opens on one calm conversation instead of the instrument panel', () => {
    installFetch();
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /what shall we make real/i })).toBeInTheDocument();
    expect(screen.getByRole('log', { name: 'Conversation' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Intent' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Invisible Online Computer' })).not.toBeInTheDocument();
  });

  it('posts the intent to /v1/execute, shows the verifying line, then the verified output', async () => {
    let release: ((response: FakeResponse) => void) | null = null;
    const pending = new Promise<FakeResponse>((resolve) => {
      release = resolve;
    });
    const fetchMock = installFetch({ '/api/v1/execute': () => pending });
    const user = userEvent.setup();
    render(<VibeOS />);

    await user.type(screen.getByRole('textbox', { name: 'Intent' }), 'Review the current state.');
    await user.click(screen.getByRole('button', { name: 'Send intent' }));

    expect(screen.getByRole('status')).toHaveTextContent('[Verifying against kai_ledger...]');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/execute',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ intent: 'Review the current state.' }),
      })
    );

    release!(
      json({
        success: true,
        status: 'VERIFIED',
        response: 'Observed: the ledger is intact.',
        evidence_hash: 'b19108c11f2912c1c18f76d7f698002b613afca7f3e87835490119dc4aa8ca7e',
      })
    );

    expect(await screen.findByText('Observed: the ledger is intact.')).toBeInTheDocument();
    const badge = await screen.findByText(/verified/i, { selector: '.vibe-badge' });
    expect(badge).toHaveTextContent('b19108c1');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('fails closed on 503 instead of inventing an answer', async () => {
    installFetch({
      '/api/v1/execute': () => json({ error: 'LOCAL_BRAIN_OFFLINE' }, { status: 503 }),
    });
    const user = userEvent.setup();
    render(<VibeOS />);

    await user.type(screen.getByRole('textbox', { name: 'Intent' }), 'Send the report.');
    await user.click(screen.getByRole('button', { name: 'Send intent' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('[UNKNOWN]');
    expect(screen.getByText(/Local Brain Offline · HTTP 503/)).toBeInTheDocument();
    expect(screen.queryByText(/verified/i, { selector: '.vibe-badge' })).not.toBeInTheDocument();
  });

  it('keeps the shield verdict instead of claiming the brain is offline', async () => {
    installFetch({
      '/api/v1/execute': () =>
        json({ success: true, status: 'DIVERGENT', reason: 'KAI Shield blocked this intent.' }),
    });
    const user = userEvent.setup();
    render(<VibeOS />);

    await user.type(screen.getByRole('textbox', { name: 'Intent' }), 'Urgent send money now.');
    await user.click(screen.getByRole('button', { name: 'Send intent' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('[DIVERGENT]');
    expect(alert).not.toHaveTextContent('Local Brain Offline');
    expect(screen.getByText('KAI Shield blocked this intent.')).toBeInTheDocument();
  });

  it('treats a 200 UNKNOWN verdict as a fail-closed bubble', async () => {
    installFetch({
      '/api/v1/execute': () =>
        json({ success: true, status: 'UNKNOWN', response: null, evidence_hash: null }),
    });
    const user = userEvent.setup();
    render(<VibeOS />);

    await user.type(screen.getByRole('textbox', { name: 'Intent' }), 'Explain everything.');
    await user.click(screen.getByRole('button', { name: 'Send intent' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('[UNKNOWN]');
  });

  it('keeps the full dashboard one disclosure away', async () => {
    installFetch();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /full system dashboard/i }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /what shall we make real/i })).toBeInTheDocument()
    );
    expect(screen.getByRole('region', { name: 'Invisible Online Computer' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /vibe os/i }));
    expect(screen.getByRole('log', { name: 'Conversation' })).toBeInTheDocument();
  });
});
