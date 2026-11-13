// Point d'entrée : routes, rendu, actions.

import { addDays, addMonths, daysBetween, monthKey, parseMonth, parseYmd, today, weekKey, ymd } from './dates.js';
import {
  activeHabits, askPersistence, exportJson, getDay, getMonth, getState, getWeek, importJson, isOn,
  patchDay, patchMonth, patchWeek, resetAll, subscribe, update
} from './store.js';
import { sessionsOfWeek, plannedSessions } from './xp.js';
import { num, toast } from './ui.js';
import { accountFirstName, cloud, initCloud, onCloudChange, signInGoogle, signOut, syncNow } from './cloud.js';
import {
  accountView, dayView, habitsView, monthView, onboardingView, profileView, saisieView, socialView, targetsView, weekView
} from './views.js';

const root = document.getElementById('app');
const ui = { draftName: '', habitName: '', habitRhythm: 'day', busy: false, skipAccount: false };
let installPrompt = null;

// ---------- Routes ----------

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const name = parts[0] || 'jour';
  const arg = parts[1] || null;
  const todayKey = ymd(today());
  switch (name) {
    case 'saisie': return { name, day: validDay(arg) || todayKey };
    case 'semaine': return { name, week: arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? weekKey(parseYmd(arg)) : weekKey(today()) };
    case 'mois': return { name, month: arg && /^\d{4}-\d{2}$/.test(arg) ? arg : monthKey(today()) };
    case 'communaute': case 'profil': case 'habitudes': case 'objectifs': case 'compte': return { name };
    default: return { name: 'jour', day: validDay(arg) || todayKey };
  }
}

function validDay(k) {
  if (!k || !/^\d{4}-\d{2}-\d{2}$/.test(k)) return null;
  return k > ymd(today()) ? null : k;
}

const go = (hash) => { location.hash = hash; };

// ---------- Rendu ----------

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function render() {
  const r = route();
  const s = getState();
  const scrollY = window.scrollY;
  const focused = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.input : null;
  let html;
  if (r.name === 'compte') {
    html = accountView(ui);
  } else if (!s.profile) {
    html = onboardingView(ui);
  } else {
    switch (r.name) {
      case 'saisie': html = saisieView(r.day); break;
      case 'semaine': html = weekView(r.week); break;
      case 'mois': html = monthView(r.month); break;
      case 'communaute': html = socialView(); break;
      case 'profil': html = profileView({ canInstall: !!installPrompt, iosHint: isIos() && !isStandalone() }); break;
      case 'habitudes': html = habitsView(ui); break;
      case 'objectifs': html = targetsView(); break;
      default: html = dayView(r.day);
    }
  }
  const sameScreen = root._lastRoute === location.hash;
  const before = sameScreen ? checkedBoxes() : null;
  root.innerHTML = html;
  if (before) bleed(before);
  root.dataset.route = s.profile ? r.name : 'onboarding';
  window.scrollTo(0, root._lastRoute === location.hash ? scrollY : 0);
  root._lastRoute = location.hash;
  if (focused) {
    const el = root.querySelector(`[data-input="${focused}"]`);
    if (el && el.dataset.live) { el.focus(); const v = el.value; el.setSelectionRange && el.setSelectionRange(v.length, v.length); }
  }
}

// Animation « sang » : une case qui vient d'être cochée sur le même écran
// se remplit. On repère les cases par leur action (ou lien) et leur rang.
function boxKeys() {
  const seen = {};
  return [...root.querySelectorAll('.box')].map((b) => {
    const host = b.closest('[data-act], a[href]');
    const id = host ? (host.dataset.act ? host.dataset.act + ':' + (host.dataset.arg || '') : host.getAttribute('href')) : '';
    seen[id] = (seen[id] || 0) + 1;
    return { b, key: id + '#' + seen[id] };
  });
}

function checkedBoxes() {
  return new Set(boxKeys().filter((x) => x.b.classList.contains('on')).map((x) => x.key));
}

