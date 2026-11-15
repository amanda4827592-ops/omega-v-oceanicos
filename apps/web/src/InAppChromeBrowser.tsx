import React, { useState, useEffect, useRef } from 'react';
import { theme } from './oceanicosTheme';

export interface InAppChromeBrowserProps {
  initialUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InAppChromeBrowser({
  initialUrl = 'http://localhost:5000',
  isOpen,
  onClose,
}: InAppChromeBrowserProps) {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'iframe' | 'headless'>('iframe');
  const [isMaximized, setIsMaximized] = useState(false);
  const [snapshotData, setSnapshotData] = useState<{
    screenshotBase64?: string;
    title?: string;
    textSnippet?: string;
    evidenceHash?: string;
    elapsedMs?: number;
  } | null>(null);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (initialUrl && initialUrl !== url) {
      setUrl(initialUrl);
      setInputUrl(initialUrl);
    }
  }, [initialUrl]);

  if (!isOpen) return null;

  const navigateTo = (target: string) => {
    let clean = target.trim();
    if (!/^https?:\/\//i.test(clean)) {
      if (clean.startsWith('localhost')) {
        clean = `http://${clean}`;
      } else {
        clean = `https://${clean}`;
      }
    }
    setUrl(clean);
    setInputUrl(clean);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), clean]);
    setHistoryIndex((prev) => prev + 1);
    setIsLoading(true);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex((i) => i - 1);
      setUrl(prev);
      setInputUrl(prev);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex((i) => i + 1);
      setUrl(next);
      setInputUrl(next);
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  const captureHeadlessSnapshot = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/v1/browser/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, captureScreenshot: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSnapshotData(data);
        setViewMode('headless');
      } else {
        alert(`Capture error: ${data.message || data.error}`);
      }
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const launchSystemChrome = async () => {
    try {
      await fetch('/v1/browser/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMaximized ? '0' : '20px',
      }}
    >
      {/* ── CHROME WINDOW CONTAINER ── */}
      <div
        style={{
          width: isMaximized ? '100vw' : '94%',
          maxWidth: isMaximized ? '100vw' : '1180px',
          height: isMaximized ? '100vh' : '82vh',
          background: '#202124',
          borderRadius: isMaximized ? '0' : '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: theme.fontSans,
          color: '#e8eaed',
        }}
      >
        {/* ── CHROME TAB STRIP & TITLEBAR ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#1e1f22',
            padding: '8px 12px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Active Tab */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#2b2d31',
                padding: '6px 14px',
                borderRadius: '8px 8px 0 0',
                fontSize: '12px',
                fontWeight: 500,
                color: '#ffffff',
                borderTop: '2px solid #38bdf8',
                maxWidth: '240px',
              }}
            >
              <span>🌐</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {url.replace(/^https?:\/\//, '')}
              </span>
            </div>

            <button
              onClick={() => navigateTo('http://localhost:5000')}
              title="Open localhost:5000"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              +
            </button>
          </div>

          {/* Titlebar Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px' }}>
            {/* Mode Toggle: Interactive vs Headless Snapshot */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '6px', padding: '2px' }}>
              <button
                onClick={() => setViewMode('iframe')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: viewMode === 'iframe' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: viewMode === 'iframe' ? '#38bdf8' : '#9ca3af',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⚡ Live
              </button>
              <button
                onClick={() => {
                  if (!snapshotData) captureHeadlessSnapshot();
                  else setViewMode('headless');
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: viewMode === 'headless' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: viewMode === 'headless' ? '#34d399' : '#9ca3af',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📸 Headless Proof
              </button>
            </div>

            {/* Launch in System Chrome */}
            <button
              onClick={launchSystemChrome}
              title="Launch URL in host Google Chrome Window"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '3px 8px',
                color: '#e2e8f0',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              <span>↗</span>
              <span>Host Chrome</span>
            </button>

            {/* Maximize */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? 'Restore' : 'Maximize'}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {isMaximized ? '❐' : '□'}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close Chrome Window"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── CHROME OMNIBOX & NAVIGATION TOOLBAR ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#2b2d31',
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Nav buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleBack}
              disabled={historyIndex === 0}
              title="Back"
              style={{
                background: 'transparent',
                border: 'none',
                color: historyIndex === 0 ? '#555' : '#cbd5e1',
                fontSize: '14px',
                cursor: historyIndex === 0 ? 'default' : 'pointer',
                padding: '4px 6px',
              }}
            >
              ←
            </button>
            <button
              onClick={handleForward}
              disabled={historyIndex >= history.length - 1}
              title="Forward"
              style={{
                background: 'transparent',
                border: 'none',
                color: historyIndex >= history.length - 1 ? '#555' : '#cbd5e1',
                fontSize: '14px',
                cursor: historyIndex >= history.length - 1 ? 'default' : 'pointer',
                padding: '4px 6px',
              }}
            >
              →
            </button>
            <button
              onClick={handleReload}
              title="Reload"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              ⟳
            </button>
          </div>

          {/* Omnibox URL input */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#1e1f22',
              borderRadius: '20px',
              padding: '6px 14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span style={{ fontSize: '12px', color: url.startsWith('https') || url.includes('localhost') ? '#34d399' : '#eab308' }}>
              🔒
            </span>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigateTo(inputUrl);
              }}
              placeholder="Search Google or type a URL..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: theme.fontSans,
              }}
            />
            {isLoading && (
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>Loading…</span>
            )}
            <button
              onClick={() => navigateTo(inputUrl)}
              style={{
                background: '#38bdf8',
                border: 'none',
                borderRadius: '12px',
                padding: '3px 10px',
                color: '#000000',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Go ➔
            </button>
          </div>

          {/* Capture proof button */}
          <button
            onClick={captureHeadlessSnapshot}
            title="Execute Chrome Headless Engine to capture DOM and screenshot"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>📸</span>
            <span>Capture Proof</span>
          </button>
        </div>

        {/* ── CHROME BOOKMARKS BAR ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#2b2d31',
            padding: '4px 12px 6px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '11px',
            overflowX: 'auto',
          }}
        >
          {[
            { label: '🏠 Master API (:5000)', url: 'http://localhost:5000' },
            { label: '✨ Dev Shell (:3000)', url: 'http://localhost:3000' },
            { label: '⚡ API Health', url: 'http://localhost:5000/health' },
            { label: '📰 AI News', url: 'http://localhost:5000/v1/glober/news' },
            { label: '🐙 GitHub', url: 'https://github.com/starofgodmayomi-droid/omega-v-oceanicos' },
            { label: '🌐 Google', url: 'https://google.com' },
          ].map((bm, i) => (
            <button
              key={i}
              onClick={() => navigateTo(bm.url)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '4px',
                padding: '2px 8px',
                color: '#cbd5e1',
                fontSize: '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
            >
              {bm.label}
            </button>
          ))}
        </div>

        {/* ── VIEWPORT: LIVE IFRAME OR HEADLESS SNAPSHOT ── */}
        <div style={{ flex: 1, position: 'relative', background: '#ffffff', overflow: 'auto' }}>
          {viewMode === 'iframe' ? (
            <iframe
              ref={iframeRef}
              src={url}
              title="Chrome in-app viewport"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              onLoad={() => setIsLoading(false)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#ffffff',
              }}
            />
          ) : (
            /* Headless Proof & Screenshot Mode */
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#121212',
                color: '#f8fafc',
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Proof Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px' }}>
                    ✓ Headless Chromium Sandboxed Proof Sealed
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: theme.fontMono }}>
                    Target: {url} ({snapshotData?.elapsedMs ?? 0}ms)
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#6ee7b7', fontFamily: theme.fontMono }}>
                  SHA-256: {snapshotData?.evidenceHash?.slice(0, 20)}…
                </div>
              </div>

              {/* Screenshot Preview */}
              {snapshotData?.screenshotBase64 && (
                <div style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                  <img
                    src={`data:image/png;base64,${snapshotData.screenshotBase64}`}
                    alt="Headless Chrome Viewport Snapshot"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              )}

              {/* Text Snippet */}
              {snapshotData?.textSnippet && (
                <div style={{ padding: '12px', borderRadius: '8px', background: '#1e1e1e', fontSize: '12px', color: '#cbd5e1' }}>
                  <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '6px' }}>Extracted Text Snippet:</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{snapshotData.textSnippet}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
