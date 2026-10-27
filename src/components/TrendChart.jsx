export default function TrendChart({ stats }) {
  if (!stats) return null;
  const { buckets, bucketMs } = stats;
  const max = Math.max(1, ...buckets.map(b => b.near + b.emergency));
  const W = 640, H = 150, pad = 22, bw = (W - pad) / buckets.length;
  const label = t => {
    const d = new Date(t);
    return bucketMs < 86400000 ? `${String(d.getHours()).padStart(2, '0')}:00` : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };
  const step = Math.ceil(buckets.length / 8);
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="chart" role="img" aria-label="Alerts over time">
      <line x1={pad} y1={H} x2={W} y2={H} stroke="#cbd5e1" />
      <text x="0" y="12" className="axis">{max}</text>
      {buckets.map((b, i) => {
        const hN = (b.near / max) * (H - 16), hE = (b.emergency / max) * (H - 16), x = pad + i * bw;
        return (
          <g key={b.t}>
            <title>{`${label(b.t)} · ${b.emergency} emergency, ${b.near} near road`}</title>
            <rect x={x + 1} y={H - hN} width={Math.max(1, bw - 2)} height={hN} fill="#f59e0b" />
            <rect x={x + 1} y={H - hN - hE} width={Math.max(1, bw - 2)} height={hE} fill="#dc2626" />
            {i % step === 0 && <text x={x} y={H + 14} className="axis">{label(b.t)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
