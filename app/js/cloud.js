// Compte et sauvegarde en ligne (Supabase).
// Le téléphone reste la source principale : l'app marche hors ligne, et chaque changement
// est envoyé sur le compte dès que possible. Sur un autre téléphone, se connecter suffit
// pour tout récupérer.

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js';
import { getState, hasLocalData, replaceState, subscribe } from './store.js';

// Chargé à la demande : sans réseau ni compte, l'app n'en a pas besoin.
const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
const TABLE = 'user_state';
const LINK_KEY = 'oni-habits:account'; // compte déjà synchronisé sur ce téléphone

export const cloud = {
  enabled: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
  ready: false, // session vérifiée (ou impossible à vérifier hors ligne)
  user: null,
  status: 'off', // off | syncing | ok | offline | error
  lastSync: null
};

let sb = null;
let notify = () => {};
let pushTimer = null;
let pulling = false;

export function onCloudChange(fn) { notify = fn; }

function setStatus(s) { cloud.status = s; notify(); }

async function client() {
  if (sb) return sb;
  const { createClient } = await import(SDK);
  sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return sb;
}

function linkedUser() { try { return localStorage.getItem(LINK_KEY); } catch (e) { return null; } }
function setLinkedUser(id) { try { if (id) localStorage.setItem(LINK_KEY, id); else localStorage.removeItem(LINK_KEY); } catch (e) { /* rien */ } }

export async function initCloud() {
  if (!cloud.enabled) return;
  subscribe((state, origin) => { if (origin !== 'remote') schedulePush(); });
  window.addEventListener('online', () => push());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pull(); else push();
  });
  try {
    const c = await client();
    c.auth.onAuthStateChange((event, session) => {
      const u = session ? session.user : null;
      const changed = (u && u.id) !== (cloud.user && cloud.user.id);
      cloud.user = u;
      if (changed && u) pull();
      if (!u) cloud.status = 'off';
      notify();
    });
    const { data } = await c.auth.getSession();
    cloud.user = data.session ? data.session.user : null;
    // Retour de la page Google : on nettoie l'adresse (?code=…).
    if (location.search.includes('code=')) history.replaceState(null, '', location.pathname + (location.hash || '#/profil'));
    cloud.ready = true;
    notify();
    if (cloud.user) await pull();
  } catch (e) {
    cloud.status = 'offline';
  }
  cloud.ready = true;
  notify();
}

// Prénom donné par Google, pour préremplir l'accueil.
export function accountFirstName() {
  const m = (cloud.user && cloud.user.user_metadata) || {};
  return m.given_name || (m.full_name || m.name || '').split(' ')[0] || '';
}

async function pull() {
  if (!cloud.user || !sb || pulling) return;
  if (!navigator.onLine) { setStatus('offline'); return; }
  pulling = true;
  setStatus('syncing');
  try {
    const { data, error } = await sb.from(TABLE).select('data, updated_at').eq('user_id', cloud.user.id).maybeSingle();
    if (error) throw error;
    const local = getState();
    const localAt = Date.parse(local.updatedAt || 0) || 0;
    if (!data) {
      await push(true); // premier envoi de ce compte
    } else {
      const remoteAt = Date.parse(data.updated_at) || 0;
      const firstTimeHere = linkedUser() !== cloud.user.id;
      if (!hasLocalData()) {
        replaceState(data.data);
      } else if (firstTimeHere && Math.abs(remoteAt - localAt) > 1000) {
        // Ce téléphone a ses propres données et le compte aussi : on demande.
        const keepAccount = window.confirm('Ton compte a déjà des données. OK : garder celles du compte. Annuler : garder celles de ce téléphone.');
        if (keepAccount) replaceState(data.data); else await push(true);
      } else if (remoteAt > localAt) {
        replaceState(data.data);
      } else if (localAt > remoteAt) {
        await push(true);
      }
    }
    setLinkedUser(cloud.user.id);
    cloud.lastSync = new Date();
    setStatus('ok');
  } catch (e) {
    console.warn('Synchro impossible', e);
    setStatus(navigator.onLine ? 'error' : 'offline');
  } finally {
    pulling = false;
  }
}

function schedulePush() {
  if (!cloud.user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => push(), 1500);
}

async function push(inPull = false) {
  if (!cloud.user || !sb) return;
  if (!navigator.onLine) { setStatus('offline'); return; }
  const s = getState();
  if (!inPull) setStatus('syncing');
  const { error } = await sb.from(TABLE).upsert({
    user_id: cloud.user.id,
    data: s,
    updated_at: s.updatedAt || new Date().toISOString()
  });
  if (error) {
    console.warn('Envoi impossible', error);
    if (inPull) throw error;
    setStatus('error');
    return;
  }
  cloud.lastSync = new Date();
  if (!inPull) setStatus('ok');
}

export const syncNow = () => pull();

export async function signInGoogle() {
  const c = await client();
  const { error } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/` } });
  if (error) throw error;
}

export async function sendCode(email) {
  const c = await client();
  const { error } = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/` } });
  if (error) throw error;
}

export async function verifyCode(email, token) {
  const c = await client();
  const { error } = await c.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
}

export async function signOut() {
  const c = await client();
  await push().catch(() => {});
  await c.auth.signOut();
  cloud.user = null;
  cloud.status = 'off';
  setLinkedUser(null);
  notify();
}
