const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MON = MONTHS.map((m) => m.slice(0, 3));

/** Parse 'YYYY-MM-DD' as a local date (no timezone shift). */
export function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function todayISO() {
  return toISO(new Date());
}

/** Thu, 17 Sep 2026 */
export function fmtLong(iso: string) {
  const d = parseISO(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

/** Thu 24 Sep */
export function fmtShort(iso: string) {
  const d = parseISO(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
}

/** 2 Sep 2026 */
export function fmtDate(iso: string) {
  const d = parseISO(iso);
  return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

export function isWeekend(iso: string) {
  const day = parseISO(iso).getDay();
  return day === 0 || day === 6;
}

/** Indian digit grouping: 150000 -> ₹1,50,000 */
export function inr(n: number) {
  const neg = n < 0;
  const s = String(Math.round(Math.abs(n)));
  let out = s;
  if (s.length > 3) {
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    out = `${rest},${last3}`;
  }
  return `${neg ? '-' : ''}₹${out}`;
}

/** Compact: 80000 -> ₹80K, 110000 -> ₹1.1L, 309000 -> ₹3.09L */
export function inrShort(n: number) {
  if (n >= 100000) return `₹${trim(n / 100000)}L`;
  if (n >= 1000) return `₹${trim(n / 1000)}K`;
  return `₹${n}`;
}

function trim(v: number) {
  return String(Math.round(v * 100) / 100);
}

/** '15:00' -> '3pm', '23:59' -> '11:59pm' */
export function fmtHour(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')}${suffix}` : `${h12}${suffix}`;
}

/** '15:00' -> '03:00 PM' */
export function fmtClock(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** 17 September 2026 */
export function fmtFull(iso: string) {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Digits only, for amount inputs. */
export const toNum = (v: string) => Number(v.replace(/[^0-9]/g, '')) || 0;