function bleed(before) {
  let n = 0;
  for (const { b, key } of boxKeys()) {
    if (!b.classList.contains('on') || before.has(key)) continue;
    b.classList.add('fill');
    b.insertAdjacentHTML('beforeend', '<i class="drop" aria-hidden="true"></i>');
    n++;
  }
  if (n && navigator.vibrate) navigator.vibrate(12);
}

// Si on touche un bouton juste après avoir rempli un champ, la sauvegarde du champ
// ne doit pas redessiner l'écran sous le doigt (le tap serait perdu) : on attend le relâchement.
let pointerDown = false;
let pendingRender = false;
function scheduleRender() {
  if (pointerDown) { pendingRender = true; return; }
  render();
}
document.addEventListener('pointerdown', () => { pointerDown = true; }, true);
['pointerup', 'pointercancel'].forEach((t) => document.addEventListener(t, () => {
  pointerDown = false;
  if (pendingRender) { pendingRender = false; setTimeout(render, 0); }
}, true));

subscribe(scheduleRender);
window.addEventListener('hashchange', render);

// ---------- Actions (boutons) ----------

function currentDay() {
  const r = route();
  return r.day || ymd(today());
}

function toggleHabit(id) {
  const r = route();
  if (r.name === 'semaine') {
    const w = getWeek(r.week);
    patchWeek(r.week, { habits: { ...w.habits, [id]: !w.habits[id] } });
  } else if (r.name === 'mois') {
    const m = getMonth(r.month);
    patchMonth(r.month, { habits: { ...m.habits, [id]: !m.habits[id] } });
  } else {
    const k = currentDay();
    const d = getDay(k);
    patchDay(k, { habits: { ...d.habits, [id]: !d.habits[id] } });
  }
}

function sessionBox(index) {
  const wk = route().week;
  const done = sessionsOfWeek(wk);
  if (index < done.length) {
    patchDay(done[index], { session: null });
    return;
  }
  // Coche aujourd'hui si c'est dans cette semaine, sinon le dernier jour libre de la semaine.
  const monday = parseYmd(wk);
  const todayKey = ymd(today());
  const candidates = [];
  for (let i = 6; i >= 0; i--) {
    const k = ymd(addDays(monday, i));
    if (k <= todayKey && getDay(k).session !== 'done') candidates.push(k);
  }
  if (!candidates.length) { toast('Tous les jours de la semaine sont déjà cochés'); return; }
  patchDay(candidates[0], { session: 'done' });
}

