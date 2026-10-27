import { timeAgo } from '../utils.js';

export default function AnimalsPanel({ stats, now }) {
  const rows = stats?.byAnimal || [];
  if (!rows.length) return <p className="empty">No tagged animal has been detected in this period.</p>;
  return (
    <table>
      <thead><tr><th>Animal</th><th>Detections</th><th>Emergencies</th><th>Last pole</th><th>Last seen</th></tr></thead>
      <tbody>
        {rows.map(a => (
          <tr key={a.animalId}>
            <td>#{a.animalId}</td><td>{a.total}</td>
            <td>{a.emergencies ? <span className="pill danger">{a.emergencies}</span> : 0}</td>
            <td>{a.lastPole}</td><td>{timeAgo(now - new Date(a.lastSeen).getTime())}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
