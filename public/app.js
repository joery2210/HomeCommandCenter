import { AGE_GROUPS, ageGroupFor, factOfTheDay } from './facts.js';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHEERS = ['Awesome!', 'Way to go!', 'Nice job!', 'Super star!', 'You rock!', 'Crushed it!'];

let state = null;          // public state from the server
let events = [];           // upcoming calendar events
let calendarErrors = [];
let todayKey = dateKey(new Date());
const factOffsets = {};    // "another one!" taps per age group

// ---------- helpers ----------
function dateKey(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Tiny element builder: h('div', { class: 'x', onclick }, child, 'text')
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v)) {
        if (prop.startsWith('--')) el.style.setProperty(prop, val);
        else el.style[prop] = val;
      }
    }
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}

async function api(path, { method = 'GET', body, pin } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(pin ? { 'X-Parent-Pin': pin } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function choresFor(kidId, date = new Date()) {
  const dow = date.getDay();
  return state.chores.filter((c) => c.kidId === kidId && c.days.includes(dow));
}

function isDone(choreId, key = todayKey) {
  return Boolean(state.completions[key]?.[choreId]);
}

// Points earned since Sunday.
function weekPoints(kidId) {
  const now = new Date();
  let total = 0;
  for (let i = 0; i <= now.getDay(); i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = dateKey(d);
    for (const c of state.chores) {
      if (c.kidId === kidId && isDone(c.id, key)) total += c.points;
    }
  }
  return total;
}

// ---------- clock & greeting ----------
function renderClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  document.getElementById('date').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const hr = now.getHours();
  const part = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = state ? `${part}, ${state.settings.familyName}! 👋` : '';

  // Roll over to a new day at midnight.
  const key = dateKey(now);
  if (key !== todayKey) {
    todayKey = key;
    Object.keys(factOffsets).forEach((k) => delete factOffsets[k]);
    renderAll();
    loadCalendar();
  }
}

// ---------- chores ----------
function renderKids() {
  const wrap = document.getElementById('kids');
  wrap.replaceChildren();
  if (!state.kids.length) {
    wrap.append(h('div', { class: 'panel' }, h('p', {}, 'No kids yet. Tap ⚙️ to add your family.')));
    return;
  }
  for (const kid of state.kids) {
    const chores = choresFor(kid.id);
    const done = chores.filter((c) => isDone(c.id)).length;
    const pct = chores.length ? Math.round((done / chores.length) * 100) : 100;
    const todayPts = chores.filter((c) => isDone(c.id)).reduce((s, c) => s + c.points, 0);

    wrap.append(
      h('article', { class: 'kid', style: { '--kid': kid.color } },
        h('div', { class: 'kid-head' },
          h('div', { class: 'avatar' }, kid.emoji),
          h('div', {},
            h('div', { class: 'kid-name' }, kid.name),
            h('div', { class: 'kid-stars' }, `⭐ ${todayPts} today · ${weekPoints(kid.id)} this week`),
          ),
        ),
        h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 },
          h('span', { style: { width: `${pct}%` } })),
        chores.length
          ? h('ul', { class: 'chores' }, chores.map((c) => h('li', {}, choreButton(kid, c))))
          : h('p', { class: 'muted' }, 'No chores today — enjoy! 🎈'),
        chores.length && done === chores.length ? h('div', { class: 'all-done' }, 'All done! 🎉') : null,
      ),
    );
  }
}

function choreButton(kid, chore) {
  const done = isDone(chore.id);
  return h('button', {
    class: `chore${done ? ' done' : ''}`,
    'data-chore': chore.id,
    'aria-pressed': String(done),
    onclick: () => toggleChore(kid, chore),
  },
    h('span', { class: 'emoji' }, chore.emoji),
    h('span', { class: 'title' }, chore.title),
    h('span', { class: 'pts' }, `+${chore.points} ⭐`),
    h('span', { class: 'check', 'aria-hidden': 'true' }, '✓'),
  );
}

