// Barème d'XP, séries et rangs. Tout est calculé à partir des données, rien n'est stocké.

import { addDays, mondayOf, parseYmd, today, weekKey, ymd, monthKey, parseMonth, addMonths } from './dates.js';
import { getDay, getMonth, getState, getWeek, isOn } from './store.js';

export const XP = {
  mobility: 10, steps: 20, kcal: 20, water: 10, sleep: 10, session: 40, checkin: 10, fullDay: 10,
  allSessions: 30, weight: 10, video: 20, review: 50, rehab: 0,
  habit: 5
};
// Routines du jour, dans l'ordre d'affichage. Une routine désactivée ne compte plus.
export const DAY_KEYS = ['mobility', 'steps', 'kcal', 'water', 'sleep', 'session', 'checkin'];

export function dayMax() {
  const on = DAY_KEYS.filter(isOn);
  return on.reduce((a, k) => a + XP[k], 0) + (on.length ? XP.fullDay : 0);
}

export function weekMax() {
  return (isOn('session') ? XP.allSessions : 0) + (isOn('weight') ? XP.weight : 0)
    + (isOn('video') ? XP.video : 0) + (isOn('review') ? XP.review : 0);
}

// Tranches de sommeil : on garde une valeur en heures pour les moyennes.
export const SLEEP_BANDS = [
  { v: 5.5, label: '− 6 h' },
  { v: 6.5, label: '6-7 h' },
  { v: 7.5, label: '7-8 h' },
  { v: 8.5, label: '8 h +' }
];
export function sleepBand(h) {
  if (h == null) return null;
  return h < 6 ? 0 : h < 7 ? 1 : h < 8 ? 2 : 3;
}

export const RANKS = [
  { name: 'Kōhai', xp: 0 },
  { name: 'Senpai', xp: 1500 },
  { name: 'Samouraï', xp: 5000 },
  { name: 'Shōgun', xp: 12000 },
  { name: 'Oni', xp: 25000 }
];

// Une habitude perso compte pour une période si elle existait à ce moment-là.
export function habitActiveOn(h, dateKey) {
  return h.createdAt <= dateKey && (!h.archivedAt || h.archivedAt > dateKey);
}

export function stepsXp(steps, target) {
  if (!steps || !target) return 0;
  const perK = XP.steps / Math.max(1, target / 1000);
  return Math.min(XP.steps, Math.round(Math.floor(steps / 1000) * perK));
}

export function dayScore(key) {
  const s = getState();
  const t = s.targets;
  const d = getDay(key);
  const checks = {
    mobility: !!d.mobility,
    steps: d.steps != null && d.steps >= t.steps,
    kcal: d.kcal != null && d.kcal >= t.kcalMin && d.kcal <= t.kcalMax,
    water: d.water >= t.water,
    sleep: d.sleep != null,
    session: d.session === 'done' || d.session === 'rest',
    checkin: d.fatigue != null
  };
  const earned = {
    mobility: checks.mobility ? XP.mobility : 0,
    steps: stepsXp(d.steps, t.steps),
    kcal: checks.kcal ? XP.kcal : 0,
    water: checks.water ? XP.water : 0,
    sleep: checks.sleep ? XP.sleep : 0,
    session: checks.session ? XP.session : 0,
    checkin: checks.checkin ? XP.checkin : 0
  };
  const on = DAY_KEYS.filter(isOn);
  const parts = {};
  DAY_KEYS.forEach((k) => { parts[k] = isOn(k) ? earned[k] : 0; });
  const complete = on.length > 0 && on.every((k) => checks[k]);
  const base = Object.values(parts).reduce((a, b) => a + b, 0) + (complete ? XP.fullDay : 0);
  const habits = s.habits.filter((h) => h.rhythm === 'day' && habitActiveOn(h, key));
  const habitXp = habits.filter((h) => d.habits[h.id]).length * XP.habit;
  return { day: d, checks, parts, complete, base, habitXp, total: base + habitXp };
}

