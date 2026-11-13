// Dates locales au format AAAA-MM-JJ, semaines du lundi au dimanche.

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAYS_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const pad = (n) => String(n).padStart(2, '0');
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseYmd(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export const weekKey = (d) => ymd(mondayOf(d));
export const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function parseMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

export function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - yearStart) / 86400000 + 1) / 7);
}

export const daysBetween = (a, b) => Math.round((parseYmd(ymd(b)) - parseYmd(ymd(a))) / 86400000);

export const fmtLong = (d) => `${cap(DAYS[d.getDay()])} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const fmtShort = (d) => `${DAYS_SHORT[d.getDay()]} ${d.getDate()}`;
export const fmtDayMonth = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
export const fmtMonth = (d) => `${cap(MONTHS[d.getMonth()])} ${d.getFullYear()}`;
export const monthName = (d) => cap(MONTHS[d.getMonth()]);

export function weekRangeLabel(monday) {
  const sunday = addDays(monday, 6);
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()} – ${sunday.getDate()} ${MONTHS_SHORT[sunday.getMonth()]}`;
  }
  return `${fmtDayMonth(monday)} – ${fmtDayMonth(sunday)}`;
}

export const lastDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
