// Les écrans de l'app. Chaque fonction renvoie le HTML de l'écran.

import {
  addDays, addMonths, daysBetween, fmtDayMonth, fmtLong, fmtMonth, fmtShort, isoWeek, lastDayOfMonth,
  monthKey, monthName, mondayOf, parseMonth, parseYmd, today, weekKey, weekRangeLabel, ymd
} from './dates.js';
import { ROUTINES, activeHabits, getDay, getMonth, getState, getWeek, isOn } from './store.js';
import { RANKS, SLEEP_BANDS, XP, dayMax, dayScore, habitActiveOn, rankOf, sessionsOfWeek, sleepBand, streaks, totalXp, weekMax, weekScore } from './xp.js';
import { checkRow, esc, fr, frDec, icon, logo, nav, segmented, segs } from './ui.js';
import { accountFirstName, cloud } from './cloud.js';

const GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

function syncLabel() {
  const t = cloud.lastSync;
  const hm = t ? `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` : '';
  switch (cloud.status) {
    case 'syncing': return 'Synchronisation…';
    case 'ok': return `Sauvegardé à ${hm}`;
    case 'offline': return 'Hors ligne : envoi au retour du réseau';
    case 'error': return 'Erreur de synchro, réessaie plus tard';
    default: return '';
  }
}

// Bloc « Compte » du profil.
function accountBlock() {
  if (!cloud.enabled) return '';
  if (cloud.user) {
    return `<section class="card account">
      <div class="sec-h"><h2>Mon compte</h2><span class="tag${cloud.status === 'ok' ? ' ok' : cloud.status === 'error' ? ' warn' : ''}">${esc(syncLabel())}</span></div>
      <p class="acc-mail">${esc(cloud.user.email || '')}</p>
      <div class="grid2">
        <button type="button" class="btn ghost" data-act="sync-now">Synchroniser</button>
        <button type="button" class="btn ghost" data-act="logout">Se déconnecter</button>
      </div>
    </section>`;
  }
  return `<section class="card account">
      <div class="sec-h"><h2>Sauvegarde en ligne</h2></div>
      <p class="hint">Connecte-toi pour retrouver tes données sur n'importe quel téléphone.</p>
      <button type="button" class="btn google" data-act="login-google">${GOOGLE_G} Continuer avec Google</button>
      <a class="btn ghost" href="#/compte">Recevoir un code par e-mail</a>
    </section>`;
}

// ---------- Connexion ----------

export function accountView(ui) {
  const back = getState().profile ? '#/profil' : '#/jour';
  if (!cloud.enabled) {
    return `${pageHead({ back, kicker: 'Compte', title: 'Connexion' })}
      <main class="main"><p class="hint center">La sauvegarde en ligne n'est pas encore activée.</p></main>`;
  }
  if (cloud.user) {
    return `${pageHead({ back, kicker: 'Compte', title: 'Connecté' })}
      <main class="main"><p class="hint center">${esc(cloud.user.email || '')}</p><a class="btn" href="#/jour">Continuer</a></main>`;
  }
  return `${pageHead({ back, kicker: 'Compte', title: 'Connexion' })}
    <main class="main">${loginBlock(ui)}</main>`;
}

// Google ou code par e-mail. Le compte est créé à la première connexion :
// « s'inscrire » et « se connecter » sont le même geste.
function loginBlock(ui) {
  return `<button type="button" class="btn google" data-act="login-google"${ui.busy ? ' disabled' : ''}>${GOOGLE_G} Continuer avec Google</button>
      <div class="or"><span>ou par e-mail</span></div>
      <section class="card form">
        ${ui.codeSent ? `
          <p class="hint">Code envoyé à <b>${esc(ui.email)}</b>. Regarde tes mails (et les indésirables).</p>
          <label class="lab" for="otp">Code à 6 chiffres</label>
          <input id="otp" class="input big center" inputmode="numeric" autocomplete="one-time-code" maxlength="6" data-input="otp" data-live="1" value="${esc(ui.code)}" placeholder="••••••">
          <button type="button" class="btn" data-act="verify-code"${ui.busy ? ' disabled' : ''}>Valider</button>
          <button type="button" class="btn ghost" data-act="code-reset">Changer d'adresse</button>`
        : `
          <label class="lab" for="email">Ton adresse e-mail</label>
          <input id="email" class="input" type="email" inputmode="email" autocomplete="email" data-input="email" data-live="1" value="${esc(ui.email)}" placeholder="toi@exemple.fr">
          <button type="button" class="btn" data-act="send-code"${ui.busy ? ' disabled' : ''}>Recevoir mon code</button>`}
      </section>
      <p class="hint center">Sur iPhone, si Google te renvoie vers Safari au lieu de l'app, utilise le code par e-mail.</p>`;
}

const ZONES = ['Épaule', 'Coude', 'Poignet', 'Dos', 'Hanche', 'Genou', 'Cheville'];

// Les 4 tranches de sommeil, en boutons.
function sleepButtons(d) {
  const cur = sleepBand(d.sleep);
  return SLEEP_BANDS.map((b, i) =>
    `<button type="button" class="${cur === i ? 'on' : ''}" aria-pressed="${cur === i}" data-act="sleep-band" data-arg="${b.v}">${b.label}</button>`).join('');
}

