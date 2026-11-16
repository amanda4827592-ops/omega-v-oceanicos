import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { submitIntent } from './vibe-os-api';
import './VibeOS.css';

/*
 * The Vibe OS — one sidebar, one conversation, one input.
 *
 * Every assistant bubble is the receipt of one intent: VERIFIED carries the
 * API's output and the first 8 characters of its evidence hash, and every
 * other outcome is a fail-closed bubble. Nothing here asserts what the API did
 * not return.
 */

export type ChatMessage = {
  role: 'user' | 'ai';
  content: string;
  verified: boolean;
  hash?: string;
  /** The API's own reason for a fail-closed answer, kept as disclosure. */
  detail?: string;
};

const VERIFYING = '[Verifying against kai_ledger...]';
const FAIL_CLOSED = '[DIVERGENT: Local Brain Offline]';

export function VibeOS({ onOpenDashboard }: { onOpenDashboard?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [verifying, setVerifying] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  // Pin the conversation to its newest line. Assigning scrollTop works in every
  // environment (jsdom included); Element.scrollTo does not.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, verifying]);

  const send = async () => {
    const intent = draft.trim();
    if (!intent || verifying) return;

    setDraft('');
    setMessages((previous) => [...previous, { role: 'user', content: intent, verified: false }]);
    setVerifying(true);

    const receipt = await submitIntent(intent);
    setVerifying(false);

    setMessages((previous) => [
      ...previous,
      receipt.verified
        ? {
            role: 'ai',
            content: receipt.output ?? '',
            verified: true,
            hash: receipt.hash ?? undefined,
          }
        : {
            role: 'ai',
            content: FAIL_CLOSED,
            verified: false,
            detail: receipt.reason ?? undefined,
          },
    ]);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  const newChat = () => {
    if (verifying) return;
    setMessages([]);
    setDraft('');
  };

  const empty = messages.length === 0 && !verifying;

  return (
    <div className="vibe-os">
      <aside className="vibe-sidebar" aria-label="Vibe OS sidebar">
        <div className="vibe-brand">
          <span className="vibe-brand-mark" aria-hidden="true">
            ≈
          </span>
          OCEANICOS
        </div>

        <button type="button" className="vibe-new" onClick={newChat} disabled={verifying}>
          + New chat
        </button>

        <p className="vibe-sidebar-note">
          One intent at a time. Answers are checked against kai_ledger before they are shown.
        </p>

        <div className="vibe-sidebar-foot">
          <span className="vibe-sovereign">
            <span className="vibe-sovereign-dot" aria-hidden="true" />
            local sovereign API
          </span>
          {onOpenDashboard && (
            <button type="button" className="vibe-disclose" onClick={onOpenDashboard}>
              Full system dashboard →
            </button>
          )}
        </div>
      </aside>

      <div className="vibe-main">
        <header className="vibe-topbar">
          <span className="vibe-topbar-title">Vibe OS</span>
          <span>
            {messages.length === 0 ? 'New session' : `${messages.length} messages`}
            {onOpenDashboard && (
              <>
                {' · '}
                <button type="button" className="vibe-topbar-dashboard" onClick={onOpenDashboard}>
                  dashboard
                </button>
              </>
            )}
          </span>
        </header>

        <div className="vibe-log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation">
          <div className="vibe-thread">
            {empty && (
              <div className="vibe-empty">
                <h1>What shall we make real?</h1>
                <p>Describe one intent. It is verified against the ledger, or it fails closed.</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`vibe-message vibe-message--${message.role === 'user' ? 'user' : 'ai'}`}
              >
                {message.role === 'user' ? (
                  <div className="vibe-bubble vibe-bubble--user">{message.content}</div>
                ) : message.verified ? (
                  <>
                    <div className="vibe-bubble vibe-bubble--ai">{message.content}</div>
                    <span className="vibe-badge">
                      <span aria-hidden="true">🔒</span> Verified
                      {message.hash && (
                        <span className="vibe-badge-hash">{message.hash.slice(0, 8)}</span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="vibe-bubble vibe-bubble--fail" role="alert">
                      {message.content}
                    </div>
                    {message.detail && <p className="vibe-detail">{message.detail}</p>}
                  </>
                )}
              </div>
            ))}

            {verifying && (
              <div className="vibe-message vibe-message--ai">
                <div className="vibe-bubble vibe-bubble--ai vibe-bubble--pending" role="status">
                  {VERIFYING}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="vibe-composer-wrap">
          <form className="vibe-composer" onSubmit={onSubmit}>
            <textarea
              className="vibe-input"
              aria-label="Intent"
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              maxLength={2000}
              disabled={verifying}
              placeholder="Ask anything — it will be verified, not asserted."
            />
            <button
              type="submit"
              className="vibe-send"
              aria-label="Send intent"
              disabled={verifying || !draft.trim()}
            >
              ↑
            </button>
          </form>
          <p className="vibe-footnote">ATT TEST · DON&apos;T ASSERT · UNKNOWN IS PRESERVED</p>
        </div>
      </div>
    </div>
  );
}
