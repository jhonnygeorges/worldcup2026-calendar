# World Cup 2026 Calendar Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a self-updating `worldcup2026.ics` calendar file from the openfootball public JSON, hosted on GitHub Pages, auto-refreshed every 6 hours via GitHub Actions.

**Architecture:** A Node.js CLI script (`src/generate.js`) fetches match data, transforms it into RFC 5545 events via focused helper modules, and writes `docs/worldcup2026.ics`. A GitHub Actions workflow runs every 6 hours, commits any changes, and GitHub Pages serves the file at a stable URL.

**Tech Stack:** Node.js 18+ (built-in `fetch`, `node:test`, `node:crypto`, `node:fs`), zero npm runtime dependencies.

---

## File Map

| File | Responsibility |
|---|---|
| `src/venues.js` | Map openfootball `ground` strings → stadium name + city |
| `src/time.js` | Parse `"HH:MM UTC±H"` + ISO date → UTC `Date` |
| `src/ics.js` | Format dates, escape text, fold lines, build VEVENT/VCALENDAR, parse existing SEQUENCE data |
| `src/events.js` | Transform raw match objects → typed event objects (title, description, score, UID, SEQUENCE) |
| `src/generate.js` | Entry point: fetch JSON, read existing ICS, build events, write file |
| `test/venues.test.js` | Unit tests for venue lookup |
| `test/time.test.js` | Unit tests for time parsing |
| `test/ics.test.js` | Unit tests for ICS formatting and SEQUENCE parsing |
| `test/events.test.js` | Unit tests for match→event transformation |
| `.github/workflows/update.yml` | Scheduled + manual GitHub Actions job |
| `docs/worldcup2026.ics` | Output file (placeholder on first commit) |
| `README.md` | Setup, run, deploy, subscribe instructions |

---

## Task 1: Scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `docs/worldcup2026.ics` (placeholder)
- Create: `test/` (empty dir)

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "worldcup2026-calendar",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "generate": "node src/generate.js",
    "test": "node --test"
  },
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2: Write `.gitignore`**

```
node_modules/
.env
```

- [ ] **Step 3: Create `docs/worldcup2026.ics` placeholder**

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//worldcup2026ics//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:FIFA World Cup 2026
END:VCALENDAR
```

- [ ] **Step 4: Create `test/` directory**

```bash
mkdir -p test
```

- [ ] **Step 5: Verify Node version**

```bash
node --version
```

Expected: `v18.x.x` or higher.

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore docs/worldcup2026.ics
git commit -m "chore: scaffold project"
```

---

## Task 2: Venue Lookup (`src/venues.js`)

**Files:**
- Create: `src/venues.js`
- Create: `test/venues.test.js`

- [ ] **Step 1: Write failing test**

Create `test/venues.test.js`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lookupVenue } from '../src/venues.js';

