import React, { useState, useEffect, useRef } from 'react';
import { ref, get, set, remove, onValue } from 'firebase/database';
import { db } from './firebase';

// ============================================================
// PAIR UP — Team Bonding Game v2
// ============================================================
const SESSION_PATH = 'session';

// ---------- COLORS (30) ----------
const COLORS = [
  { name: 'Crimson',   bg: '#E53935', text: '#FFFFFF' },
  { name: 'Tangerine', bg: '#FB8C00', text: '#FFFFFF' },
  { name: 'Sunshine',  bg: '#FDD835', text: '#3D2C00' },
  { name: 'Lime',      bg: '#7CB342', text: '#FFFFFF' },
  { name: 'Emerald',   bg: '#00897B', text: '#FFFFFF' },
  { name: 'Sky',       bg: '#039BE5', text: '#FFFFFF' },
  { name: 'Indigo',    bg: '#3949AB', text: '#FFFFFF' },
  { name: 'Violet',    bg: '#8E24AA', text: '#FFFFFF' },
  { name: 'Rose',      bg: '#EC407A', text: '#FFFFFF' },
  { name: 'Slate',     bg: '#546E7A', text: '#FFFFFF' },
  { name: 'Coral',     bg: '#FF7043', text: '#FFFFFF' },
  { name: 'Mint',      bg: '#26A69A', text: '#FFFFFF' },
  { name: 'Lavender',  bg: '#7E57C2', text: '#FFFFFF' },
  { name: 'Cocoa',     bg: '#8D6E63', text: '#FFFFFF' },
  { name: 'Sea',       bg: '#0288D1', text: '#FFFFFF' },
  { name: 'Ruby',      bg: '#C2185B', text: '#FFFFFF' },
  { name: 'Amber',     bg: '#FFA000', text: '#3D2C00' },
  { name: 'Mustard',   bg: '#F9A825', text: '#3D2C00' },
  { name: 'Forest',    bg: '#2E7D32', text: '#FFFFFF' },
  { name: 'Teal',      bg: '#00695C', text: '#FFFFFF' },
  { name: 'Cobalt',    bg: '#1565C0', text: '#FFFFFF' },
  { name: 'Plum',      bg: '#6A1B9A', text: '#FFFFFF' },
  { name: 'Magenta',   bg: '#D81B60', text: '#FFFFFF' },
  { name: 'Charcoal',  bg: '#37474F', text: '#FFFFFF' },
  { name: 'Salmon',    bg: '#FF8A65', text: '#FFFFFF' },
  { name: 'Aqua',      bg: '#00ACC1', text: '#FFFFFF' },
  { name: 'Lilac',     bg: '#9575CD', text: '#FFFFFF' },
  { name: 'Caramel',   bg: '#6D4C41', text: '#FFFFFF' },
  { name: 'Cyan',      bg: '#00BCD4', text: '#FFFFFF' },
  { name: 'Marigold',  bg: '#F57F17', text: '#FFFFFF' },
];

// ---------- HIDDEN PROFILE QUESTIONS ----------
const PROFILE_QUESTIONS = [
  { key: 'season', label: 'Koje ti je najdraže godišnje doba?', placeholder: 'npr. ljeto' },
  { key: 'snack',  label: 'Koji ti je najdraži snack?',          placeholder: 'npr. čokolada' },
  { key: 'drink',  label: 'Koje ti je najdraže piće?',           placeholder: 'npr. kava' },
];

// ---------- ACTIVITIES ----------
// Get to know — 12 questions (need 4 per game). Thumbs voting.
const GET_TO_KNOW = [
  "Da tvoj život ima theme song koji svira svaki put kad uđeš u prostoriju, koja bi to pjesma bila?",
  "Koji je tvoj hobi ili zanimanje za koje drugi ne bi rekli da ga imaš?",
  "U paru naizmjenično imenujte 6 stvari koje bi svatko od vas ponio sa sobom na pusti otok. Na kraju od navedenog složite svoj brzi (zajednički) survival pack.",
  "Podučite drugu osobu jednoj riječi iz jezika koji ona ne poznaje, a obavezno uz riječ naučite i gestu povezanu s riječju (može biti izmišljena).",
  "Reci drugoj osobi koje je tvoje najdraže putovanje i zašto.",
];

// Riddles & challenges — mix of equations (1 correct answer) and challenges (thumbs)
const RIDDLES = [
  // Challenges — type 'challenge', thumbs voting
  { type: 'challenge', prompt: "Ispričaj najsmiješniji vic koji znaš." },
  { type: 'challenge', prompt: "Osmisli zdravicu sa svojim parom, i nazdravi vašem prijateljstvu." },
  // Equations — type 'equation', exact match (case-insensitive, ignore extra spaces)
  // 2 mathematical:
  { type: 'equation', prompt: "Farmer ima 17 ovaca. Sve osim 9 ugine. Koliko mu ovaca ostaje?", answers: ['9', 'devet'] },
  { type: 'equation', prompt: "Koji je sljedeći broj u nizu?\n2, 6, 12, 20, 30, ?", answers: ['42'] },
  // 3 verbal (Croatian):
  { type: 'equation', prompt: "Što više sušiš, to postaje sve vlažnije. Što je to?", answers: ['ručnik', 'rucnik'] },
  { type: 'equation', prompt: "Imam glavu i rep, ali nemam tijelo. Što sam ja?", answers: ['kovanica', 'novčić', 'novcic', 'kuna', 'euro'] },
  { type: 'equation', prompt: "Što ima oko, ali ne vidi?", answers: ['igla', 'iglu'] },
];

// Mini games — 3 specific games per spec
const MINI_GAMES = [
  { id: 'clicking',  name: 'Clicking Contest',     subtitle: 'Najviše klikova u minuti pobjeđuje.' },
  { id: 'rps',       name: 'Kamen, Papir, Škare',  subtitle: 'Igra se na 2 dobivene runde.' },
  { id: 'mini-quiz', name: 'Mini Quiz',            subtitle: '3 pitanja — brži i točniji pobjeđuje.' },
];

// Mini-quiz questions (used by the mini-quiz game). Always the same 3 in this order.
const MINI_QUIZ_QUESTIONS = [
  { q: "Valcon u Hrvatskoj ima urede u 4 grada — Zagrebu, Splitu, Osijeku i?", a: ['rijeci', 'rijeka'] },
  { q: "Od koje inačice je dobiveno ime Valcon?", a: ['value consulting'] },
  { q: "Kako se zove Valconov interni alat koji služi za upisivanje sati, praćenje vijesti i podatke o zaposlenicima?", a: ['intranet'] },
];

// ---------- ROUND CONFIG ----------
// 4 get-to-know (3min) + 3 riddles (2min) + 3 mini-games (1min) = 10 rounds
const TOTAL_ROUNDS = 10;
const PAIRING_MS  = 60_000;   // 60s to find your group
const VOTING_MS   = 30_000;   // 30s to vote thumbs
const TRIAD_ANNOUNCE_MS = 5_000;
const RESULTS_MS  = 8_000;

function getRoundConfig(round) {
  if (round <= 4) return { category: 'get-to-know', durationMs: 180_000, label: 'Get to know' };
  if (round <= 7) return { category: 'riddles',     durationMs: 120_000, label: 'Riddles & challenges' };
  return                  { category: 'mini-games', durationMs: 60_000,  label: 'Mini games' };
}

function isTriadRound(round) {
  if (round % 3 !== 0) return false;
  const cfg = getRoundConfig(round);
  return cfg.category !== 'mini-games'; // no triads in mini-games
}

// ---------- FIREBASE HELPERS ----------
async function getSession() {
  try { const s = await get(ref(db, SESSION_PATH)); return s.exists() ? s.val() : null; }
  catch (e) { console.error(e); return null; }
}
async function setSession(s) {
  try { await set(ref(db, SESSION_PATH), s); return true; }
  catch (e) { console.error(e); return false; }
}
async function deleteSession() {
  try { await remove(ref(db, SESSION_PATH)); return true; }
  catch (e) { console.error(e); return false; }
}
function subscribeToSession(cb) {
  return onValue(ref(db, SESSION_PATH), (s) => cb(s.exists() ? s.val() : null));
}

// ---------- UTILITIES ----------
function generateCode() { return Math.floor(1000 + Math.random() * 9000).toString(); }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function makeGroups(ids, triad) {
  // Returns array of groups of size 2 (or 3 if triad).
  // If triad and ids.length isn't divisible by 3, fall back to mostly pairs + one triad.
  const shuffled = shuffle(ids);
  const groups = [];
  if (triad) {
    let i = 0;
    while (i + 3 <= shuffled.length) {
      groups.push(shuffled.slice(i, i + 3));
      i += 3;
    }
    const remaining = shuffled.slice(i);
    if (remaining.length === 2) groups.push(remaining);
    else if (remaining.length === 1) {
      // Append the lone person to the last group (creates a 4-person group — rare edge case)
      if (groups.length > 0) groups[groups.length - 1].push(remaining[0]);
      else groups.push(remaining);
    }
  } else {
    for (let i = 0; i + 2 <= shuffled.length; i += 2) {
      groups.push(shuffled.slice(i, i + 2));
    }
    if (shuffled.length % 2 === 1) groups.push([shuffled[shuffled.length - 1]]); // lone person sits out
  }
  return groups;
}
function groupKey(group) { return [...group].sort().join('|'); }
function normAns(s) { return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' '); }
function checkAnswer(input, answers) {
  const n = normAns(input);
  return answers.some(a => normAns(a) === n);
}

