import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API, adminPost, adminDelete, getJson } from './api.js';
import { EMERGENCY, downloadCsv, playAlarm, timeAgo } from './utils.js';
import Banner from './components/Banner.jsx';
import PoleCards from './components/PoleCards.jsx';
import MapView from './components/MapView.jsx';
import TrendChart from './components/TrendChart.jsx';
import AnimalsPanel from './components/AnimalsPanel.jsx';
import AlertsTable from './components/AlertsTable.jsx';

const PAGE_SIZE = 25;
const RANGES = [[1, 'Last hour'], [24, 'Last 24 hours'], [168, 'Last 7 days'], [720, 'Last 30 days'], [0, 'All time']];

export default function App() {
  const [poles, setPoles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ hours: 24, level: '', poleId: '', animalId: '', unacked: false, showTests: false });
  const [page, setPage] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [sound, setSound] = useState(false);
  const [now, setNow] = useState(Date.now());

  const audio = useRef(null), soundOn = useRef(false);
  soundOn.current = sound;

  const query = useMemo(() => {
    const q = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    if (filters.hours) q.set('sinceHours', filters.hours);
    if (filters.level) q.set('level', filters.level);
    if (filters.poleId) q.set('poleId', filters.poleId);
    if (filters.animalId !== '') q.set('animalId', filters.animalId);
    if (filters.unacked) q.set('unacked', '1');
    if (!filters.showTests) q.set('hideTests', '1');
    return q;
  }, [filters, page]);

  const load = useCallback(async () => {
    try {
      const [p, a, s] = await Promise.all([
        getJson('/api/poles'),
        getJson(`/api/alerts?${query}`),
        getJson(`/api/stats?hours=${filters.hours || 720}`),
      ]);
      setPoles(p.data); setAlerts(a.data); setTotal(a.total); setStats(s.data); setError('');
    } catch (e) { setError(e.message); }
  }, [query, filters.hours]);

  // Socket handlers must always call the newest load(); keep it in a ref.
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let timer;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => loadRef.current(), 300); };
    const socket = io(API, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => { setConnected(true); refresh(); });
    socket.on('disconnect', () => setConnected(false));
    // socket.on('animal-alert', a => {
    //   if (a.level === EMERGENCY && soundOn.current) {
    //     playAlarm(audio.current);
    //     if ('Notification' in window && Notification.permission === 'granted')
    //       new Notification('Animal on road', { body: `Animal #${a.animalId} at ${a.poleId}` });
    //   }
    //   refresh();
    // });
    
    socket.on('animal-alert', a => {
      // Play sound only for emergency alerts when sound is enabled.
      if (a.level === EMERGENCY && soundOn.current) {
        playAlarm(audio.current);
      }

      // Notify for emergencies and animal-left events.
      if (
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        if (a.level === EMERGENCY) {
          new Notification('Animal on road — EMERGENCY', {
            body: `Animal #${a.animalId} at ${a.poleId}`
          });
        } else if (a.level === 'ANIMAL_LEFT') {
          new Notification('Animal left the road', {
            body: `Animal #${a.animalId} is no longer detected at ${a.poleId}`
          });
        }
      }

      refresh();
    });

    ['pole-status', 'alert-updated', 'alerts-bulk-updated', 'alert-deleted'].forEach(ev => socket.on(ev, refresh));
    const poll = setInterval(() => loadRef.current(), 30000);   // safety net if the socket drops
    const tick = setInterval(() => setNow(Date.now()), 10000);
    return () => { clearTimeout(timer); clearInterval(poll); clearInterval(tick); socket.close(); };
  }, []);

  function toggleSound() {
    if (!sound) {
      audio.current = audio.current || new (window.AudioContext || window.webkitAudioContext)();
      audio.current.resume?.();
      playAlarm(audio.current);
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    }
    setSound(!sound);
  }

  const flash = msg => { setToast(msg); setTimeout(() => setToast(''), 4000); };
  const ack = async id => {
    try { await adminPost(`/api/alerts/${id}/ack`); load(); } catch (e) { flash(e.message); }
  };
  const deleteAlert = async id => {
    if (!window.confirm(`Permanently delete alert #${id}? This cannot be undone.`)) return;
    try {
      await adminDelete(`/api/alerts/${id}`);
      flash(`Alert #${id} deleted`);
      load();
    } catch (e) { if (e.message !== 'Cancelled') flash(e.message); }
  };
  const ackAll = async () => {
    try { const r = await adminPost('/api/alerts/ack-all'); flash(`${r.changed} alert(s) acknowledged`); load(); } catch (e) { flash(e.message); }
  };
  const exportCsv = async () => {
    try {
      const q = new URLSearchParams(query); q.set('limit', 5000); q.set('offset', 0);
      downloadCsv((await getJson(`/api/alerts?${q}`)).data);
    } catch (e) { flash(e.message); }
  };
  const setFilter = patch => { setFilters(f => ({ ...f, ...patch })); setPage(0); };

  const active = stats?.activeEmergencies || [];
  const activePoleIds = useMemo(() => new Set(active.map(a => a.poleId)), [active]);
  const online = poles.filter(p => p.online).length;
  const lastAlert = alerts.find(a => a.level !== 'TEST_ALERT');

  return (
    <main className="shell">
      <header className="top">
        <div>
          <p className="eyebrow">ROAD SAFETY OPERATIONS</p>
          <h1>Animal Alert Monitor</h1>
          <p className="sub">Live roadside detections, pole health and locations</p>
        </div>
        <div className="top-actions">
          <button className={sound ? 'on' : ''} onClick={toggleSound}>{sound ? '🔔 Alarm sound ON' : '🔕 Alarm sound off'}</button>
          <span className={connected ? 'status online' : 'status'}>{connected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </header>

      {error && <div className="error">Cannot reach the API at {API}: {error}</div>}
      {toast && <div className="toast">{toast}</div>}
      <Banner active={active} now={now} onAck={ackAll} />

      <section className="stats">
        <article><span>Poles online</span><strong className={poles.length && online < poles.length ? 'warnText' : ''}>{online} / {poles.length}</strong></article>
        <article><span>Emergencies ({filters.hours ? RANGES.find(r => r[0] === filters.hours)[1].toLowerCase() : 'last 30 days'})</span><strong>{stats?.emergencies ?? '–'}</strong></article>
        <article><span>Near-road detections</span><strong>{stats?.near ?? '–'}</strong></article>
        <article><span>Awaiting acknowledgement</span><strong className={stats?.unacked ? 'warnText' : ''}>{stats?.unacked ?? '–'}</strong></article>
        <article><span>Latest detection</span><strong className="small">{lastAlert ? timeAgo(now - new Date(lastAlert.time).getTime()) : 'none'}</strong></article>
      </section>

      <section className="panel"><div className="panelhead"><h2>Poles</h2></div>
        <PoleCards poles={poles} now={now} activePoleIds={activePoleIds} /></section>

      <section className="grid2">
        <div className="panel"><div className="panelhead"><h2>Map</h2></div>
          <MapView poles={poles} alerts={alerts} activePoleIds={activePoleIds} /></div>
        <div className="panel"><div className="panelhead"><h2>Detections over time</h2></div>
          <TrendChart stats={stats} />
          <p className="legend"><span style={{ color: '#dc2626' }}>■</span> emergency <span style={{ color: '#f59e0b' }}>■</span> near road</p>
          <div className="panelhead sub-h"><h2>Most detected animals</h2></div>
          <AnimalsPanel stats={stats} now={now} /></div>
      </section>

      <section className="panel">
        <div className="panelhead"><h2>Alert history</h2>
          <div className="row"><button onClick={exportCsv}>Export CSV</button><button onClick={load}>Refresh</button></div></div>
        <div className="filters">
          <select value={filters.hours} onChange={e => setFilter({ hours: Number(e.target.value) })}>{RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          {/* <select value={filters.level} onChange={e => setFilter({ level: e.target.value })}> */}
            {/* <option value="">All severities</option><option value={EMERGENCY}>Emergency</option><option value="ANIMAL_NEAR_ROAD">Near road</option></select> */}
            
        <select
          value={filters.level}
          onChange={e => setFilter({ level: e.target.value })}
        >
          <option value="">All alert types</option>
          <option value={EMERGENCY}>Emergency</option>
          <option value="ANIMAL_NEAR_ROAD">Near road</option>
          <option value="ANIMAL_LEFT">Animal left / no longer detected</option>
          <option value="TEST_ALERT">Test alert</option>
        </select>


          <select value={filters.poleId} onChange={e => setFilter({ poleId: e.target.value })}>
            <option value="">All poles</option>{poles.map(p => <option key={p.poleId}>{p.poleId}</option>)}</select>
          <input type="number" min="1" max="255" placeholder="Animal #" value={filters.animalId} onChange={e => setFilter({ animalId: e.target.value })} />
          <label><input type="checkbox" checked={filters.unacked} onChange={e => setFilter({ unacked: e.target.checked })} /> Unacknowledged only</label>
          <label><input type="checkbox" checked={filters.showTests} onChange={e => setFilter({ showTests: e.target.checked })} /> Show test alerts</label>
        </div>
        <AlertsTable alerts={alerts} now={now} onAck={ack} onDelete={deleteAlert} page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </section>

      {/* <footer>Prototype dashboard · Validate every alert before taking road-control action.</footer> */}
    </main>
  );
}
