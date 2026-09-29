import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../lib/store.js';

async function freshStore() {
  const dir = await mkdtemp(join(tmpdir(), 'hcc-'));
  const store = new Store(join(dir, 'db.json'));
  await store.load();
  return store;
}

test('public state hides the PIN and secret calendar URLs', async () => {
  const store = await freshStore();
  await store.updateAdmin({ settings: { calendars: [{ label: 'Practices', url: 'webcal://calendar.google.com/secret.ics' }] } });
  const pub = store.publicState();
  assert.equal(pub.settings.parentPin, undefined);
  assert.equal(pub.settings.calendars[0].url, undefined);
  assert.equal(store.state.settings.calendars[0].url, 'https://calendar.google.com/secret.ics');
  assert.equal(store.adminState().settings.parentPin, undefined);
});

test('toggling chores persists to disk and cleans up empty days', async () => {
  const store = await freshStore();
  const date = new Date().toISOString().slice(0, 10);
  await store.toggleChore(date, 'c1', true);
  let saved = JSON.parse(await readFile(store.file, 'utf8'));
  assert.equal(saved.completions[date].c1, true);
  await store.toggleChore(date, 'c1', false);
  saved = JSON.parse(await readFile(store.file, 'utf8'));
  assert.equal(saved.completions[date], undefined);
  await assert.rejects(store.toggleChore(date, 'nope', true), /Unknown chore/);
});

test('removing a kid drops their chores; invalid input is sanitized', async () => {
  const store = await freshStore();
  await store.updateAdmin({
    kids: [{ id: 'kid-2', name: 'Leo', age: 99, color: 'red', emoji: '🐢' }],
    chores: store.state.chores,
    settings: { newPin: '12', daysAhead: 500 },
  });
  assert.deepEqual(store.state.kids, [{ id: 'kid-2', name: 'Leo', age: 18, color: '#4f8cff', emoji: '🐢' }]);
  assert.ok(store.state.chores.every((c) => c.kidId === 'kid-2'));
  assert.equal(store.state.settings.parentPin, '1234');
  assert.equal(store.state.settings.daysAhead, 31);
});
