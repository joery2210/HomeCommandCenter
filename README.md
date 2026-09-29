# 🏠 Home Command Center

A kid-friendly family dashboard for a wall tablet, old iPad, or kitchen laptop:

- **✅ Chores**: each kid gets a colorful card of today's chores. Tap to check a chore off, earn ⭐ stars, and get a confetti party when everything's done. Chores can repeat on any days of the week.
- **📅 Coming Up**: upcoming practices, lessons, and games pulled from Google Calendar. Weekly repeating events, skipped weeks, and moved events are all handled. When an event title has a kid's name in it, the event shows that kid's emoji and color. A "Next up in 45 min" banner shows what's next.
- **💡 Fact of the Day**: a new fact every day for each age group: Little Explorers (≤6), Curious Kids (7–10), and Big Thinkers (11+). Kids can tap "Tell me another!" for more.
- **🔒 Parent settings**, protected by a PIN: add kids, edit chores, connect calendars, and change the PIN.

## Quick start

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm start
```

Open <http://localhost:3000>. To open it from a tablet on the same Wi-Fi, use `http://<computer-ip>:3000`. In the tablet's browser, choose **Add to Home Screen** so it runs full-screen like an app.

Tap ⚙️ and enter the default PIN **1234**. Then:

1. **Kids**: set names, ages (ages control which facts show), emojis, and colors.
2. **Chores**: add chores, choose the days they repeat, and set star values.
3. **Calendars**: paste your Google Calendar's secret iCal address (steps below).
4. **Settings**: **change the PIN!**

## Connecting Google Calendar

1. On a computer, open [calendar.google.com](https://calendar.google.com).
2. Next to the calendar under **My calendars**, click ⋮ → **Settings and sharing**.
3. Under **Integrate calendar**, copy the **Secret address in iCal format**.
4. Paste it into ⚙️ → Calendars.

Tips:
- Make a dedicated **"Kids Activities"** calendar so the dashboard doesn't show grown-up meetings.
- Put the kid's name in event titles, like `Maya – Soccer Practice`, to tag events with their emoji.
- Google can take a few hours to publish changes to the iCal feed. The dashboard itself refreshes every 10 minutes.
- The secret address is stored only on the server (`data/db.json`). The dashboard never sends it to the browser.

## Adding your own facts

Edit `public/facts.js` and add entries to any age group:

```js
{ emoji: '🦕', text: 'Your fact here.' },
```

## Running it all the time

On a Raspberry Pi or always-on computer, a process manager like `pm2` keeps it running:

```bash
npm install -g pm2
pm2 start server.js --name command-center
pm2 save && pm2 startup
```

Environment variables: `PORT` (default `3000`), `HOST` (default `0.0.0.0`), `DATA_FILE` (default `data/db.json`).

> This is meant for your home network. The PIN keeps kids out of the settings, but it is not internet-grade security, so don't expose the app directly to the internet.

## Development

```bash
npm run dev   # restarts on file changes
npm test      # unit tests (calendar expansion + storage)
```

Project layout:

```
server.js          HTTP server + JSON API (no framework)
lib/store.js       JSON-file storage for kids, chores, completions, settings
lib/calendar.js    iCal fetching + recurring event expansion (node-ical)
public/            The dashboard (vanilla JS, no build step)
  facts.js         Fact-of-the-day library
test/              node:test unit tests
```
