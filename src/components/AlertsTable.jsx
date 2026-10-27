import { levelInfo, timeAgo } from '../utils.js';

const SOURCE_NOTE = { 'last-known': 'last known', 'pole-registry': 'pole position', stored: 'saved' };

export default function AlertsTable({ alerts, now, onAck, onDelete, page, pageSize, total, onPage }) {
  if (!alerts.length) return <p className="empty">No alerts match these filters.</p>;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Severity</th><th>Time</th><th>Pole</th><th>Animal</th><th>Location</th><th>Via</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {alerts.map(a => {
              const lv = levelInfo(a.level), t = new Date(a.time);
              return (
                <tr key={a.id} className={!a.ackedAt && a.level !== 'TEST_ALERT' ? 'unacked' : ''}>
                  <td><span className={`pill ${lv.cls}`}>{lv.label}</span></td>
                  <td title={t.toLocaleString()}>{t.toLocaleTimeString()} <small>{timeAgo(now - t.getTime())}</small></td>
                  <td>{a.poleId}</td>
                  <td>{a.animalId ? `#${a.animalId}` : '–'}</td>
                  <td>
                    {a.lat != null
                      ? <><a href={a.mapLink} target="_blank" rel="noreferrer">{Number(a.lat).toFixed(5)}, {Number(a.lng).toFixed(5)}</a>
                          {SOURCE_NOTE[a.gpsSource] && <small> ({SOURCE_NOTE[a.gpsSource]})</small>}</>
                      : <small>unknown</small>}
                  </td>
                  <td>{a.via ? a.via.toUpperCase() : '–'}</td>
                  {/* <td>{a.level === 'TEST_ALERT' ? '–' : a.ackedAt ? <small>✓ acknowledged</small> : <b>NEW</b>}</td> */}
                  
                  <td>
                    {a.level === 'TEST_ALERT'
                      ? '–'
                      : a.ackedAt
                        ? <small>✓ acknowledged</small>
                        : a.level === 'ANIMAL_LEFT'
                          ? <small>Animal left</small>
                          : <b>NEW</b>}
                  </td>

                  <td className="actions">{!a.ackedAt && a.level !== 'TEST_ALERT' && <button className="small" onClick={() => onAck(a.id)}>Acknowledge</button>}<button className="small delete-button" onClick={() => onDelete(a.id)} title={`Permanently delete alert #${a.id}`}>Delete</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button disabled={page === 0} onClick={() => onPage(page - 1)}>← Newer</button>
        <span>Page {page + 1} of {pages} · {total} alerts</span>
        <button disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Older →</button>
      </div>
    </>
  );
}
