import { describe, expect, it, jest } from '@jest/globals';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { VibeOS } from '../../VibeOS';
import { installFetch, json, type FakeResponse } from './harness';

const VERIFIED_RESPONSE = 'Observed: the ledger is intact.';
const VERIFIED_RESPONSE_SHA256 = '7e1fb64de987a8e0f7d01b596fdfe68802338fddc3c33b4fc9c4ef72b2a1124d';

describe('Vibe OS surface', () => {
  it('opens on one calm conversation instead of the instrument panel', async () => {
    installFetch();
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /what shall we make real/i })).toBeInTheDocument();
    expect(screen.getByRole('log', { name: 'Conversation' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Intent' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /AVRØ HOUSE emblem/i })).toBeInTheDocument();
    expect(screen.getByText('PLATFORM')).toBeInTheDocument();
    expect(screen.getByText('VERIFICATION ENGINE')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Invisible Online Computer' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Fastify Spine status')).toHaveTextContent('OBSERVED'));
  });

  it('posts the intent to /api/chat, shows the verifying line, then the verified output', async () => {
    let release: ((response: FakeResponse) => void) | null = null;
    const pending = new Promise<FakeResponse>((resolve) => {
      release = resolve;
    });
    const fetchMock = installFetch({ '/api/chat': () => pending });
    const user = userEvent.setup();
    render(<VibeOS />);

    await user.type(screen.getByRole('textbox', { name: 'Intent' }), 'Review the current state.');
    await user.click(screen.getByRole('button', { name: 'Send intent' }));

    expect(screen.getByRole('status')).toHaveTextContent('[Verifying against kai_ledger...]');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ intent: 'Review the current state.' }),
      })
    );

    release!(
      json({
        success: true,
        status: 'VERIFIED',
        response: VERIFIED_RESPONSE,
        evidence_hash: VERIFIED_RESPONSE_SHA256,
      })
    );

    expect(await screen.findByText(VERIFIED_RESPONSE)).toBeInTheDocument();
    const badge = await screen.findByText(/verified/i, { selector: '.vibe-badge' });
    expect(badge).toHaveTextContent(VERIFIED_RESPONSE_SHA256.slice(0, 8));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('fails closed on 503 instead of inventing an answer', async () => {
    installFetch({
      '/api/chat': () => json({ error: 'LOCAL_BRAIN_OFFLINE' }, { status: 503 }),
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
      '/api/chat': () =>
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
      '/api/chat': () =>
        json({ success: true, status: 'UNKNOWN', response: null, evidence_hash: null }),
    });
    const user = userEvent.setup();
    render(<VibeOS />);

    await user.type(screen.getByRole('textbox', { name: 'Intent' }), 'Explain everything.');
    await user.click(screen.getByRole('button', { name: 'Send intent' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('[UNKNOWN]');
  });

  it('switches views without losing the conversation draft and restores focus', async () => {
    installFetch();
    const user = userEvent.setup();
    render(<App />);

    const intent = screen.getByRole('textbox', { name: 'Intent' });
    await user.type(intent, 'Carry this thought across views.');
    const navigation = screen.getByRole('navigation', { name: 'OCEANICOS views' });
    expect(within(navigation).getByRole('button', { name: 'Vibe OS' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: /full system dashboard/i }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /what shall we make real/i })).toBeInTheDocument()
    );
    expect(screen.getByRole('region', { name: 'Invisible Online Computer' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Intent' })).not.toBeInTheDocument();
    const dashboardNavigation = screen.getByRole('navigation', { name: 'OCEANICOS views' });
    expect(within(dashboardNavigation).getByRole('button', { name: 'Full system dashboard' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: /vibe os/i }));
    const restoredIntent = screen.getByRole('textbox', { name: 'Intent' });
    expect(restoredIntent).toHaveValue('Carry this thought across views.');
    expect(screen.getByRole('log', { name: 'Conversation' })).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Vibe OS' })));
  });

  it('does not probe service health when the conversation surface is inactive', () => {
    const fetchMock = installFetch();
    render(<VibeOS active={false} />);

    expect(fetchMock).not.toHaveBeenCalledWith('/api/health', expect.anything());
  });

  it('shows observed API health, keeps unprobed services UNKNOWN, and opens DAV proof on demand', async () => {
    let releaseHealth: ((response: FakeResponse) => void) | null = null;
    const healthPending = new Promise<FakeResponse>((resolve) => {
      releaseHealth = resolve;
    });
    installFetch({
      '/api/health': () => healthPending,
      '/api/tensor/4': () => json({
        success: true,
        status: 'VERIFIED',
        size: 4,
        projection: { rows: 16, columns: 16 },
        values: Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => 0)),
        invariants: { min: 0, max: 12, mean: 6, checksum: 1536 },
        sha256: 'a'.repeat(64),
      }),
    });
    const user = userEvent.setup();
    render(<VibeOS />);

    await act(async () => {
      releaseHealth!(json({ status: 'ok' }));
      await healthPending;
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByLabelText('Fastify Spine status')).toHaveTextContent('OBSERVED');
    expect(screen.getByLabelText('Local LLM · 11434 status')).toHaveTextContent('UNKNOWN');
    expect(screen.getByLabelText('KAI Shield status')).toHaveTextContent('UNKNOWN');
    expect(screen.queryByLabelText('SHA-256 verified')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /inspect 4×4×4×4 tensor/i }));
    expect(screen.getByRole('button', { name: /inspect 4×4×4×4 tensor/i })).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByLabelText('SHA-256 verified')).toBeInTheDocument();
    expect(screen.getByText('1,536')).toBeInTheDocument();
  });

  it('preserves an HTTP 422 DIVERGENT receipt instead of flattening it to UNKNOWN', async () => {
    installFetch({
      '/api/chat': () => json({
        success: false,
        status: 'DIVERGENT',
        error: 'TENSOR_INVARIANT_DIVERGENCE',
        issues: ['observed result diverges'],
      }, { status: 422 }),
    });
    const user = userEvent.setup();
    render(<VibeOS />);

    await user.type(screen.getByRole('textbox', { name: 'Intent' }), 'Inspect this state.');
    await user.click(screen.getByRole('button', { name: 'Send intent' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('[DIVERGENT]');
    expect(screen.getByText('TENSOR_INVARIANT_DIVERGENCE · HTTP 422')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('KAI Shield status')).toHaveTextContent('DIVERGENT'));
  });

  it.each([
    {
      name: 'missing digest',
      receipt: { success: true, status: 'VERIFIED', response: VERIFIED_RESPONSE },
      expectedStatus: 'UNKNOWN',
      reason: 'did not include a SHA-256 digest',
    },
    {
      name: 'malformed digest',
      receipt: { success: true, status: 'VERIFIED', response: VERIFIED_RESPONSE, evidence_hash: 'not-a-digest' },
      expectedStatus: 'DIVERGENT',
      reason: 'malformed SHA-256 digest',
    },
    {
      name: 'mismatched digest',
      receipt: { success: true, status: 'VERIFIED', response: VERIFIED_RESPONSE, evidence_hash: '0'.repeat(64) },
      expectedStatus: 'DIVERGENT',
      reason: 'does not match the supplied SHA-256 digest',
    },
    {
      name: 'missing response body',
      receipt: { success: true, status: 'VERIFIED', response: null, evidence_hash: VERIFIED_RESPONSE_SHA256 },
      expectedStatus: 'UNKNOWN',
      reason: 'did not include a response body',
    },
  ])('does not badge a VERIFIED claim with a $name', async ({ receipt, expectedStatus, reason }) => {
    installFetch({ '/api/chat': () => json(receipt) });
    const user = userEvent.setup();
    render(<VibeOS />);

    await user.type(screen.getByRole('textbox', { name: 'Intent' }), 'Check the response receipt.');
    await user.click(screen.getByRole('button', { name: 'Send intent' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(`[${expectedStatus}]`);
    expect(screen.getByText(new RegExp(reason, 'i'))).toBeInTheDocument();
    expect(screen.queryByText(VERIFIED_RESPONSE)).not.toBeInTheDocument();
    expect(screen.queryByText(/verified/i, { selector: '.vibe-badge' })).not.toBeInTheDocument();
  });

  it('keeps the receipt UNKNOWN when Web Crypto cannot compute the response digest', async () => {
    const digestSpy = jest.spyOn(globalThis.crypto.subtle, 'digest').mockRejectedValue(new Error('unavailable'));
    try {
      installFetch({
        '/api/chat': () => json({
          success: true,
          status: 'VERIFIED',
          response: VERIFIED_RESPONSE,
          evidence_hash: VERIFIED_RESPONSE_SHA256,
        }),
      });
      const user = userEvent.setup();
      render(<VibeOS />);

      await user.type(screen.getByRole('textbox', { name: 'Intent' }), 'Check crypto availability.');
      await user.click(screen.getByRole('button', { name: 'Send intent' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('[UNKNOWN]');
      expect(screen.getByText(/SHA-256 verification is unavailable/i)).toBeInTheDocument();
      expect(screen.queryByText(VERIFIED_RESPONSE)).not.toBeInTheDocument();
      expect(screen.queryByText(/verified/i, { selector: '.vibe-badge' })).not.toBeInTheDocument();
    } finally {
      digestSpy.mockRestore();
    }
  });
});
