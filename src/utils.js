// export const EMERGENCY = 'ANIMAL_ON_ROAD_EMERGENCY';

// export function levelInfo(level) {
//   if (level === EMERGENCY) return { label: 'EMERGENCY', cls: 'danger' };
//   if (level === 'TEST_ALERT') return { label: 'TEST', cls: 'test' };
//   return { label: 'NEAR ROAD', cls: 'warn' };
// }

// export function timeAgo(ms) {
//   const s = Math.max(0, Math.round(ms / 1000));
//   if (s < 60) return `${s}s ago`;
//   if (s < 3600) return `${Math.floor(s / 60)}m ago`;
//   if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
//   return `${Math.floor(s / 86400)}d ago`;
// }

// export function uptime(sec) {
//   if (!sec) return '–';
//   const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
//   return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
// }

// // SIM: CSQ 0-31 (99 = unknown). WiFi: RSSI in dBm.
// export function signalBars(via, signal) {
//   if (via === 'wifi') return signal >= -55 ? 4 : signal >= -65 ? 3 : signal >= -75 ? 2 : signal < 0 ? 1 : 0;
//   return signal === 99 || signal < 2 ? 0 : signal >= 20 ? 4 : signal >= 15 ? 3 : signal >= 10 ? 2 : 1;
// }

// export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// export function downloadCsv(rows) {
//   const head = ['id', 'time', 'level', 'poleId', 'animalId', 'lat', 'lng', 'gpsSource', 'via', 'acknowledgedAt'];
//   const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
//   const csv = [head.join(','), ...rows.map(a => [a.id, a.time, a.level, a.poleId, a.animalId, a.lat, a.lng, a.gpsSource, a.via, a.ackedAt].map(cell).join(','))].join('\n');
//   const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
//   const link = Object.assign(document.createElement('a'), { href: url, download: `animal-alerts-${new Date().toISOString().slice(0, 10)}.csv` });
//   link.click();
//   URL.revokeObjectURL(url);
// }

// // Two-tone beep, started from a user gesture (browsers block audio otherwise).
// export function playAlarm(ctx) {
//   if (!ctx) return;
//   [0, 0.35, 0.7].forEach(t => {
//     const o = ctx.createOscillator(), g = ctx.createGain();
//     o.type = 'square'; o.frequency.value = t === 0.35 ? 660 : 880;
//     g.gain.value = 0.08;
//     o.connect(g); g.connect(ctx.destination);
//     o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.25);
//   });
// }




export const EMERGENCY = 'ANIMAL_ON_ROAD_EMERGENCY';

export function levelInfo(level) {
  if (level === EMERGENCY) {
    return { label: 'EMERGENCY', cls: 'danger' };
  }

  if (level === 'ANIMAL_NEAR_ROAD') {
    return { label: 'NEAR ROAD', cls: 'warn' };
  }

  if (level === 'ANIMAL_LEFT') {
    return { label: 'ANIMAL LEFT', cls: 'left' };
  }

  if (level === 'TEST_ALERT') {
    return { label: 'TEST', cls: 'test' };
  }

  return { label: level || 'UNKNOWN', cls: 'warn' };
}

export function timeAgo(ms) {
  const s = Math.max(0, Math.round(ms / 1000));

  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;

  if (s < 86400) {
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
  }

  return `${Math.floor(s / 86400)}d ago`;
}

export function uptime(sec) {
  if (!sec) return '–';

  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);

  return d
    ? `${d}d ${h}h`
    : h
      ? `${h}h ${m}m`
      : `${m}m`;
}

// SIM: CSQ 0-31 (99 = unknown). WiFi: RSSI in dBm.
export function signalBars(via, signal) {
  if (via === 'wifi') {
    return signal >= -55
      ? 4
      : signal >= -65
        ? 3
        : signal >= -75
          ? 2
          : signal < 0
            ? 1
            : 0;
  }

  return signal === 99 || signal < 2
    ? 0
    : signal >= 20
      ? 4
      : signal >= 15
        ? 3
        : signal >= 10
          ? 2
          : 1;
}

export const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

export function downloadCsv(rows) {
  const head = [
    'id',
    'time',
    'level',
    'poleId',
    'animalId',
    'lat',
    'lng',
    'gpsSource',
    'via',
    'acknowledgedAt'
  ];

  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const csv = [
    head.join(','),
    ...rows.map(a => [
      a.id,
      a.time,
      a.level,
      a.poleId,
      a.animalId,
      a.lat,
      a.lng,
      a.gpsSource,
      a.via,
      a.ackedAt
    ].map(cell).join(','))
  ].join('\n');

  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv' })
  );

  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: `animal-alerts-${new Date().toISOString().slice(0, 10)}.csv`
  });

  link.click();
  URL.revokeObjectURL(url);
}

// Two-tone beep, started from a user gesture (browsers block audio otherwise).
export function playAlarm(ctx) {
  if (!ctx) return;

  [0, 0.35, 0.7].forEach(t => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = 'square';
    o.frequency.value = t === 0.35 ? 660 : 880;
    g.gain.value = 0.08;

    o.connect(g);
    g.connect(ctx.destination);

    o.start(ctx.currentTime + t);
    o.stop(ctx.currentTime + t + 0.25);
  });
}
