// Sync status shown on the Settings page. Written by the shell's data events.

export const status = { limited: false, syncedAt: null };

export function ago(t, now = Date.now()) {
  const m = Math.round((now - t) / 60000);
  if (m < 1) return 'just now';
  if (m === 1) return '1 minute ago';
  if (m < 60) return m + ' minutes ago';
  const h = Math.round(m / 60);
  return h === 1 ? '1 hour ago' : h + ' hours ago';
}

export function describeStatus(s, now = Date.now()) {
  const lines = [];
  if (s.limited) lines.push(['warn', 'GitHub is busy, try again later']);
  else lines.push(['ok', 'Connected']);
  lines.push(['muted', s.syncedAt ? 'Last synced ' + ago(s.syncedAt, now) : 'Not synced yet']);
  return lines;
}
