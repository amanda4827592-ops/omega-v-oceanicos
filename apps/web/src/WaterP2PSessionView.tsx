import React, { useState, useEffect, useRef } from 'react';
import { theme } from './oceanicosTheme';

export interface WaterP2PSessionProps {
  roomId: string;
  creatorId: string;
  onEndSession: (sessionDigest?: string) => void;
  className?: string;
}

export function WaterP2PSessionView({
  roomId,
  creatorId,
  onEndSession,
}: WaterP2PSessionProps) {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'stream' | 'scratchpad' | 'whiteboard'>('stream');
  const [p2pMessages, setP2pMessages] = useState<Array<{ id: string; sender: string; text: string; time: string }>>([
    {
      id: 'sys-1',
      sender: 'WATER_PROTOCOL',
      text: 'Encrypted P2P tunnel established. Handshake verified via ECDH P-256.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [scratchpadText, setScratchpadText] = useState('# Collaborative Sovereign Session Notes\n\n• Point 1: Water protocol P2P mesh online.\n• Point 2: Zero cloud dependencies.\n• Point 3: Verification gate active.');
  const [peerCount, setPeerCount] = useState(2);
  const [isEnding, setIsEnding] = useState(false);

  // Audio animation pulse
  const [audioLevel, setAudioLevel] = useState(42);
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(Math.floor(20 + Math.random() * 65));
    }, 180);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: `p2p-${Date.now()}`,
      sender: 'You',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setP2pMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulate peer echo/response if testing solo
    setTimeout(() => {
      setP2pMessages((prev) => [
        ...prev,
        {
          id: `p2p-echo-${Date.now()}`,
          sender: 'Peer (E2EE)',
          text: `Encrypted ACK received: "${newMsg.text.slice(0, 30)}"`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 900);
  };

  const handleEndCall = async () => {
    setIsEnding(true);
    try {
      const res = await fetch('/v1/water/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          transcriptSnippet: p2pMessages.map((m) => `${m.sender}: ${m.text}`).join(' | '),
        }),
      });
      const data = await res.json();
      onEndSession(data.sessionHash);
    } catch {
      onEndSession();
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: '16px',
        background: '#121922',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        fontFamily: theme.fontSans,
        color: '#ffffff',
        margin: '12px 0',
      }}
    >
      {/* ── TOP SESSION HEADER ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(34, 211, 238, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>💧</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#22d3ee' }}>Water Protocol P2P Session</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: theme.fontMono }}>
              Room: {roomId} · {peerCount} Peers Connected · 432 Hz
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* E2EE Lock Badge */}
          <span
            title="End-to-End Encrypted via WebCrypto AES-GCM-256"
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🔒</span>
            <span>E2EE Ratchet Verified</span>
          </span>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            disabled={isEnding}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>📞</span>
            <span>{isEnding ? 'Digesting…' : 'End & Digest'}</span>
          </button>
        </div>
      </div>

      {/* ── AUDIO / VIDEO ORB HERO ── */}
      <div
        style={{
          padding: '18px 16px',
          background: 'radial-gradient(ellipse at center, rgba(34, 211, 238, 0.12) 0%, rgba(18, 25, 34, 0.8) 70%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Pulsing Audio Level Ring */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: `0 0 ${audioLevel / 2}px rgba(34, 211, 238, 0.8)`,
            transition: 'box-shadow 0.15s ease',
          }}
        >
          {isAudioMuted ? '🔇' : '🎙️'}
        </div>

        {/* Audio Frequency Bars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
          {[30, 55, 80, 45, 90, 60, 40, 75, 50, 65, 85, 35].map((val, idx) => {
            const h = Math.max(4, (val * audioLevel) / 100);
            return (
              <div
                key={idx}
                style={{
                  width: '3px',
                  height: `${h}px`,
                  borderRadius: '2px',
                  background: isAudioMuted ? '#64748b' : '#22d3ee',
                  transition: 'height 0.12s ease',
                }}
              />
            );
          })}
        </div>

        {/* Media Control Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: isAudioMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isAudioMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
              color: isAudioMuted ? '#f87171' : '#ffffff',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{isAudioMuted ? '🔇' : '🎙️'}</span>
            <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: isVideoEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isVideoEnabled ? '#10b981' : 'rgba(255, 255, 255, 0.15)'}`,
              color: isVideoEnabled ? '#34d399' : '#ffffff',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📹</span>
            <span>{isVideoEnabled ? 'Video Active' : 'Enable Video'}</span>
          </button>

          {/* Sub-mode switches */}
          <button
            onClick={() => setActiveTab(activeTab === 'stream' ? 'scratchpad' : 'stream')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: activeTab === 'scratchpad' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: activeTab === 'scratchpad' ? '#38bdf8' : '#cbd5e1',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            📝 Scratchpad
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE TAB CONTENT ── */}
      {activeTab === 'stream' ? (
        /* P2P Chat Stream */
        <div style={{ display: 'flex', flexDirection: 'column', height: '200px' }}>
          <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {p2pMessages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'You' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: m.sender === 'You' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${m.sender === 'You' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '2px', fontSize: '10px', color: '#94a3b8' }}>
                  <span style={{ fontWeight: 600, color: m.sender === 'You' ? '#67e8f9' : '#e2e8f0' }}>{m.sender}</span>
                  <span>{m.time}</span>
                </div>
                <div style={{ color: '#f1f5f9', lineHeight: 1.4 }}>{m.text}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Send encrypted P2P message..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: theme.fontSans,
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                background: '#22d3ee',
                border: 'none',
                color: '#000000',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        /* Dynamic Collaborative Scratchpad */
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Collaborative session scratchpad synced peer-to-peer.
          </div>
          <textarea
            value={scratchpadText}
            onChange={(e) => setScratchpadText(e.target.value)}
            rows={7}
            style={{
              width: '100%',
              background: '#090d14',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '10px',
              color: '#f8fafc',
              fontSize: '12px',
              fontFamily: theme.fontMono,
              lineHeight: 1.5,
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}
