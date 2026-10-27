export const API =
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

const store = {
  get: k => { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

export async function getJson(path) {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(`${path} returned ${r.status}`);
  return { data: await r.json(), total: Number(r.headers.get('X-Total-Count') || 0) };
}

// Acknowledge actions need the server's ADMIN_KEY; asked once, then remembered in this browser.
export async function adminPost(path, body = {}) {
  let key = store.get('adminKey');
  if (!key) key = window.prompt('Enter the ADMIN_KEY from the server .env to acknowledge alerts:') || '';
  if (!key) throw new Error('Cancelled');
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
    body: JSON.stringify(body),
  });
  if (r.status === 401) { store.set('adminKey', ''); throw new Error('Wrong admin key'); }
  if (r.status === 503) throw new Error('ADMIN_KEY is not set on the server');
  if (!r.ok) throw new Error(`Server returned ${r.status}`);
  store.set('adminKey', key);
  return r.json();
}

// Admin-only destructive actions use the same ADMIN_KEY as acknowledgement.
// export async function adminDelete(path) {
//   let key = store.get('adminKey');
//   if (!key) key = window.prompt('Enter the ADMIN_KEY from the server .env to delete an alert:') || '';
//   if (!key) throw new Error('Cancelled');
//   const r = await fetch(API + path, { method: 'DELETE', headers: { 'X-Admin-Key': key } });
//   if (r.status === 401) { store.set('adminKey', ''); throw new Error('Wrong admin key'); }
//   if (r.status === 503) throw new Error('ADMIN_KEY is not set on the server');
//   if (!r.ok) throw new Error(`${path} returned ${r.status}`);
//   store.set('adminKey', key);
//   return r.json();
// }



export async function adminDelete(path) {
  const r = await fetch(API + path, {
    method: 'DELETE'
  });

  if (!r.ok) {
    throw new Error(`${path} returned ${r.status}`);
  }

  return r.json();
}
