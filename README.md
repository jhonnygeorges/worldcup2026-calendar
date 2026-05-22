# World Cup 2026 Calendar Subscription

A self-updating `.ics` calendar file containing all FIFA World Cup 2026 matches. Subscribe once in Google Calendar and it automatically stays up to date as scores come in.

**Subscribe URL:**
```
https://<your-github-username>.github.io/worldcup2026-calendar/worldcup2026.ics
```

---

## How to run the generator locally

Requires Node.js 18+.

```bash
node src/generate.js
```

This fetches the latest match data from [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) and writes `docs/worldcup2026.ics`.

---

## How to deploy / redeploy

1. Push `docs/worldcup2026.ics` to `main`.
2. In your GitHub repo → **Settings → Pages**, set Source to **Deploy from a branch**, branch `main`, folder `/docs`.
3. GitHub Pages will serve the file at `https://<username>.github.io/worldcup2026-calendar/worldcup2026.ics`.

The GitHub Actions workflow (`.github/workflows/update.yml`) runs every 6 hours automatically. It regenerates the `.ics` and commits any changes. You can also trigger it manually from **Actions → Update World Cup 2026 Calendar → Run workflow**.

---

## How to subscribe in Google Calendar

1. Open [Google Calendar](https://calendar.google.com).
2. In the left sidebar, click **Other calendars → From URL**.
3. Paste your subscribe URL and click **Add calendar**.
4. Google Calendar polls the URL periodically (typically every 12–24 hours) and syncs any updates.

> **Tip:** Google Calendar's refresh interval can be slow (~24h). For faster updates during match days, you can re-add the calendar or use a calendar app that lets you set a custom refresh interval (e.g. Apple Calendar with a 1-hour refresh).

---

## Data source

Match schedule and results are sourced from [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) — free, open public domain, no API key required. Scores are added by the community typically within 1–2 hours of each match ending.
