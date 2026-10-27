import { signalBars, timeAgo, uptime } from '../utils.js';

function Bars({ n }) {
  return <span className="bars" title={`${n}/4`}>{[1, 2, 3, 4].map(i => <i key={i} className={i <= n ? 'on' : ''} style={{ height: 4 + i * 3 }} />)}</span>;
}

export default function PoleCards({ poles, now, activePoleIds }) {
  if (!poles.length) {
    return <p className="empty">No pole has reported yet. A pole appears here after its first health report (within ~2 minutes of getting internet).</p>;
  }
  return (
    <div className="poles">
      {poles.map(p => {
        const alarm = activePoleIds.has(p.poleId);
        const ago = now - new Date(p.lastSeen).getTime();
        const bad = p.lastResult && !/^HTTP 2|OK|No alerts/.test(p.lastResult);
        return (
          <article key={p.poleId} className={`pole ${alarm ? 'alarm' : p.online ? '' : 'off'}`}>
            <header>
              <h3>{p.poleId}</h3>
              <span className={`pill ${alarm ? 'danger' : p.online ? 'ok' : 'off'}`}>{alarm ? 'EMERGENCY' : p.online ? 'ONLINE' : 'OFFLINE'}</span>
            </header>
            <dl>
              <dt>Last report</dt><dd>{timeAgo(ago)}</dd>
              <dt>Link</dt><dd>{(p.via || '?').toUpperCase()} <Bars n={signalBars(p.via, p.signal)} /></dd>
              <dt>GPS</dt><dd>{p.gpsFix ? `Fix · ${p.sats} sats` : 'No live fix'}{p.lat != null && !p.gpsFix ? ' (saved position)' : ''}</dd>
              <dt>Alerts sent / failed</dt><dd>{p.sent} / <span className={p.failed ? 'bad' : ''}>{p.failed}</span></dd>
              <dt>Uptime</dt><dd>{uptime(p.uptimeS)}{p.fw ? ` · fw ${p.fw}` : ''}</dd>
            </dl>
            {bad && <p className="pole-warn" title={p.lastResult}>⚠ {p.lastResult}</p>}
          </article>
        );
      })}
    </div>
  );
}
