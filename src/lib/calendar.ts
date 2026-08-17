// Calendar helpers: expand recurring + one-off events into concrete occurrences,
// and group/sort them for the schedule UI. Pure functions, no UI — safe to unit
// reason about and import from Astro frontmatter.

export type Category =
  | 'training'
  | 'local'
  | 'state'
  | 'national'
  | 'international';

export interface CalendarEntry {
  id: string;
  title: string;
  category: Category;
  start?: string;
  end?: string;
  time?: string;
  endTime?: string;
  location?: string;
  info?: string;
  url?: string;
  recurrence?: {
    freq: 'weekly';
    days: string[];
    from: string;
    until?: string;
  };
}

export interface Occurrence {
  id: string;
  title: string;
  category: Category;
  /** Local date, normalized to midnight. */
  date: Date;
  time?: string;
  endTime?: string;
  location?: string;
  info?: string;
  url?: string;
  isRecurring: boolean;
  /** Stable key so a recurring series keeps the same DOM id per date. */
  instanceId: string;
}

export const CATEGORY_META: Record<
  Category,
  { label: string; short: string }
> = {
  training: { label: 'Training', short: 'Train' },
  local: { label: 'Local', short: 'Local' },
  state: { label: 'State', short: 'State' },
  national: { label: 'National', short: 'Nat' },
  international: { label: 'International', short: 'Intl' },
};

const WEEKDAY_OFFSET: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Parse a YYYY-MM-DD string as a local Date at midnight (no UTC shift). */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(t?: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hr}${period}` : `${hr}:${String(m).padStart(2, '0')}${period}`;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  });
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/**
 * Expand a single entry into one or more dated occurrences up to `horizon`.
 * - Recurring: every matching weekday from `from` (inclusive) until `until`
 *   or the horizon, whichever is earlier.
 * - One-off: the single `start` date, or every day of a `start`..`end` range.
 */
export function expandEntry(entry: CalendarEntry, horizon: Date): Occurrence[] {
  const out: Occurrence[] = [];
  const h = startOfDay(horizon);

  if (entry.recurrence) {
    const { days, from, until } = entry.recurrence;
    const start = startOfDay(parseDate(from));
    const end = until ? startOfDay(parseDate(until)) : h;
    const last = end < h ? end : h;
    const targets = new Set(days.map((d) => WEEKDAY_OFFSET[d]));
    let cursor = new Date(start);
    // Guard against runaway loops.
    for (let i = 0; i < 10_000 && cursor <= last; i++) {
      if (targets.has(cursor.getDay())) {
        out.push({
          id: entry.id,
          title: entry.title,
          category: entry.category,
          date: new Date(cursor),
          time: entry.time,
          endTime: entry.endTime,
          location: entry.location,
          info: entry.info,
          url: entry.url,
          isRecurring: true,
          instanceId: `${entry.id}__${cursor.toISOString().slice(0, 10)}`,
        });
      }
      cursor = addDays(cursor, 1);
    }
    return out;
  }

  if (entry.start) {
    const s = startOfDay(parseDate(entry.start));
    const e = entry.end ? startOfDay(parseDate(entry.end)) : s;
    let cursor = new Date(s);
    for (let i = 0; i < 10_000 && cursor <= e; i++) {
      out.push({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        date: new Date(cursor),
        time: entry.time,
        endTime: entry.endTime,
        location: entry.location,
        info: entry.info,
        url: entry.url,
        isRecurring: false,
        instanceId: `${entry.id}__${cursor.toISOString().slice(0, 10)}`,
      });
      cursor = addDays(cursor, 1);
    }
  }
  return out;
}

export function expandAll(entries: CalendarEntry[], horizon: Date): Occurrence[] {
  return entries
    .flatMap((e) => expandEntry(e, horizon))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Group occurrences by month key, preserving chronological order. */
export function groupByMonth(occ: Occurrence[]): [string, Occurrence[]][] {
  const map = new Map<string, Occurrence[]>();
  for (const o of occ) {
    const k = monthKey(o.date);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(o);
  }
  return [...map.entries()];
}

export function buildMonthGrid(
  year: number,
  month: number,
): { date: Date; inMonth: boolean; key: string }[] {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const gridStart = addDays(first, -startDow);
  const cells: { date: Date; inMonth: boolean; key: string }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    cells.push({
      date: d,
      inMonth: d.getMonth() === month,
      key: monthKey(d),
    });
  }
  return cells;
}
