import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { buildEvents } from './events.js';
import { buildVcalendar, parseExistingSequences } from './ics.js';
import { parseKickoffUtc } from './time.js';

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

  const parseableMatches = matches.filter((m, i) => {
    try {
      parseKickoffUtc(m.date, m.time);
      return true;
    } catch {
      console.warn(`Skipping match #${i + 1} ${m.date ?? 'unknown'} (${m.team1 ?? '?'} vs ${m.team2 ?? '?'}): unparseable time "${m.time}"`);
      return false;
    }
  });

  const existing = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : '';
  const seqMap = parseExistingSequences(existing);

  const now = new Date();
  const events = buildEvents(parseableMatches, seqMap, now);
  const icsContent = buildVcalendar(events);

  writeFileSync(OUT_PATH, icsContent, 'utf8');
  console.log(`Written ${events.length} events to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
