// Tiny JSON-file store. Good enough for one household on one device.
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const DEFAULT_STATE = {
  settings: {
    familyName: 'Our Family',
    parentPin: '1234',
    // Each entry: { id, label, url, color }
    // url is the Google Calendar "Secret address in iCal format".
    calendars: [],
    daysAhead: 7,
  },
  // Each kid: { id, name, age, color, emoji }
  kids: [
    { id: 'kid-1', name: 'Kid One', age: 7, color: '#4f8cff', emoji: '🦊' },
    { id: 'kid-2', name: 'Kid Two', age: 11, color: '#ff7a59', emoji: '🐢' },
  ],
  // Each chore: { id, kidId, title, emoji, points, days: [0..6] } (0 = Sunday)
  chores: [
    { id: 'c1', kidId: 'kid-1', title: 'Make your bed', emoji: '🛏️', points: 1, days: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'c2', kidId: 'kid-1', title: 'Feed the pet', emoji: '🐶', points: 2, days: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'c3', kidId: 'kid-1', title: 'Pack your backpack', emoji: '🎒', points: 1, days: [0, 1, 2, 3, 4] },
    { id: 'c4', kidId: 'kid-2', title: 'Make your bed', emoji: '🛏️', points: 1, days: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'c5', kidId: 'kid-2', title: 'Unload the dishwasher', emoji: '🍽️', points: 2, days: [1, 3, 5] },
    { id: 'c6', kidId: 'kid-2', title: 'Take out the trash', emoji: '🗑️', points: 3, days: [2] },
    { id: 'c7', kidId: 'kid-2', title: '20 minutes of reading', emoji: '📚', points: 2, days: [0, 1, 2, 3, 4, 5, 6] },
  ],
  // { "YYYY-MM-DD": { [choreId]: true } }
  completions: {},
};

export class Store {
  constructor(file) {
    this.file = file;
    this.state = null;
    this.writing = Promise.resolve();
  }

  async load() {
    try {
      const saved = JSON.parse(await readFile(this.file, 'utf8'));
      this.state = {
        ...structuredClone(DEFAULT_STATE),
        ...saved,
        settings: { ...DEFAULT_STATE.settings, ...saved.settings },
      };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      this.state = structuredClone(DEFAULT_STATE);
      await this.save();
    }
    return this.state;
  }

  // Serialize writes and write atomically so a crash can't corrupt the file.
  save() {
    this.writing = this.writing.then(async () => {
      await mkdir(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      await writeFile(tmp, JSON.stringify(this.state, null, 2));
      await rename(tmp, this.file);
    });
    return this.writing;
  }

  // State safe to send to the kiosk: no PIN, no secret calendar URLs.
  publicState() {
    const { settings, kids, chores, completions } = this.state;
    return {
      settings: {
        familyName: settings.familyName,
        daysAhead: settings.daysAhead,
        calendars: settings.calendars.map(({ id, label, color }) => ({ id, label, color })),
      },
      kids,
      chores,
      completions,
    };
  }

  // Full state for the parent screen (still omits the PIN itself).
  adminState() {
    const { parentPin, ...settings } = this.state.settings;
    return { ...this.state, settings };
  }

  async toggleChore(date, choreId, done) {
    if (!this.state.chores.some((c) => c.id === choreId)) throw new Error('Unknown chore');
    const day = (this.state.completions[date] ??= {});
    if (done) day[choreId] = true;
    else delete day[choreId];
    if (!Object.keys(day).length) delete this.state.completions[date];
    this.pruneCompletions();
    await this.save();
  }

  // Keep ~60 days of history so the file doesn't grow forever.
  pruneCompletions() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    for (const key of Object.keys(this.state.completions)) {
      if (key < cutoffKey) delete this.state.completions[key];
    }
  }

  async updateAdmin({ settings = {}, kids, chores }) {
    const s = this.state.settings;
    if (typeof settings.familyName === 'string') s.familyName = settings.familyName.trim().slice(0, 60) || s.familyName;
    if (Number.isInteger(settings.daysAhead)) s.daysAhead = Math.min(Math.max(settings.daysAhead, 1), 31);
    if (typeof settings.newPin === 'string' && /^\d{4,8}$/.test(settings.newPin)) s.parentPin = settings.newPin;
    if (Array.isArray(settings.calendars)) {
      s.calendars = settings.calendars
        .filter((c) => c && typeof c.url === 'string' && /^(https?|webcal):\/\//i.test(c.url.trim()))
        .map((c) => ({
          id: c.id || randomUUID(),
          label: String(c.label || 'Calendar').slice(0, 40),
          url: c.url.trim().replace(/^webcal:/i, 'https:'),
          color: normalizeColor(c.color, '#7c5cff'),
        }));
    }
    if (Array.isArray(kids)) {
      this.state.kids = kids.map((k) => ({
        id: k.id || randomUUID(),
        name: String(k.name || 'Kid').slice(0, 30),
        age: clampInt(k.age, 3, 18, 8),
        color: normalizeColor(k.color, '#4f8cff'),
        emoji: String(k.emoji || '⭐').slice(0, 8),
      }));
    }
    if (Array.isArray(chores)) {
      const kidIds = new Set(this.state.kids.map((k) => k.id));
      this.state.chores = chores
        .filter((c) => kidIds.has(c.kidId) && String(c.title || '').trim())
        .map((c) => ({
          id: c.id || randomUUID(),
          kidId: c.kidId,
          title: String(c.title).trim().slice(0, 60),
          emoji: String(c.emoji || '✅').slice(0, 8),
          points: clampInt(c.points, 0, 100, 1),
          days: [...new Set((c.days || []).map(Number).filter((d) => d >= 0 && d <= 6))].sort(),
        }));
    }
    await this.save();
  }
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
}

function normalizeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
}
