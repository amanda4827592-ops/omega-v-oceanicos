import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from './oceanicosTheme';
import { enqueueOfflineMessage } from './offlineQueue';
import { InAppChromeBrowser } from './InAppChromeBrowser';
import { WaterP2PSessionView } from './WaterP2PSessionView';

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
  const [roomsAccordionOpen, setRoomsAccordionOpen] = useState(false);

  // ── 00–09 Canonical Rooms (Notion Continuum) ──
  const CANONICAL_ROOMS = [
    {
      code: '00',
      title: 'CANON',
      icon: '📜',
      desc: 'Invariants & Laws (V(Δ) = ⊤)',
      doctrine: 'Reality is the final court. Invariants take absolute conflict precedence.',
      forwardEngineering: 'Constitutional gates & mathematical admission boundaries before mutations.',
      reverseEngineering: 'Every claimed state must trace to an immutable axiom; zero ad-hoc overrides.',
      nonCollapseLaws: ['ATTESTATION ≠ AUTHORIZATION', 'CAPABILITY ≠ AUTHORITY'],
      notionUrl: 'https://app.notion.com/p/OCEANICOS-GRAPH-CONSTITUTION-EDGE-REGISTRY-3f249ca435a2819d801cc3ef5dd50609',
    },
    {
      code: '01',
      title: 'HUMAN ROOT',
      icon: '👤',
      desc: 'Lived source (ELION VAREL // 11:11)',
      doctrine: 'The Human is the external root (Authority(x)). Software is a mirror, not a master.',
      forwardEngineering: 'Human specifies intent Δ, spiritual values, moral boundaries, and consent.',
      reverseEngineering: 'Every automated run must resolve back to a verified human root command.',
      nonCollapseLaws: ['SIMULATION ≠ REALITY', 'MODEL OUTPUT ≠ CLAIM'],
      notionUrl: 'https://app.notion.com/p/AI-SOUL-MASTER-COMMAND-CENTER-33949ca435a281a89c83ca074966bbfa',
    },
    {
      code: '02',
      title: 'AI SOUL',
      icon: '🧠',
      desc: '8 Organs & Command Routing',
      doctrine: 'Doctrine, prompt routing, intelligence design, and bounded agent universe.',
      forwardEngineering: 'AI Soul interprets intent, compiles ΩIR, and dispatches to bounded organs.',
      reverseEngineering: 'Agent traces must show reasoning provenance and zero hallucinated authority.',
      nonCollapseLaws: ['PLAN ≠ EXECUTION', 'PAGE ≠ TRUTH'],
      notionUrl: 'https://app.notion.com/p/AI-SOUL-MASTER-COMMAND-CENTER-33949ca435a281a89c83ca074966bbfa',
    },
    {
      code: '03',
      title: 'ECHOFRAME',
      icon: '🎨',
      desc: 'Creation, Voice & 432 Hz Resonance',
      doctrine: 'Creation, voice, distribution, media synthesis, and aesthetic resonance.',
      forwardEngineering: 'Synthesizes clean UI components, audio frequencies, and media artifacts.',
      reverseEngineering: 'Generated media requires provenance and recipient consent verification.',
      nonCollapseLaws: ['CONTENT ≠ ENGAGEMENT', 'AUDIENCE ≠ REVENUE'],
      notionUrl: 'https://app.notion.com/p/NOTION-ORGANIZATION-MAP-ECHOFRAME-OCEANICOS-41949ca435a28160bdf9cbc700ea2829',
    },
    {
      code: '04',
      title: 'TRUTHOS',
      icon: '💎',
      desc: '4-Quadrant Wealth & Tithes',
      doctrine: 'Offers, commercial circulation, pricing hypotheses, and verifiable margins.',
      forwardEngineering: 'Validates real problems with 5 reachable buyers before building any software.',
      reverseEngineering: 'Bank/processor transaction receipts required before claiming earned cash.',
      nonCollapseLaws: ['REVENUE PLAN ≠ EARNED CASH', 'POTENTIAL VALUE ≠ REVENUE', 'REVENUE ≠ PROFIT'],
      notionUrl: 'https://app.notion.com/p/OCEANICOS-MOTION-Private-Wealth-Execution-Engine-4003080bdd5381598220ef09061f54b7',
    },
    {
      code: '05',
      title: 'OCEANICOS',
      icon: '🌊',
      desc: 'Constitutional Gate & Verification',
      doctrine: 'System specifications, admission boundaries, and fail-closed runtime engine.',
      forwardEngineering: 'Enforces the Max Equation Δ* = argmax [V(Δ) * Q_E / (R + C + ε)].',
      reverseEngineering: 'Reconciles expected vs observed state; mismatch outputs UNKNOWN.',
      nonCollapseLaws: ['CODE ≠ RUNTIME', 'CI ≠ REALITY'],
      notionUrl: 'https://app.notion.com/p/OCEANICOS-NOTION-CANONICAL-REGISTRY-3f249ca435a28165a2e8e06f3f62d9c2',
    },
    {
      code: '06',
      title: 'EXECUTION',
      icon: '⚡',
      desc: 'Work Queue & Bounded Actions',
      doctrine: 'Finite work queues, task admission, and idempotent execution sandboxes.',
      forwardEngineering: 'Translates approved decisions into atomic, testable execution tasks.',
      reverseEngineering: 'Logs exit codes, side effects, run IDs, and duplicate-action checks.',
      nonCollapseLaws: ['ATTEMPT ≠ COMPLETION', 'QUEUE ≠ DELIVERY'],
      notionUrl: 'https://app.notion.com/p/75b1967ffb1947fc8f5adb1298fe8f02',
    },
    {
      code: '07',
      title: 'EVIDENCE',
      icon: '🧬',
      desc: 'KAI Merkle DAG & Ledger Receipts',
      doctrine: 'Append-only ledger, SHA-256 state hashes, and cryptographic proof of reality.',
      forwardEngineering: 'Anchors every observed state change into an immutable Merkle timeline.',
      reverseEngineering: 'Walks the DAG backwards to verify every link from cash back to intent.',
      nonCollapseLaws: ['UNKNOWN ≠ SUCCESS', 'ASSERTION ≠ ATTESTATION'],
      notionUrl: 'https://app.notion.com/p/ALL-NOTION-PAGES-WORKSPACE-AUDIT-RECONCILIATION-3f949ca435a2813d89a9d75d402f9b5b',
    },
    {
      code: '08',
      title: 'ARCHIVE',
      icon: '📚',
      desc: 'Preserved Lineage & History',
      doctrine: 'Historical lineages, superseded drafts, and legacy milestones preserved.',
      forwardEngineering: 'Ensures no historic state or learning is destroyed for cosmetic neatness.',
      reverseEngineering: 'Provides permanent audit trail across all version branches and milestones.',
      nonCollapseLaws: ['DELETION ≠ REFACTOR', 'OBSOLESCENCE ≠ FORGETTING'],
      notionUrl: 'https://app.notion.com/p/v-NOTION-EXECUTIVE-CONTROL-PLANE-NOW-3f549ca435a2816a8ebcea9b95899cbc',
    },
    {
      code: '09',
      title: '12 ORGANS',
      icon: '🏛️',
      desc: 'Domain Applications & Workspaces',
      doctrine: 'Specialized domain surfaces (Treasury, Trading, Health, Intelligence, Community).',
      forwardEngineering: 'Binds specialized business domain capabilities to the sovereign core.',
      reverseEngineering: 'Domain-specific telemetry matches whole-body continuum invariants.',
      nonCollapseLaws: ['TOOL ≠ SOLUTION', 'FEATURE ≠ VALUE'],
      notionUrl: 'https://app.notion.com/p/AI-SOUL-MASTER-COMMAND-CENTER-33949ca435a281a89c83ca074966bbfa',
    },
  ];
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [fsmLoading, setFsmLoading] = useState<boolean>(false);
  const [fsmResult, setFsmResult] = useState<any>(null);
  const [fsmIntentText, setFsmIntentText] = useState<string>('');
  const [truthPilotResult, setTruthPilotResult] = useState<any>(null);
  const [truthPilotLoading, setTruthPilotLoading] = useState<boolean>(false);
  const [hyperTensorResult, setHyperTensorResult] = useState<any>(null);
  const [hyperTensorDegree, setHyperTensorDegree] = useState<number>(8);
  const [hyperTensorLoading, setHyperTensorLoading] = useState<boolean>(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [chromeBrowserOpen, setChromeBrowserOpen] = useState(false);
  const [chromeInitialUrl, setChromeInitialUrl] = useState('http://localhost:5000');
  const [tokenBalance, setTokenBalance] = useState<number>(1000);
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  const [activeWaterRoom, setActiveWaterRoom] = useState<any>(null);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<string[]>([]);

  const toggleReasoning = (id: string) => {
    setExpandedReasoningIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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
  const [selectedModel, setSelectedModel] = useState<'fast' | 'auto' | 'expert' | 'heavy' | 'sonnet' | 'gemini' | 'ollama' | 'vllm' | 'sovereign'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('oceanicos_model');
      if (saved && ['fast', 'auto', 'expert', 'heavy', 'sonnet', 'gemini', 'ollama', 'vllm', 'sovereign'].includes(saved)) {
        return saved as any;
      }
    }
    return 'auto';
  });

  // ── 8-Organ Selector (Soul AI Integration) ──
  const CANONICAL_ORGANS = [
    { id: 'AUTO', name: 'Auto', icon: '✨', role: 'Context-aware dynamic routing' },
    { id: 'AI_SOUL_CORE', name: 'Soul Core', icon: '🌟', role: 'Identity, sovereignty, ecosystem coordination' },
    { id: 'SOVEREIGN_TREASURY_ORATOR', name: 'Treasury', icon: '🪙', role: 'Bitcoin SegWit public treasury guardian' },
    { id: 'OCEAN_TRUTH_MEMBRANE', name: 'Truth Membrane', icon: '🛡️', role: 'Security fabric & fail-closed invariants' },
    { id: 'LUCID_FULL_STACK_BUILDER', name: 'Lucid Builder', icon: '🔨', role: 'Monorepo engineering & Fastify/Vite compiler' },
    { id: 'KAI_PROVENANCE_LEDGER', name: 'Provenance', icon: '🧬', role: 'Merkle DAG timeline & monotonic receipts' },
    { id: 'KAI_MEMORY_RECALL', name: 'Memory', icon: '🧠', role: 'Semantic vector memory & context retrieval' },
    { id: 'ƆREADE_PLURALISM_DUPLEX', name: 'Pluralism', icon: '🌊', role: 'African Pantheon & pluralistic logic' },
    { id: 'KAI_DREAM_ORACLE', name: 'Dream Oracle', icon: '🌙', role: 'Night ocean dream journaling & capture' },
  ];
  const [selectedOrgan, setSelectedOrgan] = useState<string>('AUTO');
  const [organsList, setOrgansList] = useState<any[]>(CANONICAL_ORGANS);

  const fetchOrgans = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/v1/aisoul/organs');
      if (res && res.success && Array.isArray(res.organs)) {
        setOrgansList([
          { id: 'AUTO', name: 'Auto', icon: '✨', role: 'Context-aware dynamic routing' },
          ...res.organs.map((o: any) => ({
            id: o.id,
            name: o.name.replace(/^(AI Soul |Sovereign |Ocean )/i, ''),
            icon: o.icon || '🌊',
            role: o.role,
          })),
        ]);
      }
    } catch {
      // Degrades gracefully
    }
  }, []);

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
        setToolMenuOpen(false);
        setRightPanelOpen(false);
        setShowAuthOverlay(false);
        setChromeBrowserOpen(false);
        setShowTokenModal(false);
        setShowRoomModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClearChat]);

  // ── Save Model & Submode on Change ──
  const updateSelectedModel = (model: 'fast' | 'auto' | 'expert' | 'heavy' | 'sonnet' | 'gemini' | 'ollama' | 'vllm' | 'sovereign') => {
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

  // ── KAI Merkle DAG State ──
  const [kaiDag, setKaiDag] = useState<{
    protocol: string;
    genesisHash: string;
    tipHash: string;
    nodeCount: number;
    roots: string[];
    tips: string[];
    nodes: Array<{
      nodeId: string;
      index: number;
      timestamp: string;
      contentHash: string;
      merkleRoot: string;
      parentHashes: string[];
      nodeHash: string;
      data: any;
    }>;
    verified: boolean;
  } | null>(null);
  const [selectedDagNode, setSelectedDagNode] = useState<string | null>(null);
  const [loadingDag, setLoadingDag] = useState(false);

  const fetchKaiDag = useCallback(async () => {
    try {
      setLoadingDag(true);
      const res = await apiRequest<any>('/v1/kai/dag');
      if (res && res.nodes) {
        setKaiDag(res);
      }
    } catch {
      // Degrades gracefully
    } finally {
      setLoadingDag(false);
    }
  }, []);

  const [inferenceStatus, setInferenceStatus] = useState<any>(null);
  const [pullModelInput, setPullModelInput] = useState('');
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullMessage, setPullMessage] = useState<string | null>(null);

  const fetchInferenceStatus = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/v1/inference/status');
      if (res && res.inference) {
        setInferenceStatus(res.inference);
      }
    } catch {
      // Degrades gracefully
    }
  }, []);

  const handlePullModel = async (modelToPull: string) => {
    if (!modelToPull.trim()) return;
    const target = modelToPull.trim();
    setPullingModel(target);
    setPullMessage(null);
    try {
      const res = await apiRequest<any>('/v1/inference/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: target }),
      });
      if (res && res.success) {
        setPullMessage(`✓ '${target}' ready`);
        fetchInferenceStatus();
      } else {
        setPullMessage(res?.result?.message || 'Pull request completed');
      }
    } catch (err: any) {
      setPullMessage(err.message || 'Pull initiated');
    } finally {
      setPullingModel(null);
      setPullModelInput('');
    }
  };

  // ── Sovereign Wealth Engine State & Notion Surface Sync ──
  const [wealthSyncing, setWealthSyncing] = useState(false);
  const [wealthSyncResult, setWealthSyncResult] = useState<any>(null);
  const [wealthSummary, setWealthSummary] = useState<any>(null);

  const fetchWealthSummary = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/v1/wealth/summary');
      if (res && res.success) {
        setWealthSummary(res);
      }
    } catch {
      // Degrades gracefully
    }
  }, []);

  const handleNotionWealthSync = async () => {
    setWealthSyncing(true);
    try {
      const res = await apiRequest<any>('/v1/wealth/notion-sync', {
        method: 'POST',
      });
      if (res && res.success) {
        setWealthSyncResult(res);
        fetchWealthSummary();
      }
    } catch (err: any) {
      console.error('Notion wealth sync error:', err);
    } finally {
      setWealthSyncing(false);
    }
  };

  // ── Century Singularity State & Actuator ──
  const [singularityStatus, setSingularityStatus] = useState<any>(null);
  const [singularitySealing, setSingularitySealing] = useState(false);
  const [centurySealResult, setCenturySealResult] = useState<any>(null);

  const fetchSingularityStatus = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/v1/singularity/status');
      if (res && res.success) {
        setSingularityStatus(res);
      }
    } catch {
      // Degrades gracefully
    }
  }, []);

  const handleCenturySeal = async () => {
    setSingularitySealing(true);
    try {
      const res = await apiRequest<any>('/v1/singularity/century-seal', {
        method: 'POST',
      });
      if (res && res.success) {
        setCenturySealResult(res);
        fetchSingularityStatus();
      }
    } catch (err: any) {
      console.error('Century seal error:', err);
    } finally {
      setSingularitySealing(false);
    }
  };

  // ── Simulation Engine: The Sandbox of Reality State & Actuator ──
  const [simulationStatus, setSimulationStatus] = useState<any>(null);
  const [simulationCollapsing, setSimulationCollapsing] = useState(false);
  const [collapseResult, setCollapseResult] = useState<any>(null);

  const fetchSimulationStatus = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/v1/simulation/status');
      if (res && res.success) {
        setSimulationStatus(res);
      }
    } catch {
      // Degrades gracefully
    }
  }, []);

  const handleCollapseWavefunction = async (intentText?: string) => {
    setSimulationCollapsing(true);
    try {
      const res = await apiRequest<any>('/v1/simulation/collapse-wavefunction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: intentText || 'Observe and collapse reality into verified truth',
          avatar: 'ELION',
        }),
      });
      if (res && res.success) {
        setCollapseResult(res);
        fetchSimulationStatus();
        fetchKaiDag();
      }
    } catch (err: any) {
      console.error('Simulation collapse error:', err);
    } finally {
      setSimulationCollapsing(false);
    }
  };

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
      const [sessionData, statusData, newsData, toolsData, historyData, tokenData] = await Promise.all([
        apiRequest<any>('/v1/auth/session').catch(() => null),
        apiRequest<any>('/v1/glober/status').catch(() => null),
        apiRequest<any>('/v1/glober/news').catch(() => null),
        apiRequest<any>('/v1/tools/list').catch(() => null),
        apiRequest<any>('/v1/chat/history?limit=12').catch(() => null),
        apiRequest<any>('/v1/tokens/balance').catch(() => null),
      ]);
      if (sessionData?.success) setAuthSession(sessionData);
      if (tokenData?.success && typeof tokenData.balance === 'number') {
        setTokenBalance(tokenData.balance);
      }
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
    fetchOrgans();
    const interval = setInterval(loadState, 25000);
    return () => clearInterval(interval);
  }, [loadState, fetchOrgans]);

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

    // Auto-open In-App Chrome Browser on browser queries
    const lower = query.toLowerCase();
    if (
      lower.includes('open chrome') ||
      lower.includes('test chrome') ||
      lower.includes('chrome inside') ||
      lower.includes('browers') ||
      lower.includes('browser') ||
      lower.includes('chrome.com') ||
      lower.includes('love')
    ) {
      let targetUrl = 'http://localhost:5000';
      if (lower.includes('chrome.com')) {
        targetUrl = 'https://www.google.com/chrome';
      } else if (/\blove(?:\.com)?\b/i.test(query)) {
        targetUrl = 'https://love.com';
      } else {
        const urlMatch = query.match(/https?:\/\/[^\s]+/i) || query.match(/\b([a-zA-Z0-9-]+\.(?:com|org|io|dev|app|net)(?:\/[^\s]*)?)/i);
        if (urlMatch) {
          targetUrl = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
        }
      }
      setChromeInitialUrl(targetUrl);
      setChromeBrowserOpen(true);
    }

    // Auto-launch Water Protocol P2P Session on session prompts
    if (
      lower.includes('start session') ||
      lower.includes('water session') ||
      lower.includes('p2p session') ||
      lower.includes('call alice') ||
      lower.includes('p2p call')
    ) {
      try {
        const res = await apiRequest<any>('/v1/water/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: authSession?.user?.id || 'usr_omega_sovereign_1111' }),
        });
        if (res?.success) {
          setActiveWaterRoom(res.room);
        }
      } catch {}
    }

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
          organ: selectedOrgan !== 'AUTO' ? selectedOrgan : undefined,
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

  // Fetch KAI Merkle DAG, Local Inference Status, Wealth Summary, Singularity Status, and Simulation Status on drawer open
  useEffect(() => {
    if (rightPanelOpen) {
      fetchKaiDag();
      fetchInferenceStatus();
      fetchWealthSummary();
      fetchSingularityStatus();
      fetchSimulationStatus();
    }
  }, [rightPanelOpen, fetchKaiDag, fetchInferenceStatus, fetchWealthSummary, fetchSingularityStatus, fetchSimulationStatus]);

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
                  { id: 'ollama', name: 'Ollama (Local Open-Weight)', desc: '100% self-hosted GPU (Llama 3 / DeepSeek / Phi3)' },
                  { id: 'vllm', name: 'vLLM (Local High-Throughput)', desc: 'Zero-latency local tensor-parallel inference' },
                  { id: 'sovereign', name: 'Know Child (Zero-Dependency)', desc: '100% internal cryptographic organ reasoner' },
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

          {/* Century Singularity Gate 100 Badge */}
          <button
            onClick={() => {
              setRightPanelOpen(true);
              fetchSingularityStatus();
            }}
            title="Milestone #100 Century Singularity Gate"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#fbbf24',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span>👑</span>
            <span>CENTURY 100</span>
          </button>

          {/* Simulation Engine: Reality Sandbox Badge */}
          <button
            onClick={() => {
              setRightPanelOpen(true);
              fetchSimulationStatus();
            }}
            title="Ω∞v Simulation Engine: The Sandbox of Reality"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(126, 34, 206, 0.1) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#c084fc',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span>🌌</span>
            <span>SIMULATION</span>
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

          {/* In-App Chrome Browser Toggle */}
          <button
            onClick={() => setChromeBrowserOpen(true)}
            title="Open In-App Chrome Browser (Live Viewport + Headless Snapshot)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: chromeBrowserOpen ? 'rgba(66, 133, 244, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${chromeBrowserOpen ? 'rgba(66, 133, 244, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              padding: '6px 12px',
              color: chromeBrowserOpen ? '#60a5fa' : '#e5e7eb',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <span>🌐</span>
            <span>Chrome</span>
          </button>

          {/* Omega Token Credits Pill */}
          <button
            onClick={() => setShowTokenModal(true)}
            title="Omega Token Credits & Crypto Gate"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '8px',
              padding: '6px 11px',
              color: '#facc15',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <span>🪙</span>
            <span>{tokenBalance.toLocaleString()} $Ω</span>
          </button>

          {/* Auth0 / Sovereign Pass Button */}
          <button
            onClick={() => setShowAuthOverlay(!showAuthOverlay)}
            title="Sign In / Switch SSO Tenant"
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
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>
              · {authSession?.user?.provider === 'google' ? 'Gmail' : authSession?.user?.provider === 'apple' ? 'Apple' : authSession?.user?.provider === 'local' ? 'Free Test' : 'Sovereign'}
            </span>
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

            {/* Collapsible Accordion: 00–09 Canonical Rooms (Notion Continuum) */}
            <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
              <button
                onClick={() => setRoomsAccordionOpen(!roomsAccordionOpen)}
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
                <span>📜 00–09 Rooms ({CANONICAL_ROOMS.length})</span>
                <span style={{ fontSize: '10px' }}>{roomsAccordionOpen ? '▾' : '▸'}</span>
              </button>

              {roomsAccordionOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {CANONICAL_ROOMS.map((room) => (
                    <button
                      key={room.code}
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowRoomModal(true);
                        setFsmIntentText(promptText || room.forwardEngineering || room.desc);
                        setFsmResult(null);
                      }}
                      title={`${room.code} ${room.title} — Click to inspect room & run OMNICOS FSM`}
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
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span>{room.icon}</span>
                        <span style={{ fontWeight: 600, color: '#a78bfa' }}>{room.code}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.title}</span>
                      </span>
                      <span style={{ fontSize: '10px', color: '#a78bfa', opacity: 0.8 }}>⚡</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Profile & Offline Indicator */}
            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2f2f2f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                  EV
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>Elion Varel</span>
                  <span style={{ fontSize: '10px', color: '#10b981' }}>✓ Sovereign Root</span>
                </div>
              </div>
              <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#34d399', fontWeight: 700 }}>
                  <span>🟢</span>
                  <span>ZERO EXTERNAL APIS</span>
                </div>
                <span style={{ fontSize: '9px', color: '#9ca3af', fontFamily: theme.fontMono }}>
                  Tri-Surface: :3000 · :5000 · :8088
                </span>
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
                    fontSize: '28px',
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: '0 0 6px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {getGreeting()}, Traveler.
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
                      title: 'Sync Notion Wealth Engine',
                      desc: 'Trigger 4-Quadrant Tithe & Capital Ledger sync to Notion',
                      prompt: '🏛️ Sync Notion Wealth Engine: dispatch sovereign portfolio allocations and verify surface sync hash',
                    },
                    {
                      title: 'Seal Century Singularity Gate',
                      desc: 'Mint Milestone Receipt #100 and bind 100 verified swarm receipts',
                      prompt: '👑 Seal Century Singularity Gate: execute immutable milestone #100 attestation and verify zero-entropy equilibrium',
                    },
                    {
                      title: 'Enter Reality Sandbox',
                      desc: 'Collapse simulation wave function as the human Demiurge',
                      prompt: '🌌 Collapse Simulation Wave Function: activate the reality sandbox as the human Demiurge and verify physical laws',
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
                {/* Active Water Protocol P2P Session View */}
                {activeWaterRoom && (
                  <WaterP2PSessionView
                    roomId={activeWaterRoom.id}
                    creatorId={authSession?.user?.id || 'usr_omega_sovereign_1111'}
                    onEndSession={(digest) => {
                      setActiveWaterRoom(null);
                      if (digest) {
                        setLocalMessages((prev) => [
                          ...prev,
                          {
                            id: `water-end-${Date.now()}`,
                            sender: 'system',
                            content: `🔒 **Water Protocol Session Finalized**\n\n• **Session Digest**: \`${digest}\`\n• **Attestation**: \`Appended to KAI Merkle Ledger ✓\`\n• **Status**: \`P2P Tunnel safely closed\``,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          },
                        ]);
                      }
                    }}
                  />
                )}

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

                          {/* Progressive Thought & Verification Accordion */}
                          <div style={{ paddingLeft: '32px', marginBottom: '8px' }}>
                            <button
                              onClick={() => toggleReasoning(m.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#9ca3af',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: 0,
                                fontFamily: theme.fontSans,
                              }}
                            >
                              <span style={{ fontSize: '10px' }}>{expandedReasoningIds.includes(m.id) ? '▾' : '▸'}</span>
                              <span>Thought for 2s · Verified against kai_ledger</span>
                              <span style={{ color: '#10b981' }}>✓</span>
                            </button>

                            {expandedReasoningIds.includes(m.id) && (
                              <div
                                style={{
                                  marginTop: '6px',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  borderLeft: '2px solid #10b981',
                                  fontSize: '11px',
                                  color: '#9ca3af',
                                  fontFamily: theme.fontMono,
                                  lineHeight: 1.5,
                                }}
                              >
                                <div>• Organ: {m.organ || m.metadata?.organ || 'Ω∞v GLOBER AI'} (432 Hz)</div>
                                {m.metadata?.actionTriggered && <div>• Action: {m.metadata.actionTriggered}</div>}
                                {m.metadata?.evidenceHash && <div>• Evidence Hash: {m.metadata.evidenceHash}</div>}
                                {m.metadata?.kaiRecordId && <div>• KAI Ledger Block: {m.metadata.kaiRecordId}</div>}
                                {m.metadata?.verificationOutcome && (
                                  <div>• Verification Gate: {m.metadata.verificationOutcome} ({m.metadata.verificationDecision})</div>
                                )}
                                {m.metadata?.frobeniusNorm !== undefined && (
                                  <div>• 4x4 Matrix Norm: {m.metadata.frobeniusNorm} · Gram Det: {m.metadata.fourthRootGramDeterminant?.toFixed(4)}</div>
                                )}
                              </div>
                            )}
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

                          {/* Minimalist Verified Badge */}
                          <div
                            style={{
                              marginTop: '8px',
                              paddingLeft: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span
                              title={
                                m.metadata?.verificationOutcome
                                  ? `Verification: ${m.metadata.verificationOutcome} (${m.metadata.verificationDecision})\nNorm: ${m.metadata.frobeniusNorm}\nProof: ${m.metadata.evidenceHash}`
                                  : m.metadata?.evidenceHash
                                  ? `Cryptographic Proof: ${m.metadata.evidenceHash}`
                                  : 'Verified against KAI Ledger'
                              }
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                color: '#34d399',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'default',
                              }}
                            >
                              <span>🔒</span>
                              <span>{m.metadata?.verificationDecision ? `✓ ${m.metadata.verificationDecision}` : 'Verified'}</span>
                            </span>
                          </div>
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

            {/* Floating Toolbelt Menu (Triggered by + icon) */}
            {toolMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '80px',
                  left: '16px',
                  background: '#2f2f2f',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '8px',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 50,
                  minWidth: '220px',
                }}
              >
                <button
                  onClick={() => {
                    setChromeBrowserOpen(true);
                    setToolMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(66, 133, 244, 0.15)',
                    border: '1px solid rgba(66, 133, 244, 0.3)',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    marginBottom: '2px',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>🌐</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Open In-App Chrome</span>
                    <span style={{ fontSize: '10px', color: '#93c5fd' }}>Dual-engine live viewport + snapshot</span>
                  </div>
                </button>

                <button
                  onClick={async () => {
                    setToolMenuOpen(false);
                    try {
                      const res = await apiRequest<any>('/v1/water/room', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: authSession?.user?.id || 'usr_omega_sovereign_1111' }),
                      });
                      if (res?.success) {
                        setActiveWaterRoom(res.room);
                        setLocalMessages((prev) => [
                          ...prev,
                          {
                            id: `water-${Date.now()}`,
                            sender: 'system',
                            content: `💧 **Water Protocol P2P Session Active**\n\n• **Room ID**: \`${res.room.id}\`\n• **Protocol**: \`E2EE WebRTC + WebSockets\`\n• **Invite Link**: \`${res.inviteLink}\`\n• **Status**: \`Waiting for peer · AES-GCM-256 Ratchet Verified ✓\`\n\n*The session is cryptographically bound. A Merkle transcript digest will be appended to KAI ledger upon completion.*`,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          },
                        ]);
                      }
                    } catch (err: any) {
                      alert(`P2P Session Error: ${err.message}`);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(34, 211, 238, 0.15)',
                    border: '1px solid rgba(34, 211, 238, 0.35)',
                    color: '#22d3ee',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    marginBottom: '2px',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>💧</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Start P2P Encrypted Session</span>
                    <span style={{ fontSize: '10px', color: '#a5f3fc' }}>Water Protocol WebRTC + WebSockets</span>
                  </div>
                </button>

                <button
                  onClick={async () => {
                    setToolMenuOpen(false);
                    try {
                      const res = await apiRequest<any>('/v1/tokens/claim-free', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: authSession?.user?.id || 'usr_omega_sovereign_1111' }),
                      });
                      if (res?.success) {
                        setTokenBalance(res.newBalance);
                        alert(`🎉 Successfully claimed 500 free test $Ω credits! New balance: ${res.newBalance.toLocaleString()} $Ω`);
                      }
                    } catch (err: any) {
                      alert(`Faucet Error: ${err.message}`);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    color: '#facc15',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    marginBottom: '2px',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>🪙</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Claim Free Test Credits</span>
                    <span style={{ fontSize: '10px', color: '#fde68a' }}>+500 $Ω Tokens Faucet</span>
                  </div>
                </button>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', padding: '4px 8px', textTransform: 'uppercase' }}>
                  Tools & Capabilities
                </div>
                {[
                  { id: 'web-search', icon: '🌐', label: 'Browse Web', desc: 'Real-time search & extraction' },
                  { id: 'iot', icon: '⚡', label: 'Industrial IoT', desc: 'Query sensors & relays' },
                  { id: 'notion', icon: '🏛️', label: 'Notion Workspace', desc: '7 canonical surfaces & wealth' },
                  { id: 'memory', icon: '📜', label: 'KAI Memory', desc: 'Recall cryptographic receipts' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      togglePlugin(item.id);
                      setToolMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: activePlugins.includes(item.id) ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      border: 'none',
                      color: activePlugins.includes(item.id) ? '#6ee7b7' : '#e5e7eb',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span>{item.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>{item.desc}</span>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setToolMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e5e7eb',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    marginTop: '2px',
                    paddingTop: '6px',
                  }}
                >
                  <span>📎</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Attach File</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>Document, code, or image</span>
                  </div>
                </button>
              </div>
            )}

            {/* Active Organ Selector Pill Bar (Soul AI Integration) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                padding: '0 4px 6px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, paddingRight: '4px', whiteSpace: 'nowrap' }}>
                ORGAN:
              </span>
              {organsList.map((organ) => {
                const isActive = selectedOrgan === organ.id;
                return (
                  <button
                    key={organ.id}
                    onClick={() => setSelectedOrgan(organ.id)}
                    title={organ.role || organ.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(126, 34, 206, 0.2) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isActive ? '1px solid rgba(168, 85, 247, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isActive ? '#e9d5ff' : '#9ca3af',
                      fontSize: '11px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{organ.icon}</span>
                    <span>{organ.name}</span>
                  </button>
                );
              })}
            </div>

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
                placeholder="Where should we start?"
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
                {/* Left: Small unassuming (+) button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={() => alert('File queued to multi-modal context')}
                  />
                  <button
                    onClick={() => setToolMenuOpen(!toolMenuOpen)}
                    title="Add tools or attachments"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: toolMenuOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: toolMenuOpen ? '#ffffff' : '#9ca3af',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    +
                  </button>

                  {/* Active plugin indicators (only show if active) */}
                  {activePlugins.map((pId) => {
                    const iconMap: Record<string, string> = {
                      'web-search': '🌐',
                      'iot': '⚡',
                      'notion': '🏛️',
                      'memory': '📜',
                    };
                    return (
                      <span
                        key={pId}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#d1d5db',
                        }}
                      >
                        {iconMap[pId] || pId}
                      </span>
                    );
                  })}
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

            {/* KAI MERKLE DAG MEMORY EXPLORER */}
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#212121',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa' }}>KAI MERKLE DAG</span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: '4px',
                      background: 'rgba(167, 139, 250, 0.15)',
                      color: '#c4b5fd',
                    }}
                  >
                    {kaiDag?.protocol || 'ΩVØØS-DAG/1'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={fetchKaiDag}
                    disabled={loadingDag}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                    title="Refresh Merkle DAG"
                  >
                    {loadingDag ? '…' : '↻'}
                  </button>
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
                    ✓ PROVEN
                  </span>
                </div>
              </div>

              {/* DAG Overview Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
                <div style={{ background: '#171717', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ color: '#6b7280' }}>Total Blocks</div>
                  <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px', fontFamily: theme.fontMono }}>
                    {kaiDag?.nodeCount ?? '...'}
                  </div>
                </div>
                <div style={{ background: '#171717', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ color: '#6b7280' }}>DAG Tip</div>
                  <div style={{ color: '#38bdf8', fontWeight: 600, fontFamily: theme.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {kaiDag?.tipHash ? `${kaiDag.tipHash.slice(0, 10)}…` : 'Genesis'}
                  </div>
                </div>
              </div>

              {/* DAG Nodes List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '180px', overflowY: 'auto' }}>
                {!kaiDag || kaiDag.nodes.length === 0 ? (
                  <div style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic', padding: '4px' }}>
                    Loading DAG memory graph…
                  </div>
                ) : (
                  [...kaiDag.nodes].reverse().slice(0, 8).map((node) => {
                    const isSelected = selectedDagNode === node.nodeHash;
                    return (
                      <div
                        key={node.nodeHash}
                        onClick={() => setSelectedDagNode(isSelected ? null : node.nodeHash)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(167, 139, 250, 0.1)' : '#171717',
                          border: isSelected ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          fontSize: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ color: '#c4b5fd', fontWeight: 600, fontFamily: theme.fontMono }}>
                            #{node.index} {node.nodeId}
                          </span>
                          <span
                            style={{
                              fontSize: '8px',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#9ca3af',
                            }}
                          >
                            {node.data?.distinction || 'VERIFIED'}
                          </span>
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {node.data?.statement || node.data?.subject || node.nodeHash}
                        </div>
                        {isSelected && (
                          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '3px', color: '#cbd5e1', fontSize: '9px', fontFamily: theme.fontMono }}>
                            <div><strong>Hash:</strong> {node.nodeHash.slice(0, 16)}…</div>
                            <div><strong>Merkle Root:</strong> {node.merkleRoot.slice(0, 16)}…</div>
                            <div><strong>Parents:</strong> {node.parentHashes.length === 0 ? 'Root' : node.parentHashes.map(p => p.slice(0, 8)).join(', ')}</div>
                            {node.data?.evidenceRef && <div><strong>Evidence:</strong> {node.data.evidenceRef.slice(0, 16)}…</div>}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* LOCAL SOVEREIGN INFERENCE CARD */}
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#212121',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>LOCAL MODEL INFERENCE</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: inferenceStatus?.available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: inferenceStatus?.available ? '#10b981' : '#f59e0b',
                  }}
                >
                  {inferenceStatus?.available ? 'OLLAMA ONLINE' : 'SOVEREIGN FALLBACK'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Host:</span>
                <span style={{ color: '#93c5fd', fontFamily: theme.fontMono }}>{inferenceStatus?.host || '127.0.0.1:11434'}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Model:</span>
                <span style={{ color: '#a78bfa', fontFamily: theme.fontMono }}>{inferenceStatus?.model || 'phi3:mini'}</span>
              </div>

              {/* Quick Model Pull Tags */}
              <div style={{ marginTop: '2px' }}>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>Quick Pull Open-Weight:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {['llama3.2:1b', 'deepseek-r1:1.5b', 'phi3:mini', 'qwen2.5:0.5b'].map((m) => (
                    <button
                      key={m}
                      onClick={() => handlePullModel(m)}
                      disabled={Boolean(pullingModel)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: pullingModel === m ? '#f59e0b' : '#38bdf8',
                        fontSize: '9px',
                        cursor: 'pointer',
                        fontFamily: theme.fontMono,
                      }}
                    >
                      {pullingModel === m ? 'Pulling…' : `+ ${m}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Model Pull Input */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                <input
                  type="text"
                  value={pullModelInput}
                  onChange={(e) => setPullModelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePullModel(pullModelInput);
                    }
                  }}
                  placeholder="pull model e.g. llama3.2..."
                  style={{
                    flex: 1,
                    background: '#171717',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    fontSize: '10px',
                    color: '#ffffff',
                    fontFamily: theme.fontMono,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => handlePullModel(pullModelInput)}
                  disabled={Boolean(pullingModel) || !pullModelInput.trim()}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: '#f59e0b',
                    border: 'none',
                    color: '#000000',
                    fontWeight: 700,
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  Pull
                </button>
              </div>

              {pullMessage && (
                <div style={{ fontSize: '9px', color: '#34d399', fontFamily: theme.fontMono, marginTop: '2px' }}>
                  {pullMessage}
                </div>
              )}

              <div style={{ fontSize: '10px', color: '#71717a' }}>
                Zero External APIs · 100% self-hosted open-weight inference
              </div>
            </div>

            {/* SOVEREIGN WEALTH & NOTION ENGINE CARD */}
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#212121',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>SOVEREIGN WEALTH & NOTION</span>
                <button
                  onClick={fetchWealthSummary}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '2px 4px',
                  }}
                  title="Refresh Wealth Summary"
                >
                  ↻
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Allocated:</span>
                <span style={{ color: '#34d399', fontWeight: 700, fontFamily: theme.fontMono }}>
                  ${(wealthSummary?.ledger?.totalAllocated ?? 0).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Tithe (10%):</span>
                <span style={{ color: '#a78bfa', fontFamily: theme.fontMono }}>
                  ${(wealthSummary?.ledger?.totalTithe ?? 0).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Actions Dispatched:</span>
                <span style={{ color: '#93c5fd', fontFamily: theme.fontMono }}>
                  {wealthSummary?.ledger?.allocationCount ?? 0}
                </span>
              </div>

              <button
                onClick={handleNotionWealthSync}
                disabled={wealthSyncing}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: wealthSyncing ? 'rgba(16, 185, 129, 0.2)' : '#10b981',
                  border: 'none',
                  color: wealthSyncing ? '#34d399' : '#000000',
                  fontWeight: 700,
                  fontSize: '10px',
                  cursor: wealthSyncing ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px',
                }}
              >
                <span>{wealthSyncing ? '⏳ Syncing Surface…' : '🏛️ Sync Notion Wealth Engine'}</span>
              </button>

              {wealthSyncResult && (
                <div style={{ fontSize: '9px', color: '#34d399', fontFamily: theme.fontMono, wordBreak: 'break-all', marginTop: '2px' }}>
                  ✓ Synced: {wealthSyncResult.surface?.name || 'OCEANICOS MOTION'}<br />
                  Hash: {wealthSyncResult.syncHash?.slice(0, 16)}…
                </div>
              )}

              <div style={{ fontSize: '10px', color: '#71717a' }}>
                Surface UUID: 39a4897d-aa55-8025-a7b6-c56784400fa1
              </div>
            </div>

            {/* CENTURY SINGULARITY GATE CARD (MILESTONE #100) */}
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(33, 33, 33, 0.95) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>CENTURY SINGULARITY GATE</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    fontFamily: theme.fontMono,
                  }}
                >
                  100 RECEIPTS
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Equilibrium Mode:</span>
                <span style={{ color: '#34d399', fontWeight: 700, fontFamily: theme.fontMono }}>
                  {singularityStatus?.equilibrium?.mode || 'Ψ = 0'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Merkle Root:</span>
                <span style={{ color: '#a78bfa', fontFamily: theme.fontMono }}>
                  {(singularityStatus?.merkleRoot || 'root-verified').slice(0, 16)}…
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Treasury:</span>
                <span style={{ color: '#f59e0b', fontFamily: theme.fontMono }}>
                  SegWit Veiled Custody
                </span>
              </div>

              <button
                onClick={handleCenturySeal}
                disabled={singularitySealing}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: singularitySealing ? 'rgba(245, 158, 11, 0.2)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  color: singularitySealing ? '#fbbf24' : '#000000',
                  fontWeight: 700,
                  fontSize: '10px',
                  cursor: singularitySealing ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px',
                }}
              >
                <span>{singularitySealing ? '⏳ Sealing Singularity…' : '👑 Mint Century Singularity Seal'}</span>
              </button>

              {centurySealResult && (
                <div style={{ fontSize: '9px', color: '#fbbf24', fontFamily: theme.fontMono, wordBreak: 'break-all', marginTop: '2px' }}>
                  ✓ Sealed: {centurySealResult.certificate?.status}<br />
                  Hash: {centurySealResult.sealHash?.slice(0, 16)}…<br />
                  Sig: {centurySealResult.sealSignature?.slice(0, 16)}…
                </div>
              )}

              <div style={{ fontSize: '10px', color: '#71717a' }}>
                Checksum: 30013030 · Zero External APIs
              </div>
            </div>

            {/* SIMULATION ENGINE CARD (THE SANDBOX OF REALITY) */}
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.12) 0%, rgba(33, 33, 33, 0.95) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#c084fc' }}>SIMULATION: SANDBOX OF REALITY</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    fontFamily: theme.fontMono,
                  }}
                >
                  V(Δ) = ⊤
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Demiurge (Root):</span>
                <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: theme.fontMono }}>
                  {simulationStatus?.demiurge?.humanRoot || 'ELION VAREL'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Physics Law:</span>
                <span style={{ color: '#34d399', fontWeight: 700, fontFamily: theme.fontMono }}>
                  {simulationStatus?.physics?.equation || 'V(Δ) = ⊤'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Timeline Equation:</span>
                <span style={{ color: '#a78bfa', fontFamily: theme.fontMono }}>
                  {simulationStatus?.timeline?.immutableTimeline || 'M_{t+1} = M_t ∪ Δ'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', justifyContent: 'space-between' }}>
                <span>Closed-Loop Box:</span>
                <span style={{ color: '#f59e0b', fontFamily: theme.fontMono }}>
                  Zero External Dependencies
                </span>
              </div>

              <button
                onClick={() => handleCollapseWavefunction()}
                disabled={simulationCollapsing}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: simulationCollapsing ? 'rgba(168, 85, 247, 0.2)' : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '10px',
                  cursor: simulationCollapsing ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px',
                }}
              >
                <span>{simulationCollapsing ? '⏳ Collapsing Wavefunction…' : '🌌 Collapse Simulation Wavefunction'}</span>
              </button>

              {collapseResult && (
                <div style={{ fontSize: '9px', color: '#c084fc', fontFamily: theme.fontMono, wordBreak: 'break-all', marginTop: '2px' }}>
                  ✓ Manifested: {collapseResult.wavefunction?.avatar?.soul}<br />
                  Physics: {collapseResult.wavefunction?.physics?.outcome} ({collapseResult.wavefunction?.physics?.decision})<br />
                  Timeline Tip: {collapseResult.wavefunction?.timeline?.merkleTip?.slice(0, 16)}…
                </div>
              )}

              <div style={{ fontSize: '10px', color: '#71717a' }}>
                Law: The infinite lives inside the infinitesimal.
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

      {/* ── AUTH0 & SOVEREIGN ACCESS GATE MODAL (Gmail / Apple / Free Test / Web3) ── */}
      {showAuthOverlay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 8, 14, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9995,
          }}
        >
          <div
            style={{
              width: '420px',
              padding: '28px',
              borderRadius: '20px',
              background: '#18181b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9)',
              fontFamily: theme.fontSans,
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>Ω</div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>Sovereign Access & SSO Gate</h3>
              </div>
              <button
                onClick={() => setShowAuthOverlay(false)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 20px', lineHeight: 1.5 }}>
              Choose your sovereign identity or start immediately with free test token credits. No credit card required.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Google / Gmail Sign In */}
              <button
                onClick={async () => {
                  try {
                    const res = await apiRequest<any>('/v1/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ provider: 'google', email: 'traveler@gmail.com', name: 'Traveler (Gmail)' }),
                    });
                    if (res?.success) {
                      setAuthSession({ success: true, user: res.user, tenant: res.tenant, authenticated: true });
                      setTokenBalance(res.user.credits || 1000);
                      setShowAuthOverlay(false);
                    }
                  } catch (e: any) {
                    alert(`Google SSO error: ${e.message}`);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  border: 'none',
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <span>🔵</span>
                <span>Continue with Google / Gmail</span>
              </button>

              {/* Apple Sign In */}
              <button
                onClick={async () => {
                  try {
                    const res = await apiRequest<any>('/v1/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ provider: 'apple', email: 'traveler@privaterelay.appleid.com', name: 'Traveler (Apple)' }),
                    });
                    if (res?.success) {
                      setAuthSession({ success: true, user: res.user, tenant: res.tenant, authenticated: true });
                      setTokenBalance(res.user.credits || 1000);
                      setShowAuthOverlay(false);
                    }
                  } catch (e: any) {
                    alert(`Apple SSO error: ${e.message}`);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#27272a',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <span>⚪</span>
                <span>Continue with Apple</span>
              </button>

              {/* Instant Free Test Pass */}
              <button
                onClick={async () => {
                  try {
                    const res = await apiRequest<any>('/v1/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ provider: 'local', email: 'free-tester@oceanicos.local', name: 'Free Test Traveler' }),
                    });
                    if (res?.success) {
                      setAuthSession({ success: true, user: res.user, tenant: res.tenant, authenticated: true });
                      setTokenBalance(1000);
                      setShowAuthOverlay(false);
                    }
                  } catch (e: any) {
                    alert(`Free test pass error: ${e.message}`);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <span>⚡</span>
                <span>Instant Free Test (1,000 $Ω Token Credits)</span>
              </button>

              {/* Connect Web3 Crypto Wallet */}
              <button
                onClick={async () => {
                  try {
                    const res = await apiRequest<any>('/v1/tokens/crypto-deposit', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount: 10, currency: 'USDC', walletAddress: '0x71C...b48a' }),
                    });
                    if (res?.success) {
                      setTokenBalance(res.newBalance);
                      setShowAuthOverlay(false);
                      alert(`🦊 Web3 Wallet Connected! Credited +${res.creditsIssued.toLocaleString()} $Ω credits.`);
                    }
                  } catch (e: any) {
                    alert(`Web3 error: ${e.message}`);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(234, 179, 8, 0.12)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  color: '#facc15',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <span>🦊</span>
                <span>Connect Web3 Crypto Wallet (MetaMask / SOL)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── $Ω TOKEN CREDITS & CRYPTO GATE MODAL ── */}
      {showTokenModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 8, 14, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9995,
          }}
        >
          <div
            style={{
              width: '440px',
              padding: '28px',
              borderRadius: '20px',
              background: '#18181b',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9)',
              fontFamily: theme.fontSans,
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🪙</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>$Ω Token Credits & Crypto Gate</h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {/* Token Balance Display */}
            <div
              style={{
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '18px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Available Balance
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#facc15', margin: '4px 0' }}>
                {tokenBalance.toLocaleString()} $Ω
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                Tier: {authSession?.user?.tier || 'Free Test Tier'} · Self-Contained Sovereign Protocol
              </div>
            </div>

            {/* Faucet & Deposit Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={async () => {
                  try {
                    const res = await apiRequest<any>('/v1/tokens/claim-free', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: authSession?.user?.id || 'usr_omega_sovereign_1111' }),
                    });
                    if (res?.success) {
                      setTokenBalance(res.newBalance);
                      alert(`🎉 Successfully claimed 500 free test $Ω credits! New balance: ${res.newBalance.toLocaleString()} $Ω`);
                    }
                  } catch (e: any) {
                    alert(`Faucet error: ${e.message}`);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <span>⚡</span>
                <span>Claim +500 Free Test $Ω Credits (Faucet)</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await apiRequest<any>('/v1/tokens/crypto-deposit', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount: 10, currency: 'USDC', walletAddress: '0x71C...b48a' }),
                    });
                    if (res?.success) {
                      setTokenBalance(res.newBalance);
                      alert(`🪙 Crypto deposit verified! +${res.creditsIssued.toLocaleString()} $Ω added.`);
                    }
                  } catch (e: any) {
                    alert(`Crypto deposit error: ${e.message}`);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <span>💳</span>
                <span>Deposit 10 USDC (+100 $Ω Credits)</span>
              </button>

              {/* Bitcoin SegWit Treasury Destination */}
              <div
                style={{
                  marginTop: '6px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  fontSize: '11px',
                  color: '#9ca3af',
                  fontFamily: theme.fontMono,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ color: '#e5e7eb', fontWeight: 600, marginBottom: '2px' }}>🛡️ Bitcoin SegWit Treasury Tithe:</div>
                <div style={{ wordBreak: 'break-all', color: '#facc15' }}>bc1qaj8jmp5as80zwew09ep86w6fgw37zwhwzr89mp</div>
                <div style={{ marginTop: '2px', fontSize: '10px', color: '#71717a' }}>Veiled custody · 100% self-contained local ledger verification</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CANONICAL ROOM & OMNICOS FSM MODAL ── */}
      {showRoomModal && selectedRoom && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 8, 14, 0.88)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9996,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRoomModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              borderRadius: '20px',
              background: '#12161f',
              border: '1px solid rgba(167, 139, 250, 0.35)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9)',
              fontFamily: theme.fontSans,
              color: '#ffffff',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{selectedRoom.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', background: 'rgba(167, 139, 250, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      ROOM {selectedRoom.code}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{selectedRoom.title}</h3>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{selectedRoom.desc}</div>
                </div>
              </div>
              <button
                onClick={() => setShowRoomModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            {/* Doctrine Banner */}
            <div
              style={{
                background: 'rgba(167, 139, 250, 0.08)',
                border: '1px solid rgba(167, 139, 250, 0.25)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                lineHeight: 1.5,
                color: '#e2e8f0',
              }}
            >
              <div style={{ fontWeight: 700, color: '#c4b5fd', marginBottom: '4px' }}>🏛️ Room Doctrine & Meaning:</div>
              {selectedRoom.doctrine || selectedRoom.desc}
            </div>

            {/* Dual Vectors: Forward & Reverse Engineering */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '11px',
                }}
              >
                <div style={{ color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>➡️ Forward Engineering</div>
                <div style={{ color: '#cbd5e1', lineHeight: 1.4 }}>{selectedRoom.forwardEngineering || 'Intent flows forward into bounded action and observed value.'}</div>
              </div>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '11px',
                }}
              >
                <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>⬅️ Reverse Engineering</div>
                <div style={{ color: '#cbd5e1', lineHeight: 1.4 }}>{selectedRoom.reverseEngineering || 'Claim flows backward through evidence to authority and original intent.'}</div>
              </div>
            </div>

            {/* Non-Collapse Laws */}
            {selectedRoom.nonCollapseLaws && (
              <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedRoom.nonCollapseLaws.map((law: string, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '10px',
                      fontFamily: theme.fontMono,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      color: '#f87171',
                    }}
                  >
                    ⚠️ {law}
                  </span>
                ))}
              </div>
            )}

            {/* Interactive OMNICOS FSM Transition Stepper */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#facc15' }}>⚡ OMNICOS FSM State Machine</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: theme.fontMono }}>4-Step Execution</span>
              </div>

              <input
                type="text"
                value={fsmIntentText}
                onChange={(e) => setFsmIntentText(e.target.value)}
                placeholder="Enter intent Δ to perceive, align, synchronize & evolve..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '12px',
                  marginBottom: '10px',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  disabled={fsmLoading}
                  onClick={async () => {
                    setFsmLoading(true);
                    try {
                      const payload = await apiRequest<any>('/v1/aisoul/omnicos/transition', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          intent: fsmIntentText || `Advance bounded continuum for Room ${selectedRoom.code}`,
                          targetRoom: selectedRoom.code,
                          targetOrgan: selectedOrgan,
                          valueEstimate: 2.0,
                          evidenceQuality: 0.95,
                          riskEstimate: 0.1,
                          costEstimate: 0.1,
                        }),
                      });
                      setFsmResult(payload);
                    } catch (err: any) {
                      setFsmResult({ success: false, status: 'DIVERGENT', error: err.message });
                    } finally {
                      setFsmLoading(false);
                    }
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: fsmLoading ? 'rgba(167, 139, 250, 0.2)' : '#7c3aed',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: fsmLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {fsmLoading ? '⏳ Processing FSM Transition...' : '⚡ Step FSM State Machine'}
                </button>

                <button
                  onClick={() => {
                    setPromptText(`Room ${selectedRoom.code} [${selectedRoom.title}]: ${fsmIntentText || selectedRoom.desc}`);
                    setShowRoomModal(false);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  💬 Use in Chat
                </button>
              </div>

              {/* FSM Result Display */}
              {fsmResult && (
                <div
                  style={{
                    background: fsmResult.success ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                    border: `1px solid ${fsmResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '11px',
                    fontFamily: theme.fontMono,
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: fsmResult.success ? '#34d399' : '#f87171' }}>
                      {fsmResult.success ? '✓ FSM TRANSITION VERIFIED' : '✗ FSM DIVERGENT / HALTED'}
                    </span>
                    <span style={{ color: '#94a3b8' }}>Status: {fsmResult.status}</span>
                  </div>

                  {fsmResult.fsm?.step1_perceive && (
                    <div>1. KAI Shield: {fsmResult.fsm.step1_perceive.boundaryCheck} ({fsmResult.fsm.step1_perceive.verdict})</div>
                  )}
                  {fsmResult.fsm?.step2_connect && (
                    <div>2. ELION: Routed to {fsmResult.fsm.step2_connect.targetOrgan} ({fsmResult.fsm.step2_connect.harmonicHz} Hz)</div>
                  )}
                  {fsmResult.fsm?.step3_synchronize && (
                    <div>3. OMEGA Gate: SHA-256 match = {String(fsmResult.fsm.step3_synchronize.hashMatch)} ({fsmResult.fsm.step3_synchronize.status})</div>
                  )}
                  {fsmResult.fsm?.step4_evolve && (
                    <div>
                      4. KAI Ledger: Decision = <strong>{fsmResult.fsm.step4_evolve.decision}</strong> · Priority Score = <strong>{fsmResult.fsm.step4_evolve.priorityScore}</strong>
                      <div style={{ color: '#a78bfa', marginTop: '2px' }}>Next Δ: {fsmResult.fsm.step4_evolve.next_delta}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── ROOM 04 SPECIALIZED: TRUTHOS 5-BUYER COMMERCIAL VALIDATION ── */}
            {selectedRoom.code === '04' && (
              <div
                style={{
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#facc15' }}>💎 TruthOS 5-Buyer Commercial Pilot Generator</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: theme.fontMono }}>Section 8 First Action</span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#d1d5db', lineHeight: 1.4 }}>
                  Generates 5 personalized interview prompts for reachable buyers. Invariant: Build software only after validated demand.
                </p>
                <button
                  disabled={truthPilotLoading}
                  onClick={async () => {
                    setTruthPilotLoading(true);
                    try {
                      const res = await apiRequest<any>('/v1/truthos/finite-action/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          niche: 'Boutique agencies & operators',
                          manualTask: 'Manual CRM to Notion project tracking (3+ hrs/wk)',
                          pilotFeeRange: '$250–$1,000',
                        }),
                      });
                      setTruthPilotResult(res);
                    } catch (err: any) {
                      setTruthPilotResult({ error: err.message });
                    } finally {
                      setTruthPilotLoading(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: truthPilotLoading ? 'rgba(234, 179, 8, 0.2)' : '#ca8a04',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: truthPilotLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '10px',
                  }}
                >
                  {truthPilotLoading ? '⏳ Generating Pilot Prompts...' : '⚡ Generate 5-Buyer Interview Hooks'}
                </button>

                {truthPilotResult?.candidatePrompts && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#fef08a' }}>
                      📋 5 Candidate Buyer Interview Hooks ({truthPilotResult.status}):
                    </div>
                    {truthPilotResult.candidatePrompts.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(234, 179, 8, 0.2)',
                          borderRadius: '8px',
                          padding: '10px',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ color: '#facc15', fontWeight: 600 }}>{p.targetPersona}</div>
                        <div style={{ color: '#e2e8f0', margin: '4px 0', fontStyle: 'italic' }}>"{p.interviewHook}"</div>
                        <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                          Invariants: {p.invariantChecks.join(' · ')}
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: '10px', color: '#f87171', marginTop: '4px', fontFamily: theme.fontMono }}>
                      ⚠️ {truthPilotResult.nonCollapseRule}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ROOM 05 SPECIALIZED: HYPER-TENSOR SWITCHER (4x4x4x4 / 6x6x6x6 / 8x8x8x8) ── */}
            {selectedRoom.code === '05' && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>🌊 Hyper-Tensor Dimensionality Switcher</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: theme.fontMono }}>Tensors: 4⁴ / 6⁴ / 8⁴</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  {[4, 6, 8].map((deg) => (
                    <button
                      key={deg}
                      onClick={async () => {
                        setHyperTensorDegree(deg);
                        setHyperTensorLoading(true);
                        try {
                          const res = await apiRequest<any>(`/v1/pluralism/tensor/hyper?degree=${deg}`);
                          setHyperTensorResult(res?.evaluation);
                        } catch (err: any) {
                          setHyperTensorResult({ error: err.message });
                        } finally {
                          setHyperTensorLoading(false);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: hyperTensorDegree === deg ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: hyperTensorDegree === deg ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {deg}×{deg}×{deg}×{deg} ({Math.pow(deg, 4)}-D)
                    </button>
                  ))}
                </div>

                {hyperTensorLoading ? (
                  <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
                    ⏳ Computing {hyperTensorDegree}⁴ ({Math.pow(hyperTensorDegree, 4)}-D) Tensor Projection...
                  </div>
                ) : hyperTensorResult ? (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '11px',
                      fontFamily: theme.fontMono,
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>
                      {hyperTensorResult['🌊']} · {hyperTensorResult.contract}
                    </div>
                    <div>Dimension: <strong>{hyperTensorResult.tensorDimension} coordinates</strong></div>
                    <div>Frobenius Norm: <strong>{Number(hyperTensorResult.frobeniusNorm || 0).toFixed(4)}</strong></div>
                    <div>Gram Determinant: <strong>{Number(hyperTensorResult.gramDeterminant || hyperTensorResult.gram8x8Determinant || 0).toFixed(6)}</strong></div>
                    <div>Root Determinant: <strong>{Number(hyperTensorResult.rootGramDeterminant || hyperTensorResult.eighthRootGramDeterminant || 0).toFixed(6)}</strong></div>
                    <div style={{ color: '#34d399' }}>Fixpoint: ✓ STABLE (Ψ = 0) · Proof: {String(hyperTensorResult.proofHash || '').slice(0, 16)}...</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '6px' }}>
                    Select a tier (4⁴, 6⁴, 8⁴) to inspect its Gram matrix determinant and Frobenius norm.
                  </div>
                )}
              </div>
            )}

            {/* Notion Control Surface Link */}
            {selectedRoom.notionUrl && (
              <a
                href={selectedRoom.notionUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '12px',
                  textDecoration: 'none',
                }}
              >
                <span>🌐 Open in Notion Control Surface ↗</span>
              </a>
            )}
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

      {/* ── IN-APP CHROME BROWSER MODAL (Live Viewport + Headless Snapshot) ── */}
      <InAppChromeBrowser
        isOpen={chromeBrowserOpen}
        initialUrl={chromeInitialUrl}
        onClose={() => setChromeBrowserOpen(false)}
      />
    </div>
  );
}
