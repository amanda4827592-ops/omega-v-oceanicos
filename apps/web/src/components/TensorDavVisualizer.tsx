import { useEffect, useMemo, useState } from 'react';

type TensorSize = 4 | 6 | 8;
type TensorResult = {
  size: TensorSize;
  shape_4d: [number, number, number, number];
  shape_2d: [number, number];
  projection: number[][];
  stats: { minVal: number; maxVal: number; mean: number; checksum: number };
  status: 'VERIFIED' | 'DIVERGENT' | 'UNKNOWN';
  reason: string | null;
  receipt: { algorithm: 'sha256'; digest: string; status: 'VERIFIED' } | null;
};

type HoverCell = { row: number; column: number; value: number } | null;

const SIZES: TensorSize[] = [4, 6, 8];
const apiBase = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');

const cellColor = (value: number, max: number): string => {
  const ratio = max === 0 ? 0 : value / max;
  const hue = 190 - ratio * 155;
  return `hsl(${hue} 78% ${Math.round(28 + ratio * 34)}%)`;
};

export function TensorDavVisualizer() {
  const [size, setSize] = useState<TensorSize>(4);
  const [result, setResult] = useState<TensorResult | null>(null);
  const [hover, setHover] = useState<HoverCell>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setHover(null);
    fetch(`${apiBase}/tensor/${size}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || `Tensor request failed (${response.status})`);
        return payload.data as TensorResult;
      })
      .then((payload) => { if (active) setResult(payload); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Tensor result unavailable'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [size]);

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${size * size}, minmax(2px, 1fr))`,
    gap: '1px',
    aspectRatio: '1',
    width: '100%',
    maxHeight: '560px',
    background: '#071827',
    padding: '4px',
    borderRadius: '10px',
    overflow: 'auto',
  } as const), [size]);

  return (
    <section aria-label="Tensor DAV visualizer" style={{ margin: '24px 0', padding: '18px', border: '1px solid #1e4b5f', borderRadius: '14px', background: 'rgba(2, 18, 30, 0.88)', color: '#d8f8ff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#67e8f9', fontSize: '11px', letterSpacing: '0.14em', fontWeight: 800 }}>DAV · DETERMINISTIC TENSOR SURFACE</div>
          <h2 style={{ margin: '6px 0 4px', fontSize: '20px' }}>T[i,j,k,l] = i + j + k + l</h2>
          <small style={{ color: '#8bb8c5' }}>Pure local verification · no Python daemon or external model required</small>
        </div>
        <div role="group" aria-label="Tensor sizes" style={{ display: 'flex', gap: '6px' }}>
          {SIZES.map((candidate) => (
            <button key={candidate} type="button" aria-pressed={size === candidate} onClick={() => setSize(candidate)} style={{ border: `1px solid ${size === candidate ? '#67e8f9' : '#1e4b5f'}`, borderRadius: '999px', background: size === candidate ? '#0e5268' : 'transparent', color: '#d8f8ff', padding: '8px 11px', cursor: 'pointer', fontSize: '11px' }}>
              {candidate}×{candidate}×{candidate}×{candidate}
            </button>
          ))}
        </div>
      </header>

      {loading && <p role="status" style={{ color: '#8bb8c5' }}>Observing tensor {size}…</p>}
      {error && <p role="alert" style={{ color: '#fbbf24' }}>UNKNOWN · {error}</p>}
      {result && !loading && (
        <>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '16px 0 10px', flexWrap: 'wrap' }}>
            <strong style={{ color: result.status === 'VERIFIED' ? '#86efac' : '#fbbf24' }}>{result.status === 'VERIFIED' ? '🔒 Verified' : result.status}</strong>
            {result.receipt && <code style={{ fontSize: '10px', color: '#8bb8c5', overflowWrap: 'anywhere' }}>SHA-256 {result.receipt.digest}</code>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 180px', gap: '14px', alignItems: 'start' }}>
            <div style={gridStyle} aria-label={`${size * size} by ${size * size} tensor projection`}>
              {result.projection.flatMap((row, rowIndex) => row.map((value, columnIndex) => (
                <button key={`${rowIndex}-${columnIndex}`} type="button" aria-label={`row ${rowIndex}, column ${columnIndex}, sum ${value}`} onMouseEnter={() => setHover({ row: rowIndex, column: columnIndex, value })} onFocus={() => setHover({ row: rowIndex, column: columnIndex, value })} style={{ border: 0, padding: 0, minWidth: 0, aspectRatio: '1', background: cellColor(value, result.stats.maxVal), cursor: 'crosshair' }} title={`[${rowIndex}, ${columnIndex}] = ${value}`} />
              )))}
            </div>
            <aside style={{ fontSize: '12px', color: '#b7d7df' }}>
              <div style={{ color: '#67e8f9', letterSpacing: '0.1em', fontSize: '10px' }}>OBSERVATION</div>
              <p>{hover ? `hover [row ${hover.row}, col ${hover.column}] → i+j+k+l = ${hover.value}` : 'Hover a cell to inspect coordinates.'}</p>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px' }}>
                <dt>4D shape</dt><dd>{result.shape_4d.join('×')}</dd>
                <dt>Projection</dt><dd>{size * size}×{size * size}</dd>
                <dt>2D shape</dt><dd>{result.shape_2d.join('×')}</dd>
                <dt>Minimum</dt><dd>{result.stats.minVal}</dd>
                <dt>Maximum</dt><dd>{result.stats.maxVal}</dd>
                <dt>Mean</dt><dd>{result.stats.mean}</dd>
                <dt>Checksum</dt><dd>{result.stats.checksum.toLocaleString()}</dd>
              </dl>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
