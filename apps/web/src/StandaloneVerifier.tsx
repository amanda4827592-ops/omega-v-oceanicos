import { useState, type CSSProperties } from 'react';
import { verifyAttestation, type VerificationOutcome } from './verify';

type Props = { onBack: () => void };

const fieldStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #24463f',
  borderRadius: 6,
  background: '#071a17',
  color: '#e9f4f2',
  padding: '12px 14px',
  fontFamily: 'DM Mono, monospace',
  fontSize: 12,
  lineHeight: 1.5,
};

export function StandaloneVerifier({ onBack }: Props) {
  const [attestationText, setAttestationText] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [result, setResult] = useState<VerificationOutcome | null>(null);
  const [busy, setBusy] = useState(false);

  const runVerification = async () => {
    setBusy(true);
    try {
      let attestation: Record<string, unknown>;
      try {
        const parsed: unknown = JSON.parse(attestationText);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Attestation must be a JSON object.');
        }
        attestation = parsed as Record<string, unknown>;
      } catch (error) {
        setResult({
          valid: false,
          reason: error instanceof Error ? error.message : 'Attestation is not valid JSON.',
          stage: 'shape',
        });
        return;
      }
      setResult(await verifyAttestation(attestation, publicKey));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="verifier-shell">
      <header className="verifier-header">
        <div>
          <div className="verifier-kicker">💧 OCEANICOS · INDEPENDENT VERIFICATION</div>
          <h1>Ed25519 browser verifier</h1>
          <p>Check an attestation locally with WebCrypto. The private key never enters this page.</p>
        </div>
        <button className="verifier-back" onClick={onBack}>← Dashboard</button>
      </header>

      <main className="verifier-grid">
        <section className="verifier-card">
          <div className="verifier-label">01 · ATTESTATION JSON</div>
          <textarea
            aria-label="Attestation JSON"
            style={{ ...fieldStyle, minHeight: 280 }}
            value={attestationText}
            onChange={(event) => setAttestationText(event.target.value)}
            placeholder={'{\n  "status": "signed",\n  "signingAlgorithm": "Ed25519",\n  ...\n}'}
          />
          <div className="verifier-label verifier-key-label">02 · PUBLIC KEY PEM</div>
          <textarea
            aria-label="Public key PEM"
            style={{ ...fieldStyle, minHeight: 150 }}
            value={publicKey}
            onChange={(event) => setPublicKey(event.target.value)}
            placeholder="-----BEGIN PUBLIC KEY-----"
          />
          <button className="verifier-action" disabled={busy || !attestationText || !publicKey} onClick={runVerification}>
            {busy ? 'CHECKING LOCALLY…' : 'VERIFY SIGNATURE'}
          </button>
        </section>

        <aside className="verifier-card verifier-explanation">
          <div className="verifier-label">VERIFICATION BOUNDARY</div>
          <h2>What this proves</h2>
          <p>A valid result proves that the signed fields match the supplied public key.</p>
          <p>It does not prove that the underlying observation was correct, current, authorized, or free from later revocation.</p>
          <div className="verifier-boundary">ATTEST ≠ ASSERT<br />SIGNATURE ≠ REALITY<br />CAPABILITY ≠ AUTHORITY</div>
          {result && (
            <div className={`verifier-result ${result.valid ? 'is-valid' : 'is-invalid'}`} role="status">
              <strong>{result.valid ? '✓ SIGNATURE VALID' : '× SIGNATURE NOT VERIFIED'}</strong>
              <span>{result.reason}</span>
              <small>stage: {result.stage}</small>
            </div>
          )}
        </aside>
      </main>
      <footer className="verifier-footer">No account. No upload. No server-side verification request.</footer>
    </div>
  );
}
