import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EMERGENCY, esc, levelInfo } from '../utils.js';

const COLORS = { online: '#16a34a', offline: '#94a3b8', alarm: '#dc2626', near: '#d97706', test: '#64748b' };

export default function MapView({ poles, alerts, activePoleIds }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), fitted = useRef(false);

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView([22.08, 82.14], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current.remove(); fitted.current = false; };
  }, []);

  useEffect(() => {
    layer.current.clearLayers();
    const pts = [];

    alerts.filter(a => a.lat != null).slice(0, 100).forEach(a => {
      const color = a.level === EMERGENCY ? COLORS.alarm : a.level === 'TEST_ALERT' ? COLORS.test : COLORS.near;
      L.circleMarker([a.lat, a.lng], { radius: a.level === EMERGENCY ? 7 : 5, color, fillColor: color, fillOpacity: 0.45, weight: 1 })
        .bindPopup(`<b>${levelInfo(a.level).label}</b><br>Animal #${esc(a.animalId)} · ${esc(a.poleId)}<br>${esc(new Date(a.time).toLocaleString())}`)
        .addTo(layer.current);
      pts.push([a.lat, a.lng]);
    });

    poles.filter(p => p.lat != null).forEach(p => {
      const color = activePoleIds.has(p.poleId) ? COLORS.alarm : p.online ? COLORS.online : COLORS.offline;
      L.circleMarker([p.lat, p.lng], { radius: 11, color: '#0f172a', weight: 2, fillColor: color, fillOpacity: 0.95 })
        .bindTooltip(esc(p.poleId), { permanent: true, direction: 'top', offset: [0, -10], className: 'poletip' })
        .bindPopup(`<b>${esc(p.poleId)}</b><br>${p.online ? 'Online' : 'Offline'} · ${esc((p.via || '').toUpperCase())}`)
        .addTo(layer.current);
      pts.push([p.lat, p.lng]);
    });

    if (pts.length && !fitted.current) {
      map.current.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
      fitted.current = true;
    }
  }, [poles, alerts, activePoleIds]);

  return (
    <div>
      <div ref={el} className="map" />
      <p className="legend">
        <span style={{ color: COLORS.online }}>●</span> pole online · <span style={{ color: COLORS.offline }}>●</span> pole offline ·
        <span style={{ color: COLORS.alarm }}> ●</span> emergency · <span style={{ color: COLORS.near }}>●</span> near road
      </p>
    </div>
  );
}
