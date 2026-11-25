const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const naira = (n: number) =>
  '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number) {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  c.setDate(c.getDate() + n);
  return c;
}

export function daysUntil(iso: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseISO(iso).getTime() - today.getTime()) / 86400000);
}

export function upcomingDates(count: number, startOffset = 1) {
  const base = new Date();
  return Array.from({ length: count }, (_, i) => toISO(addDays(base, startOffset + i)));
}

export function formatDate(iso: string) {
  const d = parseISO(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatDateLong(iso: string) {
  const d = parseISO(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function chipDate(iso: string) {
  const d = parseISO(iso);
  return { dow: DAYS[d.getDay()], day: String(d.getDate()), month: MONTHS[d.getMonth()] };
}

export function formatStamp(isoTimestamp: string) {
  const d = new Date(isoTimestamp);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