function linkItem({ href, checked, partial = false, label, sub = '', xp = '', extra = '' }) {
  return `<a class="item" href="${href}">
    <span class="box${checked ? ' on' : partial ? ' part' : ''}">${checked ? icon.check() : ''}</span>
    <span class="lbl"><span class="t">${esc(label)}</span>${extra}</span>
    <span class="xp${checked || partial ? ' on' : ''}">${esc(xp)}</span>
  </a>`;
}

function actItem({ href, checked, partial = false, label, extra = '', action, xp, on }) {
  const lbl = href
    ? `<a class="lbl" href="${href}"><span class="t">${esc(label)}</span>${extra}</a>`
    : `<span class="lbl"><span class="t">${esc(label)}</span>${extra}</span>`;
  return `<div class="item act">
    <span class="box${checked ? ' on' : partial ? ' part' : ''}">${checked ? icon.check() : ''}</span>
    ${lbl}
    <span class="xp${on ? ' on' : ''}">${esc(xp)}</span>
    ${action}
  </div>`;
}

function pageHead({ back, kicker, title, right = '' }) {
  return `<header class="top">
    ${back ? `<a class="iconbtn" href="${back}" aria-label="Retour">${icon.back()}</a>` : ''}
    <div class="head-txt"><div class="kicker">${kicker}</div><h1 class="title">${title}</h1></div>
    ${right}
  </header>`;
}

function xpPlus(v) { return v > 0 ? `+${v}` : '0'; }

// ---------- Accueil (premier lancement) ----------

export function onboardingView(ui) {
  const t = getState().targets;
  const head = `<div class="ob-logo">${logo(64)}<span class="ob-sub">HABITS</span></div>`;

  // Étape 1 : le compte (création ou connexion, c'est le même bouton).
  if (cloud.enabled && !cloud.user && !ui.skipAccount) {
    if (!cloud.ready) return `<main class="main onboarding">${head}<p class="hint center">Chargement…</p></main>`;
    return `<main class="main onboarding">
      ${head}
      <p class="lead">Ta routine ONI, jour après jour. Crée ton compte pour retrouver tes données sur n'importe quel téléphone.</p>
      <span class="lab center">Créer mon compte ou me connecter</span>
      ${loginBlock(ui)}
      <button type="button" class="linkbtn" data-act="skip-account">Continuer sans compte</button>
    </main>`;
  }
  // Connecté : on récupère d'abord ce qui est déjà sur le compte.
  if (cloud.user && cloud.status === 'syncing') {
    return `<main class="main onboarding">${head}<p class="hint center">Récupération de tes données…</p></main>`;
  }

  // Étape 2 : prénom et objectifs.
  const name = ui.draftName || accountFirstName();
  return `<main class="main onboarding">
    ${head}
    ${cloud.user ? `<p class="hint center ok">Compte créé · ${esc(cloud.user.email || '')}</p>` : ''}
    <section class="card form">
      <label class="lab" for="ob-name">Ton prénom</label>
      <input id="ob-name" class="input" data-input="draft-name" value="${esc(name)}" autocomplete="given-name" placeholder="Prénom">
      <p class="hint">Tes objectifs, ceux que Pierre t'a donnés. Tu pourras les changer plus tard.</p>
      ${targetFields(t)}
    </section>
    <button type="button" class="btn" data-act="start">C'est parti</button>
  </main>`;
}

function targetFields(t) {
  const fields = [];
  if (isOn('steps')) fields.push(`<div><label class="lab" for="t-steps">Pas par jour</label><input id="t-steps" class="input" inputmode="numeric" data-input="t-steps" value="${t.steps}"></div>`);
  if (isOn('water')) fields.push(`<div><label class="lab" for="t-water">Eau (L)</label><input id="t-water" class="input" inputmode="decimal" data-input="t-water" value="${frDec(t.water, 2)}"></div>`);
  if (isOn('kcal')) {
    fields.push(`<div><label class="lab" for="t-kmin">Calories min.</label><input id="t-kmin" class="input" inputmode="numeric" data-input="t-kcalMin" value="${t.kcalMin}"></div>`);
    fields.push(`<div><label class="lab" for="t-kmax">Calories max.</label><input id="t-kmax" class="input" inputmode="numeric" data-input="t-kcalMax" value="${t.kcalMax}"></div>`);
  }
  return `${fields.length ? `<div class="grid2">${fields.join('')}</div>` : ''}
    ${isOn('session') ? `<span class="lab">Séances par semaine</span>
    ${segmented('Séances par semaine', [1, 2, 3, 4, 5, 6, 7], t.sessions, 't-sessions')}` : ''}`;
}

// ---------- Jour ----------

