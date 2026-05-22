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
