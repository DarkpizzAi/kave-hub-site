// Countdown maths for the home page. The move-in moment is written in the
// private repo as Madrid wall-clock time; everything here works in UTC
// milliseconds so summer and winter time cannot skew the count.

const ZONE = 'Europe/Madrid';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

// "30/09/2027 09:00" or "2027-09-30 09:00" anywhere in the text; null without both a date and a time.
export function parseMoveIn(text) {
  let m = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (m) return { y: +m[3], mo: +m[2], d: +m[1], h: +m[4], mi: +m[5] };
  m = text.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (m) return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] };
  return null;
}

// How far Madrid's wall clock is ahead of UTC at this instant.
function offsetMs(utcMs) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(utcMs)).map(x => [x.type, x.value]));
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return wall - Math.floor(utcMs / 1000) * 1000;
}

// Madrid wall-clock parts -> UTC milliseconds. Two passes settle the offset
// on the two days a year when it changes.
export function madridToUtc({ y, mo, d, h, mi }) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = guess - offsetMs(guess);
  return guess - offsetMs(first);
}

export function remaining(nowMs, targetMs) {
  const total = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: targetMs <= nowMs,
  };
}

const pad = n => String(n).padStart(2, '0');

export function formatMoveIn({ y, mo, d, h, mi }) {
  return `${d} ${MONTHS[mo - 1]} ${y}, ${pad(h)}:${pad(mi)}`;
}
