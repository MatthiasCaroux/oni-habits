// Toutes les données restent sur le téléphone (localStorage).
// Pas de serveur pour l'instant : l'export JSON sert de sauvegarde.

import { today, ymd } from './dates.js';

const KEY = 'oni-habits:v1';

export const emptyDay = () => ({
  mobility: false,
  steps: null,
  kcal: null,
  water: 0,
  session: null, // 'done' | 'rest' | null
  sleep: null,
  fatigue: null,
  pain: null, // true | false | null (pas encore répondu)
  painZone: null,
  habits: {}
});

export const emptyWeek = () => ({
  sessions: null, // séances prévues, sinon objectif par défaut
  weight: null,
  video: false,
  rehab: false,
  sentAt: null, // bilan fait avec le coach (date de la case)
  habits: {}
});

export const emptyMonth = () => ({ coachPaid: false, paidAt: null, habits: {} });

// Routines de base, chacune activable ou non dans « Mes habitudes ».
export const ROUTINES = [
  { id: 'mobility', rhythm: 'day', name: 'Souplesse du matin', xp: '+10 XP' },
  { id: 'steps', rhythm: 'day', name: 'Pas', xp: '+20 XP' },
  { id: 'kcal', rhythm: 'day', name: 'Calories', xp: '+20 XP' },
  { id: 'water', rhythm: 'day', name: 'Eau', xp: '+10 XP' },
  { id: 'sleep', rhythm: 'day', name: 'Sommeil', xp: '+10 XP' },
  { id: 'session', rhythm: 'day', name: 'Séances', xp: '+40 XP' },
  { id: 'checkin', rhythm: 'day', name: 'Forme (fatigue, douleur)', xp: '+10 XP' },
  { id: 'weight', rhythm: 'week', name: 'Pesée', xp: '+10 XP' },
  { id: 'video', rhythm: 'week', name: 'Vidéos au coach', xp: '+20 XP' },
  { id: 'review', rhythm: 'week', name: 'Bilan avec le coach', xp: '+50 XP' },
  { id: 'rehab', rhythm: 'week', name: 'Rehab', xp: 'Sans XP' },
  { id: 'coachPaid', rhythm: 'month', name: 'Payer le coach', xp: 'Sans XP' }
];

export function isOn(id) {
  const r = state.routines;
  return !r || r[id] !== false;
}

function defaults() {
  return {
    v: 1,
    createdAt: ymd(today()),
    profile: null, // { name }
    targets: { steps: 10000, kcalMin: 2000, kcalMax: 2400, water: 2, sessions: 4 },
    routines: {}, // { id: false } pour une routine de base désactivée
    days: {},
    weeks: {},
    months: {},
    habits: [] // { id, name, rhythm: 'day' | 'week' | 'month', createdAt, archivedAt }
  };
}

function migrate(data) {
  const base = defaults();
  const { competition, ...rest } = data; // compétition retirée de l'app
  return {
    ...base,
    ...rest,
    targets: { ...base.targets, ...(data.targets || {}) },
    routines: data.routines || {},
    days: data.days || {},
    weeks: data.weeks || {},
    months: data.months || {},
    habits: data.habits || []
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('Lecture des données impossible', e);
  }
  return defaults();
}

let state = load();
const listeners = new Set();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Sauvegarde impossible', e);
  }
}

export const getState = () => state;
export const subscribe = (fn) => listeners.add(fn);

export function update(fn) {
  fn(state);
  state.updatedAt = new Date().toISOString(); // sert à savoir quelle version est la plus récente (téléphone ou compte)
  save();
  listeners.forEach((l) => l(state, 'local'));
}

// Remplace tout par les données du compte, sans les marquer comme modifiées ici.
export function replaceState(data) {
  const next = migrate(data);
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, next);
  save();
  listeners.forEach((l) => l(state, 'remote'));
}

export const hasLocalData = () => !!state.profile || Object.keys(state.days).length > 0;

export const getDay = (key) => ({ ...emptyDay(), ...(state.days[key] || {}) });
export const getWeek = (key) => ({ ...emptyWeek(), ...(state.weeks[key] || {}) });
export const getMonth = (key) => ({ ...emptyMonth(), ...(state.months[key] || {}) });

export function patchDay(key, patch) {
  update((s) => { s.days[key] = { ...getDay(key), ...patch }; });
}
export function patchWeek(key, patch) {
  update((s) => { s.weeks[key] = { ...getWeek(key), ...patch }; });
}
export function patchMonth(key, patch) {
  update((s) => { s.months[key] = { ...getMonth(key), ...patch }; });
}

export const activeHabits = (rhythm) =>
  state.habits.filter((h) => !h.archivedAt && (!rhythm || h.rhythm === rhythm));

export function exportJson() {
  return JSON.stringify({ app: 'oni-habits', exportedAt: new Date().toISOString(), data: state }, null, 2);
}

export function importJson(text) {
  const parsed = JSON.parse(text);
  const data = parsed && parsed.data ? parsed.data : parsed;
  if (!data || typeof data !== 'object' || !data.days) throw new Error('Fichier non reconnu');
  update((s) => {
    const next = migrate(data);
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, next);
  });
}

export function resetAll() {
  update((s) => {
    const next = defaults();
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, next);
  });
}

// Demande au navigateur de ne pas effacer les données (utile sur iPhone).
export function askPersistence() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((p) => { if (!p) navigator.storage.persist(); }).catch(() => {});
  }
}
