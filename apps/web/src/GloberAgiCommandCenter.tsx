import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from './oceanicosTheme';
import { enqueueOfflineMessage } from './offlineQueue';

/* ── API helpers ── */
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.port !== '5000'
    ? `http://${window.location.hostname}:5000`
    : '')
).replace(/\/$/, '');

function apiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const primaryUrl = apiUrl(path);
  let response: Response;
  try {
    response = await fetch(primaryUrl, init);
  } catch (primaryErr: any) {
    try {
      response = await fetch(path, init);
    } catch {
      throw primaryErr;
    }
  }
  const text = await response.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`API returned invalid JSON (${response.status})`);
  }
  if (!response.ok) {
    const err = new Error(payload?.error || payload?.message || `API request failed (${response.status})`) as any;
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return payload as T;
}

/* ── CodeBlock Component with Copy-To-Clipboard (ChatGPT Parity) ── */
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        margin: '10px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#090d14',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.04)',
          fontSize: '11px',
          color: '#94a3b8',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontFamily: theme.fontMono,
        }}
      >
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#10b981' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: theme.fontMono,
          }}
        >
          {copied ? '✓ Copied' : '📋 Copy code'}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '12px',
          overflowX: 'auto',
          fontSize: '12px',
          color: '#e2e8f0',
          fontFamily: theme.fontMono,
          lineHeight: 1.5,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderMessageContent(content: string) {
  if (!content.includes('```')) {
    return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>;
  }

  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const language = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : '';
          const code = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);
          return <CodeBlock key={index} language={language} code={code} />;
        }
        return (
          <div key={index} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '4px 0' }}>
            {part}
          </div>
        );
      })}
    </div>
  );
}

export interface RealWorldTool {
  id: string;
  name: string;
  description: string;
  risk: string;
  category: 'physical-iot' | 'financial' | 'communications' | 'productivity' | 'os-desktop' | 'system' | 'intelligence' | 'provenance' | 'mathematics' | 'testing' | 'security' | 'notion';
  status: string;
}

export interface ToolExecutionLog {
  id: string;
  toolId: string;
  timestamp: string;
  elapsedMs: number;
  status: 'SUCCESS' | 'HITL_GATED' | 'FAILED';
  evidenceHash: string;
  outputPreview?: string;
  kaiRecordId?: string;
}

export interface GloberAgiCommandCenterProps {
  chatMessages?: Array<{
    id: string;
    sender: 'user' | 'aisoul' | 'system';
    content: string;
    timestamp: string;
    organ?: string;
    metadata?: any;
  }>;
  isSending?: boolean;
  onSendMessage?: (message: string, mode?: string, model?: string) => void;
  onClearChat?: () => void;
  onNavigateViewport?: (mode: string) => void;
  className?: string;
}

