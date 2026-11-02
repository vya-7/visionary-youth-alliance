/* TalentVerse Network — shared across every site (identical file everywhere).
   Each page sets   window.TVNET_SITE = 'your-site-id'   before loading this module.
   Uses its own Firebase project (tv-network-hub): no personal data, only nickname + scores. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const cfg = {
  apiKey: "AIzaSyCa0pO6ZYJfCeIzqdfMpJmBAA3-qpnM5cw",
  authDomain: "tv-network-hub.firebaseapp.com",
  projectId: "tv-network-hub",
  storageBucket: "tv-network-hub.firebasestorage.app",
  messagingSenderId: "1072480251627",
  appId: "1:1072480251627:web:dc6cadaeff460cf72ad8ae"
};
const app = (getApps().find(a => a.name === 'tvnet')) || initializeApp(cfg, 'tvnet');
const db = getFirestore(app);
const auth = getAuth(app);
const GAMES = ['memory', 'scramble', 'rush'];
const guess = (function () { var h = location.hostname; return h.indexOf('talentversebd') === 0 ? 'tvbd' : h.indexOf('vya-7') === 0 ? 'vya' : h.indexOf('fahad-abdur') === 0 ? 'fahad' : 'unknown'; })();
const siteId = String(window.TVNET_SITE || guess).trim().toLowerCase();
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
let sitesCache = null, userP = null;

function user() {
  if (userP) return userP;
  userP = (async () => {
    try { await auth.authStateReady(); } catch (e) {}
    if (auth.currentUser) return auth.currentUser;   /* keep an existing login (e.g. the admin's Google sign-in) */
    try { return (await signInAnonymously(auth)).user; } catch (e) { userP = null; throw e; }
  })();
  return userP;
}
async function getSites(force) {
  if (sitesCache && !force) return sitesCache;
  try {
    const s = await getDocs(collection(db, 'sites'));
    sitesCache = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => x.active !== false)
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  } catch (e) { sitesCache = sitesCache || []; }
  return sitesCache;
}
function getName() { return ls.get('tvnet_name') || ''; }
function setName(n) { n = String(n || '').replace(/[<>]/g, '').trim().slice(0, 24); if (n) ls.set('tvnet_name', n); return n; }
function localBest(game) { return parseInt(ls.get('tvnet_best_' + siteId + '_' + game) || '0', 10) || 0; }

/* Save a score. Keeps only the best per player per site. Returns {saved, best, online} */
async function submit(game, score) {
  if (!GAMES.includes(game)) return { saved: false, best: 0, online: false };
  score = Math.max(0, Math.min(100000, Math.floor(Number(score) || 0)));
  const prev = localBest(game);
  const best = Math.max(prev, score);
  if (score > prev) ls.set('tvnet_best_' + siteId + '_' + game, String(score));
  const name = getName();
  if (!name || score <= 0) return { saved: false, best, online: true };
  try {
    const u = await user();
    const ref = doc(db, 'lb_' + game, siteId + '_' + u.uid);
    const snap = await getDoc(ref);
    const old = snap.exists() ? (snap.data().score || 0) : -1;
    if (old >= score && snap.exists() && snap.data().name === name) return { saved: false, best: Math.max(best, old), online: true };
    await setDoc(ref, { uid: u.uid, siteId, name, score: Math.max(score, old), updatedAt: Date.now() });
    return { saved: true, best: Math.max(best, old, score), online: true };
  } catch (e) { return { saved: false, best, online: false, error: String(e.code || e.message || e) + ' @' + siteId }; }
}
async function top(game, n) {
  if (!GAMES.includes(game)) return [];
  try {
    const s = await getDocs(query(collection(db, 'lb_' + game), orderBy('score', 'desc'), limit(n || 100)));
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
}
async function myUid() { try { return (await user()).uid; } catch (e) { return null; } }

/* ---- admin helpers (only work for the allowed Google account in the Rules) ---- */
const admin = {
  login: () => signInWithPopup(auth, new GoogleAuthProvider()),
  logout: () => signOut(auth).then(() => { userP = null; }),
  onUser: cb => onAuthStateChanged(auth, cb),
  saveSite: (id, data) => setDoc(doc(db, 'sites', id), data, { merge: true }),
  deleteSite: id => deleteDoc(doc(db, 'sites', id)),
  deleteScore: (game, id) => deleteDoc(doc(db, 'lb_' + game, id)),
  /* notices */
  listNotices: async () => (await getDocs(query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(50)))).docs.map(d => ({ id: d.id, ...d.data() })),
  saveNotice: (id, data) => setDoc(doc(db, 'notices', id), data),
  deleteNotice: id => deleteDoc(doc(db, 'notices', id)),
  /* dashboard numbers (admin only) — doc id: {siteId}_{YYYY-MM} */
  getStats: async month => (await getDocs(query(collection(db, 'stats'), where('month', '==', month)))).docs.map(d => ({ id: d.id, ...d.data() })),
  saveStat: (siteId, month, data) => setDoc(doc(db, 'stats', siteId + '_' + month), { siteId, month, ...data, updatedAt: Date.now() }),
  /* network top member — doc id: YYYY-MM */
  listTops: async () => (await getDocs(query(collection(db, 'topMembers'), orderBy('month', 'desc'), limit(12)))).docs.map(d => ({ id: d.id, ...d.data() })),
  saveTop: (month, data) => setDoc(doc(db, 'topMembers', month), { month, ...data, publishedAt: Date.now() }),
  deleteTop: month => deleteDoc(doc(db, 'topMembers', month))
};
async function latestTop() {
  try { const s = await getDocs(query(collection(db, 'topMembers'), orderBy('month', 'desc'), limit(1))); return s.docs.length ? { id: s.docs[0].id, ...s.docs[0].data() } : null; } catch (e) { return null; }
}

window.TVNet = { siteId, GAMES, getSites, getName, setName, localBest, submit, top, myUid, admin, db, latestTop };
window.dispatchEvent(new Event('tvnet-ready'));