export function dayView(key) {
  const s = getState();
  const t = s.targets;
  const date = parseYmd(key);
  const isToday = key === ymd(today());
  const sc = dayScore(key);
  const d = sc.day;
  const st = streaks();
  const max = dayMax();
  const pct = max ? Math.min(100, Math.round((sc.base / max) * 100)) : 0;
  const title = isToday ? 'Aujourd’hui' : daysBetween(date, today()) === 1 ? 'Hier' : fmtShort(date);
  const canPrev = daysBetween(date, today()) < 7;

  const stepsK = d.steps ? Math.floor(d.steps / 1000) : 0;
  const stepsTargetK = Math.max(1, Math.round(t.steps / 1000));
  const stepsSub = d.steps == null ? `Objectif ${fr(t.steps)} · +${frDec(XP.steps / stepsTargetK)} XP tous les 1 000`
    : sc.checks.steps ? 'Objectif atteint' : `+${frDec(XP.steps / stepsTargetK)} XP tous les 1 000 · encore ${fr(t.steps - d.steps)}`;
  const kcalSub = sc.checks.kcal ? `Dans ${fr(t.kcalMin)} – ${fr(t.kcalMax)}` : `Fourchette ${fr(t.kcalMin)} – ${fr(t.kcalMax)}`;
  const waterLeft = Math.max(0, t.water - d.water);
  const formeSub = d.fatigue == null ? 'Fatigue, douleur'
    : d.pain ? `Douleur signalée${d.painZone ? ' · ' + d.painZone : ''}` : 'Aucune douleur signalée';
  const formeLabel = d.fatigue == null ? 'Forme' : `Forme · fatigue ${d.fatigue}/5`;
  const xpOf = (k) => (sc.checks[k] ? `+${XP[k]}` : XP[k]);

  const wKey = weekKey(date);
  const ws = weekScore(wKey);
  const boxes = [];
  for (let i = 0; i < ws.planned; i++) boxes.push(`<i class="${i < ws.done ? 'on' : ''}">${i < ws.done ? icon.check(12) : ''}</i>`);

  const habits = s.habits.filter((h) => h.rhythm === 'day' && habitActiveOn(h, key));

  return `<header class="top">
      ${logo()}
      <span class="pill red">${icon.flame()} Série ${st.current} j</span>
    </header>
    <main class="main">
      <section class="card xpcard" aria-label="XP du jour">
        <div class="dayhead">
          <button type="button" class="iconbtn sm" data-act="day-prev" aria-label="Jour précédent"${canPrev ? '' : ' disabled'}>${icon.prev()}</button>
          <h1 class="title">${esc(title)}</h1>
          <button type="button" class="iconbtn sm" data-act="day-next" aria-label="Jour suivant"${isToday ? ' disabled' : ''}>${icon.next()}</button>
        </div>
        <div class="big">${sc.total}<small> / ${max} XP</small></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </section>

      <div class="list">
        ${isOn('mobility') ? checkRow({ act: 'toggle-mobility', checked: d.mobility, label: 'Souplesse du matin', sub: d.mobility ? 'Faite' : 'Quelques minutes au réveil', xp: xpOf('mobility') }) : ''}
        ${isOn('steps') ? actItem({ href: `#/saisie/${key}`, checked: sc.checks.steps, partial: sc.parts.steps > 0, label: d.steps == null ? 'Pas' : `Pas · ${fr(d.steps)}`, extra: segs(Math.min(10, stepsTargetK), Math.min(10, Math.round(stepsK * Math.min(10, stepsTargetK) / stepsTargetK))), action: '<button type="button" class="quick" data-act="steps-add" data-arg="1000" aria-label="Ajouter 1 000 pas">+1 000</button>', xp: sc.parts.steps > 0 ? `+${sc.parts.steps}` : XP.steps, on: sc.parts.steps > 0 }) : ''}
        ${isOn('kcal') ? linkItem({ href: `#/saisie/${key}`, checked: sc.checks.kcal, label: d.kcal == null ? 'Calories' : `Calories · ${fr(d.kcal)} kcal`, sub: kcalSub, xp: xpOf('kcal') }) : ''}
        ${isOn('water') ? actItem({ href: `#/saisie/${key}`, checked: sc.checks.water, partial: d.water > 0, label: `Eau · ${frDec(d.water, 2)} / ${frDec(t.water, 2)} L`, action: '<button type="button" class="quick" data-act="water-add" data-arg="0.25" aria-label="Ajouter un verre de 0,25 L">+0,25</button>', xp: xpOf('water'), on: sc.checks.water }) : ''}
        ${isOn('sleep') ? `<div class="item static stack">
          <span class="box${sc.checks.sleep ? ' on' : ''}">${sc.checks.sleep ? icon.check() : ''}</span>
          <span class="lbl"><span class="t">Sommeil cette nuit</span></span>
          <span class="xp${sc.checks.sleep ? ' on' : ''}">${xpOf('sleep')}</span>
          <span class="mini-seg four" role="group" aria-label="Heures de sommeil">${sleepButtons(d)}</span>
        </div>` : ''}
        ${isOn('session') ? actItem({ checked: sc.checks.session, label: d.session === 'rest' ? 'Repos' : 'Séance', action: `<span class="mini-seg" role="group" aria-label="Séance ou repos">
            <button type="button" class="${d.session === 'done' ? 'on' : ''}" aria-pressed="${d.session === 'done'}" data-act="session" data-arg="done">Faite</button>
            <button type="button" class="${d.session === 'rest' ? 'on' : ''}" aria-pressed="${d.session === 'rest'}" data-act="session" data-arg="rest">Repos</button>
          </span>`, xp: xpOf('session'), on: sc.checks.session }) : ''}
        ${isOn('checkin') ? linkItem({ href: `#/saisie/${key}`, checked: sc.checks.checkin, label: formeLabel, sub: formeSub, xp: xpOf('checkin') }) : ''}
        ${habits.map((h) => checkRow({ act: 'toggle-habit', arg: h.id, checked: !!d.habits[h.id], label: h.name, sub: 'Habitude perso', xp: d.habits[h.id] ? `+${XP.habit}` : XP.habit })).join('')}
      </div>

      ${isOn('session') ? `<a class="weekstrip" href="#/semaine/${wKey}">
        <span class="k">Semaine<br><b>${ws.done} / ${ws.planned} séances</b></span>
        <span class="boxes">${boxes.join('')}</span>
        <span class="go">Semaine →</span>
      </a>` : ''}

      <a class="btn" href="#/saisie/${key}">Saisir mes données</a>
    </main>
    ${nav('jour')}`;
}

// ---------- Saisie ----------

export function saisieView(key) {
  const t = getState().targets;
  const date = parseYmd(key);
  const sc = dayScore(key);
  const d = sc.day;
  const stepsTargetK = Math.max(1, Math.round(t.steps / 1000));
  const stepsK = d.steps ? Math.floor(d.steps / 1000) : 0;
  const back = key === ymd(today()) ? '#/jour' : `#/jour/${key}`;
  const zones = ZONES.map((z) => `<button type="button" class="chip${d.painZone === z ? ' on' : ''}" aria-pressed="${d.painZone === z}" data-act="zone" data-arg="${z}">${z}</button>`).join('');
  const waterLeft = Math.max(0, t.water - d.water);

  return `${pageHead({ back, kicker: esc(fmtLong(date)), title: 'Saisie du jour', right: `<span class="headxp">+${sc.total}</span>` })}
    <main class="main">
      ${isOn('mobility') ? `<section class="sec">
        <div class="sec-h"><h2>Souplesse du matin</h2></div>
        ${checkRow({ act: 'toggle-mobility', checked: d.mobility, label: d.mobility ? 'Faite ce matin' : 'Pas encore faite', sub: 'Mobilité, étirements, quelques minutes', xp: `+${XP.mobility}` })}
      </section>` : ''}

      ${isOn('steps') ? `<section class="sec">
        <div class="sec-h"><h2>Pas</h2><span class="tag${sc.parts.steps ? ' ok' : ''}">${xpPlus(sc.parts.steps)} XP</span></div>
        <div class="bigfield">
          <input id="steps" class="input big" inputmode="numeric" data-input="steps" value="${d.steps ?? ''}" placeholder="0" aria-label="Nombre de pas">
          <span class="unit">/ ${fr(t.steps)} pas</span>
        </div>
        ${segs(Math.min(10, stepsTargetK), Math.min(10, Math.round(stepsK * Math.min(10, stepsTargetK) / stepsTargetK)))}
        <button type="button" class="btn ghost" data-act="steps-add" data-arg="1000">+ 1 000 pas</button>
        <p class="hint"><b>+${frDec(XP.steps / stepsTargetK)} XP tous les 1 000 pas</b>, jusqu'à ton objectif. Recopie le chiffre de l'app Santé ou de ta montre.</p>
      </section>` : ''}

      ${isOn('kcal') ? `<section class="sec">
        <div class="sec-h"><h2>Calories</h2><span class="tag${sc.checks.kcal ? ' ok' : ''}">${sc.checks.kcal ? `+${XP.kcal}` : '0'} XP</span></div>
        <div class="bigfield${d.kcal != null && !sc.checks.kcal ? ' warn' : ''}">
          <input id="kcal" class="input big" inputmode="numeric" data-input="kcal" value="${d.kcal ?? ''}" placeholder="0" aria-label="Calories">
          <span class="unit">kcal</span>
        </div>
        <p class="hint ${sc.checks.kcal ? 'ok' : d.kcal != null ? 'warn' : ''}">Fourchette ${fr(t.kcalMin)} – ${fr(t.kcalMax)} kcal</p>
      </section>` : ''}

      ${isOn('water') ? `<section class="sec">
        <div class="sec-h"><h2>Eau</h2><span class="tag${sc.checks.water ? ' ok' : ''}">${sc.checks.water ? `+${XP.water}` : '0'} XP</span></div>
        <div class="waterline"><span class="big">${frDec(d.water, 2)}</span><span class="unit">/ ${frDec(t.water, 2)} L</span></div>
        <div class="grid3">
          <button type="button" class="btn ghost" data-act="water-add" data-arg="0.25">+ 0,25 L</button>
          <button type="button" class="btn ghost" data-act="water-add" data-arg="0.5">+ 0,5 L</button>
          <button type="button" class="btn ghost" data-act="water-add" data-arg="-0.25">− 0,25 L</button>
        </div>
        <p class="hint ${sc.checks.water ? 'ok' : ''}">${sc.checks.water ? 'Objectif atteint' : `Encore ${frDec(waterLeft, 2)} L`}</p>
      </section>` : ''}

      ${isOn('sleep') ? `<section class="sec">
        <div class="sec-h"><h2>Sommeil cette nuit</h2><span class="tag${sc.checks.sleep ? ' ok' : ''}">${sc.checks.sleep ? `+${XP.sleep}` : '0'} XP</span></div>
        <div class="seg four" role="group" aria-label="Heures de sommeil">${sleepButtons(d)}</div>
      </section>` : ''}

      ${isOn('checkin') ? `<section class="sec">
        <div class="sec-h"><h2>Forme</h2><span class="tag${sc.checks.checkin ? ' ok' : ''}">${sc.checks.checkin ? `+${XP.checkin}` : '0'} XP</span></div>
        <span class="lab">Fatigue <span class="muted">· 1 en pleine forme, 5 épuisé</span></span>
        ${segmented('Fatigue', [1, 2, 3, 4, 5], d.fatigue, 'fatigue')}
        <span class="lab">Une douleur aujourd'hui ?</span>
        ${segmented('Douleur', [{ value: 'no', label: 'Non' }, { value: 'yes', label: 'Oui' }], d.pain === true ? 'yes' : d.pain === false ? 'no' : '', 'pain')}
        ${d.pain ? `<div class="chips">${zones}</div>` : ''}
      </section>` : ''}

      <a class="btn" href="${back}">Enregistrer · +${sc.total} XP</a>
    </main>`;
}