describe('lookupVenue', () => {
  it('returns stadium name for known ground', () => {
    assert.equal(lookupVenue('Mexico City'), 'Estadio Azteca, Mexico City');
  });

  it('returns stadium for US city', () => {
    assert.equal(lookupVenue('Los Angeles (Inglewood)'), 'SoFi Stadium, Inglewood (Los Angeles)');
  });

  it('falls back to raw ground string for unknown value', () => {
    assert.equal(lookupVenue('Unknown City'), 'Unknown City');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/venues.test.js
```

Expected: FAIL — `Cannot find module '../src/venues.js'`

- [ ] **Step 3: Write `src/venues.js`**

```js
const VENUES = {
  'Mexico City': 'Estadio Azteca, Mexico City',
  'Monterrey': 'Estadio BBVA, Monterrey',
  'Guadalajara': 'Estadio Akron, Guadalajara',
  'Vancouver': 'BC Place, Vancouver',
  'Toronto': 'BMO Field, Toronto',
  'Dallas (Arlington)': 'AT&T Stadium, Arlington (Dallas)',
  'Los Angeles (Inglewood)': 'SoFi Stadium, Inglewood (Los Angeles)',
  'San Francisco Bay Area (Santa Clara)': "Levi's Stadium, Santa Clara (Bay Area)",
  'Las Vegas': 'Allegiant Stadium, Las Vegas',
  'Kansas City': 'Arrowhead Stadium, Kansas City',
  'Denver': 'Empower Field at Mile High, Denver',
  'Seattle': 'Lumen Field, Seattle',
  'Boston (Foxborough)': 'Gillette Stadium, Foxborough (Boston)',
  'New York/New Jersey (East Rutherford)': 'MetLife Stadium, East Rutherford (NYC)',
  'Philadelphia': 'Lincoln Financial Field, Philadelphia',
  'Miami (Miami Gardens)': 'Hard Rock Stadium, Miami Gardens',
  'Houston': 'NRG Stadium, Houston',
  'Atlanta': 'Mercedes-Benz Stadium, Atlanta',
  'Charlotte': 'Bank of America Stadium, Charlotte',
};

export function lookupVenue(ground) {
  return VENUES[ground] ?? ground;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/venues.test.js
```

Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/venues.js test/venues.test.js
git commit -m "feat: add venue lookup map"
```

---

## Task 3: Time Parser (`src/time.js`)

**Files:**
- Create: `src/time.js`
- Create: `test/time.test.js`

- [ ] **Step 1: Write failing test**

Create `test/time.test.js`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseKickoffUtc } from '../src/time.js';

describe('parseKickoffUtc', () => {
  it('converts UTC-6 time to UTC', () => {
    // 13:00 UTC-6 → 19:00 UTC
    const result = parseKickoffUtc('2026-06-11', '13:00 UTC-6');
    assert.equal(result.toISOString(), '2026-06-11T19:00:00.000Z');
  });

  it('converts UTC-4 time to UTC', () => {
    // 16:00 UTC-4 → 20:00 UTC
    const result = parseKickoffUtc('2026-06-12', '16:00 UTC-4');
    assert.equal(result.toISOString(), '2026-06-12T20:00:00.000Z');
  });

  it('converts UTC+0 time unchanged', () => {
    const result = parseKickoffUtc('2026-07-01', '20:00 UTC+0');
    assert.equal(result.toISOString(), '2026-07-01T20:00:00.000Z');
  });

  it('converts UTC-7 time handling day rollover', () => {
    // 22:00 UTC-7 → 05:00 next day UTC
    const result = parseKickoffUtc('2026-06-15', '22:00 UTC-7');
    assert.equal(result.toISOString(), '2026-06-16T05:00:00.000Z');
  });

  it('throws on unparseable time string', () => {
    assert.throws(() => parseKickoffUtc('2026-06-11', 'TBD'), /Unparseable time/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/time.test.js
```

Expected: FAIL — `Cannot find module '../src/time.js'`

- [ ] **Step 3: Write `src/time.js`**

```js
/**
 * Parse an openfootball time string + ISO date into a UTC Date.
 * @param {string} dateStr  e.g. "2026-06-11"
 * @param {string} timeStr  e.g. "13:00 UTC-6"
 * @returns {Date}
 */
export function parseKickoffUtc(dateStr, timeStr) {
  const m = timeStr.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+(?:\.\d+)?)$/);
  if (!m) throw new Error(`Unparseable time: ${timeStr}`);
  const localH = parseInt(m[1], 10);
  const localM = parseInt(m[2], 10);
  const offsetH = parseFloat(m[3]);
  // UTC = local - offset  (e.g. 13:00 UTC-6 → 13 - (-6) = 19:00 UTC)
  const utcMinutes = localH * 60 + localM - offsetH * 60;
  const base = new Date(dateStr + 'T00:00:00Z');
  return new Date(base.getTime() + utcMinutes * 60 * 1000);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/time.test.js
```

Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/time.js test/time.test.js
git commit -m "feat: add kickoff time parser"
```

---

## Task 4: ICS Utilities (`src/ics.js`)

**Files:**
- Create: `src/ics.js`
- Create: `test/ics.test.js`

- [ ] **Step 1: Write failing test**

Create `test/ics.test.js`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, escapeText, buildVcalendar, parseExistingSequences } from '../src/ics.js';

describe('formatDate', () => {
  it('formats a UTC date to ICS format', () => {
    const d = new Date('2026-06-11T19:00:00Z');
    assert.equal(formatDate(d), '20260611T190000Z');
  });
});

describe('escapeText', () => {
  it('escapes backslashes', () => {
    assert.equal(escapeText('a\\b'), 'a\\\\b');
  });

  it('escapes semicolons', () => {
    assert.equal(escapeText('a;b'), 'a\\;b');
  });

  it('escapes commas', () => {
    assert.equal(escapeText('a,b'), 'a\\,b');
  });

  it('escapes newlines', () => {
    assert.equal(escapeText('a\nb'), 'a\\nb');
  });
});

describe('buildVcalendar', () => {
  it('wraps events in VCALENDAR block with CRLF line endings', () => {
    const events = [{
      uid: 'wc2026-match-001@worldcup2026ics',
      dtstart: new Date('2026-06-11T19:00:00Z'),
      dtend: new Date('2026-06-11T21:30:00Z'),
      dtstamp: new Date('2026-05-22T12:00:00Z'),
      lastModified: new Date('2026-05-22T12:00:00Z'),
      summary: 'Group A: Mexico vs South Africa',
      location: 'Estadio Azteca, Mexico City',
      description: 'Round: Matchday 1\nGroup: A',
      sequence: 0,
      hash: 'abc12345',
    }];
    const result = buildVcalendar(events);
    assert.ok(result.startsWith('BEGIN:VCALENDAR\r\n'));
    assert.ok(result.includes('BEGIN:VEVENT\r\n'));
    assert.ok(result.includes('UID:wc2026-match-001@worldcup2026ics\r\n'));
    assert.ok(result.includes('DTSTART:20260611T190000Z\r\n'));
    assert.ok(result.includes('SEQUENCE:0\r\n'));
    assert.ok(result.endsWith('END:VCALENDAR\r\n'));
  });
});

describe('parseExistingSequences', () => {
  it('returns empty map for empty string', () => {
    assert.equal(parseExistingSequences('').size, 0);
  });

  it('extracts UID, sequence, and hash from existing ICS', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:wc2026-match-001@worldcup2026ics',
      'SEQUENCE:3',
      'X-WC2026-HASH:abc12345',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const map = parseExistingSequences(ics);
    assert.equal(map.size, 1);
    const entry = map.get('wc2026-match-001@worldcup2026ics');
    assert.equal(entry.sequence, 3);
    assert.equal(entry.hash, 'abc12345');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/ics.test.js
```

Expected: FAIL — `Cannot find module '../src/ics.js'`

- [ ] **Step 3: Write `src/ics.js`**

```js
export function formatDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

export function escapeText(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldLine(line) {
  if (line.length <= 75) return line;
  const parts = [];
  let remaining = line;
  let first = true;
  while (remaining.length > 0) {
    const limit = first ? 75 : 74;
    parts.push(remaining.slice(0, limit));
    remaining = remaining.slice(limit);
    first = false;
  }
  return parts.join('\r\n ');
}

function buildVEvent(ev) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${formatDate(ev.dtstamp)}`,
    `DTSTART:${formatDate(ev.dtstart)}`,
    `DTEND:${formatDate(ev.dtend)}`,
    `SUMMARY:${escapeText(ev.summary)}`,
    `LOCATION:${escapeText(ev.location)}`,
    `DESCRIPTION:${escapeText(ev.description)}`,
    `LAST-MODIFIED:${formatDate(ev.lastModified)}`,
    `SEQUENCE:${ev.sequence}`,
    `X-WC2026-HASH:${ev.hash}`,
    'END:VEVENT',
  ];
  return lines.map(foldLine).join('\r\n');
}

export function buildVcalendar(events) {
  const parts = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//worldcup2026ics//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FIFA World Cup 2026',
    'X-WR-TIMEZONE:UTC',
    ...events.map(buildVEvent),
    'END:VCALENDAR',
  ];
  return parts.join('\r\n') + '\r\n';
}

/**
 * Parse an existing ICS string and return a Map of UID → { sequence, hash }.
 * Used to determine whether events have changed and need SEQUENCE incremented.
 * @param {string} icsContent
 * @returns {Map<string, {sequence: number, hash: string}>}
 */
export function parseExistingSequences(icsContent) {
  const map = new Map();
  if (!icsContent) return map;
  const blocks = icsContent.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const uid = (block.match(/\r?\nUID:(.+?)\r?\n/) ?? [])[1]?.trim();
    const seq = (block.match(/\r?\nSEQUENCE:(\d+)/) ?? [])[1];
    const hash = (block.match(/\r?\nX-WC2026-HASH:(.+?)\r?\n/) ?? [])[1]?.trim();
    if (uid) {
      map.set(uid, {
        sequence: seq ? parseInt(seq, 10) : 0,
        hash: hash ?? '',
      });
    }
  }
  return map;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/ics.test.js
```

Expected: 8 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/ics.js test/ics.test.js
git commit -m "feat: add ICS formatting utilities"
```

---

## Task 5: Match → Event Transformer (`src/events.js`)

**Files:**
- Create: `src/events.js`
- Create: `test/events.test.js`

- [ ] **Step 1: Write failing test**

Create `test/events.test.js`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildEvents } from '../src/events.js';

const NOW = new Date('2026-05-22T12:00:00Z');

const GROUP_MATCH = {
  round: 'Matchday 1',
  date: '2026-06-11',
  time: '13:00 UTC-6',
  team1: 'Mexico',
  team2: 'South Africa',
  group: 'Group A',
  ground: 'Mexico City',
};

const KNOCKOUT_TBD = {
  round: 'Round of 32',
  date: '2026-06-29',
  time: '15:00 UTC-4',
  team1: '1A',
  team2: '2B',
  ground: 'New York/New Jersey (East Rutherford)',
};

const KNOCKOUT_KNOWN = {
  round: 'Quarter-finals',
  date: '2026-07-03',
  time: '18:00 UTC-4',
  team1: 'France',
  team2: 'Brazil',
  ground: 'Los Angeles (Inglewood)',
};

const SCORED_MATCH = {
  round: 'Matchday 1',
  date: '2026-06-11',
  time: '16:00 UTC-5',
  team1: 'USA',
  team2: 'England',
  group: 'Group B',
  ground: 'Dallas (Arlington)',
  score: { ft: [2, 1] },
};

describe('buildEvents', () => {
  it('generates correct UID from match index', () => {
    const [ev] = buildEvents([GROUP_MATCH], new Map(), NOW);
    assert.equal(ev.uid, 'wc2026-match-001@worldcup2026ics');
  });

  it('builds group stage summary', () => {
    const [ev] = buildEvents([GROUP_MATCH], new Map(), NOW);
    assert.equal(ev.summary, 'Group A: Mexico vs South Africa');
  });

  it('builds knockout summary with known teams', () => {
    const [ev] = buildEvents([KNOCKOUT_KNOWN], new Map(), NOW);
    assert.equal(ev.summary, 'QF1: France vs Brazil');
  });

  it('builds knockout summary with TBD teams using human-readable labels', () => {
    const [ev] = buildEvents([KNOCKOUT_TBD], new Map(), NOW);
    assert.equal(ev.summary, 'R321: Group A Winner vs Group B Runner-up');
  });

  it('converts kickoff to UTC and sets 150-min duration', () => {
    const [ev] = buildEvents([GROUP_MATCH], new Map(), NOW);
    assert.equal(ev.dtstart.toISOString(), '2026-06-11T19:00:00.000Z');
    assert.equal(ev.dtend.toISOString(), '2026-06-11T21:30:00.000Z');
  });

  it('looks up stadium name from ground', () => {
    const [ev] = buildEvents([GROUP_MATCH], new Map(), NOW);
    assert.equal(ev.location, 'Estadio Azteca, Mexico City');
  });

  it('includes score in description when available', () => {
    const [ev] = buildEvents([SCORED_MATCH], new Map(), NOW);
    assert.ok(ev.description.includes('Score: 2–1 (USA wins)'));
  });

  it('starts SEQUENCE at 0 for new event', () => {
    const [ev] = buildEvents([GROUP_MATCH], new Map(), NOW);
    assert.equal(ev.sequence, 0);
  });

  it('keeps SEQUENCE when event data unchanged', () => {
    const [ev] = buildEvents([GROUP_MATCH], new Map(), NOW);
    // Simulate re-run with same event already stored
    const seqMap = new Map([[ev.uid, { sequence: 2, hash: ev.hash }]]);
    const [ev2] = buildEvents([GROUP_MATCH], seqMap, NOW);
    assert.equal(ev2.sequence, 2);
  });

  it('increments SEQUENCE when event data changes', () => {
    const [ev] = buildEvents([GROUP_MATCH], new Map(), NOW);
    // Simulate stored state with old hash
    const seqMap = new Map([[ev.uid, { sequence: 1, hash: 'oldhash' }]]);
    const [ev2] = buildEvents([GROUP_MATCH], seqMap, NOW);
    assert.equal(ev2.sequence, 2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/events.test.js
```

Expected: FAIL — `Cannot find module '../src/events.js'`

- [ ] **Step 3: Write `src/events.js`**

```js
import { createHash } from 'node:crypto';
import { lookupVenue } from './venues.js';
import { parseKickoffUtc } from './time.js';
import { formatDate, escapeText } from './ics.js';

/** True if a team field is a coded placeholder like "1A" or "W73". */
function isTbd(team) {
  if (!team) return true;
  return /^[1-3][A-L]$/i.test(team) || /^[WL]\d+$/i.test(team);
}

function resolveTeamName(team) {
  if (!isTbd(team)) return team;
  const groupRef = team.match(/^([1-3])([A-L])$/i);
  if (groupRef) {
    const pos = { '1': 'Winner', '2': 'Runner-up', '3': '3rd Place' }[groupRef[1]] ?? `${groupRef[1]}th`;
    return `Group ${groupRef[2].toUpperCase()} ${pos}`;
  }
  const winnerRef = team.match(/^W(\d+)$/i);
  if (winnerRef) return `Winner of Match ${winnerRef[1]}`;
  const loserRef = team.match(/^L(\d+)$/i);
  if (loserRef) return `Loser of Match ${loserRef[1]}`;
  return 'TBD';
}

const ROUND_SHORT = {
  'Round of 32': 'R32',
  'Round of 16': 'R16',
  'Quarter-finals': 'QF',
  'Quarter-final': 'QF',
  'Semi-finals': 'SF',
  'Semi-final': 'SF',
  'Match for third place': '3rd Place',
  'Final': 'Final',
};

function buildSummary(match, roundLabel) {
  const t1 = resolveTeamName(match.team1);
  const t2 = resolveTeamName(match.team2);
  if (match.group) {
    const g = match.group.replace(/^Group\s+/i, '');
    return `Group ${g}: ${t1} vs ${t2}`;
  }
  return `${roundLabel}: ${t1} vs ${t2}`;
}

function buildScore(match) {
  if (!match.score?.ft) return null;
  const [h, a] = match.score.ft;
  const t1 = resolveTeamName(match.team1);
  const t2 = resolveTeamName(match.team2);
  if (h > a) return `${h}\u2013${a} (${t1} wins)`;
  if (a > h) return `${h}\u2013${a} (${t2} wins)`;
  return `${h}\u2013${a} (Draw)`;
}

function buildDescription(match, venue, score) {
  const lines = [`Round: ${match.round}`];
  if (match.group) lines.push(`Group: ${match.group.replace(/^Group\s+/i, '')}`);
  lines.push(`Venue: ${venue}`);
  if (score) lines.push(`Score: ${score}`);
  return lines.join('\n');
}

function computeHash(summary, dtstart, description) {
  return createHash('sha1')
    .update(`${summary}|${formatDate(dtstart)}|${escapeText(description)}`)
    .digest('hex')
    .slice(0, 8);
}

/**
 * Transform an array of openfootball match objects into ICS event objects.
 * @param {object[]} matches
 * @param {Map<string, {sequence: number, hash: string}>} seqMap - from parseExistingSequences
 * @param {Date} now - current timestamp for DTSTAMP / LAST-MODIFIED
 * @returns {object[]}
 */
export function buildEvents(matches, seqMap, now) {
  const roundCounters = {};
  return matches.map((match, i) => {
    const uid = `wc2026-match-${String(i + 1).padStart(3, '0')}@worldcup2026ics`;
    const dtstart = parseKickoffUtc(match.date, match.time);
    const dtend = new Date(dtstart.getTime() + 150 * 60 * 1000);
    const venue = lookupVenue(match.ground);

    // Determine round label for knockout event titles
    let roundLabel;
    const shortLabel = ROUND_SHORT[match.round];
    if (shortLabel && !match.group) {
      if (['R32', 'R16', 'QF', 'SF'].includes(shortLabel)) {
        roundCounters[shortLabel] = (roundCounters[shortLabel] ?? 0) + 1;
        roundLabel = `${shortLabel}${roundCounters[shortLabel]}`;
      } else {
        roundLabel = shortLabel;
      }
    } else {
      roundLabel = match.round;
    }

    const score = buildScore(match);
    const summary = buildSummary(match, roundLabel);
    const description = buildDescription(match, venue, score);
    const hash = computeHash(summary, dtstart, description);

    const existing = seqMap.get(uid);
    let sequence = existing?.sequence ?? 0;
    if (existing && existing.hash !== hash) sequence++;

    return { uid, dtstart, dtend, dtstamp: now, lastModified: now, summary, location: venue, description, sequence, hash };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/events.test.js
```

Expected: 10 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/events.js test/events.test.js
git commit -m "feat: add match-to-event transformer"
```

---

## Task 6: Main Generator Script (`src/generate.js`)

**Files:**
- Create: `src/generate.js`

No new test file — integration is verified by running the script end-to-end.

- [ ] **Step 1: Write `src/generate.js`**

```js
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { buildEvents } from './events.js';
import { buildVcalendar, parseExistingSequences } from './ics.js';

const DATA_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'docs', 'worldcup2026.ics');

async function main() {
  console.log('Fetching World Cup 2026 data...');
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const { matches } = await res.json();
  console.log(`Fetched ${matches.length} matches.`);

  const existing = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : '';
  const seqMap = parseExistingSequences(existing);

  const now = new Date();
  const events = buildEvents(matches, seqMap, now);
  const icsContent = buildVcalendar(events);

  writeFileSync(OUT_PATH, icsContent, 'utf8');
  console.log(`Written ${events.length} events to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run the script**

```bash
node src/generate.js
```

Expected output:
```
Fetching World Cup 2026 data...
Fetched 96 matches.
Written 96 events to .../docs/worldcup2026.ics
```

- [ ] **Step 3: Verify the output file**

```bash
head -30 docs/worldcup2026.ics
```

Expected: starts with `BEGIN:VCALENDAR`, contains `BEGIN:VEVENT`, `UID:wc2026-match-001@worldcup2026ics`, a valid `DTSTART`.

- [ ] **Step 4: Run again to verify SEQUENCE stays stable**

```bash
node src/generate.js
```

Then inspect one event's SEQUENCE — it should remain 0 (data hasn't changed between runs).

```bash
grep -A 12 'wc2026-match-001' docs/worldcup2026.ics
```

Expected: `SEQUENCE:0`

- [ ] **Step 5: Commit**

```bash
git add src/generate.js docs/worldcup2026.ics
git commit -m "feat: add main ICS generator script"
```

---

## Task 7: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/update.yml`

- [ ] **Step 1: Create workflow file**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/update.yml`:

```yaml
name: Update World Cup 2026 Calendar

on:
  schedule:
    - cron: '0 */6 * * *'   # Every 6 hours
  workflow_dispatch:          # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write         # Needed to push the auto-commit

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Generate ICS
        run: node src/generate.js

      - name: Commit changes if any
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: update worldcup2026.ics [skip ci]'
          file_pattern: 'docs/worldcup2026.ics'
```

- [ ] **Step 2: Verify YAML syntax**

```bash
node -e "
const fs = require('fs');
// Basic check: file exists and contains required fields
const c = fs.readFileSync('.github/workflows/update.yml', 'utf8');
['schedule','workflow_dispatch','actions/checkout','setup-node','generate.js','git-auto-commit-action'].forEach(k => {
  if (!c.includes(k)) throw new Error('Missing: ' + k);
});
console.log('YAML looks good');
"
```

Expected: `YAML looks good`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/update.yml
git commit -m "ci: add scheduled ICS update workflow"
```

---

## Task 8: README & Final Push

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
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
```

- [ ] **Step 2: Run all tests one final time**

```bash
node --test
```

Expected: All tests pass.

- [ ] **Step 3: Run the generator one final time to ensure docs/ is current**

```bash
node src/generate.js
```

- [ ] **Step 4: Final commit**

```bash
git add README.md docs/worldcup2026.ics
git commit -m "docs: add README with setup and subscribe instructions"
```

- [ ] **Step 5: Create GitHub repo and push**

```bash
# Create repo (requires GitHub CLI)
gh repo create worldcup2026-calendar --public --source=. --remote=origin --push

# Or if pushing to an existing remote:
git remote add origin https://github.com/<your-username>/worldcup2026-calendar.git
git push -u origin main
```

- [ ] **Step 6: Enable GitHub Pages**

Go to your repo on GitHub → **Settings → Pages → Source: Deploy from a branch → Branch: main → Folder: /docs → Save**.

Your subscribe URL will be:
```
https://<your-username>.github.io/worldcup2026-calendar/worldcup2026.ics
```

---

## Self-Review Checklist

- [x] Venue lookup map covers all 19 World Cup 2026 venues
- [x] Time parser handles UTC-6 through UTC-4 (US/Canada/Mexico venue offsets)
- [x] SEQUENCE increments only when event data changes (via SHA-1 hash comparison)
- [x] `X-WC2026-HASH` custom property stored per VEVENT for round-trip stability
- [x] Knockout TBD team names shown as human-readable labels, not raw codes
- [x] Score line appended to description once `score.ft` appears in source data
- [x] Duration hardcoded to 150 minutes (2.5 hours)
- [x] GitHub Actions has `contents: write` permission for auto-commit
- [x] `[skip ci]` in commit message prevents workflow re-triggering itself
- [x] Error path exits with code 1 and does not overwrite existing `.ics`