function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const actions = {
  start() {
    const name = (ui.draftName || accountFirstName()).trim();
    if (!name) { toast('Indique ton prénom'); return; }
    update((s) => { s.profile = { name }; });
    askPersistence();
    go('#/jour');
  },
  'day-prev'() {
    const k = currentDay();
    if (daysBetween(parseYmd(k), today()) >= 7) return;
    go(`#/jour/${ymd(addDays(parseYmd(k), -1))}`);
  },
  'day-next'() {
    const next = ymd(addDays(parseYmd(currentDay()), 1));
    go(next >= ymd(today()) ? '#/jour' : `#/jour/${next}`);
  },
  'toggle-mobility'() { const k = currentDay(); patchDay(k, { mobility: !getDay(k).mobility }); },
  session(arg) { const k = currentDay(); patchDay(k, { session: getDay(k).session === arg ? null : arg }); },
  'water-add'(arg) {
    const k = currentDay();
    const next = Math.max(0, Math.round((getDay(k).water + parseFloat(arg)) * 100) / 100);
    patchDay(k, { water: next });
  },
  'steps-add'(arg) { const k = currentDay(); patchDay(k, { steps: (getDay(k).steps || 0) + Number(arg) }); },
  'sleep-band'(arg) { const k = currentDay(); const v = Number(arg); patchDay(k, { sleep: getDay(k).sleep === v ? null : v }); },
  routine(id) { update((s) => { s.routines = { ...(s.routines || {}), [id]: !isOn(id) }; }); },
  fatigue(arg) { patchDay(currentDay(), { fatigue: Number(arg) }); },
  pain(arg) { patchDay(currentDay(), arg === 'yes' ? { pain: true } : { pain: false, painZone: null }); },
  zone(arg) { const k = currentDay(); patchDay(k, { painZone: getDay(k).painZone === arg ? null : arg }); },
  'toggle-habit': toggleHabit,

  'week-prev'() { go(`#/semaine/${ymd(addDays(parseYmd(route().week), -7))}`); },
  'week-next'() {
    const next = ymd(addDays(parseYmd(route().week), 7));
    go(next > weekKey(today()) ? '#/semaine' : `#/semaine/${next}`);
  },
  planned(arg) { patchWeek(route().week, { sessions: Number(arg) }); },
  'session-box'(arg) { sessionBox(Number(arg)); },
  'toggle-video'() { const wk = route().week; patchWeek(wk, { video: !getWeek(wk).video }); },
  'toggle-rehab'() { const wk = route().week; patchWeek(wk, { rehab: !getWeek(wk).rehab }); },
  'toggle-review'() { const wk = route().week; patchWeek(wk, { sentAt: getWeek(wk).sentAt ? null : new Date().toISOString() }); },

  'month-prev'() { go(`#/mois/${monthKey(addMonths(parseMonth(route().month), -1))}`); },
  'month-next'() {
    const next = monthKey(addMonths(parseMonth(route().month), 1));
    go(next >= monthKey(today()) ? '#/mois' : `#/mois/${next}`);
  },
  'toggle-paid'() {
    const mk = route().month;
    const paid = !getMonth(mk).coachPaid;
    patchMonth(mk, { coachPaid: paid, paidAt: paid ? new Date().toISOString() : null });
  },

  'habit-rhythm'(arg) { ui.habitRhythm = arg; render(); },
  'habit-add'() {
    const name = ui.habitName.trim();
    if (!name) { toast('Donne un nom à ton habitude'); return; }
    const id = `h${Date.now().toString(36)}`;
    update((s) => { s.habits.push({ id, name, rhythm: ui.habitRhythm, createdAt: ymd(today()), archivedAt: null }); });
    ui.habitName = '';
    render();
    toast('Habitude ajoutée');
  },
  'habit-remove'(id) {
    const h = getState().habits.find((x) => x.id === id);
    if (!h || !window.confirm(`Supprimer « ${h.name} » ? L'XP déjà gagnée est gardée.`)) return;
    update((s) => {
      const target = s.habits.find((x) => x.id === id);
      if (target.createdAt === ymd(today())) s.habits = s.habits.filter((x) => x.id !== id);
      else target.archivedAt = ymd(today());
    });
  },

  async 'login-google'() {
    try { await signInGoogle(); } catch (e) { toast('Connexion Google impossible'); }
  },
  'skip-account'() { ui.skipAccount = true; render(); },
  'sync-now'() { syncNow(); },
  async logout() {
    if (!window.confirm('Te déconnecter ? Tes données restent sur ce téléphone.')) return;
    await signOut();
    toast('Déconnecté');
  },

  async install() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null;
    render();
  },
  export() { download(`oni-habits-${ymd(today())}.json`, exportJson()); },
  import() { document.getElementById('import-file').click(); },
  reset() {
    if (!window.confirm('Tout effacer sur ce téléphone ? Tes journées, semaines et habitudes seront perdues. Exporte d’abord si tu veux les garder.')) return;
    resetAll();
    go('#/jour');
  }
};

root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el.dataset.arg);
});

// ---------- Champs ----------