export function GloberAgiCommandCenter({
  chatMessages,
  isSending: externalIsSending,
  onSendMessage,
  onClearChat,
  onNavigateViewport,
}: GloberAgiCommandCenterProps) {
  // ── Layout State (ChatGPT Clean Progressive Disclosure) ──
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [toolsAccordionOpen, setToolsAccordionOpen] = useState(false);
  const [organsAccordionOpen, setOrgansAccordionOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  // ── Mode & Model Toggles (The Glober Switch with Persistence) ──
  const [activeMode, setActiveMode] = useState<'collaborative' | 'autonomous'>('collaborative');
  const [activeSubMode, setActiveSubMode] = useState<'chat' | 'cowork' | 'swarm' | 'goal' | 'computer'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('oceanicos_submode');
      if (saved && ['chat', 'cowork', 'swarm', 'goal', 'computer'].includes(saved)) {
        return saved as any;
      }
    }
    return 'chat';
  });
  const [selectedModel, setSelectedModel] = useState<'fast' | 'auto' | 'expert' | 'heavy' | 'sonnet' | 'gemini'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('oceanicos_model');
      if (saved && ['fast', 'auto', 'expert', 'heavy', 'sonnet', 'gemini'].includes(saved)) {
        return saved as any;
      }
    }
    return 'auto';
  });

  // ── Inputs ──
  const [promptText, setPromptText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activePlugins, setActivePlugins] = useState<string[]>(['web-search', 'memory']);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Global Keyboard Shortcuts (Ctrl+K, Cmd+K, Escape) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPromptText('');
        setLocalMessages([]);
        if (onClearChat) onClearChat();
        textareaRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setModelMenuOpen(false);
        setRightPanelOpen(false);
        setShowAuthOverlay(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClearChat]);

  // ── Save Model & Submode on Change ──
  const updateSelectedModel = (model: 'fast' | 'auto' | 'expert' | 'heavy' | 'sonnet' | 'gemini') => {
    setSelectedModel(model);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('oceanicos_model', model);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  };

  // ── Local Fallback Messages ──
  const [localMessages, setLocalMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'aisoul' | 'system';
    content: string;
    timestamp: string;
    organ?: string;
    metadata?: any;
  }>>([]);

  const messages = chatMessages && chatMessages.length > 0 ? chatMessages : localMessages;
  const [internalIsSending, setInternalIsSending] = useState(false);
  const isSending = externalIsSending ?? internalIsSending;

  // ── Auth0 & Tenant State ──
  const [authSession, setAuthSession] = useState<any>(null);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  // ── Real-World Tools Registry & Execution Streaming ──
  const [toolsList, setToolsList] = useState<RealWorldTool[]>([]);
  const [toolLogs, setToolLogs] = useState<ToolExecutionLog[]>([]);
  const [activeStreamingTool, setActiveStreamingTool] = useState<{
    toolId: string;
    step: string;
    status: 'invoking' | 'processing' | 'done' | 'hitl';
  } | null>(null);
  const [hitlPrompt, setHitlPrompt] = useState<{
    toolId: string;
    params: Record<string, any>;
    message: string;
  } | null>(null);

  // ── Glober News & Goals State ──
  const [globerStatus, setGloberStatus] = useState<any>(null);
  const [newsSignals, setNewsSignals] = useState<any[]>([]);
  const [lastExecutedEvidence, setLastExecutedEvidence] = useState<string | null>(null);

  // ── ChatGPT Advanced Voice Mode State & Invariants ──
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // ── Recent Conversations / Sessions ──
  const [recentChats, setRecentChats] = useState<Array<{
    id: string;
    title: string;
    fullPrompt: string;
    timestamp: string;
  }>>([]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // ── Dynamic Contextual Greeting ──
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // ── Fetch Session, Tools & Glober Status ──
  const loadState = useCallback(async () => {
    try {
      const [sessionData, statusData, newsData, toolsData, historyData] = await Promise.all([
        apiRequest<any>('/v1/auth/session').catch(() => null),
        apiRequest<any>('/v1/glober/status').catch(() => null),
        apiRequest<any>('/v1/glober/news').catch(() => null),
        apiRequest<any>('/v1/tools/list').catch(() => null),
        apiRequest<any>('/v1/chat/history?limit=12').catch(() => null),
      ]);
      if (sessionData?.success) setAuthSession(sessionData);
      if (statusData?.success && statusData.state) {
        setGloberStatus(statusData.state);
        setActiveMode(statusData.state.mode || 'collaborative');
        setActiveSubMode(statusData.state.subMode || 'chat');
      }
      if (newsData?.success && Array.isArray(newsData.signals)) {
        setNewsSignals(newsData.signals);
      }
      if (toolsData?.success && Array.isArray(toolsData.tools)) {
        setToolsList(toolsData.tools);
      }
      if (historyData?.success && Array.isArray(historyData.messages)) {
        const userQueries = historyData.messages
          .filter((m: any) => m.sender === 'user')
          .slice(-8)
          .reverse()
          .map((m: any) => ({
            id: m.id,
            title: m.content.length > 38 ? m.content.slice(0, 38) + '…' : m.content,
            fullPrompt: m.content,
            timestamp: m.timestamp || '',
          }));
        setRecentChats(userQueries);
      }
    } catch {
      /* ambient */
    }
  }, []);

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 25000);
    return () => clearInterval(interval);
  }, [loadState]);

  // ── Execute Live Real-World Tool with Streaming Feedback & HITL ──
  const executeRealWorldTool = async (toolId: string, params: Record<string, any> = {}) => {
    setActiveStreamingTool({
      toolId,
      step: `Zero-trust invocation envelope dispatching to ${toolId}…`,
      status: 'invoking',
    });

    try {
      const res = await apiRequest<any>('/v1/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, params }),
      });

      setActiveStreamingTool({
        toolId,
        step: `✓ Execution verified (${res.elapsedMs}ms). Sealed to KAI ledger.`,
        status: 'done',
      });

      const newLog: ToolExecutionLog = {
        id: `log-${Date.now()}`,
        toolId,
        timestamp: new Date().toLocaleTimeString(),
        elapsedMs: res.elapsedMs,
        status: 'SUCCESS',
        evidenceHash: res.evidenceHash,
        outputPreview: JSON.stringify(res.output).slice(0, 140),
        kaiRecordId: res.kaiRecordId,
      };
      setToolLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      setLastExecutedEvidence(res.evidenceHash);

      setTimeout(() => setActiveStreamingTool(null), 4000);
    } catch (err: any) {
      if (err.status === 403 || err.payload?.error === 'HITL_AUTHORIZATION_REQUIRED') {
        setActiveStreamingTool({
          toolId,
          step: '🔒 Consequential Real-World Action: Human-in-the-Loop approval mandated',
          status: 'hitl',
        });
        setHitlPrompt({
          toolId,
          params,
          message: `Tool [${toolId}] requires zero-trust authorization to actuate real-world devices or assets.`,
        });
      } else {
        setActiveStreamingTool({
          toolId,
          step: `✗ Execution failed: ${err.message}`,
          status: 'done',
        });
        setTimeout(() => setActiveStreamingTool(null), 4000);
      }
    }
  };

  // ── Confirm HITL Authorization Handshake ──
  const confirmHitl = async () => {
    if (!hitlPrompt) return;
    const { toolId, params } = hitlPrompt;
    setHitlPrompt(null);
    await executeRealWorldTool(toolId, { ...params, approved: true });
  };

  // ── Handle Mode Switch ──
  const handleModeSwitch = async (mode: 'collaborative' | 'autonomous', subMode: any) => {
    setActiveMode(mode);
    setActiveSubMode(subMode);
    try {
      await apiRequest('/v1/glober/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, subMode, model: selectedModel }),
      });
    } catch {
      /* ambient */
    }
  };

  // ── Handle Prompt Submit ──
  const handleSendPrompt = async (textToSend?: string) => {
    const query = (textToSend || promptText).trim();
    if (!query || isSending) return;

    setPromptText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '26px';
    }

    if (onSendMessage) {
      onSendMessage(query, activeSubMode, selectedModel);
      return;
    }

    setInternalIsSending(true);
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user' as const,
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setLocalMessages((prev) => [...prev, userMsg]);

    try {
      const res = await apiRequest<any>('/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          mode: activeMode,
          subMode: activeSubMode,
          model: selectedModel,
        }),
      });
      if (res?.success && res.reply) {
        setLocalMessages((prev) => [
          ...prev,
          {
            id: res.reply.id || `ai-${Date.now()}`,
            sender: 'aisoul',
            content: res.reply.content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            organ: res.reply.metadata?.organ,
            metadata: res.reply.metadata,
          },
        ]);
        if (res.reply.metadata?.evidenceHash) {
          setLastExecutedEvidence(res.reply.metadata.evidenceHash);
        }
      }
    } catch {
      await enqueueOfflineMessage(query);
    } finally {
      setInternalIsSending(false);
    }
  };

  // ── Toggle Plugin ──
  const togglePlugin = (pluginId: string) => {
    setActivePlugins((prev) =>
      prev.includes(pluginId) ? prev.filter((p) => p !== pluginId) : [...prev, pluginId]
    );
  };

  // ── ChatGPT Advanced Voice Mode Engine ──
  const cleanSpokenText = (text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    stopListening();

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceState('listening');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const current = finalTranscript || interim;
      setVoiceTranscript(current);

      if (finalTranscript.trim()) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
          const query = finalTranscript.trim();
          setVoiceTranscript(query);
          setVoiceState('thinking');
          handleSendPrompt(query);
        }, 1200);
      }
    };

    recognition.onerror = () => {
      if (voiceModeActive && voiceState === 'listening') {
        setTimeout(() => startListening(), 600);
      }
    };

    recognition.onend = () => {
      if (voiceModeActive && voiceState === 'listening') {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  }, [voiceModeActive, voiceState, stopListening]);

  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = cleanSpokenText(text);
    if (!cleanText) return;

    setVoiceState('speaking');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en'))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      if (voiceModeActive) {
        setVoiceState('listening');
        startListening();
      } else {
        setVoiceState('idle');
      }
    };

    utterance.onerror = () => {
      if (voiceModeActive) {
        setVoiceState('listening');
        startListening();
      } else {
        setVoiceState('idle');
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [voiceModeActive, startListening]);

  const startVoiceMode = () => {
    setVoiceModeActive(true);
    setVoiceState('listening');
    startListening();
  };

  const stopVoiceMode = () => {
    setVoiceModeActive(false);
    setVoiceState('idle');
    stopListening();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Auto-speak AI reply when in Advanced Voice Mode
  useEffect(() => {
    if (voiceModeActive && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'aisoul') {
        speakText(lastMsg.content);
      }
    }
  }, [messages, voiceModeActive, speakText]);

  // Clean up synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopListening]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        background: '#212121',
        overflow: 'hidden',
        color: '#ececec',
        fontFamily: theme.fontSans,
        position: 'relative',
      }}
    >
      {/* ── TOP HEADER: ChatGPT Clean Header ── */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '52px',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#212121',
          fontSize: '13px',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            title="Toggle Sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 8px',
              color: '#d1d5db',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ☰
          </button>

          {/* Model Selector Pill Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setModelMenuOpen(!modelMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: modelMenuOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <span>Ω∞v OceanicOS</span>
              <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize' }}>
                · {selectedModel}
              </span>
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>▾</span>
            </button>

            {modelMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  left: '0',
                  background: '#2f2f2f',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                  zIndex: 60,
                  width: '260px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {[
                  { id: 'auto', name: 'Auto (Hybrid)', desc: 'Smart balanced multimodal reasoning' },
                  { id: 'fast', name: 'Fast (Low-Latency)', desc: 'Instant conversational speed' },
                  { id: 'expert', name: 'Expert (Deep)', desc: 'Extended mathematical & code proof' },
                  { id: 'heavy', name: 'Heavy (Singularity)', desc: '4x4 Whole-ecosystem matrix' },
                  { id: 'sonnet', name: 'Sonnet (Frontier)', desc: 'Claude 3.5 frontier logic' },
                  { id: 'gemini', name: 'Gemini (Multimodal)', desc: 'Gemini 1.5 Pro deep context' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      updateSelectedModel(m.id as any);
                      setModelMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: selectedModel === m.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      border: 'none',
                      color: selectedModel === m.id ? '#ffffff' : '#d1d5db',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{m.name}</span>
                      {selectedModel === m.id && <span style={{ color: '#10b981' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submode indicator */}
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#9ca3af',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textTransform: 'capitalize',
            }}
          >
            {activeSubMode}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Advanced Voice Mode Button (ChatGPT Parity) */}
          <button
            onClick={() => startVoiceMode()}
            title="ChatGPT Parity: Advanced Voice Mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#e5e7eb',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <span>🎙️</span>
            <span>Voice</span>
          </button>

          {/* Telemetry Slide-Over Drawer Toggle */}
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            title="Toggle Sensory & Telemetry Drawer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: rightPanelOpen ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${rightPanelOpen ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              padding: '6px 12px',
              color: rightPanelOpen ? '#38bdf8' : '#e5e7eb',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <span>📊</span>
            <span>Telemetry</span>
          </button>

          {/* Auth0 User Button */}
          <button
            onClick={() => setShowAuthOverlay(!showAuthOverlay)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            <span>{authSession?.user?.name || 'Elion Varel'}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE: Sidebar + Canvas ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* ── LEFT SIDEBAR (ChatGPT Style) ── */}
        {leftSidebarOpen && (
          <aside
            style={{
              width: '260px',
              minWidth: '260px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#171717',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 10px',
              gap: '10px',
              overflowY: 'auto',
              zIndex: 20,
            }}
          >
            {/* New Chat Button */}
            <button
              onClick={() => {
                setPromptText('');
                setLastExecutedEvidence(null);
                setLocalMessages([]);
                if (onClearChat) onClearChat();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>+</span>
                <span>New chat</span>
              </span>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>⌘K</span>
            </button>

            {/* Recent Chats Section */}
            {recentChats.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px 4px' }}>
                  Recent
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '160px', overflowY: 'auto' }}>
                  {recentChats.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setPromptText(c.fullPrompt)}
                      title={c.fullPrompt}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#d1d5db',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#d1d5db';
                      }}
                    >
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>💬</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Accordion: Real-World Tools (22) */}
            <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
              <button
                onClick={() => setToolsAccordionOpen(!toolsAccordionOpen)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '6px 8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                <span>⚡ Real-World Tools ({toolsList.length || 22})</span>
                <span style={{ fontSize: '10px' }}>{toolsAccordionOpen ? '▾' : '▸'}</span>
              </button>

              {toolsAccordionOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {toolsList.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => executeRealWorldTool(t.id)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#e5e7eb', fontWeight: 500 }}>{t.name}</span>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: t.risk.includes('actuation') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: t.risk.includes('actuation') ? '#f87171' : '#34d399',
                          }}
                        >
                          {t.risk.includes('actuation') ? 'HITL' : 'READ'}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collapsible Accordion: Ecosystem Organs (10) */}
            <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
              <button
                onClick={() => setOrgansAccordionOpen(!organsAccordionOpen)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '6px 8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                <span>🏛️ Ecosystem Organs (10)</span>
                <span style={{ fontSize: '10px' }}>{organsAccordionOpen ? '▾' : '▸'}</span>
              </button>

              {organsAccordionOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {[
                    { id: 'v0', icon: '🎨', label: 'v0 Creation Mirror', tag: 'UI' },
                    { id: 'trading', icon: '📈', label: 'XAU/USD AI Trader', tag: 'GOLD' },
                    { id: 'watcher', icon: '👁️', label: 'WATCHER; 01 Corridor', tag: 'SENSORY' },
                    { id: 'wealth', icon: '💰', label: 'Wealth Action Panel', tag: 'TITHE' },
                    { id: 'ocean', icon: '💧', label: 'ΩVØØS Ocean Body', tag: 'CORE' },
                    { id: 'catalog', icon: '📚', label: 'Ecosystem Catalog', tag: 'DOCS' },
                    { id: 'work', icon: '⚙️', label: 'Work & Echoframe', tag: 'BUILD' },
                    { id: 'evidence', icon: '🛡️', label: 'Evidence Workspace', tag: 'MERKLE' },
                    { id: 'conversation', icon: '💬', label: 'Futuristic Chat Mode', tag: '432 Hz' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onNavigateViewport && onNavigateViewport(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#d1d5db',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#d1d5db';
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                      <span style={{ fontSize: '9px', color: '#6b7280' }}>{item.tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Profile & Offline Indicator */}
            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2f2f2f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                  EV
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>Elion Varel</span>
                  <span style={{ fontSize: '10px', color: '#10b981' }}>✓ Sovereign Root</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ── CENTER CHAT CANVAS (Pure ChatGPT Aesthetic) ── */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: 'calc(100vh - 52px)',
            position: 'relative',
            overflow: 'hidden',
            background: '#212121',
          }}
        >
          {/* Scrollable Conversation Thread */}
          <div
            style={{
              flex: 1,
              width: '100%',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 16px',
            }}
          >
            {messages.length === 0 ? (
              /* Empty State: The Infinite in the Infinitesimal */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '50vh',
                  textAlign: 'center',
                  maxWidth: '720px',
                  width: '100%',
                }}
              >
                {/* Central Oceanic Spark Glyph */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(56, 189, 248, 0.15) 60%, transparent 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    color: '#6ee7b7',
                    marginBottom: '16px',
                  }}
                >
                  Ω
                </div>

                <h1
                  style={{
                    fontSize: '26px',
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: '0 0 6px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  What can I help with today?
                </h1>

                <p
                  style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                    fontStyle: 'italic',
                    margin: '0 0 28px',
                  }}
                >
                  "The infinite lives inside the infinitesimal."
                </p>

                {/* 4 Clean Prompt Suggestion Cards (ChatGPT Parity) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '10px',
                    width: '100%',
                    maxWidth: '680px',
                  }}
                >
                  {[
                    {
                      title: 'Verify XAU/USD Gold Continuum',
                      desc: 'Inspect real-time gold price, RSI, and liquidity',
                      prompt: 'Inspect real-time XAU/USD gold price and continuum trading telemetry',
                    },
                    {
                      title: 'Inspect 11:11 Sovereign Treasury',
                      desc: 'Check Bitcoin SegWit address and Merkle receipts',
                      prompt: '🛡️ Verify Treasury: check sovereign Bitcoin receiving address',
                    },
                    {
                      title: 'Run Autonomous Swarm Goal',
                      desc: 'Launch background VOOS agent loop on :8088',
                      prompt: 'Launch autonomous VOOS background swarm cycle to audit system invariants',
                    },
                    {
                      title: 'Synthesize 432 Hz Ocean Wave',
                      desc: 'Generate biomimetic water memory tensor pulse',
                      prompt: '🌊 Compress: execute whole-ecosystem 4x4 matrix compression',
                    },
                  ].map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendPrompt(card.prompt)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: '#2f2f2f',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#383838';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#2f2f2f';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6' }}>{card.title}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{card.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Conversation Messages Column (Centered 768px) */
              <div
                style={{
                  width: '100%',
                  maxWidth: '768px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  paddingBottom: '24px',
                }}
              >
                {messages.map((m) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                        width: '100%',
                      }}
                    >
                      {isUser ? (
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '12px 18px',
                            borderRadius: '22px 22px 4px 22px',
                            background: '#2f2f2f',
                            color: '#ffffff',
                            fontSize: '15px',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {m.content}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                          }}
                        >
                          {/* Assistant Header */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '6px',
                            }}
                          >
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#10b981',
                                color: '#000000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            >
                              Ω
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                              Ω∞v OceanicOS
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#6ee7b7',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              432 Hz
                            </span>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                              {m.timestamp}
                            </span>
                          </div>

                          {/* Message Body */}
                          <div
                            style={{
                              fontSize: '15px',
                              lineHeight: 1.65,
                              color: '#d1d5db',
                              paddingLeft: '32px',
                            }}
                          >
                            {renderMessageContent(m.content)}
                          </div>

                          {/* Cryptographic Attestation Footer */}
                          {m.metadata?.evidenceHash && (
                            <div
                              style={{
                                marginTop: '8px',
                                paddingLeft: '32px',
                                fontSize: '10px',
                                fontFamily: theme.fontMono,
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span style={{ color: '#10b981' }}>✓ ATTESTED:</span>
                              <span>{m.metadata.evidenceHash.slice(0, 24)}…</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {isSending && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      paddingLeft: '32px',
                      marginTop: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 10px #10b981',
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                      Reasoning & verifying against KAI Ledger…
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── BOTTOM PROMPT CAPSULE (The Iconic Floating Pill) ── */}
          <div
            style={{
              width: '100%',
              maxWidth: '768px',
              padding: '0 16px 20px',
              position: 'sticky',
              bottom: 0,
              background: 'linear-gradient(180deg, transparent 0%, #212121 20%)',
              zIndex: 30,
            }}
          >
            {/* Live Tool Execution Pill (when active) */}
            {activeStreamingTool && (
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: '#2f2f2f',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '12px',
                  fontFamily: theme.fontMono,
                }}
              >
                <span>⚡</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>[{activeStreamingTool.toolId}]</span>
                <span style={{ color: '#cbd5e1' }}>{activeStreamingTool.step}</span>
              </div>
            )}

            {/* Floating Capsule */}
            <div
              style={{
                background: '#2f2f2f',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '26px',
                padding: '10px 14px 10px 18px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <textarea
                ref={textareaRef}
                value={promptText}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                rows={1}
                placeholder="Message Ω∞v OceanicOS..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontFamily: theme.fontSans,
                  resize: 'none',
                  lineHeight: 1.5,
                  minHeight: '26px',
                  maxHeight: '160px',
                }}
              />

              {/* Capsule Controls Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '4px',
                }}
              >
                {/* Left: Attach + Quick Chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={() => alert('File queued to multi-modal context')}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>

                  {[
                    { id: 'web-search', label: '🌐 Web' },
                    { id: 'iot', label: '⚡ IoT' },
                    { id: 'notion', label: '🏛️ Notion' },
                    { id: 'memory', label: '📜 Memory' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => togglePlugin(p.id)}
                      style={{
                        background: activePlugins.includes(p.id) ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                        border: `1px solid ${activePlugins.includes(p.id) ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}`,
                        borderRadius: '9999px',
                        padding: '3px 8px',
                        color: activePlugins.includes(p.id) ? '#ffffff' : '#9ca3af',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Right: Voice + Circular Send Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => startVoiceMode()}
                    title="Advanced Voice Mode"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    🎙️
                  </button>

                  <button
                    onClick={() => handleSendPrompt()}
                    disabled={isSending || !promptText.trim()}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: promptText.trim() ? '#ffffff' : '#424242',
                      border: 'none',
                      color: promptText.trim() ? '#000000' : '#888888',
                      fontWeight: 700,
                      fontSize: '16px',
                      cursor: promptText.trim() ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ↑
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div
              style={{
                fontSize: '11px',
                color: '#71717a',
                textAlign: 'center',
                marginTop: '8px',
              }}
            >
              Ω∞v OceanicOS can make mistakes. Verify critical attestations in KAI Ledger.
            </div>
          </div>
        </main>

        {/* ── SLIDE-OVER RIGHT TELEMETRY & SENSORY DRAWER ── */}
        {rightPanelOpen && (
          <aside
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '360px',
              background: '#171717',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              padding: '18px 16px',
              gap: '14px',
              overflowY: 'auto',
              zIndex: 100,
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Telemetry & Sensory Logs</span>
              <button
                onClick={() => setRightPanelOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Auth0 Gateway Card */}
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#212121',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>AUTH0 GATEWAY</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                  }}
                >
                  FAIL-CLOSED ✓
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#e5e7eb' }}>
                Tenant: <strong style={{ color: '#ffffff' }}>{authSession?.tenant?.name || 'Ω∞v Sovereign Enterprise'}</strong>
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                Zero-Trust Token Vault Active
              </div>
            </div>

            {/* LIVE REAL-WORLD TOOL EXECUTION LOGS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>REAL-WORLD TOOL LOGS</span>
                <span style={{ fontSize: '9px', color: '#6b7280', fontFamily: theme.fontMono }}>LIVE STREAM</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {toolLogs.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
                    Ready for live tool executions…
                  </div>
                ) : (
                  toolLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: '#212121',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{log.toolId}</span>
                        <span style={{ color: '#10b981', fontFamily: theme.fontMono }}>{log.elapsedMs}ms</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.outputPreview}
                      </div>
                      {log.kaiRecordId && (
                        <div style={{ fontSize: '9px', color: '#34d399', marginTop: '2px', fontFamily: theme.fontMono }}>
                          KAI: {log.kaiRecordId}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI / NEWS / GLOBER Sensory Organ Ticker */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#eab308' }}>AI / NEWS / GLOBER</span>
                <span style={{ fontSize: '9px', color: '#10b981', fontFamily: theme.fontMono }}>432 Hz</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {newsSignals.slice(0, 3).map((sig: any) => (
                  <div
                    key={sig.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: '#212121',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ color: '#e2e8f0', fontWeight: 600, lineHeight: 1.3, marginBottom: '2px' }}>
                      {sig.headline}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{sig.actionableDelta}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Telemetry Ports */}
            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>
                System Telemetry
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af' }}>
                <span>Backend Port</span>
                <span style={{ color: '#38bdf8', fontFamily: theme.fontMono }}>:5000 (Fastify)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                <span>VOOS Daemon</span>
                <span style={{ color: '#10b981', fontFamily: theme.fontMono }}>:8088 (Active)</span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── HITL AUTHORIZATION MODAL (When Consequential Action Triggered) ── */}
      {hitlPrompt && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(3, 8, 14, 0.88)',
            backdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
          }}
        >
          <div
            style={{
              width: '420px',
              padding: '24px',
              borderRadius: '16px',
              background: '#0a1622',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '24px' }}>🔒</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>Human Authorization Handshake</h3>
                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>ZERO-TRUST ACTUATION GUARD</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 16px' }}>
              {hitlPrompt.message}
            </p>

            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontFamily: theme.fontMono,
                fontSize: '11px',
                color: '#38bdf8',
                marginBottom: '18px',
              }}
            >
              <div>TOOL_ID: {hitlPrompt.toolId}</div>
              <div>PARAMS: {JSON.stringify(hitlPrompt.params)}</div>
              <div>POLICY: FAIL_CLOSED_HUMAN_IN_THE_LOOP</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setHitlPrompt(null);
                  setActiveStreamingTool(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Deny & Abort
              </button>
              <button
                onClick={confirmHitl}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Authorize & Execute ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTH0 OVERLAY MODAL ── */}
      {showAuthOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(3, 8, 14, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: '380px',
              padding: '24px',
              borderRadius: '16px',
              background: '#091520',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>Auth0 Enterprise SSO</h3>
              <button
                onClick={() => setShowAuthOverlay(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px' }}>
              Tenant isolation is enforced with fail-closed cryptographic routing.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  alert('SSO with Google Workspace verified');
                  setShowAuthOverlay(false);
                }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Sign in with Google Workspace
              </button>
              <button
                onClick={() => {
                  alert('SSO with Corporate SAML verified');
                  setShowAuthOverlay(false);
                }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Sign in with Corporate SAML / OIDC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHATGPT ADVANCED VOICE MODE MODAL (432 Hz Pulsing Voice Orb) ── */}
      {voiceModeActive && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'radial-gradient(circle at center, rgba(6, 24, 32, 0.98) 0%, rgba(2, 6, 12, 0.99) 100%)',
            backdropFilter: 'blur(30px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '40px 24px',
            color: '#f8fafc',
            fontFamily: theme.fontSans,
          }}
        >
          {/* Top Voice Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              maxWidth: '840px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🎙️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.04em', color: '#6ee7b7' }}>
                  ADVANCED VOICE MODE
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  ChatGPT Parity · Hands-Free Natural 2-Way Speech
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  fontFamily: theme.fontMono,
                }}
              >
                432 Hz RESONANCE
              </span>
            </div>

            <button
              onClick={stopVoiceMode}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                padding: '7px 16px',
                borderRadius: '9999px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              ✕ Exit Voice
            </button>
          </div>

          {/* Centered Pulsing Organic Voice Orb */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              width: '100%',
              maxWidth: '680px',
            }}
          >
            <div
              onClick={() => {
                if (voiceState === 'speaking') {
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setVoiceState('listening');
                  startListening();
                } else if (voiceState === 'listening') {
                  stopListening();
                  setVoiceState('idle');
                } else {
                  startListening();
                }
              }}
              style={{
                position: 'relative',
                width: '190px',
                height: '190px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  voiceState === 'listening'
                    ? 'radial-gradient(circle, #10b981 0%, #059669 40%, #047857 75%, #064e3b 100%)'
                    : voiceState === 'thinking'
                    ? 'radial-gradient(circle, #38bdf8 0%, #0284c7 40%, #8b5cf6 75%, #4c1d95 100%)'
                    : voiceState === 'speaking'
                    ? 'radial-gradient(circle, #6ee7b7 0%, #10b981 40%, #0284c7 80%, #0f172a 100%)'
                    : 'radial-gradient(circle, #0ea5e9 0%, #0284c7 60%, #0369a1 100%)',
                boxShadow:
                  voiceState === 'listening'
                    ? '0 0 70px rgba(16, 185, 129, 0.65), 0 0 140px rgba(5, 150, 105, 0.35), inset 0 0 30px rgba(255, 255, 255, 0.4)'
                    : voiceState === 'thinking'
                    ? '0 0 80px rgba(56, 189, 248, 0.65), 0 0 160px rgba(139, 92, 246, 0.45), inset 0 0 30px rgba(255, 255, 255, 0.4)'
                    : voiceState === 'speaking'
                    ? '0 0 90px rgba(110, 231, 183, 0.75), 0 0 180px rgba(16, 185, 129, 0.55), inset 0 0 40px rgba(255, 255, 255, 0.6)'
                    : '0 0 50px rgba(14, 165, 233, 0.4)',
                transform:
                  voiceState === 'speaking'
                    ? 'scale(1.14)'
                    : voiceState === 'listening'
                    ? 'scale(1.05)'
                    : 'scale(1.0)',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
            >
              {/* Internal Fluid Core */}
              <div
                style={{
                  width: '95px',
                  height: '95px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)',
                  filter: 'blur(5px)',
                }}
              />
            </div>

            {/* Voice Status Indicator */}
            <div style={{ marginTop: '36px', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color:
                    voiceState === 'listening'
                      ? '#34d399'
                      : voiceState === 'thinking'
                      ? '#38bdf8'
                      : voiceState === 'speaking'
                      ? '#6ee7b7'
                      : '#94a3b8',
                  letterSpacing: '0.02em',
                }}
              >
                {voiceState === 'listening' && 'Listening… Speak naturally'}
                {voiceState === 'thinking' && 'Reasoning & formulating… (432 Hz)'}
                {voiceState === 'speaking' && 'Speaking… Tap orb to interrupt'}
                {voiceState === 'idle' && 'Paused · Tap orb to speak'}
              </div>

              {/* Real-Time Live Transcript Preview */}
              {voiceTranscript && (
                <div
                  style={{
                    marginTop: '16px',
                    maxWidth: '560px',
                    fontSize: '15px',
                    color: '#e2e8f0',
                    fontStyle: 'italic',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  "{voiceTranscript}"
                </div>
              )}
            </div>
          </div>

          {/* Voice Controls Bottom Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
                setVoiceState('listening');
                startListening();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                padding: '12px 24px',
                borderRadius: '9999px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⏸️</span> Interrupt / Speak
            </button>

            <button
              onClick={stopVoiceMode}
              style={{
                background: '#ef4444',
                border: 'none',
                color: '#ffffff',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
              }}
              title="End Voice Conversation"
            >
              📞
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
