// Pulls events from Google Calendar "secret iCal" URLs and expands recurring
// events (weekly practices, etc.) into individual upcoming instances.
import ical from 'node-ical';

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map(); // url -> { fetchedAt, events }

export async function fetchCalendarText(url) {
  const res = await fetch(url, { headers: { Accept: 'text/calendar' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Calendar responded ${res.status}`);
  return res.text();
}

async function loadCalendar(url, { fetchText = fetchCalendarText, force = false } = {}) {
  const hit = cache.get(url);
  if (!force && hit && Date.now() - hit.fetchedAt < CACHE_MS) return hit.data;
  const data = ical.sync.parseICS(await fetchText(url));
  cache.set(url, { fetchedAt: Date.now(), data });
  return data;
}

export function clearCalendarCache() {
  cache.clear();
}

// Returns events whose time overlaps [from, to), sorted by start.
export function expandEvents(parsed, from, to) {
  const out = [];
  for (const item of Object.values(parsed)) {
    if (item.type !== 'VEVENT' || item.status === 'CANCELLED') continue;
    // Modified single instances of a recurring series are handled via
    // the parent's `recurrences`, so skip stray override entries.
    if (item.recurrenceid && !item.rrule) continue;

    let instances;
    try {
      instances = ical.expandRecurringEvent(item, { from, to, expandOngoing: true });
    } catch {
      continue; // one malformed event shouldn't take down the whole calendar
    }
    for (const inst of instances) {
      const start = new Date(inst.start);
      const end = new Date(inst.end ?? inst.start);
      if (end <= from || start >= to) continue;
      const source = inst.event ?? item;
      if (source.status === 'CANCELLED') continue;
      out.push({
        id: `${item.uid}-${start.getTime()}`,
        title: text(inst.summary ?? source.summary) || 'Busy',
        location: text(source.location ?? item.location),
        allDay: Boolean(inst.isFullDay),
        start: inst.isFullDay ? localDateKey(start) : start.toISOString(),
        end: inst.isFullDay ? localDateKey(end) : end.toISOString(),
        sortKey: start.getTime(),
      });
    }
  }
  return out.sort((a, b) => a.sortKey - b.sortKey || a.title.localeCompare(b.title));
}

export async function getUpcomingEvents(calendars, daysAhead, opts = {}) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + daysAhead);

  const errors = [];
  const results = await Promise.all(
    calendars.map(async (cal) => {
      try {
        const parsed = await loadCalendar(cal.url, opts);
        return expandEvents(parsed, from, to).map((e) => ({
          ...e,
          calendarId: cal.id,
          calendarLabel: cal.label,
          color: cal.color,
        }));
      } catch (err) {
        errors.push({ calendarId: cal.id, label: cal.label, message: err.message });
        return [];
      }
    }),
  );

  const events = results.flat().sort((a, b) => a.sortKey - b.sortKey);
  return { events: events.map(({ sortKey, ...e }) => e), errors };
}

function text(value) {
  if (value == null) return '';
  if (typeof value === 'object' && 'val' in value) return String(value.val).trim();
  return String(value).trim();
}

function localDateKey(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
