// Fetch layer over the GitHub Contents API. Same function names as the
// local hub's data.js so the copied views work unchanged. Everything returns
// null (or []) on failure and never throws, except that a 401 and a 403 also
// raise a window event so the shell can react.

import { parse } from './md.js';

export const CONFIG = { owner: 'DarkpizzAi', repo: 'kave-hub', branch: 'main' };

const TOKEN_KEY = 'ak';
const CACHE_PREFIX = 'hubweb:c:';
const RAW = 'application/vnd.github.raw+json';
const LISTING = 'application/vnd.github+json';

let fetchImpl = (...args) => fetch(...args);
const memory = new Map();

export function setFetch(fn) { fetchImpl = fn; }
export function resetMemory() { memory.clear(); }

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
}
export function setToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch (e) { /* storage blocked */ }
}
export function dropCache() {
  try {
    Object.keys(sessionStorage).filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => sessionStorage.removeItem(k));
  } catch (e) { /* storage blocked */ }
  memory.clear();
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* storage blocked */ }
  dropCache();
}

export function apiUrl(path) {
  const clean = path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${clean}?ref=${CONFIG.branch}`;
}

async function request(path, accept) {
  const token = getToken();
  if (!token) { window.dispatchEvent(new Event('data:auth')); return { status: 401 }; }

  const cacheKey = CACHE_PREFIX + accept + ':' + path;
  let cached = null;
  try { cached = JSON.parse(sessionStorage.getItem(cacheKey)); } catch (e) { /* none */ }

  const headers = { Authorization: 'Bearer ' + token, Accept: accept };
  if (cached && cached.etag) headers['If-None-Match'] = cached.etag;

  let r;
  try { r = await fetchImpl(apiUrl(path), { headers }); } catch (e) { return { status: 0 }; }

  if (r.status === 304 && cached) return { status: 200, body: cached.body };
  if (r.status === 401) window.dispatchEvent(new Event('data:auth'));
  if (r.status === 403) window.dispatchEvent(new Event('data:limit'));
  if (r.status !== 200) return { status: r.status };

  const body = await r.text();
  const etag = r.headers.get('ETag');
  if (etag) {
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ etag, body })); } catch (e) { /* quota */ }
  }
  return { status: 200, body };
}

export async function text(path) {
  if (memory.has(path)) return memory.get(path);
  const r = await request(path, RAW);
  const out = r.status === 200 ? r.body : null;
  // A missing file is a stable answer; a transient failure is not.
  if (r.status === 200 || r.status === 404) memory.set(path, out);
  return out;
}

export async function json(path) {
  const t = await text(path);
  if (t == null) return null;
  try { return JSON.parse(t); } catch (e) { return null; }
}

export async function doc(path) {
  const t = await text(path);
  return t == null ? null : parse(t);
}

export async function listDir(dir) {
  const r = await request(dir, LISTING);
  if (r.status !== 200) return [];
  try {
    return JSON.parse(r.body).filter(e => e.type === 'file').map(e => e.name);
  } catch (e) { return []; }
}

// Checks a candidate token against one small file. Stores nothing.
export async function verifyToken(token) {
  try {
    const r = await fetchImpl(apiUrl('.claude-plugin/marketplace.json'), {
      headers: { Authorization: 'Bearer ' + token, Accept: RAW },
    });
    return r.status === 200;
  } catch (e) { return false; }
}

// ---- dates ----

function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

// Accepts YYYY-MM-DD, DD/MM/YYYY, DD/MM (next occurrence). Returns Date or null.
export function parseDate(s) {
  if (!s) return null;
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/(^|\s)(\d{1,2})\/(\d{1,2})(\s|$)/);
  if (m) {
    const now = startOfDay(new Date());
    let d = new Date(now.getFullYear(), +m[3] - 1, +m[2]);
    if (d < now) d = new Date(now.getFullYear() + 1, +m[3] - 1, +m[2]);
    return d;
  }
  return null;
}

export function daysUntil(d) {
  if (!d) return null;
  const now = startOfDay(new Date());
  return Math.round((startOfDay(d) - now) / 86400000);
}

// Next occurrence of a day-of-month (for bills). Returns days until it.
export function daysUntilDayOfMonth(day) {
  const now = startOfDay(new Date());
  let d = new Date(now.getFullYear(), now.getMonth(), day);
  if (d < now) d = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return daysUntil(d);
}

export function fmtEur(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export function fmtDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
