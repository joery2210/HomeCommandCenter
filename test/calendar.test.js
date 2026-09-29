import { test } from 'node:test';
import assert from 'node:assert/strict';
import ical from 'node-ical';
import { expandEvents, getUpcomingEvents, clearCalendarCache } from '../lib/calendar.js';

// Weekly Tuesday soccer with one skipped week and one moved week,
// a one-off game, an all-day event, and a cancelled event.
const ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//test//EN
BEGIN:VEVENT
UID:soccer@test
DTSTART:20260901T220000Z
DTEND:20260901T233000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
EXDATE:20260915T220000Z
SUMMARY:Maya Soccer Practice
LOCATION:Field 3
END:VEVENT
BEGIN:VEVENT
UID:soccer@test
RECURRENCE-ID:20260922T220000Z
DTSTART:20260923T220000Z
DTEND:20260923T233000Z
SUMMARY:Maya Soccer Practice (moved)
END:VEVENT
BEGIN:VEVENT
UID:game@test
DTSTART:20260919T150000Z
DTEND:20260919T160000Z
SUMMARY:Leo Basketball Game
END:VEVENT
BEGIN:VEVENT
UID:allday@test
DTSTART;VALUE=DATE:20260918
DTEND;VALUE=DATE:20260919
SUMMARY:No School
END:VEVENT
BEGIN:VEVENT
UID:cancel@test
DTSTART:20260917T150000Z
DTEND:20260917T160000Z
STATUS:CANCELLED
SUMMARY:Cancelled thing
END:VEVENT
END:VCALENDAR`;

const parsed = ical.sync.parseICS(ICS);

test('expands weekly practices, honoring EXDATE and moved instances', () => {
  const events = expandEvents(parsed, new Date('2026-09-07T00:00:00Z'), new Date('2026-09-28T00:00:00Z'));
  const soccer = events.filter((e) => e.title.startsWith('Maya Soccer'));
  assert.deepEqual(soccer.map((e) => e.start), [
    '2026-09-08T22:00:00.000Z',
    '2026-09-23T22:00:00.000Z', // moved from the 22nd; the 15th is skipped
  ]);
  assert.equal(soccer[1].title, 'Maya Soccer Practice (moved)');
  assert.equal(soccer[0].location, 'Field 3');
});

test('includes one-off and all-day events, skips cancelled, sorts by start', () => {
  const events = expandEvents(parsed, new Date('2026-09-17T00:00:00Z'), new Date('2026-09-21T00:00:00Z'));
  assert.deepEqual(events.map((e) => e.title), ['No School', 'Leo Basketball Game']);
  const allDay = events[0];
  assert.equal(allDay.allDay, true);
  assert.equal(allDay.start, '2026-09-18');
});

test('getUpcomingEvents reports a broken calendar without failing the others', async () => {
  clearCalendarCache();
  const fetchText = async (url) => {
    if (url.includes('bad')) throw new Error('boom');
    return ICS;
  };
  const { events, errors } = await getUpcomingEvents(
    [
      { id: 'a', label: 'Good', url: 'https://good.example/cal.ics', color: '#111111' },
      { id: 'b', label: 'Bad', url: 'https://bad.example/cal.ics', color: '#222222' },
    ],
    7,
    { fetchText },
  );
  assert.equal(errors.length, 1);
  assert.equal(errors[0].label, 'Bad');
  assert.ok(events.every((e) => e.calendarId === 'a' && e.color === '#111111'));
});
