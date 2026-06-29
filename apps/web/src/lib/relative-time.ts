/**
 * Relative + absolute time helpers for the dashboard.
 */
export function relativeTime(input: string | number | Date | null | undefined): string {
  if (!input) return 'never';
  const date = input instanceof Date ? input : new Date(input);
  const ms = date.getTime();
  if (Number.isNaN(ms)) return 'unknown';
  const diff = Date.now() - ms;
  const abs = Math.abs(diff);
  const future = diff < 0;

  const units: [number, string][] = [
    [60_000, 'minute'],
    [3_600_000, 'hour'],
    [86_400_000, 'day'],
    [604_800_000, 'week'],
    [2_592_000_000, 'month'],
    [31_536_000_000, 'year'],
  ];

  if (abs < 45_000) return 'just now';
  let value = abs / 60_000;
  let unit = 'minute';
  for (let i = 0; i < units.length; i++) {
    const [threshold, name] = units[i]!;
    const next = units[i + 1];
    if (!next || abs < next[0]) {
      value = abs / threshold;
      unit = name;
      break;
    }
  }
  const rounded = Math.floor(value);
  const label = `${rounded} ${unit}${rounded === 1 ? '' : 's'}`;
  return future ? `in ${label}` : `${label} ago`;
}

export function formatDateTime(input: string | number | Date | null | undefined): string {
  if (!input) return 'N/A';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Online if last-seen within `windowMs` (default 5 min). */
export function isOnline(
  lastSeen: string | number | Date | null | undefined,
  windowMs = 300_000,
): boolean {
  if (!lastSeen) return false;
  const date = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
  return !Number.isNaN(date.getTime()) && Date.now() - date.getTime() < windowMs;
}