// ---------- Semaine ----------

function previousWeight(wKey) {
  let k = wKey;
  for (let i = 0; i < 12; i++) {
    k = ymd(addDays(parseYmd(k), -7));
    const w = getState().weeks[k];
    if (w && w.weight != null) return { weight: w.weight, week: isoWeek(parseYmd(k)) };
  }
  return null;
}

export function weekView(wKey) {
  const s = getState();
  const monday = parseYmd(wKey);
  const isCurrent = wKey === weekKey(today());
  const ws = weekScore(wKey);
  const w = ws.week;
  const doneDays = sessionsOfWeek(wKey);
  const all = ws.planned > 0 && ws.done >= ws.planned;

  const sessionRows = [];
  for (let i = 0; i < ws.planned; i++) {
    const dk = doneDays[i];
    sessionRows.push(checkRow({
      act: 'session-box', arg: String(i), checked: !!dk,
      label: `Séance ${i + 1}`,
      sub: dk ? `Faite ${fmtShort(parseYmd(dk))}` : 'À cocher une fois faite',
      highlight: !dk && i === doneDays.length && isCurrent
    }));
  }
  const extraSessions = Math.max(0, doneDays.length - ws.planned);

  const prev = previousWeight(wKey);
  let delta = 'Une fois par semaine, à jeun au réveil';
  if (w.weight != null && prev) {
    const diff = Math.round((w.weight - prev.weight) * 10) / 10;
    delta = `${diff > 0 ? '+' : ''}${frDec(diff)} kg vs sem. ${prev.week}`;
  }

  const habits = s.habits.filter((h) => h.rhythm === 'week' && habitActiveOn(h, ymd(addDays(monday, 6))));
  const coachName = esc(s.coachName || 'Pierre');

  return `${pageHead({
      kicker: `Semaine ${isoWeek(monday)} · ${esc(weekRangeLabel(monday))}`,
      title: 'Ma semaine',
      right: `<div class="headnav">
        <button type="button" class="iconbtn sm" data-act="week-prev" aria-label="Semaine précédente">${icon.prev()}</button>
        <span class="headxp">+${ws.total}<small> / ${weekMax()}</small></span>
        <button type="button" class="iconbtn sm" data-act="week-next" aria-label="Semaine suivante"${isCurrent ? ' disabled' : ''}>${icon.next()}</button>
      </div>`
    })}
    <main class="main">
      ${isOn('session') ? `<section class="sec">
        <div class="sec-h"><h2>Séances</h2><span class="tag${all ? ' ok' : ''}">${all ? `+${XP.allSessions} XP gagnés` : `+${XP.allSessions} XP si toutes faites`}</span></div>
        <span class="lab">Combien de séances cette semaine ?</span>
        ${segmented('Séances prévues', [1, 2, 3, 4, 5, 6, 7], ws.planned, 'planned')}
        <div class="list">${sessionRows.join('')}</div>
        <p class="hint">${ws.done} / ${ws.planned} faites${extraSessions ? ` · ${extraSessions} en plus du plan` : ''}. Une case cochée ici coche la séance du jour.</p>
      </section>` : ''}

      ${isOn('weight') ? `<section class="sec">
        <div class="sec-h"><h2>Pesée de la semaine</h2><span class="tag${w.weight != null ? ' ok' : ''}">${w.weight != null ? `+${XP.weight}` : XP.weight} XP</span></div>
        <div class="grid2 mid">
          <div class="bigfield"><input class="input big" inputmode="decimal" data-input="weight" value="${w.weight != null ? frDec(w.weight) : ''}" placeholder="—" aria-label="Poids à jeun en kg"><span class="unit">kg</span></div>
          <p class="hint">${esc(delta)}</p>
        </div>
      </section>` : ''}

      ${isOn('video') || isOn('review') ? `<section class="sec">
        <div class="sec-h"><h2>Coach</h2></div>
        <div class="list">
          ${isOn('video') ? checkRow({ act: 'toggle-video', checked: w.video, label: `Vidéos envoyées à ${coachName}`, sub: 'Tes séries clés filmées', xp: w.video ? `+${XP.video}` : XP.video }) : ''}
          ${isOn('review') ? checkRow({ act: 'toggle-review', checked: !!w.sentAt, label: `Bilan de la semaine avec ${coachName}`, sub: 'Par message, appel ou en séance', xp: w.sentAt ? `+${XP.review}` : XP.review }) : ''}
        </div>
      </section>` : ''}

      ${habits.length ? `<section class="sec">
        <div class="sec-h"><h2>Mes habitudes de la semaine</h2></div>
        <div class="list">${habits.map((h) => checkRow({ act: 'toggle-habit', arg: h.id, checked: !!w.habits[h.id], label: h.name, xp: w.habits[h.id] ? `+${XP.habit}` : XP.habit })).join('')}</div>
      </section>` : ''}

      ${isOn('rehab') ? `<section class="sec">
        <div class="sec-h"><h2>Retour rehab</h2><span class="tag">Sans XP</span></div>
        ${checkRow({ act: 'toggle-rehab', checked: w.rehab, label: 'Rehab faite cette semaine', sub: 'Kiné, ostéo ou tes exercices de rehab' })}
      </section>` : ''}

      ${!['session', 'weight', 'video', 'review', 'rehab'].some(isOn) && !habits.length ? '<p class="hint center">Rien cette semaine. Active des routines dans <a href="#/habitudes">Mes habitudes</a>.</p>' : ''}

    </main>
    ${nav('semaine')}`;
}

