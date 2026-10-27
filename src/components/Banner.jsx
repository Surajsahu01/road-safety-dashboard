import { timeAgo } from '../utils.js';

export default function Banner({ active, now, onAck }) {
  if (!active.length) return null;
  return (
    <section className="banner" role="alert">
      <div>
        <strong>⚠ {active.length} active emergenc{active.length > 1 ? 'ies' : 'y'}</strong>
        <ul>
          {active.map(a => (
            <li key={a.id}>
              Animal #{a.animalId} on road at <b>{a.poleId}</b> · {timeAgo(now - new Date(a.time).getTime())}
              {a.mapLink && <> · <a href={a.mapLink} target="_blank" rel="noreferrer">Open map</a></>}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={onAck}>Acknowledge all</button>
    </section>
  );
}