async function toggleChore(kid, chore) {
  const nowDone = !isDone(chore.id);
  // Optimistic update so taps feel instant.
  (state.completions[todayKey] ??= {});
  if (nowDone) state.completions[todayKey][chore.id] = true;
  else delete state.completions[todayKey][chore.id];
  renderKids();

  if (nowDone) {
    document.querySelector(`[data-chore="${chore.id}"]`)?.classList.add('pop');
    const remaining = choresFor(kid.id).filter((c) => !isDone(c.id)).length;
    if (remaining === 0) celebrate(`${kid.emoji} ${kid.name} finished everything! 🎉`, 40);
    else celebrate(null, 8);
  }

  try {
    state = await api('/api/chores/toggle', { method: 'POST', body: { date: todayKey, choreId: chore.id, done: nowDone } });
  } catch (err) {
    console.error(err);
    await loadState(); // resync with the server on failure
  }
  renderKids();
}

function celebrate(message, pieces) {
  const layer = document.getElementById('celebrate');
  const bits = ['🎉', '⭐', '✨', '🎊', '🌟', '💫'];
  for (let i = 0; i < pieces; i++) {
    const s = h('span', { class: 'confetti' }, bits[i % bits.length]);
    s.style.left = `${Math.random() * 100}vw`;
    s.style.animationDuration = `${1.8 + Math.random() * 1.8}s`;
    s.style.animationDelay = `${Math.random() * 0.4}s`;
    layer.append(s);
    s.addEventListener('animationend', () => s.remove());
  }
  if (message) {
    const b = h('div', { class: 'banner' }, message);
    layer.append(b);
    b.addEventListener('animationend', () => b.remove());
  } else if (pieces) {
    const b = h('div', { class: 'banner', style: { fontSize: '1.4rem', top: '20%' } }, CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    layer.append(b);
    b.addEventListener('animationend', () => b.remove());
  }
}

// ---------- calendar ----------
async function loadCalendar(force = false) {
  try {
    const data = await api(`/api/calendar${force ? '?refresh=1' : ''}`);
    events = data.events;
    calendarErrors = data.errors;
  } catch (err) {
    calendarErrors = [{ label: 'Calendar', message: err.message }];
  }
  renderAgenda();
}

function eventStart(e) {
  return e.allDay ? new Date(`${e.start}T00:00:00`) : new Date(e.start);
}
function eventEnd(e) {
  return e.allDay ? new Date(`${e.end}T00:00:00`) : new Date(e.end);
}

// Which kids does this event mention? ("Maya soccer practice" -> Maya)
function kidsForEvent(e) {
  const hay = `${e.title} ${e.calendarLabel}`.toLowerCase();
  return state.kids.filter((k) => new RegExp(`\\b${k.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay));
}

function dayLabel(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const that = new Date(d); that.setHours(0, 0, 0, 0);
  const diff = Math.round((that - today) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return that.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function renderAgenda() {
  const box = document.getElementById('agenda');
  box.replaceChildren();
  const now = new Date();

  if (!state.settings.calendars.length) {
    box.append(h('p', { class: 'muted' }, 'No calendar connected yet. A grown-up can add one in ⚙️ → Calendars.'));
    renderNextUp();
    return;
  }
  for (const err of calendarErrors) {
    box.append(h('p', { class: 'warn' }, `⚠️ Couldn't load "${err.label}": ${err.message}`));
  }

  const upcoming = events.filter((e) => eventEnd(e) > now);
  if (!upcoming.length && !calendarErrors.length) {
    box.append(h('p', { class: 'muted' }, 'Nothing on the calendar. Free time! 🎈'));
  }

  const groups = new Map();
  for (const e of upcoming) {
    // Multi-day all-day events show on today if they started earlier.
    const start = eventStart(e) < now ? now : eventStart(e);
    const label = dayLabel(start);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(e);
  }

  for (const [label, list] of groups) {
    box.append(h('div', {},
      h('div', { class: 'day-label' }, label),
      list.map((e) => {
        const who = kidsForEvent(e);
        const start = eventStart(e);
        const time = e.allDay ? 'All day' : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const meta = [e.location, e.calendarLabel].filter(Boolean).join(' · ');
        return h('div', { class: 'event', style: { '--cal': who[0]?.color || e.color } },
          h('div', { class: 'event-time' }, time),
          h('div', { class: 'event-body' },
            h('div', { class: 'event-title' }, e.title),
            meta ? h('div', { class: 'event-meta' }, meta) : null,
          ),
          who.length ? h('div', { class: 'event-who', title: who.map((k) => k.name).join(', ') }, who.map((k) => k.emoji).join('')) : null,
        );
      }),
    ));
  }
  renderNextUp();
}

function renderNextUp() {
  const bar = document.getElementById('nextUp');
  const now = new Date();
  const next = events.find((e) => !e.allDay && eventStart(e) > now && eventStart(e) - now < 12 * 3_600_000);
  if (!next) { bar.hidden = true; return; }
  const mins = Math.round((eventStart(next) - now) / 60_000);
  const when = mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} hr ${mins % 60 ? `${mins % 60} min` : ''}`;
  const who = kidsForEvent(next).map((k) => k.emoji).join(' ');
  bar.textContent = `⏰ Next up ${when}: ${who ? `${who} ` : ''}${next.title}${next.location ? ` @ ${next.location}` : ''}`;
  bar.hidden = false;
}

// ---------- facts ----------
function renderFacts() {
  const box = document.getElementById('facts');
  box.replaceChildren();
  const groups = AGE_GROUPS.map((g) => ({ ...g, kids: state.kids.filter((k) => ageGroupFor(k.age).id === g.id) }))
    .filter((g) => g.kids.length);
  if (!groups.length) groups.push({ ...AGE_GROUPS[1], kids: [] });

  for (const g of groups) {
    const fact = factOfTheDay(g.id, new Date(), factOffsets[g.id] || 0);
    box.append(h('div', { class: 'fact' },
      h('div', { class: 'fact-for' }, g.kids.length ? `For ${g.kids.map((k) => `${k.emoji} ${k.name}`).join(' & ')}` : g.label),
      h('div', { class: 'fact-text' }, h('span', { class: 'fact-emoji' }, fact.emoji), fact.text),
      h('button', {
        class: 'fact-more',
        onclick: () => { factOffsets[g.id] = (factOffsets[g.id] || 0) + 1; renderFacts(); },
      }, 'Tell me another! 🔄'),
    ));
  }
}

// ---------- parent area ----------
const dialog = document.getElementById('parentDialog');
const content = document.getElementById('parentContent');
let parent = null; // { pin, data, tab }

document.getElementById('parentBtn').addEventListener('click', () => {
  parent = null;
  renderPinPad();
  dialog.showModal();
});
dialog.addEventListener('close', () => { parent = null; content.replaceChildren(); });

function dialogHead(title) {
  return h('div', { class: 'dialog-head' },
    h('h2', {}, title),
    h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: () => dialog.close() }, '✕'));
}

function renderPinPad() {
  let pin = '';
  const display = h('div', { class: 'pin-display' }, ' ');
  const error = h('div', { class: 'error' });
  const update = () => { display.textContent = '•'.repeat(pin.length) || ' '; };
  const submit = async () => {
    try {
      const data = await api('/api/admin/login', { method: 'POST', body: { pin } });
      parent = { pin, data, tab: 'kids' };
      renderParent();
    } catch (err) {
      error.textContent = err.message === 'Wrong PIN' ? 'Oops, wrong PIN. Try again!' : err.message;
      pin = ''; update();
    }
  };
  const key = (label, fn) => h('button', { type: 'button', onclick: fn }, label);
  content.replaceChildren(
    dialogHead('🔒 Grown-ups only'),
    h('p', { class: 'help', style: { textAlign: 'center' } }, 'Enter the parent PIN (default is 1234 — change it in Settings).'),
    display,
    h('div', { class: 'pinpad' },
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => key(n, () => { if (pin.length < 8) { pin += n; update(); error.textContent = ''; } })),
      key('⌫', () => { pin = pin.slice(0, -1); update(); }),
      key(0, () => { if (pin.length < 8) { pin += '0'; update(); } }),
      key('✓', submit),
    ),
    error,
  );
}

function renderParent() {
  const tabs = [['kids', '👧 Kids'], ['chores', '🧹 Chores'], ['calendars', '📅 Calendars'], ['settings', '⚙️ Settings']];
  const body = h('div');
  content.replaceChildren(
    dialogHead('Parent Settings'),
    h('div', { class: 'tabs', role: 'tablist' },
      tabs.map(([id, label]) => h('button', {
        role: 'tab', 'aria-selected': String(parent.tab === id),
        onclick: () => { parent.tab = id; renderParent(); },
      }, label))),
    body,
    h('div', { class: 'error', id: 'saveError' }),
    h('div', { class: 'actions' },
      h('button', { class: 'btn', onclick: () => dialog.close() }, 'Cancel'),
      h('button', { class: 'btn primary', onclick: saveParent }, 'Save'),
    ),
  );
  ({ kids: renderKidsEditor, chores: renderChoresEditor, calendars: renderCalendarsEditor, settings: renderSettingsEditor })[parent.tab](body);
}

const bind = (obj, key, transform = (v) => v) => (e) => { obj[key] = transform(e.target.value); };

function renderKidsEditor(body) {
  const { kids } = parent.data;
  body.append(
    h('p', { class: 'help' }, 'Age picks which facts each kid sees. Put a kid\'s name in calendar event titles (like "Maya – Soccer") to tag the event with their emoji.'),
    h('div', { class: 'rows' }, kids.map((k, i) => h('div', { class: 'row' },
      h('input', { class: 'w-emoji', value: k.emoji, 'aria-label': 'Emoji', oninput: bind(k, 'emoji') }),
      h('input', { class: 'grow', value: k.name, placeholder: 'Name', 'aria-label': 'Name', oninput: bind(k, 'name') }),
      h('label', {}, 'Age ', h('input', { class: 'w-num', type: 'number', min: 3, max: 18, value: k.age, oninput: bind(k, 'age', Number) })),
      h('input', { type: 'color', value: k.color, 'aria-label': 'Color', oninput: bind(k, 'color') }),
      h('button', {
        class: 'btn danger', onclick: () => {
          if (!confirm(`Remove ${k.name} and their chores?`)) return;
          kids.splice(i, 1);
          parent.data.chores = parent.data.chores.filter((c) => c.kidId !== k.id);
          renderParent();
        },
      }, 'Remove'),
    ))),
    h('div', { class: 'actions' }, h('button', {
      class: 'btn', onclick: () => {
        const palette = ['#4f8cff', '#ff7a59', '#22b573', '#b05cff', '#ffb020', '#ff5c8a'];
        kids.push({ id: crypto.randomUUID(), name: 'New kid', age: 8, emoji: '⭐', color: palette[kids.length % palette.length] });
        renderParent();
      },
    }, '+ Add kid')),
  );
}

function renderChoresEditor(body) {
  const { kids, chores } = parent.data;
  if (!kids.length) { body.append(h('p', { class: 'help' }, 'Add a kid first.')); return; }
  body.append(h('p', { class: 'help' }, 'Pick the days each chore shows up. Points become ⭐ stars.'));
  for (const kid of kids) {
    body.append(h('h3', {}, `${kid.emoji} ${kid.name}`));
    body.append(h('div', { class: 'rows' }, chores.filter((c) => c.kidId === kid.id).map((c) => h('div', { class: 'row' },
      h('input', { class: 'w-emoji', value: c.emoji, 'aria-label': 'Emoji', oninput: bind(c, 'emoji') }),
      h('input', { class: 'grow', value: c.title, placeholder: 'Chore', 'aria-label': 'Chore', oninput: bind(c, 'title') }),
      h('label', {}, '⭐ ', h('input', { class: 'w-num', type: 'number', min: 0, max: 100, value: c.points, oninput: bind(c, 'points', Number) })),
      h('div', { class: 'days' }, DAY_NAMES.map((d, i) => h('label', { title: d },
        h('input', {
          type: 'checkbox', checked: c.days.includes(i),
          onchange: (e) => { c.days = e.target.checked ? [...c.days, i].sort() : c.days.filter((x) => x !== i); },
        }), d.slice(0, 2)))),
      h('button', { class: 'btn danger', onclick: () => { chores.splice(chores.indexOf(c), 1); renderParent(); } }, 'Remove'),
    ))));
    body.append(h('div', { class: 'actions' }, h('button', {
      class: 'btn', onclick: () => {
        chores.push({ id: crypto.randomUUID(), kidId: kid.id, title: '', emoji: '✅', points: 1, days: [0, 1, 2, 3, 4, 5, 6] });
        renderParent();
      },
    }, `+ Chore for ${kid.name}`)));
  }
}

function renderCalendarsEditor(body) {
  const cals = parent.data.settings.calendars;
  body.append(
    h('div', { class: 'help' },
      h('p', {}, h('b', {}, 'How to connect a Google Calendar:')),
      h('ol', {},
        h('li', {}, 'On a computer, open calendar.google.com.'),
        h('li', {}, 'Hover the calendar under "My calendars" → ⋮ → Settings and sharing.'),
        h('li', {}, 'Scroll to "Integrate calendar" and copy the "Secret address in iCal format".'),
        h('li', {}, 'Paste it below. Tip: make a separate "Kids Activities" calendar for practices.'),
      ),
      h('p', {}, 'The secret address stays on this device and is never shown on the dashboard.'),
    ),
    h('div', { class: 'rows' }, cals.map((c, i) => h('div', { class: 'row' },
      h('input', { type: 'color', value: c.color || '#7c5cff', 'aria-label': 'Color', oninput: bind(c, 'color') }),
      h('input', { class: 'w-num', style: { width: '160px' }, value: c.label, placeholder: 'Label', 'aria-label': 'Label', oninput: bind(c, 'label') }),
      h('input', { class: 'grow', value: c.url, placeholder: 'https://calendar.google.com/calendar/ical/…/basic.ics', 'aria-label': 'iCal URL', oninput: bind(c, 'url') }),
      h('button', { class: 'btn danger', onclick: () => { cals.splice(i, 1); renderParent(); } }, 'Remove'),
    ))),
    h('div', { class: 'actions' }, h('button', {
      class: 'btn', onclick: () => { cals.push({ label: 'Practices', url: '', color: '#7c5cff' }); renderParent(); },
    }, '+ Add calendar')),
  );
}

function renderSettingsEditor(body) {
  const s = parent.data.settings;
  body.append(
    h('label', { class: 'field' }, 'Family name',
      h('input', { value: s.familyName, oninput: bind(s, 'familyName') })),
    h('label', { class: 'field' }, 'Show calendar events for the next … days',
      h('input', { type: 'number', min: 1, max: 31, value: s.daysAhead, oninput: bind(s, 'daysAhead', Number) })),
    h('label', { class: 'field' }, 'New parent PIN (4–8 digits, leave blank to keep)',
      h('input', { type: 'password', inputMode: 'numeric', pattern: '\\d{4,8}', autocomplete: 'new-password', value: s.newPin || '', oninput: bind(s, 'newPin') })),
    h('label', { class: 'field' }, 'Theme',
      h('select', { onchange: (e) => setTheme(e.target.value) },
        ['auto', 'light', 'dark'].map((t) => h('option', { value: t, selected: currentTheme() === t }, t[0].toUpperCase() + t.slice(1))))),
    h('p', { class: 'help' }, 'Theme is saved on this device only.'),
  );
}

async function saveParent() {
  const err = document.getElementById('saveError');
  const s = parent.data.settings;
  if (s.newPin && !/^\d{4,8}$/.test(s.newPin)) { err.textContent = 'PIN must be 4–8 digits.'; return; }
  try {
    await api('/api/admin/state', { method: 'PUT', pin: parent.pin, body: parent.data });
    dialog.close();
    await loadState();
    loadCalendar(true);
  } catch (e) {
    err.textContent = e.message;
  }
}

// ---------- theme (per device) ----------
function currentTheme() {
  try { return localStorage.getItem('theme') || 'auto'; } catch { return 'auto'; }
}
function setTheme(t) {
  try { localStorage.setItem('theme', t); } catch { /* private mode */ }
  applyTheme();
}
function applyTheme() {
  const t = currentTheme();
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

// ---------- boot ----------
async function loadState() {
  state = await api('/api/state');
  renderAll();
}

function renderAll() {
  renderClock();
  renderKids();
  renderAgenda();
  renderFacts();
}

applyTheme();
await loadState();
loadCalendar();
setInterval(renderClock, 10_000);
setInterval(renderNextUp, 60_000);
setInterval(() => loadCalendar(), 10 * 60_000);
// Pick up changes made on other devices (e.g. a parent's phone).
setInterval(() => { if (!dialog.open) loadState().catch(() => {}); }, 60_000);
