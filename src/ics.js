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
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const parts = [];
  let offset = 0;
  let first = true;
  while (offset < bytes.length) {
    const limit = first ? 75 : 74;
    let end = offset + limit;
    if (end >= bytes.length) {
      end = bytes.length;
    } else {
      // Back up to avoid splitting a multibyte UTF-8 sequence
      while (end > offset && (bytes[end] & 0xC0) === 0x80) end--;
    }
    parts.push(bytes.slice(offset, end).toString('utf8'));
    offset = end;
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