// ---------- Mois ----------

export function monthView(mKey) {
  const s = getState();
  const first = parseMonth(mKey);
  const isCurrent = mKey === monthKey(today());
  const m = getMonth(mKey);
  const last = lastDayOfMonth(first);
  const habits = s.habits.filter((h) => h.rhythm === 'month' && habitActiveOn(h, ymd(last)));
  const created = parseYmd(s.createdAt);

  const history = [];
  for (let i = 1; i <= 6; i++) {
    const md = addMonths(first, -i);
    if (md < new Date(created.getFullYear(), created.getMonth(), 1)) break;
    const k = monthKey(md);
    const hm = getMonth(k);
    history.push(`<li><span>${esc(fmtMonth(md))}</span><span class="${hm.coachPaid ? 'ok' : 'muted'}">${hm.coachPaid ? `${icon.check(14)} Réglé${hm.paidAt ? ' le ' + esc(fmtDayMonth(new Date(hm.paidAt))) : ''}` : 'Non coché'}</span></li>`);
  }

  return `${pageHead({
      kicker: String(first.getFullYear()),
      title: esc(monthName(first)),
      right: `<div class="headnav">
        <button type="button" class="iconbtn sm" data-act="month-prev" aria-label="Mois précédent">${icon.prev()}</button>
        <button type="button" class="iconbtn sm" data-act="month-next" aria-label="Mois suivant"${isCurrent ? ' disabled' : ''}>${icon.next()}</button>
      </div>`
    })}
    <main class="main">
      ${isOn('coachPaid') ? `<section class="sec">
        <div class="sec-h"><h2>À faire ce mois-ci</h2></div>
        <button type="button" class="item bigcheck${m.coachPaid ? '' : ' hl'}" role="checkbox" aria-checked="${m.coachPaid}" data-act="toggle-paid">
          <span class="box lg${m.coachPaid ? ' on' : ' warn'}">${m.coachPaid ? icon.check(20) : ''}</span>
          <span class="lbl"><span class="t up">Payer le coach</span></span>
        </button>
      </section>` : ''}

      ${!isOn('coachPaid') && !habits.length ? '<p class="hint center">Rien ce mois-ci. Active des routines dans <a href="#/habitudes">Mes habitudes</a>.</p>' : ''}

      ${habits.length ? `<section class="sec">
        <div class="sec-h"><h2>Mes habitudes du mois</h2></div>
        <div class="list">${habits.map((h) => checkRow({ act: 'toggle-habit', arg: h.id, checked: !!m.habits[h.id], label: h.name, xp: m.habits[h.id] ? `+${XP.habit}` : XP.habit })).join('')}</div>
      </section>` : ''}

      ${history.length ? `<section class="sec">
        <div class="sec-h"><h2 class="muted">Mois précédents</h2></div>
        <ul class="history">${history.join('')}</ul>
      </section>` : ''}
    </main>
    ${nav('mois')}`;
}

