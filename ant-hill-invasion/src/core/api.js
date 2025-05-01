// src/core/api.js
const BASE = 'http://localhost:4000';   // back-end host

export async function api(path, opts = {}) {
  const res  = await fetch(BASE + path, {
    credentials: 'include',                       // sends / receives JWT cookie
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}