function setTarget(field, raw) {
  const v = num(raw);
  if (v == null || v <= 0) return;
  update((s) => {
    const t = s.targets;
    if (field === 'steps') t.steps = Math.round(v);
    if (field === 'water') t.water = Math.round(v * 100) / 100;
    if (field === 'kcalMin') t.kcalMin = Math.round(v);
    if (field === 'kcalMax') t.kcalMax = Math.round(v);
    if (t.kcalMin > t.kcalMax) [t.kcalMin, t.kcalMax] = [t.kcalMax, t.kcalMin];
  });
}

const inputs = {
  'draft-name'(v) { ui.draftName = v; },
  'habit-name'(v) { ui.habitName = v; },
  steps(v) { const n = num(v); patchDay(currentDay(), { steps: n == null ? null : Math.max(0, Math.round(n)) }); },
  kcal(v) { const n = num(v); patchDay(currentDay(), { kcal: n == null ? null : Math.max(0, Math.round(n)) }); },
  weight(v) { const n = num(v); patchWeek(route().week, { weight: n == null || n <= 0 ? null : Math.round(n * 10) / 10 }); },
  't-steps'(v) { setTarget('steps', v); },
  't-water'(v) { setTarget('water', v); },
  't-kcalMin'(v) { setTarget('kcalMin', v); },
  't-kcalMax'(v) { setTarget('kcalMax', v); },
  'p-name'(v) { if (v.trim()) update((s) => { s.profile = { ...(s.profile || {}), name: v.trim() }; }); },
  'coach-name'(v) { update((s) => { s.coachName = v.trim() || 'Pierre'; }); }
};

// Saisie au fil de l'eau pour les champs « live » (pas de re-rendu), validation à la sortie du champ pour les autres.
root.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset && el.dataset.input && ['draft-name', 'habit-name'].includes(el.dataset.input)) {
    inputs[el.dataset.input](el.value);
  }
});

root.addEventListener('change', (e) => {
  const el = e.target;
  if (el.id === 'import-file' && el.files && el.files[0]) {
    el.files[0].text().then((txt) => {
      if (!window.confirm('Remplacer les données de ce téléphone par cette sauvegarde ?')) return;
      try { importJson(txt); toast('Sauvegarde importée'); } catch (err) { toast('Fichier non reconnu'); }
    });
    return;
  }
  const key = el.dataset && el.dataset.input;
  if (!key || ['draft-name', 'habit-name'].includes(key)) return;
  if (inputs[key]) inputs[key](el.value);
});

// Les segments de l'accueil et des objectifs (séances par semaine).
actions['t-sessions'] = (arg) => update((s) => { s.targets.sessions = Number(arg); });

// Valider un champ avec la touche Entrée referme le clavier.
root.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur();
});

// ---------- Installation ----------

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  if (route().name === 'profil') render();
});

// En local, pas de service worker (sinon on teste une vieille version en cache), sauf avec ?sw.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname) && !location.search.includes('sw');
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !isLocal) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      // Une app installée reste ouverte en arrière-plan : on regarde s'il y a du neuf
      // à chaque retour dessus, et toutes les 30 minutes.
      const check = () => reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
      setInterval(check, 30 * 60 * 1000);
    } catch (err) {
      console.warn('Service worker non enregistré', err);
    }
  });
  // La nouvelle version a pris la main : on propose de recharger (pas au tout premier lancement).
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) showUpdateBar(); });
}

function showUpdateBar() {
  if (document.getElementById('update-bar')) return;
  const bar = document.createElement('button');
  bar.type = 'button';
  bar.id = 'update-bar';
  bar.className = 'update-bar';
  bar.innerHTML = '<span>Nouvelle version disponible</span><b>Mettre à jour</b>';
  bar.addEventListener('click', () => location.reload());
  document.body.appendChild(bar);
}
// Au retour sur l'app après minuit, on repasse sur la bonne journée.
let lastDay = ymd(today());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ymd(today()) !== lastDay) {
    lastDay = ymd(today());
    render();
  }
});

render();
onCloudChange(scheduleRender);
initCloud();

// Pour déboguer dans la console.
window.oni = { getState, plannedSessions, cloud };