// ---------- Social (prochainement) ----------

export function socialView() {
  return `${pageHead({ kicker: 'Ce que font les autres', title: 'Social' })}
    <main class="main">
      <section class="card soon">
        <span class="soon-ic">${icon.people()}</span>
        <span class="pill red">Prochainement</span>
        <h2>Voir les autres athlètes ONI</h2>
        <p>Bientôt, tu pourras suivre ce que font les autres et les encourager. Sans classement, sans comparaison : juste de la motivation.</p>
      </section>
    </main>
    ${nav('communaute')}`;
}

// ---------- Habitudes ----------

export function habitsView(ui) {
  const mine = activeHabits();
  const rhythmLabel = { day: 'Chaque jour', week: 'Chaque semaine', month: 'Chaque mois' };
  const groups = [{ id: 'day', name: 'Chaque jour' }, { id: 'week', name: 'Chaque semaine' }, { id: 'month', name: 'Chaque mois' }];
  const toggle = (r) => {
    const on = isOn(r.id);
    return `<button type="button" class="item toggle" role="switch" aria-checked="${on}" data-act="routine" data-arg="${r.id}">
      <span class="lbl"><span class="t">${esc(r.name)}</span></span>
      <span class="xp${on ? ' on' : ''}">${esc(r.xp)}</span>
      <span class="switch${on ? ' on' : ''}" aria-hidden="true"><i></i></span>
    </button>`;
  };
  return `${pageHead({ back: '#/jour', kicker: 'Ta routine', title: 'Mes habitudes' })}
    <main class="main">
      <section class="sec">
        <div class="sec-h"><h2>De base</h2><span class="tag">Active ce qui te concerne</span></div>
        ${groups.map((g) => `<span class="lab">${g.name}</span>
        <div class="list">${ROUTINES.filter((r) => r.rhythm === g.id).map(toggle).join('')}</div>`).join('')}
      </section>

      <section class="sec">
        <div class="sec-h"><h2>Les miennes</h2><span class="tag">${mine.length}</span></div>
        ${mine.length ? `<div class="list">${mine.map((h) => `<div class="item static mine">
            <span class="lbl"><span class="t">${esc(h.name)}</span><span class="s">${rhythmLabel[h.rhythm]}</span></span>
            <span class="xp on">+${XP.habit}</span>
            <button type="button" class="iconbtn sm" data-act="habit-remove" data-arg="${esc(h.id)}" aria-label="Supprimer ${esc(h.name)}">${icon.close()}</button>
          </div>`).join('')}</div>` : '<p class="hint">Aucune pour l’instant. Crée la tienne juste en dessous.</p>'}
      </section>

      <section class="sec card new">
        <div class="sec-h"><h2>Créer une habitude</h2></div>
        <label class="lab" for="hname">Nom</label>
        <input id="hname" class="input" data-input="habit-name" data-live="1" value="${esc(ui.habitName)}" maxlength="40" placeholder="Ex. Lire 10 pages, gainage 2 min…">
        <span class="lab">Rythme</span>
        ${segmented('Rythme', [{ value: 'day', label: 'Jour' }, { value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }], ui.habitRhythm, 'habit-rhythm')}
        <button type="button" class="btn" data-act="habit-add">Ajouter à ma routine</button>
        <p class="hint">+${XP.habit} XP à chaque fois que tu la coches.</p>
      </section>
    </main>`;
}

