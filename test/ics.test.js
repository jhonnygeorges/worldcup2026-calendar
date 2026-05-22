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
