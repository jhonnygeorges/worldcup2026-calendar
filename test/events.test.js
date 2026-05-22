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
    assert.equal(ev.summary, 'QF-1: France vs Brazil');
  });

  it('builds knockout summary with TBD teams using human-readable labels', () => {
    const [ev] = buildEvents([KNOCKOUT_TBD], new Map(), NOW);
    assert.equal(ev.summary, 'R32-1: Group A Winner vs Group B Runner-up');
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
    assert.ok(ev.description.includes('Score: 2\u20131 (USA wins)'));
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