// ---------- Profil ----------

function calendar() {
  const s = getState();
  const created = s.createdAt;
  const now = ymd(today());
  const startMonday = addDays(mondayOf(today()), -28);
  const rows = [];
  let validated = 0; let counted = 0;
  for (let w = 0; w < 5; w++) {
    const monday = addDays(startMonday, w * 7);
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const k = ymd(addDays(monday, i));
      let cls = 'f';
      if (k > now) cls = 'f';
      else if (k < created) cls = 'x';
      else {
        const sc = dayScore(k);
        if (k === now && !sc.complete) cls = sc.base > 0 ? 'p t' : 't';
        else if (sc.complete) cls = 'c';
        else if (sc.base > 0) cls = 'p';
        else cls = 'm';
        if (k !== now) { counted++; if (sc.complete) validated++; }
        if (k === now && sc.complete) { counted++; validated++; }
      }
      cells.push(`<i class="${cls}"></i>`);
    }
    rows.push(`<div class="calrow"><span>S${isoWeek(monday)}</span>${cells.join('')}</div>`);
  }
  const pct = counted ? Math.round((validated / counted) * 100) : 0;
  return { html: rows.join(''), pct, counted };
}

function weightChart() {
  const s = getState();
  const pts = Object.keys(s.weeks).sort().filter((k) => s.weeks[k].weight != null).slice(-10)
    .map((k) => ({ k, v: s.weeks[k].weight }));
  if (pts.length < 2) return '';
  const vals = pts.map((p) => p.v);
  let min = Math.min(...vals); let max = Math.max(...vals);
  if (max - min < 1) { max += 0.5; min -= 0.5; }
  const W = 340; const H = 80; const P = 12;
  const x = (i) => P + (i * (W - 2 * P)) / (pts.length - 1);
  const y = (v) => P + ((max - v) * (H - 2 * P)) / (max - min);
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const first = pts[0]; const last = pts[pts.length - 1];
  return `<section class="sec">
      <div class="sec-h"><h2>Pesée hebdo</h2><span class="tag">${frDec(first.v)} → ${frDec(last.v)} kg</span></div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Poids des dernières semaines, de ${frDec(first.v)} à ${frDec(last.v)} kg">
        <polyline points="${line}" class="ln"/>
        ${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3}" class="${i === pts.length - 1 ? 'last' : ''}"/>`).join('')}
      </svg>
    </section>`;
}

export function profileView(env) {
  const s = getState();
  const p = s.profile || { name: '' };
  const initials = (p.name || 'ONI').split(/\s+/).map((x) => x.charAt(0)).join('').slice(0, 2).toUpperCase();
  const xp = totalXp();
  const r = rankOf(xp);
  const st = streaks();
  const cal = calendar();
  const rankSegs = RANKS.map((rk, i) => {
    if (i < r.index) return '<i class="on"></i>';
    if (i === r.index) return `<i style="background:linear-gradient(90deg,var(--red) ${Math.round(r.pct * 100)}%,var(--track) ${Math.round(r.pct * 100)}%)"></i>`;
    return '<i></i>';
  }).join('');

  return `<header class="top profile">
      <span class="avatar">${esc(initials)}</span>
      <div class="head-txt"><h1 class="title">${esc(p.name || 'Athlète')}</h1><div class="kicker">ONI Coaching</div></div>
    </header>
    <main class="main">
      <section class="card rankcard">
        <div class="xprow">
          <div><div class="kicker">Rang ${r.index + 1} sur ${RANKS.length}</div><div class="rankname">${esc(r.rank.name)}</div></div>
          <div class="big">${fr(xp)}<small> XP</small></div>
        </div>
        <div class="ranksegs">${rankSegs}</div>
        <div class="ranklabels">${RANKS.map((rk, i) => `<span class="${i === r.index ? 'on' : ''}">${esc(rk.name)}</span>`).join('')}</div>
        <p class="hint">${r.next ? `${fr(r.toNext)} XP avant ${esc(r.next.name)}` : 'Tu as atteint le dernier rang.'}</p>
      </section>

      <div class="stats">
        <div class="card"><b class="red">${st.current} j</b><span>Série actuelle</span></div>
        <div class="card"><b>${st.best} j</b><span>Meilleure série</span></div>
        <div class="card"><b>${st.jokerLeft}</b><span>Joker dispo</span></div>
      </div>

      <section class="sec">
        <div class="sec-h"><h2>5 dernières semaines</h2><span class="tag">${cal.counted ? `${cal.pct} % de jours complets` : ''}</span></div>
        <div class="calrow head"><span></span><b>L</b><b>M</b><b>M</b><b>J</b><b>V</b><b>S</b><b>D</b></div>
        <div class="cal">${cal.html}</div>
        <div class="legend"><span><i class="c"></i>Complète</span><span><i class="p"></i>Partielle</span><span><i class="m"></i>Rien</span><span><i class="t"></i>Aujourd'hui</span></div>
      </section>

      ${weightChart()}
      ${accountBlock()}

      <section class="sec">
        <div class="menu">
          <a href="#/objectifs">Mes objectifs et mon profil<span>›</span></a>
          <a href="#/habitudes">Mes habitudes<span>›</span></a>
          ${env.canInstall ? '<button type="button" data-act="install">Installer l’app sur ce téléphone<span>›</span></button>' : ''}
          <button type="button" data-act="export">${icon.download()} Exporter mes données<span>›</span></button>
          <button type="button" data-act="import">${icon.upload()} Importer une sauvegarde<span>›</span></button>
        </div>
        ${env.iosHint ? '<p class="hint card iosnote">Sur iPhone : touche <b>Partager</b> dans Safari puis <b>« Sur l’écran d’accueil »</b> pour installer ONI Habits.</p>' : ''}
        <p class="hint">Tes données restent sur ce téléphone, rien n'est envoyé. Exporte-les de temps en temps pour les garder en sécurité.</p>
        <input type="file" id="import-file" accept="application/json,.json" hidden>
      </section>
    </main>
    ${nav('profil')}`;
}

// ---------- Objectifs ----------

export function targetsView() {
  const s = getState();
  const p = s.profile || {};
  return `${pageHead({ back: '#/profil', kicker: 'Réglages', title: 'Mes objectifs' })}
    <main class="main">
      <section class="sec card form">
        <div class="sec-h"><h2>Profil</h2></div>
        <label class="lab" for="p-name">Prénom</label>
        <input id="p-name" class="input" data-input="p-name" value="${esc(p.name || '')}">
        <label class="lab" for="p-coach">Prénom du coach</label>
        <input id="p-coach" class="input" data-input="coach-name" value="${esc(s.coachName || 'Pierre')}">
      </section>

      <section class="sec card form">
        <div class="sec-h"><h2>Objectifs</h2><span class="tag">Ceux de ton coach</span></div>
        ${targetFields(s.targets)}
      </section>

      <section class="sec">
        <button type="button" class="btn ghost danger" data-act="reset">Tout effacer sur ce téléphone</button>
      </section>
    </main>`;
}
