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
        roundLabel = `${shortLabel}-${roundCounters[shortLabel]}`;
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