export function sessionsOfWeek(wKey) {
  const monday = parseYmd(wKey);
  const done = [];
  for (let i = 0; i < 7; i++) {
    const k = ymd(addDays(monday, i));
    if (getDay(k).session === 'done') done.push(k);
  }
  return done;
}

export function plannedSessions(wKey) {
  const w = getWeek(wKey);
  return w.sessions != null ? w.sessions : getState().targets.sessions;
}

export function weekScore(wKey) {
  const s = getState();
  const w = getWeek(wKey);
  const planned = plannedSessions(wKey);
  const done = sessionsOfWeek(wKey).length;
  const parts = {
    allSessions: isOn('session') && planned > 0 && done >= planned ? XP.allSessions : 0,
    weight: isOn('weight') && w.weight != null ? XP.weight : 0,
    video: isOn('video') && w.video ? XP.video : 0,
    review: isOn('review') && w.sentAt ? XP.review : 0
  };
  const sunday = ymd(addDays(parseYmd(wKey), 6));
  const habits = s.habits.filter((h) => h.rhythm === 'week' && habitActiveOn(h, sunday));
  const habitXp = habits.filter((h) => w.habits[h.id]).length * XP.habit;
  const base = Object.values(parts).reduce((a, b) => a + b, 0);
  return { week: w, planned, done, parts, base, habitXp, total: base + habitXp };
}

export function monthScore(mKey) {
  const s = getState();
  const m = getMonth(mKey);
  const lastDay = ymd(addMonths(parseMonth(mKey), 1));
  const habits = s.habits.filter((h) => h.rhythm === 'month' && habitActiveOn(h, lastDay));
  const habitXp = habits.filter((h) => m.habits[h.id]).length * XP.habit;
  return { month: m, habitXp, total: habitXp };
}

export function totalXp() {
  const s = getState();
  let sum = 0;
  Object.keys(s.days).forEach((k) => { sum += dayScore(k).total; });
  Object.keys(s.weeks).forEach((k) => { sum += weekScore(k).base + weekScore(k).habitXp; });
  // Les séances cochées sans ligne de semaine comptent aussi pour le bonus « toutes faites ».
  const weeksWithSessions = new Set(Object.keys(s.days).map((k) => weekKey(parseYmd(k))));
  weeksWithSessions.forEach((wk) => { if (!s.weeks[wk]) sum += weekScore(wk).total; });
  Object.keys(s.months).forEach((k) => { sum += monthScore(k).total; });
  return sum;
}

export function rankOf(xp) {
  let i = 0;
  RANKS.forEach((r, idx) => { if (xp >= r.xp) i = idx; });
  const rank = RANKS[i];
  const next = RANKS[i + 1] || null;
  const pct = next ? (xp - rank.xp) / (next.xp - rank.xp) : 1;
  return { index: i, rank, next, pct, toNext: next ? next.xp - xp : 0 };
}

// Série : jours complets d'affilée. Un joker par semaine couvre un jour raté.
// Aujourd'hui ne casse pas la série tant que la journée n'est pas finie.
export function streaks() {
  const s = getState();
  const start = parseYmd(s.createdAt);
  const end = today();
  let run = 0;
  let best = 0;
  let jokerWeek = null;
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const key = ymd(d);
    const wk = weekKey(d);
    if (dayScore(key).complete) {
      run += 1;
    } else if (key === ymd(end)) {
      // journée en cours
    } else if (run > 0 && jokerWeek !== wk) {
      jokerWeek = wk;
    } else {
      run = 0;
    }
    best = Math.max(best, run);
  }
  return { current: run, best, jokerLeft: jokerWeek !== weekKey(end) ? 1 : 0 };
}

export function weekKeyOfToday() {
  return ymd(mondayOf(today()));
}

export function currentMonthKey() {
  return monthKey(today());
}
