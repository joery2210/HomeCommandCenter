import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { Store } from './lib/store.js';
import { getUpcomingEvents, clearCalendarCache } from './lib/calendar.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const store = new Store(process.env.DATA_FILE || join(ROOT, 'data', 'db.json'));
await store.load();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw Object.assign(new Error('Body too large'), { status: 413 });
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 });
  }
}

function pinMatches(pin) {
  const a = Buffer.from(String(pin ?? ''));
  const b = Buffer.from(store.state.settings.parentPin);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireParent(req) {
  if (!pinMatches(req.headers['x-parent-pin'])) {
    throw Object.assign(new Error('Wrong PIN'), { status: 401 });
  }
}

const routes = {
  'GET /api/state': () => store.publicState(),

  'POST /api/chores/toggle': async (req) => {
    const { date, choreId, done } = await readJson(req);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw Object.assign(new Error('Bad date'), { status: 400 });
    await store.toggleChore(date, choreId, Boolean(done));
    return store.publicState();
  },

  'GET /api/calendar': async (req, url) => {
    const { calendars, daysAhead } = store.state.settings;
    const force = url.searchParams.get('refresh') === '1';
    return getUpcomingEvents(calendars, daysAhead, { force });
  },

  'POST /api/admin/login': async (req) => {
    const { pin } = await readJson(req);
    if (!pinMatches(pin)) throw Object.assign(new Error('Wrong PIN'), { status: 401 });
    return store.adminState();
  },

  'GET /api/admin/state': (req) => {
    requireParent(req);
    return store.adminState();
  },

  'PUT /api/admin/state': async (req) => {
    requireParent(req);
    await store.updateAdmin(await readJson(req));
    clearCalendarCache();
    return store.adminState();
  },
};

async function serveStatic(res, pathname) {
  const rel = normalize(pathname === '/' ? '/index.html' : pathname).replace(/^(\.\.[/\\])+/, '');
  const file = join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR)) return send(res, 404, { error: 'Not found' });
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    send(res, 404, { error: 'Not found' });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const handler = routes[`${req.method} ${url.pathname}`];
  try {
    if (handler) return send(res, 200, await handler(req, url));
    if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'Not found' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    return serveStatic(res, url.pathname);
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    send(res, status, { error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`🏠 Home Command Center running at http://localhost:${PORT}`);
});
