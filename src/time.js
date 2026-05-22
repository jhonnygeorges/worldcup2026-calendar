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
