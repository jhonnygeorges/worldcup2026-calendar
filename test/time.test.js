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
