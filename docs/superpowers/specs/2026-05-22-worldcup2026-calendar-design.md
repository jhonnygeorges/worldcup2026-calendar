# World Cup 2026 Calendar Subscription — Design Spec

**Date:** 2026-05-22  
**Status:** Approved

---

## Overview

A Node.js script that fetches the World Cup 2026 match schedule and results from the openfootball public JSON dataset, generates a valid RFC 5545 `.ics` calendar file, and writes it to `docs/worldcup2026.ics`. GitHub Pages serves the file at a stable URL. A GitHub Actions workflow re-runs the script every 6 hours and auto-commits changes, keeping Google Calendar subscriptions up to date throughout the tournament.

---

## Data Source

**openfootball/worldcup.json**  
URL: `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`

- No API key required; open public domain
- 96 matches: group stage + full knockout bracket
- Fields per match: `round`, `date`, `time` (e.g. `"13:00 UTC-6"`), `team1`, `team2`, `group`, `ground` (city string)
- `score.ft` array (`[home, away]`) added by community as matches complete; absent for unplayed matches
- Knockout teams start as coded refs (`"1A"` = Group A winner, `"W73"` = winner of match 73) and resolve to real names as the tournament progresses

---

## Project Structure

```
worldcup2026-calendar/
├── src/
│   └── generate.js            # Main script: fetch → transform → write ICS
├── docs/
│   └── worldcup2026.ics       # Output; served by GitHub Pages
│   └── superpowers/
│       └── specs/
│           └── 2026-05-22-worldcup2026-calendar-design.md
├── .github/
│   └── workflows/
│       └── update.yml         # Scheduled + manual dispatch job
├── package.json
└── README.md
```

---

## Data Flow

1. `generate.js` fetches the openfootball JSON via Node's built-in `fetch` (Node 18+, zero runtime deps)
2. Iterates the `matches` array in order; each match's 0-based array index is used to derive a stable UID
3. Parses the `time` field (regex: `HH:MM UTC±H`) and converts to UTC for `DTSTART`
4. `DTEND` = `DTSTART` + 150 minutes
5. Looks up the `ground` city string in a hardcoded venue map to get the full stadium name + location string
6. Constructs the event title, description, and optional score line
7. Writes a single `VCALENDAR` block with all `VEVENT` entries to `docs/worldcup2026.ics`

---

## ICS Event Fields

| ICS Field | Value |
|---|---|
| `UID` | `wc2026-match-001@worldcup2026ics` (1-based, zero-padded to 3 digits) |
| `DTSTART` | Kickoff in UTC, format `YYYYMMDDTHHmmssZ` |
| `DTEND` | Kickoff + 150 min in UTC |
| `DTSTAMP` | Script run time in UTC |
| `LAST-MODIFIED` | Script run time in UTC |
| `SEQUENCE` | Per-event; incremented only when that event's data changes; 0 on first write |
| `SUMMARY` | See title logic below |
| `LOCATION` | Stadium name and city (from venue map) |
| `DESCRIPTION` | Round, group, stadium, city; score appended once available |

### Title Logic

- **Group stage (teams known):** `Group A: Mexico vs South Africa`
- **Knockout (teams known):** `QF1: France vs Brazil`
- **Knockout (teams TBD):** `Round of 32 - Match 49` (coded refs like `1A`, `W73` replaced with human-readable labels)

### Score in Description

When `score.ft` is present:
- Win: `Score: 2–1 (Mexico wins)`
- Draw: `Score: 1–1 (Draw)`

### Knockout Round Labels

| Code prefix | Label |
|---|---|
| `Matchday 1/2/3` | Group stage |
| `Round of 32` | Round of 32 |
| `Round of 16` | Round of 16 |
| `Quarter-final` | QF + sequential number |
| `Semi-final` | SF1 / SF2 |
| `Match for third place` | 3rd Place |
| `Final` | Final |

---

## Venue Map

Hardcoded lookup from `ground` city string → stadium name + display location:

| ground value | Display |
|---|---|
| `Mexico City` | Estadio Azteca, Mexico City |
| `Monterrey` | Estadio BBVA, Monterrey |
| `Guadalajara` | Estadio Akron, Guadalajara |
| `Vancouver` | BC Place, Vancouver |
| `Toronto` | BMO Field, Toronto |
| `Dallas (Arlington)` | AT&T Stadium, Arlington (Dallas) |
| `Los Angeles (Inglewood)` | SoFi Stadium, Inglewood (Los Angeles) |
| `San Francisco Bay Area (Santa Clara)` | Levi's Stadium, Santa Clara (Bay Area) |
| `Las Vegas` | Allegiant Stadium, Las Vegas |
| `Kansas City` | Arrowhead Stadium, Kansas City |
| `Denver` | Empower Field at Mile High, Denver |
| `Seattle` | Lumen Field, Seattle |
| `Boston (Foxborough)` | Gillette Stadium, Foxborough (Boston) |
| `New York/New Jersey (East Rutherford)` | MetLife Stadium, East Rutherford (NYC) |
| `Philadelphia` | Lincoln Financial Field, Philadelphia |
| `Miami (Miami Gardens)` | Hard Rock Stadium, Miami Gardens |
| `Houston` | NRG Stadium, Houston |
| `Atlanta` | Mercedes-Benz Stadium, Atlanta |
| `Charlotte` | Bank of America Stadium, Charlotte |

---

## SEQUENCE Handling

On each run, the script reads the existing `docs/worldcup2026.ics` (if it exists) and extracts the current `SEQUENCE` value for each UID. If a match's data has changed (score added, team name resolved), the SEQUENCE is incremented by 1. Unchanged events keep their current SEQUENCE. This satisfies RFC 5545 and ensures calendar clients like Google Calendar apply updates correctly.

---

## GitHub Actions Workflow

**File:** `.github/workflows/update.yml`

**Triggers:**
- `schedule`: `cron: '0 */6 * * *'` (every 6 hours)
- `workflow_dispatch` (manual run)

**Steps:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` with Node 20
3. `npm ci`
4. `node src/generate.js`
5. `stefanzweifel/git-auto-commit-action@v5` — commits `docs/worldcup2026.ics` only if changed, with message `chore: update worldcup2026.ics [skip ci]`

No secrets required.

---

## GitHub Pages

- Source: `docs/` folder on `main` branch
- Subscription URL: `https://<username>.github.io/worldcup2026-calendar/worldcup2026.ics`
- Must be enabled in repo Settings → Pages → Source: `docs/` on `main`

---

## Error Handling

- If the fetch fails, the script exits with a non-zero code (Actions job fails visibly; existing `.ics` is not overwritten)
- If `time` field cannot be parsed, the match is skipped with a console warning
- If `ground` is not in the venue map, the raw `ground` value is used as the location fallback

---

## Dependencies

- Runtime: none (uses Node 18+ built-in `fetch`)
- Dev: none
- `package.json` scripts: `"generate": "node src/generate.js"`
