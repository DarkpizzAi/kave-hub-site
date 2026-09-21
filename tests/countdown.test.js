import { test, eq } from './run.js';
import { parseMoveIn, madridToUtc, remaining, formatMoveIn } from '../js/countdown.js';

test('parseMoveIn reads day-first and ISO forms with a time', () => {
  eq(parseMoveIn('Move-in date: 30/09/2027 09:00 (Madrid time)'), { y: 2027, mo: 9, d: 30, h: 9, mi: 0 });
  eq(parseMoveIn('Move-in date: 2027-09-30 09:00'), { y: 2027, mo: 9, d: 30, h: 9, mi: 0 });
  eq(parseMoveIn('Move-in date: 5/1/2028 7:30'), { y: 2028, mo: 1, d: 5, h: 7, mi: 30 });
});

test('parseMoveIn returns null without a full date and time', () => {
  eq(parseMoveIn('Move-in date: soon'), null);
  eq(parseMoveIn('Move-in date: 30/09/2027'), null);
});

test('madridToUtc handles summer time, winter time and the switch days', () => {
  // 30 Sep 2027 is CEST (UTC+2): 09:00 in Madrid is 07:00 UTC
  eq(new Date(madridToUtc({ y: 2027, mo: 9, d: 30, h: 9, mi: 0 })).toISOString(), '2027-09-30T07:00:00.000Z');
  // 15 Jan 2027 is CET (UTC+1)
  eq(new Date(madridToUtc({ y: 2027, mo: 1, d: 15, h: 9, mi: 0 })).toISOString(), '2027-01-15T08:00:00.000Z');
  // 31 Oct 2027 09:00 is after the clocks went back: CET
  eq(new Date(madridToUtc({ y: 2027, mo: 10, d: 31, h: 9, mi: 0 })).toISOString(), '2027-10-31T08:00:00.000Z');
  // 28 Mar 2027 09:00 is after the clocks went forward: CEST
  eq(new Date(madridToUtc({ y: 2027, mo: 3, d: 28, h: 9, mi: 0 })).toISOString(), '2027-03-28T07:00:00.000Z');
});

test('remaining splits the gap into days, hours, minutes and seconds', () => {
  const t = Date.UTC(2027, 8, 30, 7, 0, 0);
  eq(remaining(t - ((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000), t),
    { days: 2, hours: 3, minutes: 4, seconds: 5, done: false });
  eq(remaining(t - 999, t), { days: 0, hours: 0, minutes: 0, seconds: 0, done: false });
});

test('remaining is done at and after the moment and never negative', () => {
  const t = Date.UTC(2027, 8, 30, 7, 0, 0);
  eq(remaining(t, t), { days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
  eq(remaining(t + 5000, t), { days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
});

test('formatMoveIn writes the date in words without locale help', () => {
  eq(formatMoveIn({ y: 2027, mo: 9, d: 30, h: 9, mi: 0 }), '30 September 2027, 09:00');
  eq(formatMoveIn({ y: 2028, mo: 1, d: 5, h: 7, mi: 5 }), '5 January 2028, 07:05');
});