// ---------- STYLES ----------
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800;9..144,900&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body, #root { margin: 0; padding: 0; height: 100%; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #0F0E17;
    color: #FFFFFE;
    overscroll-behavior: none;
  }
  .pu-display { font-family: 'Fraunces', serif; font-weight: 900; letter-spacing: -0.03em; line-height: 0.95; }
  .pu-serif { font-family: 'Fraunces', serif; }
  .pu-shell {
    min-height: 100vh;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 20px 32px;
    display: flex;
    flex-direction: column;
  }
  .pu-btn {
    appearance: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-weight: 600;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  .pu-btn:active { transform: scale(0.97); }
  .pu-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .pu-input {
    appearance: none;
    border: 2px solid rgba(255,255,254,0.15);
    background: rgba(255,255,254,0.05);
    color: #FFFFFE;
    font-family: inherit;
    font-size: 16px;
    padding: 14px 16px;
    border-radius: 12px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .pu-input:focus { border-color: #FF8906; background: rgba(255,255,254,0.08); }
  .pu-input::placeholder { color: rgba(255,255,254,0.35); }
  @keyframes pu-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .pu-fade { animation: pu-fade-in 0.4s ease forwards; }
  @keyframes pu-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
  .pu-pulse { animation: pu-pulse 1.6s ease-in-out infinite; }
  @keyframes pu-spin { to { transform: rotate(360deg); } }
  .pu-spin { animation: pu-spin 1s linear infinite; }
  @keyframes pu-flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .pu-flash { animation: pu-flash 1s ease-in-out infinite; }
`;

// ============================================================
// SMALL UI HELPERS
// ============================================================
function Spinner() {
  return <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,254,0.2)', borderTopColor: '#FF8906', borderRadius: '50%' }} className="pu-spin" />;
}

function Countdown({ deadline, urgentAt = 10 }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  if (!deadline) return null;
  const secLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
  const mm = Math.floor(secLeft / 60);
  const ss = secLeft % 60;
  const urgent = secLeft <= urgentAt;
  return (
    <div className={urgent && secLeft > 0 ? 'pu-flash' : ''} style={{
      fontFamily: 'Fraunces, serif',
      fontWeight: 800,
      fontSize: 28,
      color: urgent ? '#F25F4C' : '#FF8906',
      letterSpacing: '0.04em',
    }}>
      {mm}:{ss.toString().padStart(2, '0')}
    </div>
  );
}

function getJoinUrl() {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#join`;
}

function QRCode({ value, size = 140 }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let cancelled = false;
    const render = (lib) => {
      try {
        const qr = lib(0, 'M');
        qr.addData(value);
        qr.make();
        const count = qr.getModuleCount();
        const cell = size / count;
        let rects = '';
        for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            rects += `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="#0F0E17"/>`;
          }
        }
        if (!cancelled) setSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${rects}</svg>`);
      } catch (e) { console.error(e); }
    };
    if (window.qrcode) { render(window.qrcode); return; }
    const existing = document.querySelector('script[data-qrcode-lib]');
    if (existing) { existing.addEventListener('load', () => window.qrcode && render(window.qrcode)); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
    s.dataset.qrcodeLib = 'true';
    s.onload = () => window.qrcode && render(window.qrcode);
    document.head.appendChild(s);
    return () => { cancelled = true; };
  }, [value, size]);
  if (!svg) return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12 }}>Loading…</div>;
  return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function JoinCard({ code }) {
  const joinUrl = getJoinUrl();
  return (
    <div style={{
      background: 'linear-gradient(135deg, #FF8906 0%, #F25F4C 100%)',
      borderRadius: 20, padding: '24px 20px', color: '#0F0E17', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, letterSpacing: '0.3em', opacity: 0.7, marginBottom: 8 }}>JOIN CODE</div>
      <div className="pu-display" style={{ fontSize: 72, letterSpacing: '0.05em', lineHeight: 1 }}>{code}</div>
      <div style={{ marginTop: 16, background: '#FFFFFE', borderRadius: 14, padding: 12, display: 'inline-flex' }}>
        <QRCode value={joinUrl} size={140} />
      </div>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 12, wordBreak: 'break-all', lineHeight: 1.4 }}>
        Scan or visit<br /><strong style={{ fontWeight: 700 }}>{joinUrl}</strong>
      </div>
    </div>
  );
}

function CopyLinkRow() {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    const joinUrl = getJoinUrl();
    try { await navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = joinUrl; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
      document.body.removeChild(ta);
    }
  };
  return (
    <button className="pu-btn" onClick={onCopy} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      background: 'rgba(255,255,254,0.06)', color: copied ? '#7CB342' : 'rgba(255,255,254,0.85)',
      fontSize: 14, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,254,0.1)',
    }}>
      {copied ? '✓ Link copied' : '⎘ Copy join link'}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,254,0.04)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
      <div className="pu-display" style={{ fontSize: 26, color: '#FFFFFE' }}>{value}</div>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginTop: 2 }}>{label.toUpperCase()}</div>
    </div>
  );
}

// ============================================================
// LANDING
// ============================================================
function Landing({ onChoose }) {
  return (
    <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 32 }}>
      <div>
        <div style={{ fontSize: 12, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 16 }}>TEAM BONDING</div>
        <h1 className="pu-display" style={{ fontSize: 72, margin: '0 0 8px' }}>
          Pair<br/><span style={{ color: '#FF8906', fontStyle: 'italic' }}>Up.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
          Meet strangers. Find your color. Earn points. Have fun.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button className="pu-btn" onClick={() => onChoose('join')} style={{
          background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14,
        }}>I'm a participant →</button>
        <button className="pu-btn" onClick={() => onChoose('host')} style={{
          background: 'transparent', color: 'rgba(255,255,254,0.8)', fontSize: 15, padding: '14px 24px',
          borderRadius: 14, border: '2px solid rgba(255,255,254,0.15)',
        }}>I'm hosting this event</button>
      </div>
    </div>
  );
}

// ============================================================
// HOST: ROUND RUNNER — pure functions to compute next state
// ============================================================
function buildActivityPlan() {
  // Pre-shuffle activity indices so each session has a different order.
  // get-to-know: 5 available, we use 4 (so one random one is omitted per session — adds variety)
  // riddles: 7 available, we use 3
  // mini-games: 3 fixed, used in shuffled order
  return {
    'get-to-know': shuffle([...Array(GET_TO_KNOW.length).keys()]).slice(0, 4),
    'riddles':     shuffle([...Array(RIDDLES.length).keys()]).slice(0, 3),
    'mini-games':  shuffle([...Array(MINI_GAMES.length).keys()]).slice(0, 3),
  };
}

function getRoundActivity(session, round) {
  const cfg = getRoundConfig(round);
  const plan = session.activityPlan || {};
  if (cfg.category === 'get-to-know') {
    const slot = round - 1; // 0..3
    const idx = (plan['get-to-know'] || [])[slot] ?? 0;
    return { kind: 'thumbs', category: 'get-to-know', prompt: GET_TO_KNOW[idx] };
  }
  if (cfg.category === 'riddles') {
    const slot = round - 5; // 0..2
    const idx = (plan['riddles'] || [])[slot] ?? 0;
    const r = RIDDLES[idx];
    if (r.type === 'equation') return { kind: 'equation', category: 'riddles', prompt: r.prompt, answers: r.answers };
    return { kind: 'thumbs', category: 'riddles', prompt: r.prompt };
  }
  // mini-games
  const slot = round - 8; // 0..2
  const idx = (plan['mini-games'] || [])[slot] ?? 0;
  const g = MINI_GAMES[idx];
  if (g.id === 'mini-quiz') {
    return {
      kind: 'mini-game', miniGame: 'mini-quiz', category: 'mini-games',
      name: g.name, subtitle: g.subtitle, questions: MINI_QUIZ_QUESTIONS,
    };
  }
  return { kind: 'mini-game', miniGame: g.id, category: 'mini-games', name: g.name, subtitle: g.subtitle };
}

function detectReturning(group, pastGroups) {
  // Returns true if any pair within `group` already shared a past group.
  if (group.length < 2) return false;
  const set = new Set();
  for (const past of pastGroups || []) {
    if (!past || past.length < 2) continue;
    for (let i = 0; i < past.length; i++) for (let j = i + 1; j < past.length; j++) {
      set.add([past[i], past[j]].sort().join('|'));
    }
  }
  for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
    if (set.has([group[i], group[j]].sort().join('|'))) return true;
  }
  return false;
}

function scoreRound(session, round) {
  // Returns { pointsAwarded: { [id]: number }, finishOrder: [groupKey...] }
  const groups = session.groups || [];
  const colors = session.colors || {};
  const activity = session.currentActivity || {};
  const voting = session.voting || {};
  const finishTimes = []; // [{ key, t }]

  groups.forEach(g => {
    const key = groupKey(g);
    const v = voting[key];
    if (v?.finishedAt) finishTimes.push({ key, t: v.finishedAt });
  });
  finishTimes.sort((a, b) => a.t - b.t);
  const fastest3 = new Set(finishTimes.slice(0, 3).map(x => x.key));

  const points = {};
  groups.forEach(g => {
    if (g.length < 2) return; // solo sit-outs
    const key = groupKey(g);
    const v = voting[key] || {};
    const mult = fastest3.has(key) ? 2 : 1;

    let basePerPerson = 0;
    if (activity.kind === 'thumbs') {
      const ups = g.filter(id => v.thumbs && v.thumbs[id] === 'up').length;
      if (ups === g.length) basePerPerson = 2;
      else if (ups >= g.length - 1 && g.length >= 2) basePerPerson = 1;
      else basePerPerson = 0;
    } else if (activity.kind === 'equation') {
      basePerPerson = v.correct ? 1 : 0;
    } else if (activity.kind === 'mini-game') {
      // Determine winner. Falls back to computing from raw data if no winnerId set
      // (e.g., timer expired before resolution).
      let winnerId = v.winnerId;
      if (!winnerId && activity.miniGame === 'clicking') {
        // Clicking contest: most clicks wins. Tie → no winner.
        const taps = v.taps || {};
        const sorted = [...g].sort((a, b) => (taps[b] || 0) - (taps[a] || 0));
        if (sorted.length >= 2 && (taps[sorted[0]] || 0) > (taps[sorted[1]] || 0)) {
          winnerId = sorted[0];
        }
      }
      if (!winnerId && activity.miniGame === 'rps') {
        // RPS: whoever has more sub-round wins (tie → no winner)
        const rounds = v.rpsRounds || [];
        const scores = {};
        rounds.forEach(r => { if (r.winner) scores[r.winner] = (scores[r.winner] || 0) + 1; });
        const sorted = [...g].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
        if (sorted.length >= 2 && (scores[sorted[0]] || 0) > (scores[sorted[1]] || 0)) {
          winnerId = sorted[0];
        }
      }
      if (!winnerId && activity.miniGame === 'mini-quiz') {
        // Mini quiz: most correct answers wins; tiebreak = fastest total time
        const quiz = v.quiz || {};
        const stats = g.map(id => {
          const qa = quiz[id] || {};
          const correct = (qa.correct || []).filter(Boolean).length;
          const time = qa.totalTimeMs || Number.MAX_SAFE_INTEGER;
          return { id, correct, time };
        });
        stats.sort((a, b) => b.correct - a.correct || a.time - b.time);
        if (stats.length >= 2 && (stats[0].correct > stats[1].correct ||
            (stats[0].correct === stats[1].correct && stats[0].correct > 0 && stats[0].time < stats[1].time))) {
          winnerId = stats[0].id;
        }
      }
      if (winnerId && winnerId !== 'tie' && g.includes(winnerId)) {
        points[winnerId] = (points[winnerId] || 0) + (1 * mult);
      }
      g.forEach(id => { if (points[id] === undefined) points[id] = 0; });
      return; // skip the per-person assignment below
    }
    g.forEach(id => {
      points[id] = (points[id] || 0) + basePerPerson * mult;
    });
  });

  return { pointsAwarded: points, fastest3: [...fastest3] };
}

// ============================================================
// HOST DASHBOARD
// ============================================================
function HostDashboard({ onBack }) {
  const [session, setSessionState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const tickBusy = useRef(false);

  useEffect(() => {
    const unsub = subscribeToSession((s) => { setSessionState(s); setLoading(false); });
    return unsub;
  }, []);

  // ----- HOST TICK LOOP: advance phases when deadlines pass -----
  useEffect(() => {
    const id = setInterval(async () => {
      if (tickBusy.current) return;
      const s = await getSession();
      if (!s) return;
      const now = Date.now();
      try {
        tickBusy.current = true;
        // triad-announce timeout → pairing
        if (s.phase === 'triad-announce' && s.triadAnnounceDeadline && now >= s.triadAnnounceDeadline) {
          await beginPairing(s);
        }
        // pairing timeout OR all found → activity
        else if (s.phase === 'pairing' && s.pairingDeadline) {
          const groups = s.groups || [];
          const confirmed = s.foundConfirmed || {};
          const allFound = groups.filter(g => g.length >= 2).every(g => {
            const c = confirmed[groupKey(g)] || {};
            return g.every(id => c[id]);
          });
          if (allFound || now >= s.pairingDeadline) {
            await beginActivity(s);
          }
        }
        // activity timeout OR all groups done → voting (or directly to results for equation/mini-game)
        else if (s.phase === 'activity' && s.activityDeadline) {
          const activity = s.currentActivity || {};
          const groups = s.groups || [];
          const voting = s.voting || {};
          const allDone = groups.filter(g => g.length >= 2).every(g => voting[groupKey(g)]?.finishedAt);
          if (allDone || now >= s.activityDeadline) {
            if (activity.kind === 'thumbs') {
              await beginVoting(s);
            } else {
              await finalizeRound(s);
            }
          }
        }
        // voting timeout OR all voted → results
        else if (s.phase === 'voting' && s.votingDeadline) {
          const groups = s.groups || [];
          const voting = s.voting || {};
          const allVoted = groups.filter(g => g.length >= 2).every(g => voting[groupKey(g)]?.finishedAt);
          if (allVoted || now >= s.votingDeadline) {
            await finalizeRound(s);
          }
        }
        // results auto-advance to next round (or final) for smoother flow
        else if (s.phase === 'results' && s.resultsDeadline && now >= s.resultsDeadline) {
          await nextRoundOrFinish(s);
        }
      } catch (e) { console.error('Tick error', e); }
      finally { tickBusy.current = false; }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ----- STATE TRANSITIONS -----
  const createSession = async () => {
    setCreating(true);
    const newSession = {
      code: generateCode(),
      createdAt: Date.now(),
      phase: 'lobby',
      round: 0,
      participants: {},
      groups: [],
      colors: {},
      foundConfirmed: {},
      voting: {},
      pastGroups: [],
      activityPlan: buildActivityPlan(),
      currentActivity: null,
      hasReunion: false,
    };
    await setSession(newSession);
    setCreating(false);
  };

  const beginPairing = async (sFromCaller) => {
    const s = sFromCaller || await getSession();
    if (!s) return;
    const ids = Object.keys(s.participants || {});
    if (ids.length < 2) { alert('Need at least 2 participants.'); return; }
    // If coming from triad-announce, round was already set by startRound; otherwise compute.
    const targetRound = (s.phase === 'triad-announce') ? s.round : (s.phase === 'lobby' ? 1 : s.round + 1);
    const groups = makeGroups(ids, isTriadRound(targetRound));
    const colors = {};
    groups.forEach((g, i) => {
      const colorIdx = i % COLORS.length;
      g.forEach(id => { colors[id] = colorIdx; });
    });
    const hasReunion = groups.some(g => detectReturning(g, s.pastGroups || []));
    await setSession({
      ...s,
      phase: 'pairing',
      round: targetRound,
      groups,
      colors,
      foundConfirmed: {},
      voting: {},
      currentActivity: getRoundActivity(s, targetRound),
      pairingDeadline: Date.now() + PAIRING_MS,
      hasReunion,
    });
  };

  const startRound = async () => {
    const s = await getSession();
    if (!s) return;
    const ids = Object.keys(s.participants || {});
    if (ids.length < 2) { alert('Need at least 2 participants.'); return; }
    const targetRound = s.phase === 'lobby' ? 1 : s.round + 1;
    if (targetRound > TOTAL_ROUNDS) { await finishGame(s); return; }
    if (isTriadRound(targetRound)) {
      // Triad-announce screen first
      await setSession({ ...s, phase: 'triad-announce', round: targetRound, triadAnnounceDeadline: Date.now() + TRIAD_ANNOUNCE_MS });
    } else {
      // Skip announce, go straight to pairing
      const groups = makeGroups(ids, false);
      const colors = {};
      groups.forEach((g, i) => { const c = i % COLORS.length; g.forEach(id => { colors[id] = c; }); });
      const hasReunion = groups.some(g => detectReturning(g, s.pastGroups || []));
      await setSession({
        ...s,
        phase: 'pairing',
        round: targetRound,
        groups, colors,
        foundConfirmed: {},
        voting: {},
        currentActivity: getRoundActivity(s, targetRound),
        pairingDeadline: Date.now() + PAIRING_MS,
        hasReunion,
      });
    }
  };

  const beginActivity = async (sFromCaller) => {
    const s = sFromCaller || await getSession();
    if (!s) return;
    const cfg = getRoundConfig(s.round);
    await setSession({
      ...s,
      phase: 'activity',
      activityDeadline: Date.now() + cfg.durationMs,
    });
  };

  const beginVoting = async (sFromCaller) => {
    const s = sFromCaller || await getSession();
    if (!s) return;
    await setSession({
      ...s,
      phase: 'voting',
      votingDeadline: Date.now() + VOTING_MS,
    });
  };

  const finalizeRound = async (sFromCaller) => {
    const s = sFromCaller || await getSession();
    if (!s) return;
    const { pointsAwarded } = scoreRound(s, s.round);
    const participants = { ...(s.participants || {}) };
    Object.entries(pointsAwarded).forEach(([id, pts]) => {
      if (participants[id]) {
        participants[id] = { ...participants[id], score: (participants[id].score || 0) + pts };
      }
    });
    // Persist past groupings for "returning pair" detection
    const newPast = [...(s.pastGroups || []), ...(s.groups || []).filter(g => g.length >= 2)];
    await setSession({
      ...s,
      phase: 'results',
      participants,
      lastRoundPoints: pointsAwarded,
      pastGroups: newPast,
      resultsDeadline: Date.now() + RESULTS_MS,
    });
  };

  const nextRoundOrFinish = async (sFromCaller) => {
    const s = sFromCaller || await getSession();
    if (!s) return;
    if (s.round >= TOTAL_ROUNDS) {
      await finishGame(s);
    } else {
      // Set phase back to lobby briefly so host can advance
      await setSession({ ...s, phase: 'between' });
    }
  };

  const continueToNextRound = async () => {
    const s = await getSession();
    if (!s) return;
    await startRound();
  };

  const finishGame = async (sFromCaller) => {
    const s = sFromCaller || await getSession();
    if (!s) return;
    // Compute profile statistics
    const stats = { season: {}, snack: {}, drink: {} };
    Object.values(s.participants || {}).forEach(p => {
      const prof = p.profile || {};
      ['season', 'snack', 'drink'].forEach(k => {
        const v = normAns(prof[k]);
        if (!v) return;
        stats[k][v] = (stats[k][v] || 0) + 1;
      });
    });
    await setSession({ ...s, phase: 'finished', stats });
  };

  const endSession = async () => {
    if (!window.confirm('End the session? All participants will be disconnected.')) return;
    await deleteSession();
  };

  // ----- RENDER -----
  if (loading) return <div className="pu-shell" style={{ justifyContent: 'center', alignItems: 'center' }}><Spinner /></div>;

  if (!session) {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', gap: 24 }}>
        <button onClick={onBack} className="pu-btn" style={{ alignSelf: 'flex-start', background: 'transparent', color: 'rgba(255,255,254,0.5)', fontSize: 14, padding: '8px 0' }}>← back</button>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>HOST</div>
          <h2 className="pu-display" style={{ fontSize: 42, margin: '0 0 16px' }}>
            Start a<br/><em style={{ color: '#FF8906' }}>new session</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.6 }}>
            10 rounds total: 4 conversations, 3 riddles & challenges, 3 mini games. Get the join code and let people in.
          </p>
        </div>
        <button className="pu-btn" onClick={createSession} disabled={creating} style={{
          background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14,
        }}>{creating ? 'Creating…' : 'Create session →'}</button>
      </div>
    );
  }

  const participantList = Object.entries(session.participants || {});
  const groups = session.groups || [];
  const colors = session.colors || {};
  const confirmed = session.foundConfirmed || {};
  const confirmedCount = groups.filter(g => g.length >= 2).filter(g => {
    const c = confirmed[groupKey(g)] || {};
    return g.every(id => c[id]);
  }).length;
  const totalGroups = groups.filter(g => g.length >= 2).length;
  const cfg = session.round > 0 ? getRoundConfig(session.round) : null;

  return (
    <div className="pu-shell pu-fade" style={{ gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>HOST DASHBOARD</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,254,0.5)', marginTop: 2 }}>
            {session.round > 0 ? `Round ${session.round} of ${TOTAL_ROUNDS} · ${cfg.label}` : 'Lobby'}
          </div>
        </div>
        <button onClick={endSession} className="pu-btn" style={{
          background: 'transparent', color: 'rgba(255,255,254,0.4)', fontSize: 12, padding: '6px 10px',
          border: '1px solid rgba(255,255,254,0.15)', borderRadius: 8,
        }}>end session</button>
      </div>

      {session.phase === 'lobby' && (
        <>
          <JoinCard code={session.code} />
          <CopyLinkRow />
        </>
      )}

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Stat label="people" value={participantList.length} />
        <Stat label="groups" value={totalGroups} />
        <Stat label="found" value={`${confirmedCount}/${totalGroups}`} />
      </div>

      {/* PHASE / CONTROLS */}
      <div style={{ background: 'rgba(255,255,254,0.04)', border: '1px solid rgba(255,255,254,0.08)', borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>
            PHASE · {session.phase.toUpperCase()}
          </div>
          {session.phase === 'pairing' && <Countdown deadline={session.pairingDeadline} />}
          {session.phase === 'activity' && <Countdown deadline={session.activityDeadline} />}
          {session.phase === 'voting' && <Countdown deadline={session.votingDeadline} />}
          {session.phase === 'triad-announce' && <Countdown deadline={session.triadAnnounceDeadline} urgentAt={3} />}
        </div>

        {session.phase === 'lobby' && (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Waiting for participants. Start round 1 when you have at least 2.
            </p>
            <button className="pu-btn" onClick={startRound} disabled={participantList.length < 2} style={{
              background: '#FF8906', color: '#0F0E17', fontSize: 15, padding: '14px 20px', borderRadius: 12, width: '100%',
            }}>Start round 1 → Get to know</button>
          </>
        )}

        {session.phase === 'between' && (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: '0 0 14px' }}>
              Round {session.round} complete. Ready for round {session.round + 1}?
            </p>
            <button className="pu-btn" onClick={continueToNextRound} style={{
              background: '#FF8906', color: '#0F0E17', fontSize: 15, padding: '14px 20px', borderRadius: 12, width: '100%',
            }}>Start round {session.round + 1} →</button>
          </>
        )}

        {session.phase === 'triad-announce' && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: 0 }}>
            Announcing triad round — participants will get groups of 3.
          </p>
        )}

        {(session.phase === 'pairing' || session.phase === 'activity' || session.phase === 'voting') && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: 0, lineHeight: 1.5 }}>
            {session.phase === 'pairing' && `Finding groups. ${confirmedCount}/${totalGroups} confirmed.`}
            {session.phase === 'activity' && `Activity in progress — ${cfg?.label}.`}
            {session.phase === 'voting' && `Collecting thumbs.`}
          </p>
        )}

        {session.phase === 'results' && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: 0 }}>
            Round {session.round} scored. Auto-advancing…
          </p>
        )}

        {session.phase === 'finished' && (
          <FinalLeaderboard session={session} />
        )}
      </div>

      {/* MINI LEADERBOARD */}
      {session.phase !== 'lobby' && session.phase !== 'finished' && participantList.length > 0 && (
        <MiniLeaderboard session={session} />
      )}

      {/* PARTICIPANT LIST */}
      {session.phase === 'lobby' && (
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginBottom: 10 }}>PARTICIPANTS</div>
          {participantList.length === 0 ? (
            <div style={{ fontSize: 14, color: 'rgba(255,255,254,0.4)', fontStyle: 'italic', padding: '12px 0' }}>No one has joined yet…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {participantList.map(([id, p]) => (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  background: 'rgba(255,255,254,0.04)', borderRadius: 10, fontSize: 14,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF8906' }} />
                  <span style={{ flex: 1 }}>{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniLeaderboard({ session }) {
  const list = Object.entries(session.participants || {})
    .map(([id, p]) => ({ id, name: p.name, score: p.score || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  if (list.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginBottom: 10 }}>TOP 5</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            background: i === 0 ? 'rgba(255,137,6,0.12)' : 'rgba(255,255,254,0.04)', borderRadius: 10, fontSize: 14,
          }}>
            <span style={{ width: 18, color: 'rgba(255,255,254,0.5)', fontSize: 13 }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{p.name}</span>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 18, color: i === 0 ? '#FF8906' : '#FFFFFE' }}>{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalLeaderboard({ session }) {
  const list = Object.entries(session.participants || {})
    .map(([id, p]) => ({ id, name: p.name, score: p.score || 0 }))
    .sort((a, b) => b.score - a.score);
  const stats = session.stats || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)' }}>Game over. Final standings:</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            background: i < 3 ? 'rgba(255,137,6,0.12)' : 'rgba(255,255,254,0.04)', borderRadius: 10, fontSize: 14,
          }}>
            <span style={{ width: 22, color: i < 3 ? '#FF8906' : 'rgba(255,255,254,0.5)', fontWeight: 700 }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <span style={{ flex: 1 }}>{p.name}</span>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 18 }}>{p.score}</span>
          </div>
        ))}
      </div>
      <StatsBlock stats={stats} />
    </div>
  );
}

function StatsBlock({ stats }) {
  if (!stats) return null;
  const blocks = [
    { key: 'season', label: 'Godišnja doba' },
    { key: 'snack',  label: 'Snackovi' },
    { key: 'drink',  label: 'Pića' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>STATISTIKE</div>
      {blocks.map(b => {
        const entries = Object.entries(stats[b.key] || {}).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) return null;
        return (
          <div key={b.key} style={{ background: 'rgba(255,255,254,0.04)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,254,0.6)', marginBottom: 8 }}>{b.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {entries.slice(0, 5).map(([v, c]) => (
                <div key={v} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ textTransform: 'capitalize' }}>{v}</span>
                  <span style={{ color: '#FF8906', fontWeight: 600 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// PARTICIPANT FLOW
// ============================================================
function ParticipantFlow({ onBack }) {
  const [step, setStep] = useState('enter'); // enter | profile | wait | game
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [profile, setProfile] = useState({ season: '', snack: '', drink: '' });
  const [error, setError] = useState('');
  const [session, setSessionState] = useState(null);
  const [myId, setMyId] = useState(null);
  const myIdRef = useRef(null);

  // Subscribe once we're in
  useEffect(() => {
    if (!myId) return;
    const unsub = subscribeToSession((s) => {
      if (!s || s.code !== code) {
        setError('Session ended by host.');
        setStep('enter');
        setMyId(null); myIdRef.current = null;
        return;
      }
      setSessionState(s);
      if (step === 'wait') setStep('game'); // any phase change moves us into the game loop
    });
    return unsub;
  }, [myId, code]);

  // ----- ENTER CODE -----
  const submitCode = async () => {
    setError('');
    const trimmed = code.trim();
    if (!/^\d{4}$/.test(trimmed)) { setError('Enter the 4-digit code.'); return; }
    const s = await getSession();
    if (!s) { setError('No active session. Ask the host to start one.'); return; }
    if (s.code !== trimmed) { setError("That code doesn't match the active session."); return; }
    if (s.phase !== 'lobby') { setError('Game already started — wait for the next event.'); return; }
    setStep('profile');
  };

  // ----- SUBMIT PROFILE -----
  const submitProfile = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter a name.'); return; }
    if (!profile.season.trim() || !profile.snack.trim() || !profile.drink.trim()) {
      setError('Molimo te ispuni sva polja.');
      return;
    }
    const s = await getSession();
    if (!s) { setError('Session ended.'); setStep('enter'); return; }
    if (s.phase !== 'lobby') { setError('Game already started.'); setStep('enter'); return; }
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const updated = {
      ...s,
      participants: {
        ...(s.participants || {}),
        [id]: {
          name: name.trim(),
          profile: { season: profile.season.trim(), snack: profile.snack.trim(), drink: profile.drink.trim() },
          joinedAt: Date.now(),
          score: 0,
        }
      }
    };
    const ok = await setSession(updated);
    if (!ok) { setError('Could not join. Try again.'); return; }
    setMyId(id); myIdRef.current = id;
    setStep('wait');
  };

  // ----- RENDER BY STEP -----
  if (step === 'enter') {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', gap: 24 }}>
        <button onClick={onBack} className="pu-btn" style={{ alignSelf: 'flex-start', background: 'transparent', color: 'rgba(255,255,254,0.5)', fontSize: 14, padding: '8px 0' }}>← back</button>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>JOIN</div>
          <h2 className="pu-display" style={{ fontSize: 48, margin: '0 0 8px' }}>
            Enter the<br/><em style={{ color: '#FF8906' }}>code.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.5 }}>
            Your host has a 4-digit code on screen.
          </p>
        </div>
        <input type="tel" inputMode="numeric" maxLength={4} className="pu-input"
          placeholder="0000" value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{ fontSize: 36, textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'Fraunces, serif', fontWeight: 800, padding: '20px 16px' }} />
        {error && <div style={{ color: '#F25F4C', fontSize: 14 }}>{error}</div>}
        <button className="pu-btn" onClick={submitCode} style={{
          background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14,
        }}>Continue →</button>
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <div className="pu-shell pu-fade" style={{ gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>O TEBI</div>
          <h2 className="pu-display" style={{ fontSize: 38, margin: '0 0 8px' }}>
            Reci nam <em style={{ color: '#FF8906' }}>nešto</em><br/>o sebi.
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Tvoje ime ili nadimak" value={name} onChange={setName} placeholder="npr. Ana" autoFocus />
          {PROFILE_QUESTIONS.map(q => (
            <Field key={q.key} label={q.label}
              value={profile[q.key]}
              onChange={v => setProfile({ ...profile, [q.key]: v })}
              placeholder={q.placeholder} />
          ))}
        </div>
        {error && <div style={{ color: '#F25F4C', fontSize: 14 }}>{error}</div>}
        <button className="pu-btn" onClick={submitProfile} style={{
          background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14,
        }}>Uđi u igru →</button>
      </div>
    );
  }

  // wait or game
  if (!session) {
    return <div className="pu-shell" style={{ justifyContent: 'center', alignItems: 'center' }}><Spinner /></div>;
  }

  return <GameScreen session={session} myId={myId} myName={name} />;
}

function Field({ label, value, onChange, placeholder, autoFocus }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,254,0.7)' }}>{label}</span>
      <input type="text" className="pu-input" value={value || ''}
        onChange={e => onChange(e.target.value.slice(0, 50))}
        placeholder={placeholder} autoFocus={autoFocus} />
    </label>
  );
}

// ============================================================
// GAME SCREEN — routes by phase
// ============================================================
function GameScreen({ session, myId, myName }) {
  const myGroup = (session.groups || []).find(g => g && g.includes(myId));

  if (session.phase === 'lobby') {
    const count = Object.keys(session.participants || {}).length;
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 28 }}>
        <div className="pu-pulse" style={{
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,137,6,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FF8906' }} />
        </div>
        <div>
          <h2 className="pu-display" style={{ fontSize: 40, margin: '0 0 12px' }}>
            Hej <em style={{ color: '#FF8906' }}>{myName}.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16, lineHeight: 1.5, maxWidth: 280 }}>
            U sobi si. Čekamo da host pokrene prvu rundu.
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,254,0.4)' }}>
          {count} {count === 1 ? 'igrač' : 'igrača'} u sobi
        </div>
      </div>
    );
  }

  if (session.phase === 'between') {
    const myScore = session.participants?.[myId]?.score || 0;
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <div className="pu-display" style={{ fontSize: 32, color: '#FF8906' }}>Round {session.round} done.</div>
        <div className="pu-display" style={{ fontSize: 64 }}>{myScore} <span style={{ fontSize: 24, color: 'rgba(255,255,254,0.5)' }}>pts</span></div>
        <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 14 }}>Host će uskoro pokrenuti sljedeću rundu…</p>
      </div>
    );
  }

  if (session.phase === 'triad-announce') {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>HEADS UP</div>
        <div className="pu-display" style={{ fontSize: 52, lineHeight: 1.05 }}>
          This round —<br/><em style={{ color: '#FF8906' }}>groups of three.</em>
        </div>
        <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16, maxWidth: 280 }}>
          You'll be paired up with TWO other people instead of one.
        </p>
        <Countdown deadline={session.triadAnnounceDeadline} urgentAt={3} />
      </div>
    );
  }

  if (session.phase === 'pairing') {
    if (!myGroup) return <div className="pu-shell" style={{ justifyContent: 'center', alignItems: 'center' }}><Spinner /></div>;
    if (myGroup.length === 1) {
      return (
        <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <div className="pu-display" style={{ fontSize: 60, color: '#FF8906' }}>solo</div>
          <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16, lineHeight: 1.6, maxWidth: 280 }}>
            Odd number — you're sitting this round out. Hang tight for the next.
          </p>
        </div>
      );
    }
    return <PairingScreen session={session} myId={myId} myGroup={myGroup} />;
  }

  if (session.phase === 'activity') {
    if (!myGroup || myGroup.length < 2) return <SitOutScreen />;
    return <ActivityScreen session={session} myId={myId} myGroup={myGroup} myName={myName} />;
  }

  if (session.phase === 'voting') {
    if (!myGroup || myGroup.length < 2) return <SitOutScreen />;
    return <VotingScreen session={session} myId={myId} myGroup={myGroup} />;
  }

  if (session.phase === 'results') {
    const myScore = session.participants?.[myId]?.score || 0;
    const lastPts = session.lastRoundPoints?.[myId] || 0;
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>ROUND {session.round}</div>
        <div className="pu-display" style={{ fontSize: 90, color: lastPts > 0 ? '#FF8906' : '#FFFFFE' }}>+{lastPts}</div>
        <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 16 }}>points this round</p>
        <div style={{ marginTop: 12, fontSize: 18 }}>
          Total: <strong className="pu-display" style={{ fontSize: 32, color: '#FF8906' }}>{myScore}</strong>
        </div>
      </div>
    );
  }

  if (session.phase === 'finished') {
    return <ParticipantFinalScreen session={session} myId={myId} />;
  }

  return null;
}

function SitOutScreen() {
  return (
    <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 }}>
      <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16 }}>You sat this round out. Stand by for the next one.</p>
    </div>
  );
}

// ============================================================
// PAIRING SCREEN — color reveal + find your group
// ============================================================
function PairingScreen({ session, myId, myGroup }) {
  const colorIdx = (session.colors || {})[myId];
  const color = colorIdx !== undefined ? COLORS[colorIdx] : null;
  const myKey = groupKey(myGroup);
  const myConfirmed = (session.foundConfirmed || {})[myKey]?.[myId];
  const isReunion = (session.hasReunion === true) && (session.pastGroups || []).some(past => {
    if (!past || past.length < 2) return false;
    // Returns true if any pair within myGroup also exists in past
    for (let i = 0; i < myGroup.length; i++) for (let j = i + 1; j < myGroup.length; j++) {
      const a = myGroup[i], b = myGroup[j];
      if (past.includes(a) && past.includes(b)) return true;
    }
    return false;
  });

  const confirmFound = async () => {
    if (myConfirmed) return;
    const s = await getSession();
    if (!s) return;
    const fc = s.foundConfirmed || {};
    const existing = fc[myKey] || {};
    await setSession({
      ...s,
      foundConfirmed: { ...fc, [myKey]: { ...existing, [myId]: Date.now() } },
    });
  };

  if (!color) return <div className="pu-shell" style={{ justifyContent: 'center', alignItems: 'center' }}><Spinner /></div>;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: color.bg, color: color.text,
      display: 'flex', flexDirection: 'column', padding: '24px 20px 32px',
      animation: 'pu-fade-in 0.4s ease forwards',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', opacity: 0.7 }}>YOUR COLOR</div>
          {isReunion && <div style={{ fontSize: 12, marginTop: 4, fontStyle: 'italic', opacity: 0.85 }}>♻︎ Reunion — you've met before!</div>}
        </div>
        <Countdown deadline={session.pairingDeadline} />
      </div>
      <div className="pu-display" style={{ fontSize: 96, margin: '8px 0 4px', lineHeight: 0.9 }}>
        {color.name}.
      </div>
      <div style={{ fontSize: 16, opacity: 0.7, marginBottom: 16, fontStyle: 'italic' }}>
        {myGroup.length === 3 ? 'Find your other TWO people.' : 'Find your one partner.'}
      </div>
      <div style={{
        height: 4, width: 80, background: color.text, opacity: 0.4, borderRadius: 2, marginBottom: 16,
      }} />
      <p style={{ fontSize: 17, lineHeight: 1.5, opacity: 0.9, marginBottom: 'auto', maxWidth: 320 }}>
        Look around the room for someone whose phone shows <strong>{color.name}</strong>. {myGroup.length === 3 ? 'You\'re a group of three this round.' : 'They\'re your partner.'}
      </p>

      <div style={{ marginTop: 32 }}>
        {!myConfirmed ? (
          <button className="pu-btn" onClick={confirmFound} style={{
            width: '100%', background: color.text, color: color.bg,
            fontSize: 17, padding: '20px 24px', borderRadius: 16, fontWeight: 700,
          }}>I found my {myGroup.length === 3 ? 'group' : 'partner'} ✓</button>
        ) : (
          <div style={{
            padding: '20px 24px', borderRadius: 16, background: 'rgba(0,0,0,0.15)',
            textAlign: 'center', fontSize: 15, fontWeight: 500,
          }}>
            Confirmed. Hang tight — activity coming up.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ACTIVITY SCREEN — routes by activity kind
// ============================================================
function ActivityScreen({ session, myId, myGroup, myName }) {
  const activity = session.currentActivity || {};
  const colorIdx = (session.colors || {})[myId];
  const color = COLORS[colorIdx] || COLORS[0];
  const cfg = getRoundConfig(session.round);
  const partners = myGroup.filter(id => id !== myId).map(id => session.participants?.[id]?.name || '?').join(' & ');

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color.bg }} />
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>
          {color.name.toUpperCase()} · WITH {partners.toUpperCase()}
        </div>
      </div>
      <Countdown deadline={session.activityDeadline} urgentAt={Math.min(15, Math.floor(cfg.durationMs / 6000))} />
    </div>
  );

  if (activity.kind === 'thumbs') {
    return (
      <div className="pu-shell pu-fade" style={{ gap: 16 }}>
        {header}
        <ActivityCard color={color} type={activity.category === 'get-to-know' ? 'QUESTION' : 'CHALLENGE'} prompt={activity.prompt} />
        <div style={{
          padding: '14px 16px', background: 'rgba(255,137,6,0.1)', border: '1px solid rgba(255,137,6,0.2)',
          borderRadius: 12, fontSize: 13, color: 'rgba(255,255,254,0.7)', textAlign: 'center',
        }}>
          Talk it through together. You'll rate it after the timer.
        </div>
      </div>
    );
  }

  if (activity.kind === 'equation') {
    return <EquationActivity session={session} myId={myId} myGroup={myGroup} color={color} header={header} activity={activity} />;
  }

  if (activity.kind === 'mini-game') {
    if (activity.miniGame === 'rps') return <RPSGame session={session} myId={myId} myGroup={myGroup} color={color} header={header} />;
    if (activity.miniGame === 'clicking') return <ClickingContestGame session={session} myId={myId} myGroup={myGroup} color={color} header={header} />;
    if (activity.miniGame === 'mini-quiz') return <MiniQuizGame session={session} myId={myId} myGroup={myGroup} color={color} header={header} activity={activity} />;
  }

  return null;
}

function ActivityCard({ color, type, prompt }) {
  return (
    <div style={{
      background: 'rgba(255,255,254,0.04)', border: `2px solid ${color.bg}40`,
      borderRadius: 20, padding: '28px 24px', flex: 1,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20,
    }}>
      <div style={{
        alignSelf: 'flex-start', background: color.bg, color: color.text,
        fontSize: 11, letterSpacing: '0.2em', padding: '6px 12px', borderRadius: 100, fontWeight: 700,
      }}>{type}</div>
      <div className="pu-serif" style={{
        fontSize: 24, lineHeight: 1.35, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'pre-line',
      }}>{prompt}</div>
    </div>
  );
}

// ============================================================
// EQUATION ACTIVITY (riddles category)
// ============================================================
function EquationActivity({ session, myId, myGroup, color, header, activity }) {
  const myKey = groupKey(myGroup);
  const myVote = (session.voting || {})[myKey] || {};
  const [answer, setAnswer] = useState(myVote.answer || '');
  const [feedback, setFeedback] = useState(myVote.finishedAt ? (myVote.correct ? 'correct' : 'wrong') : null);
  const submitted = !!myVote.finishedAt;

  const submit = async () => {
    if (submitted || !answer.trim()) return;
    const s = await getSession();
    if (!s) return;
    const correct = checkAnswer(answer, activity.answers || []);
    const voting = s.voting || {};
    await setSession({
      ...s,
      voting: { ...voting, [myKey]: { ...(voting[myKey] || {}), answer, correct, finishedAt: Date.now() } },
    });
    setFeedback(correct ? 'correct' : 'wrong');
  };

  return (
    <div className="pu-shell pu-fade" style={{ gap: 16 }}>
      {header}
      <ActivityCard color={color} type="RIDDLE" prompt={activity.prompt} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="text" className="pu-input" value={answer}
          onChange={e => setAnswer(e.target.value)} placeholder="Your answer"
          disabled={submitted} onKeyDown={e => e.key === 'Enter' && submit()} />
        {!submitted ? (
          <button className="pu-btn" onClick={submit} disabled={!answer.trim()} style={{
            background: '#FF8906', color: '#0F0E17', fontSize: 16, padding: '14px 20px', borderRadius: 12,
          }}>Submit answer</button>
        ) : (
          <div style={{
            padding: '14px 20px', borderRadius: 12, textAlign: 'center', fontWeight: 600,
            background: feedback === 'correct' ? 'rgba(124,179,66,0.15)' : 'rgba(242,95,76,0.15)',
            color: feedback === 'correct' ? '#7CB342' : '#F25F4C',
          }}>
            {feedback === 'correct' ? '✓ Correct!' : '✗ Not quite. Wait for the round to finish.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MINI GAME: ROCK / PAPER / SCISSORS (Kamen / Papir / Škare) — best of 3 (first to 2)
// ============================================================
function RPSGame({ session, myId, myGroup, color, header }) {
  const myKey = groupKey(myGroup);
  const voting = (session.voting || {})[myKey] || {};
  const partnerId = myGroup.find(id => id !== myId);
  const finished = !!voting.finishedAt;

  // State shape:
  //   voting[key].rpsRounds   = [{ picks: { [id]: 'rock'|'paper'|'scissors' }, winner: id|null }, ...]
  //   voting[key].rpsCurrent  = { [id]: pick }  (current incomplete round)
  //   voting[key].winnerId    = set when someone reaches 2 wins
  const rounds = voting.rpsRounds || [];
  const current = voting.rpsCurrent || {};
  const myCurrent = current[myId];
  const partnerCurrent = current[partnerId];
  const myScore = rounds.filter(r => r.winner === myId).length;
  const partnerScore = rounds.filter(r => r.winner === partnerId).length;

  const pick = async (choice) => {
    if (finished || myCurrent) return;
    const s = await getSession();
    if (!s) return;
    const v = s.voting || {};
    const cur = v[myKey] || {};
    const curRounds = cur.rpsRounds || [];
    const curCurrent = { ...(cur.rpsCurrent || {}), [myId]: choice };

    let updates = { ...cur, rpsCurrent: curCurrent };

    // If both picked, resolve the sub-round
    if (curCurrent[myId] && curCurrent[partnerId]) {
      const winner = rpsWinner(myId, curCurrent[myId], partnerId, curCurrent[partnerId]);
      const newRounds = [...curRounds, { picks: { ...curCurrent }, winner }];
      const myWins = newRounds.filter(r => r.winner === myId).length;
      const partnerWins = newRounds.filter(r => r.winner === partnerId).length;
      updates = { ...updates, rpsRounds: newRounds, rpsCurrent: {} };
      if (myWins >= 2) updates = { ...updates, winnerId: myId, finishedAt: Date.now() };
      else if (partnerWins >= 2) updates = { ...updates, winnerId: partnerId, finishedAt: Date.now() };
    }

    await setSession({ ...s, voting: { ...v, [myKey]: updates } });
  };

  const lastRound = rounds[rounds.length - 1];

  return (
    <div className="pu-shell pu-fade" style={{ gap: 16 }}>
      {header}
      <div style={{
        background: 'rgba(255,255,254,0.04)', border: `2px solid ${color.bg}40`,
        borderRadius: 20, padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18,
      }}>
        <div style={{ alignSelf: 'flex-start', background: color.bg, color: color.text,
          fontSize: 11, letterSpacing: '0.2em', padding: '6px 12px', borderRadius: 100, fontWeight: 700 }}>MINI GAME</div>
        <div className="pu-display" style={{ fontSize: 32 }}>Kamen, Papir, Škare</div>

        {/* Scoreboard */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="pu-display" style={{ fontSize: 48, color: '#FF8906' }}>{myScore}</div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>TI</div>
          </div>
          <div style={{ fontSize: 22, color: 'rgba(255,255,254,0.3)' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div className="pu-display" style={{ fontSize: 48 }}>{partnerScore}</div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>PROTIVNIK</div>
          </div>
        </div>

        {/* Last round result flash */}
        {lastRound && !finished && (
          <div style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,254,0.7)' }}>
            Prošla runda: ti {emojiFor(lastRound.picks[myId])} · protivnik {emojiFor(lastRound.picks[partnerId])} →{' '}
            <strong style={{ color: lastRound.winner === myId ? '#7CB342' : lastRound.winner === partnerId ? '#F25F4C' : '#FF8906' }}>
              {lastRound.winner === myId ? 'pobjeda' : lastRound.winner === partnerId ? 'poraz' : 'neriješeno'}
            </strong>
          </div>
        )}

        {/* Picker */}
        {!finished && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['rock','✊','Kamen'], ['paper','✋','Papir'], ['scissors','✌️','Škare']].map(([k, e, label]) => (
                <button key={k} className="pu-btn" onClick={() => pick(k)} disabled={!!myCurrent}
                  style={{
                    background: myCurrent === k ? color.bg : 'rgba(255,255,254,0.06)',
                    color: myCurrent === k ? color.text : '#FFFFFE',
                    border: `2px solid ${myCurrent === k ? color.bg : 'rgba(255,255,254,0.1)'}`,
                    borderRadius: 14, padding: '20px 8px', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
                  }}>
                  <div style={{ fontSize: 34 }}>{e}</div>
                  <div>{label}</div>
                </button>
              ))}
            </div>
            {myCurrent && !partnerCurrent && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,254,0.6)', fontSize: 13 }}>
                Čekamo protivnika…
              </div>
            )}
          </>
        )}

        {finished && (
          <div style={{ textAlign: 'center' }}>
            <div className="pu-display" style={{ fontSize: 36, color: voting.winnerId === myId ? '#FF8906' : '#FFFFFE' }}>
              {voting.winnerId === myId ? 'Pobjeda! 🎉' : 'Poraz'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,254,0.5)', marginTop: 6 }}>
              Konačno: {myScore} — {partnerScore}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function emojiFor(c) { return c === 'rock' ? '✊' : c === 'paper' ? '✋' : c === 'scissors' ? '✌️' : '?'; }
function rpsWinner(idA, a, idB, b) {
  if (a === b) return null;
  if ((a === 'rock' && b === 'scissors') || (a === 'paper' && b === 'rock') || (a === 'scissors' && b === 'paper')) return idA;
  return idB;
}

// ============================================================
// MINI GAME: CLICKING CONTEST — 1 minute, most clicks wins (no early exit)
// ============================================================
function ClickingContestGame({ session, myId, myGroup, color, header }) {
  const myKey = groupKey(myGroup);
  const voting = (session.voting || {})[myKey] || {};
  const finished = !!voting.finishedAt;
  const taps = voting.taps || {};
  const myTaps = taps[myId] || 0;
  const partnerId = myGroup.find(id => id !== myId);
  const partnerTaps = taps[partnerId] || 0;

  // Local optimistic counter for snappy taps
  const [localTaps, setLocalTaps] = useState(myTaps);
  const lastPushed = useRef(myTaps);
  const localTapsRef = useRef(localTaps);
  localTapsRef.current = localTaps;
  useEffect(() => { if (myTaps > localTaps) setLocalTaps(myTaps); }, [myTaps]);

  // Throttled push to Firebase — interval set up ONCE, reads localTaps from ref.
  useEffect(() => {
    if (finished) return;
    const interval = setInterval(async () => {
      const t = localTapsRef.current;
      if (t === lastPushed.current) return;
      const s = await getSession();
      if (!s) return;
      const v = s.voting || {};
      const cur = v[myKey] || {};
      if (cur.finishedAt) return; // round resolved by host tick
      const curTaps = { ...(cur.taps || {}) };
      curTaps[myId] = Math.max(curTaps[myId] || 0, t);
      await setSession({ ...s, voting: { ...v, [myKey]: { ...cur, taps: curTaps } } });
      lastPushed.current = t;
    }, 250);
    return () => clearInterval(interval);
  }, [finished, myKey, myId]);

  const tap = () => { if (finished) return; setLocalTaps(t => t + 1); };
  const myDisplay = Math.max(myTaps, localTaps);

  return (
    <div className="pu-shell pu-fade" style={{ gap: 16 }}>
      {header}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pu-display" style={{ fontSize: 42, color: '#FF8906' }}>{myDisplay}</div>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>TI</div>
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,254,0.3)' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div className="pu-display" style={{ fontSize: 42 }}>{partnerTaps}</div>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>PROTIVNIK</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,254,0.5)', textAlign: 'center' }}>
        Najviše klikova u minuti pobjeđuje
      </div>
      {!finished ? (
        <button onClick={tap} onTouchStart={(e) => { e.preventDefault(); tap(); }} style={{
          flex: 1, background: color.bg, color: color.text,
          border: 'none', borderRadius: 24, fontSize: 40, fontWeight: 800, fontFamily: 'Fraunces, serif',
          cursor: 'pointer', userSelect: 'none', touchAction: 'manipulation',
        }}>KLIK!</button>
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: voting.winnerId === myId ? 'rgba(255,137,6,0.15)' : 'rgba(255,255,254,0.04)',
          borderRadius: 24, fontSize: 28, fontFamily: 'Fraunces, serif', fontWeight: 800,
          color: voting.winnerId === myId ? '#FF8906' : 'rgba(255,255,254,0.6)',
        }}>
          {voting.winnerId === myId ? 'Pobjeda! 🎉' : voting.winnerId === partnerId ? 'Poraz' : 'Neriješeno'}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MINI GAME: MINI QUIZ — 3 specific questions, race through them
// Each player progresses independently. Winner = most correct (tiebreak: fastest total time).
// ============================================================
function MiniQuizGame({ session, myId, myGroup, color, header, activity }) {
  const myKey = groupKey(myGroup);
  const voting = (session.voting || {})[myKey] || {};
  const partnerId = myGroup.find(id => id !== myId);
  const finished = !!voting.finishedAt;
  const questions = activity.questions || MINI_QUIZ_QUESTIONS;

  const myQuiz = (voting.quiz || {})[myId] || { qIdx: 0, answers: [], correct: [], startedAt: null, totalTimeMs: 0 };
  const partnerQuiz = (voting.quiz || {})[partnerId] || { qIdx: 0 };
  const myDone = myQuiz.qIdx >= questions.length;
  const partnerDone = partnerQuiz.qIdx >= questions.length;
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const startedAtRef = useRef(myQuiz.startedAt || null);

  // Initialize start time on first render of this question
  useEffect(() => {
    if (!startedAtRef.current && !myDone) startedAtRef.current = Date.now();
  }, [myDone]);

  // Clear feedback when question advances
  useEffect(() => { setFeedback(null); setAnswer(''); }, [myQuiz.qIdx]);

  const submit = async () => {
    if (myDone || !answer.trim() || feedback) return;
    const q = questions[myQuiz.qIdx];
    const isCorrect = checkAnswer(answer, q.a);
    const now = Date.now();
    const startedAt = startedAtRef.current || now;
    const newTotalTime = (myQuiz.totalTimeMs || 0) + (now - startedAt);
    startedAtRef.current = now; // reset timer for next question

    setFeedback(isCorrect ? 'correct' : 'wrong');

    const s = await getSession();
    if (!s) return;
    const v = s.voting || {};
    const cur = v[myKey] || {};
    if (cur.finishedAt) return;
    const quiz = { ...(cur.quiz || {}) };
    const mine = quiz[myId] || { qIdx: 0, answers: [], correct: [], totalTimeMs: 0 };
    quiz[myId] = {
      qIdx: mine.qIdx + 1,
      answers: [...(mine.answers || []), answer],
      correct: [...(mine.correct || []), isCorrect],
      totalTimeMs: newTotalTime,
    };

    let updates = { ...cur, quiz };

    // Check if both players are done — if so, finalize with winner
    const partnerData = quiz[partnerId] || { qIdx: 0 };
    if (quiz[myId].qIdx >= questions.length && (partnerData.qIdx >= questions.length)) {
      const myCorrect = (quiz[myId].correct || []).filter(Boolean).length;
      const partnerCorrect = (partnerData.correct || []).filter(Boolean).length;
      let winnerId = null;
      if (myCorrect > partnerCorrect) winnerId = myId;
      else if (partnerCorrect > myCorrect) winnerId = partnerId;
      else if (myCorrect > 0) {
        // Tie on correct — fastest total time wins
        winnerId = (quiz[myId].totalTimeMs <= (partnerData.totalTimeMs || Number.MAX_SAFE_INTEGER)) ? myId : partnerId;
      }
      updates = { ...updates, winnerId: winnerId || 'tie', finishedAt: Date.now() };
    }

    await setSession({ ...s, voting: { ...v, [myKey]: updates } });

    // Brief delay so user sees feedback before next question
    setTimeout(() => setFeedback(null), 600);
  };

  if (finished) {
    const myCorrect = (myQuiz.correct || []).filter(Boolean).length;
    const partnerCorrect = (partnerQuiz.correct || []).filter(Boolean).length;
    return (
      <div className="pu-shell pu-fade" style={{ gap: 16 }}>
        {header}
        <div style={{ background: 'rgba(255,255,254,0.04)', border: `2px solid ${color.bg}40`,
          borderRadius: 20, padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <div className="pu-display" style={{ fontSize: 36, textAlign: 'center', color: voting.winnerId === myId ? '#FF8906' : '#FFFFFE' }}>
            {voting.winnerId === myId ? 'Pobjeda! 🎉' : voting.winnerId === partnerId ? 'Poraz' : 'Neriješeno'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="pu-display" style={{ fontSize: 42, color: '#FF8906' }}>{myCorrect}/{questions.length}</div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>TI</div>
            </div>
            <div style={{ fontSize: 22, color: 'rgba(255,255,254,0.3)' }}>vs</div>
            <div style={{ textAlign: 'center' }}>
              <div className="pu-display" style={{ fontSize: 42 }}>{partnerCorrect}/{questions.length}</div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>PROTIVNIK</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (myDone) {
    return (
      <div className="pu-shell pu-fade" style={{ gap: 16 }}>
        {header}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
          <div className="pu-display" style={{ fontSize: 36, color: '#FF8906' }}>Gotovo!</div>
          <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16 }}>
            Čekamo protivnika ({partnerQuiz.qIdx || 0}/{questions.length}).
          </p>
        </div>
      </div>
    );
  }

  const currentQ = questions[myQuiz.qIdx];
  return (
    <div className="pu-shell pu-fade" style={{ gap: 16 }}>
      {header}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,254,0.6)' }}>
          Pitanje {myQuiz.qIdx + 1} / {questions.length}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,254,0.4)' }}>
          Protivnik: {partnerQuiz.qIdx || 0}/{questions.length}
        </div>
      </div>
      <div style={{
        background: 'rgba(255,255,254,0.04)', border: `2px solid ${color.bg}40`,
        borderRadius: 20, padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ alignSelf: 'flex-start', background: color.bg, color: color.text,
          fontSize: 11, letterSpacing: '0.2em', padding: '6px 12px', borderRadius: 100, fontWeight: 700 }}>MINI QUIZ</div>
        <div className="pu-serif" style={{ fontSize: 22, lineHeight: 1.35, fontWeight: 600 }}>{currentQ.q}</div>

        <input type="text" className="pu-input" value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Tvoj odgovor"
          onKeyDown={e => e.key === 'Enter' && submit()}
          disabled={!!feedback}
          autoFocus />
        <button className="pu-btn" onClick={submit} disabled={!answer.trim() || !!feedback} style={{
          background: '#FF8906', color: '#0F0E17', fontSize: 16, padding: '14px 20px', borderRadius: 12,
        }}>Pošalji</button>

        {feedback === 'correct' && (
          <div style={{ textAlign: 'center', color: '#7CB342', fontWeight: 600 }}>✓ Točno!</div>
        )}
        {feedback === 'wrong' && (
          <div style={{ textAlign: 'center', color: '#F25F4C', fontWeight: 600 }}>✗ Krivo — idemo dalje</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// VOTING SCREEN — thumbs up/down (for thumbs categories)
// ============================================================
function VotingScreen({ session, myId, myGroup }) {
  const myKey = groupKey(myGroup);
  const voting = (session.voting || {})[myKey] || {};
  const thumbs = voting.thumbs || {};
  const myThumb = thumbs[myId];
  const colorIdx = (session.colors || {})[myId];
  const color = COLORS[colorIdx] || COLORS[0];

  const vote = async (choice) => {
    if (myThumb) return;
    const s = await getSession();
    if (!s) return;
    const v = s.voting || {};
    const cur = v[myKey] || {};
    const newThumbs = { ...(cur.thumbs || {}), [myId]: choice };
    let updates = { ...cur, thumbs: newThumbs };
    if (myGroup.every(id => newThumbs[id])) {
      updates = { ...updates, finishedAt: Date.now() };
    }
    await setSession({ ...s, voting: { ...v, [myKey]: updates } });
  };

  return (
    <div className="pu-shell pu-fade" style={{ gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>RATE IT</div>
        <Countdown deadline={session.votingDeadline} urgentAt={5} />
      </div>
      <div>
        <h2 className="pu-display" style={{ fontSize: 36, margin: '0 0 8px' }}>
          Was that<br/><em style={{ color: '#FF8906' }}>fun?</em>
        </h2>
        <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 14, lineHeight: 1.5 }}>
          Your group's combined thumbs decide your points. Both/all thumbs up = 2 pts each.
        </p>
      </div>

      {!myThumb ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
          <button className="pu-btn" onClick={() => vote('up')} style={{
            background: 'rgba(124,179,66,0.15)', color: '#7CB342', fontSize: 64, padding: 0,
            border: '2px solid rgba(124,179,66,0.3)', borderRadius: 20, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <div>👍</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Yep</div>
          </button>
          <button className="pu-btn" onClick={() => vote('down')} style={{
            background: 'rgba(242,95,76,0.12)', color: '#F25F4C', fontSize: 64, padding: 0,
            border: '2px solid rgba(242,95,76,0.3)', borderRadius: 20, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <div>👎</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Nope</div>
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 80 }}>{myThumb === 'up' ? '👍' : '👎'}</div>
          <div style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15 }}>
            Submitted. Waiting for {myGroup.length === 3 ? 'the others' : 'partner'}…
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PARTICIPANT FINAL SCREEN
// ============================================================
function ParticipantFinalScreen({ session, myId }) {
  const list = Object.entries(session.participants || {})
    .map(([id, p]) => ({ id, name: p.name, score: p.score || 0 }))
    .sort((a, b) => b.score - a.score);
  const myRank = list.findIndex(p => p.id === myId) + 1;
  const myScore = session.participants?.[myId]?.score || 0;

  return (
    <div className="pu-shell pu-fade" style={{ gap: 22 }}>
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 8 }}>GAME OVER</div>
        <div className="pu-display" style={{ fontSize: 52, lineHeight: 1 }}>
          {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : `#${myRank}`}
        </div>
        <div style={{ marginTop: 10, fontSize: 16, color: 'rgba(255,255,254,0.7)' }}>
          You scored <strong className="pu-display" style={{ fontSize: 26, color: '#FF8906' }}>{myScore}</strong> points
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginBottom: 10 }}>LEADERBOARD</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              background: p.id === myId ? 'rgba(255,137,6,0.18)' : (i < 3 ? 'rgba(255,137,6,0.08)' : 'rgba(255,255,254,0.04)'),
              borderRadius: 10, fontSize: 14,
            }}>
              <span style={{ width: 22, color: i < 3 ? '#FF8906' : 'rgba(255,255,254,0.5)', fontWeight: 700 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <span style={{ flex: 1 }}>{p.name}{p.id === myId ? ' (you)' : ''}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 800, fontSize: 18 }}>{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      <StatsBlock stats={session.stats} />
    </div>
  );
}

// ============================================================
// ROOT
// ============================================================
export default function App() {
  const [mode, setMode] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return ['host', 'join'].includes(h) ? h : null;
  });
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '');
      setMode(['host', 'join'].includes(h) ? h : null);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const goTo = (m) => { setMode(m); window.location.hash = m || ''; };
  return (
    <>
      <style>{baseStyles}</style>
      {mode === null && <Landing onChoose={goTo} />}
      {mode === 'host' && <HostDashboard onBack={() => goTo(null)} />}
      {mode === 'join' && <ParticipantFlow onBack={() => goTo(null)} />}
    </>
  );
}
