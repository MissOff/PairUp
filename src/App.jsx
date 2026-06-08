import React, { useState, useEffect, useRef } from 'react';
import { ref, get, set, remove, onValue } from 'firebase/database';
import { db } from './firebase';

// ============================================================
// PAIR UP — Team Bonding Game v2
// ============================================================

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

// ---------- RULEBOOK (shown to participants on join, before profile) ----------
// EDIT THESE 5 POINTS — these are placeholders.
const RULEBOOK = [
  "Igra ima 10 rundi raspoređenih u 3 kategorije - Upoznaj svog para; Izazov ili zagonetka; Brza igra",
  "Tvoj par mijenja se svaku rundu — pronađi osobu s istom bojom na ekranu.",
  "Svaka runda (i uparivanje) ima vremensko ograničenje. Budi brz!",
  "U igri zagonetki odgovaraš sa svojim parom - dogovori se i pronađi točan odgovor.",
  "Bodovi se zbrajaju kroz cijelu igru — pobjednik se otkriva na kraju.",
  "Najvažnije — zabavi se i upoznaj nove ljude!",
];

// ---------- CATEGORY TITLES (shown before each round) ----------
const CATEGORY_TITLES = {
  'get-to-know': 'Upoznaj svog para',
  'riddles':     'Izazov ili zagonetka',
  'mini-games':  'Brza igra',
};

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
  { type: 'challenge', prompt: "Nasmij svog partnera nekom forom ili vicem." },
  { type: 'challenge', prompt: "Osmisli zdravicu sa svojim parom, i nazdravi vašem prijateljstvu." },
  // Equations — type 'equation', exact match (case-insensitive, ignore extra spaces)
  // 2 mathematical:
  { type: 'equation', prompt: "Farmer ima 17 ovaca. Sve osim 9 ugine. Koliko mu ovaca ostaje?", answers: ['9', 'devet'] },
  { type: 'equation', prompt: "Koji je sljedeći broj u nizu?\n2, 6, 12, 20, 30, ?", answers: ['42'] },
  // 3 verbal (Croatian):
  { type: 'equation', prompt: "Što više sušiš, to postaje sve vlažnije. Što je to?", answers: ['ručnik', 'rucnik'] },
  { type: 'equation', prompt: "Imam glavu i rep, ali nemam tijelo. Što sam ja?", answers: ['kovanica', 'novčić', 'novcic', 'kuna', 'euro'] },
  { type: 'equation', prompt: "Što uvijek dolazi, a nikad ne stiže?", answers: ['sutra'] },
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
const PAIRING_MS  = 60_000;
const PAIRING_EXT_MS = 10_000;
const VOTING_MS   = 15_000;
const TRIAD_ANNOUNCE_MS = 3_000;
const CATEGORY_ANNOUNCE_MS = 2_500;
const BETWEEN_MS  = 1_500;
const CLICKING_COUNTDOWN_MS = 3_000;
const TIEBREAKER_ANNOUNCE_MS = 8_000;
const TIEBREAKER_COUNTDOWN_MS = 3_000;  // "Pripremi se za igru" 3-2-1 before clicking starts
const TIEBREAKER_ACTIVE_MS = TIEBREAKER_COUNTDOWN_MS + 15_000; // 3s prep + 15s clicking

function getCategoryForRound(session, round) {
  const order = session?.categoryOrder || ['get-to-know','get-to-know','get-to-know','get-to-know','riddles','riddles','riddles','mini-games','mini-games','mini-games'];
  return order[round - 1] || 'get-to-know';
}

const PHASE_LABELS_HR = {
  'lobby': 'ČEKAONICA',
  'category-announce': 'NAJAVA',
  'triad-announce': 'NAJAVA TRIJADE',
  'pairing': 'UPARIVANJE',
  'activity': 'AKTIVNOST',
  'voting': 'GLASANJE',
  'between': 'PAUZA',
  'tiebreaker-announce': 'NAJAVA STANDOFFA',
  'tiebreaker-active': 'STANDOFF',
  'finished': 'KRAJ',
};
function phaseLabelHr(phase) {
  return PHASE_LABELS_HR[phase] || (phase || '').toUpperCase();
}

// Leaderboard sort: by score desc, then by tiebreaker tap count desc, then alphabetical.
function makeLeaderboardSorter(session) {
  const tbTaps = (session && session.tiebreakerTaps) || {};
  return (a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    const aT = tbTaps[a.id] || 0;
    const bT = tbTaps[b.id] || 0;
    if (bT !== aT) return bT - aT;
    return (a.name || '').localeCompare(b.name || '');
  };
}


function getRoundConfig(session, round) {
  const category = getCategoryForRound(session, round);
  if (category === 'get-to-know') return { category, durationMs: 180_000, label: CATEGORY_TITLES['get-to-know'] };
  if (category === 'riddles')     return { category, durationMs: 120_000, label: CATEGORY_TITLES['riddles'] };
  return                                 { category, durationMs: 60_000,  label: CATEGORY_TITLES['mini-games'] };
}

function isTriadRound(session, round) {
  if (round % 3 !== 0) return false;
  return getCategoryForRound(session, round) !== 'mini-games';
}

// Constrained shuffle: 10 rounds (4 get-to-know, 3 riddles, 3 mini-games)
// with the constraint that mini-games never land on positions 3, 6, or 9
// (where triad rounds happen). Uses rejection sampling.
function shuffleCategoryOrder() {
  const base = [
    'get-to-know','get-to-know','get-to-know','get-to-know',
    'riddles','riddles','riddles',
    'mini-games','mini-games','mini-games',
  ];
  const triadPositions = [2, 5, 8]; // 0-indexed for rounds 3, 6, 9
  for (let attempt = 0; attempt < 200; attempt++) {
    const order = shuffle(base);
    if (triadPositions.every(p => order[p] !== 'mini-games')) return order;
  }
  // Fallback: manually place mini-games in non-triad slots
  const nonTriadSlots = [0,1,3,4,6,7,9];
  const positions = shuffle(nonTriadSlots).slice(0, 3);
  const result = [];
  let giIdx = 0, rIdx = 0;
  const gtk = 4, rid = 3;
  for (let i = 0; i < 10; i++) {
    if (positions.includes(i)) result[i] = 'mini-games';
  }
  for (let i = 0; i < 10; i++) {
    if (result[i]) continue;
    if (giIdx < gtk) { result[i] = 'get-to-know'; giIdx++; }
    else if (rIdx < rid) { result[i] = 'riddles'; rIdx++; }
  }
  return result;
}

// ---------- PAIRING RESOLUTION ----------
// At final pairing deadline, partial groups (some members didn't confirm) are resolved:
// - Unconfirmed members sit out this round.
// - Confirmed "orphans" (alone in their original group) are moved into the smallest
//   intact group nearby (a pair becomes a triad), or paired together if no room,
//   or finally sit out if there's no group to join.
// Returns { newGroups, sitOuts, transferredIds, colors }.
function resolveFailedPairings(s) {
  const groups = s.groups || [];
  const foundConfirmed = s.foundConfirmed || {};
  const sitOuts = [];
  const transferredIds = [];
  const intactGroups = []; // confirmed members of each original group (≥ 2)
  const orphans = [];      // confirmed-but-alone members

  groups.forEach(g => {
    const confirmed = foundConfirmed[groupKey(g)] || {};
    const ok  = g.filter(id => confirmed[id]);
    const bad = g.filter(id => !confirmed[id]);
    sitOuts.push(...bad);
    if (ok.length >= 2) intactGroups.push([...ok]);
    else if (ok.length === 1) orphans.push(ok[0]);
  });

  // Distribute orphans
  while (orphans.length > 0) {
    // Look for smallest intact group with room (< 3 members so we don't make groups of 4)
    let smallestIdx = -1;
    let smallestSize = Infinity;
    for (let i = 0; i < intactGroups.length; i++) {
      if (intactGroups[i].length < 3 && intactGroups[i].length < smallestSize) {
        smallestSize = intactGroups[i].length;
        smallestIdx = i;
      }
    }
    if (smallestIdx !== -1) {
      const orphan = orphans.shift();
      intactGroups[smallestIdx] = [...intactGroups[smallestIdx], orphan];
      transferredIds.push(orphan);
    } else {
      // All intact groups are full (3 each) — pair remaining orphans with each other
      if (orphans.length >= 2) {
        const a = orphans.shift();
        const b = orphans.shift();
        intactGroups.push([a, b]);
        transferredIds.push(a, b);
      } else {
        // Single lonely orphan, nowhere to put them
        sitOuts.push(orphans.shift());
      }
    }
  }

  // Assign colors: each new group gets a single color. Prefer the color that the majority
  // of original members had (so an "absorbed" pair keeps its color and only the new arrival changes).
  const colors = {};
  intactGroups.forEach((g, i) => {
    const counts = {};
    g.forEach(id => {
      const c = s.colors?.[id];
      if (c !== undefined) counts[c] = (counts[c] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const chosen = sorted.length > 0 ? Number(sorted[0][0]) : (i % COLORS.length);
    g.forEach(id => { colors[id] = chosen; });
  });

  return { newGroups: intactGroups, sitOuts, transferredIds, colors };
}

// ---------- FIREBASE HELPERS (multi-session: keyed by 4-digit code) ----------
function sessionPath(code) { return `sessions/${code}`; }

async function getSession(code) {
  if (!code) return null;
  try { const s = await get(ref(db, sessionPath(code))); return s.exists() ? s.val() : null; }
  catch (e) { console.error(e); return null; }
}
async function setSession(code, s) {
  if (!code) return false;
  try { await set(ref(db, sessionPath(code)), s); return true; }
  catch (e) { console.error(e); return false; }
}
async function deleteSession(code) {
  if (!code) return false;
  try { await remove(ref(db, sessionPath(code))); return true; }
  catch (e) { console.error(e); return false; }
}
function subscribeToSession(code, cb) {
  if (!code) { cb(null); return () => {}; }
  return onValue(ref(db, sessionPath(code)), (s) => cb(s.exists() ? s.val() : null));
}

async function findUniqueCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const c = generateCode();
    const existing = await getSession(c);
    if (!existing) return c;
  }
  // Fallback: use timestamp-based code if all else fails
  return generateCode();
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
  @keyframes pu-blink-pulse {
    0%, 100% { box-shadow: inset 0 0 0 0 rgba(242,95,76,0); }
    50% { box-shadow: inset 0 0 0 14px rgba(242,95,76,0.75); }
  }
  .pu-blink { animation: pu-blink-pulse 0.6s ease-in-out infinite; }
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
      color: urgent ? '#F25F4C' : '#FFFFFE',
      letterSpacing: '0.04em',
    }}>
      {mm}:{ss.toString().padStart(2, '0')}
    </div>
  );
}

function getJoinUrl(code) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#join=${code || ''}`;
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
  const joinUrl = getJoinUrl(code);
  return (
    <div style={{
      background: 'linear-gradient(135deg, #FF8906 0%, #F25F4C 100%)',
      borderRadius: 20, padding: '24px 20px', color: '#0F0E17', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, letterSpacing: '0.3em', opacity: 0.7, marginBottom: 8 }}>KOD ZA PRIDRUŽIVANJE</div>
      <div className="pu-display" style={{ fontSize: 72, letterSpacing: '0.05em', lineHeight: 1 }}>{code}</div>
      <div style={{ marginTop: 16, background: '#FFFFFE', borderRadius: 14, padding: 12, display: 'inline-flex' }}>
        <QRCode value={joinUrl} size={140} />
      </div>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 12, wordBreak: 'break-all', lineHeight: 1.4 }}>
        Skeniraj ili posjeti<br /><strong style={{ fontWeight: 700 }}>{joinUrl}</strong>
      </div>
    </div>
  );
}

function CopyLinkRow({ code }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    const joinUrl = getJoinUrl(code);
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
      {copied ? '✓ Link kopiran' : '⎘ Kopiraj link'}
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
          Upoznaj nove ljude. Pronađi svoju boju. Skupljaj bodove. Zabavi se.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button className="pu-btn" onClick={() => onChoose('join')} style={{
          background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14,
        }}>Sudionik sam →</button>
        <button className="pu-btn" onClick={() => onChoose('host')} style={{
          background: 'transparent', color: 'rgba(255,255,254,0.8)', fontSize: 15, padding: '14px 24px',
          borderRadius: 14, border: '2px solid rgba(255,255,254,0.15)',
        }}>Ja sam domaćin</button>
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
  const cfg = getRoundConfig(session, round);
  const category = cfg.category;
  const plan = session.activityPlan || {};
  // With randomized category order, we can't use `round - 1` as the slot anymore.
  // Slot = how many times this category has already appeared in rounds 1..round-1.
  const order = session.categoryOrder || [];
  let slot = 0;
  for (let i = 0; i < round - 1; i++) {
    if (order[i] === category) slot++;
  }

  if (category === 'get-to-know') {
    const idx = (plan['get-to-know'] || [])[slot] ?? 0;
    return { kind: 'thumbs', category: 'get-to-know', prompt: GET_TO_KNOW[idx] };
  }
  if (category === 'riddles') {
    const idx = (plan['riddles'] || [])[slot] ?? 0;
    const r = RIDDLES[idx];
    if (r.type === 'equation') return { kind: 'equation', category: 'riddles', prompt: r.prompt, answers: r.answers };
    return { kind: 'thumbs', category: 'riddles', prompt: r.prompt };
  }
  // mini-games
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
  // Returns { pointsAwarded: { [id]: number }, fastest3: [groupKey...] }
  const groups = session.groups || [];
  const activity = session.currentActivity || {};
  const voting = session.voting || {};

  // Speed bonus: applies only to non-thumbs activities (equations + mini-games).
  // Thumbs voting isn't a speed contest; capping at 1 pt as requested.
  let fastest3 = new Set();
  if (activity.kind !== 'thumbs') {
    const finishTimes = [];
    groups.forEach(g => {
      if (g.length < 2) return;
      const key = groupKey(g);
      const v = voting[key];
      if (v?.finishedAt) finishTimes.push({ key, t: v.finishedAt });
    });
    finishTimes.sort((a, b) => a.t - b.t);
    fastest3 = new Set(finishTimes.slice(0, 3).map(x => x.key));
  }

  const points = {};
  groups.forEach(g => {
    if (g.length < 2) return; // solo sit-outs
    const key = groupKey(g);
    const v = voting[key] || {};

    if (activity.kind === 'thumbs') {
      // Strict: all-up = 1 pt each, anything else = 0. No speed multiplier.
      const ups = g.filter(id => v.thumbs && v.thumbs[id] === 'up').length;
      const base = (ups === g.length) ? 1 : 0;
      g.forEach(id => { points[id] = (points[id] || 0) + base; });
      return;
    }

    const mult = fastest3.has(key) ? 2 : 1;

    if (activity.kind === 'equation') {
      const base = v.correct ? 1 : 0;
      g.forEach(id => { points[id] = (points[id] || 0) + base * mult; });
      return;
    }

    if (activity.kind === 'mini-game') {
      // Determine winner (fall back to computing from raw data if timer-expired)
      let winnerId = v.winnerId;
      if (!winnerId && activity.miniGame === 'clicking') {
        const taps = v.taps || {};
        const sorted = [...g].sort((a, b) => (taps[b] || 0) - (taps[a] || 0));
        if (sorted.length >= 2 && (taps[sorted[0]] || 0) > (taps[sorted[1]] || 0)) {
          winnerId = sorted[0];
        }
      }
      if (!winnerId && activity.miniGame === 'rps') {
        const rounds = v.rpsRounds || [];
        const scores = {};
        rounds.forEach(r => { if (r.winner) scores[r.winner] = (scores[r.winner] || 0) + 1; });
        const sorted = [...g].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
        if (sorted.length >= 2 && (scores[sorted[0]] || 0) > (scores[sorted[1]] || 0)) {
          winnerId = sorted[0];
        }
      }
      if (!winnerId && activity.miniGame === 'mini-quiz') {
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
      // Winner gets 1 pt × mult (so 2 if fastest 3, else 1). Others get 0 for this round.
      if (winnerId && winnerId !== 'tie' && g.includes(winnerId)) {
        points[winnerId] = (points[winnerId] || 0) + (1 * mult);
      }
      g.forEach(id => { if (points[id] === undefined) points[id] = 0; });
    }
  });

  return { pointsAwarded: points, fastest3: [...fastest3] };
}

// ============================================================
// HOST DASHBOARD
// ============================================================
function HostDashboard({ onBack }) {
  // Session code is in URL hash (#host=1234) so refresh reconnects to same session.
  const [code, setCode] = useState(() => {
    const m = window.location.hash.match(/#host=(\d{4})/);
    return m ? m[1] : null;
  });
  const [session, setSessionState] = useState(null);
  const [loading, setLoading] = useState(!!code);
  const [creating, setCreating] = useState(false);
  const tickBusy = useRef(false);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    const unsub = subscribeToSession(code, (s) => { setSessionState(s); setLoading(false); });
    return unsub;
  }, [code]);

  // ----- HOST TICK LOOP: advance phases when deadlines pass -----
  useEffect(() => {
    if (!code) return;
    const id = setInterval(async () => {
      if (tickBusy.current) return;
      const s = await getSession(code);
      if (!s) return;
      const now = Date.now();
      try {
        tickBusy.current = true;
        // category-announce timeout → activity (NEW: this comes after pairing now)
        if (s.phase === 'category-announce' && s.categoryAnnounceDeadline && now >= s.categoryAnnounceDeadline) {
          await beginActivity(s);
        }
        // triad-announce timeout → pairing
        else if (s.phase === 'triad-announce' && s.triadAnnounceDeadline && now >= s.triadAnnounceDeadline) {
          await beginPairing(s);
        }
        // pairing: handle extension + final timeout, then → category-announce
        else if (s.phase === 'pairing' && s.pairingDeadline) {
          const groups = s.groups || [];
          const confirmed = s.foundConfirmed || {};
          const allFound = groups.filter(g => g.length >= 2).every(g => {
            const c = confirmed[groupKey(g)] || {};
            return g.every(id => c[id]);
          });
          if (allFound) {
            await beginCategoryAnnounce(s);
          } else if (now >= s.pairingDeadline) {
            if (!s.pairingExtended) {
              // First deadline reached, not everyone found — extend by 10s and signal blink
              await setSession(code, { ...s, pairingExtended: true, pairingDeadline: now + PAIRING_EXT_MS });
            } else {
              // Final deadline expired — resolve partial groups, then advance.
              const { newGroups, transferredIds, colors } = resolveFailedPairings(s);
              await setSession(code, {
                ...s,
                groups: newGroups,
                colors,
                transferredIds,
                phase: 'category-announce',
                categoryAnnounceDeadline: Date.now() + CATEGORY_ANNOUNCE_MS,
              });
            }
          }
        }
        // activity timeout OR all groups done → voting (or directly to finalize for non-thumbs)
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
        // voting timeout OR all voted → finalize
        else if (s.phase === 'voting' && s.votingDeadline) {
          const groups = s.groups || [];
          const voting = s.voting || {};
          const allVoted = groups.filter(g => g.length >= 2).every(g => voting[groupKey(g)]?.finishedAt);
          if (allVoted || now >= s.votingDeadline) {
            await finalizeRound(s);
          }
        }
        // between: brief pause, then auto-advance to next round (no points reveal)
        else if (s.phase === 'between' && s.betweenDeadline && now >= s.betweenDeadline) {
          await advanceToNextRound(s);
        }
        // tiebreaker-announce → tiebreaker-active
        else if (s.phase === 'tiebreaker-announce' && s.tiebreakerAnnounceDeadline && now >= s.tiebreakerAnnounceDeadline) {
          await beginTiebreaker(s);
        }
        // tiebreaker-active → finished (timer expired)
        else if (s.phase === 'tiebreaker-active' && s.tiebreakerDeadline && now >= s.tiebreakerDeadline) {
          await finalizeTiebreaker(s);
        }
      } catch (e) { console.error('Tick error', e); }
      finally { tickBusy.current = false; }
    }, 500);
    return () => clearInterval(id);
  }, [code]);

  // ----- STATE TRANSITIONS -----
  const createSession = async () => {
    setCreating(true);
    const newCode = await findUniqueCode();
    const newSession = {
      code: newCode,
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
      categoryOrder: shuffleCategoryOrder(),
      currentActivity: null,
      hasReunion: false,
    };
    await setSession(newCode, newSession);
    setCode(newCode);
    window.location.hash = `host=${newCode}`;
    setCreating(false);
  };

  const beginPairing = async (sFromCaller) => {
    const s = sFromCaller || await getSession(code);
    if (!s) return;
    const ids = Object.keys(s.participants || {});
    if (ids.length < 2) { alert('Treba najmanje 2 sudionika.'); return; }
    // By now `s.round` has been set by startRound (via category-announce phase). Just use it.
    const targetRound = s.round;
    const groups = makeGroups(ids, isTriadRound(s, targetRound));
    const colors = {};
    groups.forEach((g, i) => {
      const colorIdx = i % COLORS.length;
      g.forEach(id => { colors[id] = colorIdx; });
    });
    const hasReunion = groups.some(g => detectReturning(g, s.pastGroups || []));
    await setSession(code, {
      ...s,
      phase: 'pairing',
      round: targetRound,
      groups,
      colors,
      foundConfirmed: {},
      voting: {},
      currentActivity: getRoundActivity(s, targetRound),
      pairingDeadline: Date.now() + PAIRING_MS,
      pairingExtended: false,
      transferredIds: [],
      hasReunion,
    });
  };

  const startRound = async () => {
    const s = await getSession(code);
    if (!s) return;
    const ids = Object.keys(s.participants || {});
    if (ids.length < 2) { alert('Treba najmanje 2 sudionika.'); return; }
    const targetRound = (s.phase === 'lobby' || !s.round) ? 1 : s.round + 1;
    if (targetRound > TOTAL_ROUNDS) { await finishGame(s); return; }
    // Triad heads-up (if applicable) → pairing → category-announce → activity
    if (isTriadRound(s, targetRound)) {
      await setSession(code, {
        ...s,
        phase: 'triad-announce',
        round: targetRound,
        triadAnnounceDeadline: Date.now() + TRIAD_ANNOUNCE_MS,
      });
    } else {
      await beginPairing({ ...s, round: targetRound });
    }
  };

  // Called when pairing is done (everyone confirmed or extension expired).
  // Shows the category announce screen for a short pause, then activity begins.
  const beginCategoryAnnounce = async (sFromCaller) => {
    const s = sFromCaller || await getSession(code);
    if (!s) return;
    await setSession(code, {
      ...s,
      phase: 'category-announce',
      categoryAnnounceDeadline: Date.now() + CATEGORY_ANNOUNCE_MS,
    });
  };

  const beginActivity = async (sFromCaller) => {
    const s = sFromCaller || await getSession(code);
    if (!s) return;
    // Defensive: if state is incomplete (no currentActivity or groups), don't start a timer
    // on stale data. Re-enter pairing for the current round instead.
    if (!s.currentActivity || !s.groups || s.groups.length === 0) {
      console.warn('beginActivity called with missing state — restarting pairing for round', s.round);
      await beginPairing(s);
      return;
    }
    const cfg = getRoundConfig(s, s.round);
    await setSession(code, {
      ...s,
      phase: 'activity',
      activityDeadline: Date.now() + cfg.durationMs,
    });
  };

  const beginVoting = async (sFromCaller) => {
    const s = sFromCaller || await getSession(code);
    if (!s) return;
    await setSession(code, {
      ...s,
      phase: 'voting',
      votingDeadline: Date.now() + VOTING_MS,
    });
  };

  const finalizeRound = async (sFromCaller) => {
    const s = sFromCaller || await getSession(code);
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
    // Skip the "results" reveal — participants don't see per-round points anymore.
    // Go straight to 'between' with a short auto-advance timer.
    await setSession(code, {
      ...s,
      phase: 'between',
      participants,
      pastGroups: newPast,
      betweenDeadline: Date.now() + BETWEEN_MS,
    });
  };

  // Called by tick loop when 'between' phase ends — go to next round or finish.
  // Must mirror startRound: triad-announce (if applicable) → pairing → category-announce → activity.
  // (Previously this jumped straight to category-announce, which skipped pairing and reused
  // stale voting state, causing rounds to auto-fire in seconds.)
  const advanceToNextRound = async (sFromCaller) => {
    const s = sFromCaller || await getSession(code);
    if (!s) return;
    if (s.round >= TOTAL_ROUNDS) {
      await finishGame(s);
      return;
    }
    const targetRound = s.round + 1;
    if (isTriadRound(s, targetRound)) {
      await setSession(code, {
        ...s,
        phase: 'triad-announce',
        round: targetRound,
        triadAnnounceDeadline: Date.now() + TRIAD_ANNOUNCE_MS,
      });
    } else {
      // beginPairing rebuilds groups/colors/voting/currentActivity for the new round
      await beginPairing({ ...s, round: targetRound });
    }
  };

  const continueToNextRound = async () => {
    const s = await getSession(code);
    if (!s) return;
    await startRound();
  };

  const finishGame = async (sFromCaller) => {
    const s = sFromCaller || await getSession(code);
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

    // Check for ties: anyone sharing a score with at least one other player joins the standoff
    const participants = s.participants || {};
    const scoreCounts = {};
    Object.values(participants).forEach(p => {
      const sc = p.score || 0;
      scoreCounts[sc] = (scoreCounts[sc] || 0) + 1;
    });
    const tiedScores = new Set(
      Object.entries(scoreCounts).filter(([_, n]) => n > 1).map(([s]) => Number(s))
    );
    const tiebreakerIds = Object.entries(participants)
      .filter(([_, p]) => tiedScores.has(p.score || 0))
      .map(([id]) => id);

    if (tiebreakerIds.length >= 2) {
      // Enter tiebreaker announce phase
      await setSession(code, {
        ...s,
        phase: 'tiebreaker-announce',
        stats,
        tiebreakerIds,
        tiebreakerTaps: {},
        tiebreakerAnnounceDeadline: Date.now() + TIEBREAKER_ANNOUNCE_MS,
      });
    } else {
      // No ties → straight to final leaderboard
      await setSession(code, { ...s, phase: 'finished', stats });
    }
  };

  // Transition from tiebreaker-announce → tiebreaker-active (start clicking)
  const beginTiebreaker = async (sFromCaller) => {
    const s = sFromCaller || await getSession(code);
    if (!s) return;
    await setSession(code, {
      ...s,
      phase: 'tiebreaker-active',
      tiebreakerDeadline: Date.now() + TIEBREAKER_ACTIVE_MS,
    });
  };

  // Tiebreaker over (timer expired) → reveal final leaderboard with tiebreaker-resolved order
  const finalizeTiebreaker = async (sFromCaller) => {
    const s = sFromCaller || await getSession(code);
    if (!s) return;
    await setSession(code, { ...s, phase: 'finished' });
  };

  const endSession = async () => {
    if (!window.confirm('Završiti sesiju? Svi sudionici će biti odspojeni.')) return;
    await deleteSession(code);
    setCode(null);
    setSessionState(null);
    window.location.hash = 'host';
  };

  // ----- REJOIN ADMIN -----
  const admitRejoin = async (id) => {
    const s = await getSession(code);
    if (!s) return;
    const pending = { ...(s.pendingRejoins || {}) };
    delete pending[id];
    // If mid-round, remove the rejoiner from the current round's groups so they sit out
    // this round; they'll be paired again at the next round's beginPairing.
    let groups = s.groups;
    if (s.phase !== 'lobby' && s.phase !== 'finished' && Array.isArray(groups)) {
      groups = groups.map(g => Array.isArray(g) ? g.filter(pid => pid !== id) : g)
                     .filter(g => Array.isArray(g) && g.length > 0);
    }
    await setSession(code, { ...s, pendingRejoins: pending, groups });
  };
  const denyRejoin = async (id) => {
    const s = await getSession(code);
    if (!s) return;
    const pending = { ...(s.pendingRejoins || {}) };
    delete pending[id];
    const participants = { ...(s.participants || {}) };
    delete participants[id];
    await setSession(code, { ...s, pendingRejoins: pending, participants });
  };

  // ----- RENDER -----
  if (loading) return <div className="pu-shell" style={{ justifyContent: 'center', alignItems: 'center' }}><Spinner /></div>;

  if (!session) {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', gap: 24 }}>
        <button onClick={onBack} className="pu-btn" style={{ alignSelf: 'flex-start', background: 'transparent', color: 'rgba(255,255,254,0.5)', fontSize: 14, padding: '8px 0' }}>← natrag</button>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>DOMAĆIN</div>
          <h2 className="pu-display" style={{ fontSize: 42, margin: '0 0 16px' }}>
            Pokreni<br/><em style={{ color: '#FF8906' }}>novu sesiju</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.6 }}>
            10 rundi: 4 razgovora, 3 zagonetke i izazova, 3 mini igre. Dobit ćeš kod i pusti ljude unutra.
          </p>
        </div>
        <button className="pu-btn" onClick={createSession} disabled={creating} style={{
          background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14,
        }}>{creating ? 'Pokrećem…' : 'Pokreni sesiju →'}</button>
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
  const cfg = session.round > 0 ? getRoundConfig(session, session.round) : null;

  return (
    <div className="pu-shell pu-fade" style={{ gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>UPRAVLJAČKA PLOČA</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,254,0.5)', marginTop: 2 }}>
            {session.round > 0 ? `Runda ${session.round} od ${TOTAL_ROUNDS} · ${cfg.label}` : 'Čekaonica'}
          </div>
        </div>
        <button onClick={endSession} className="pu-btn" style={{
          background: 'transparent', color: 'rgba(255,255,254,0.4)', fontSize: 12, padding: '6px 10px',
          border: '1px solid rgba(255,255,254,0.15)', borderRadius: 8,
        }}>završi sesiju</button>
      </div>

      {session.phase === 'lobby' && (
        <>
          <JoinCard code={session.code} />
          <CopyLinkRow code={session.code} />
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
            FAZA · {phaseLabelHr(session.phase)}
          </div>
          {session.phase === 'pairing' && <Countdown key={session.pairingDeadline} deadline={session.pairingDeadline} />}
          {session.phase === 'activity' && <Countdown deadline={session.activityDeadline} />}
          {session.phase === 'voting' && <Countdown deadline={session.votingDeadline} />}
          {session.phase === 'triad-announce' && <Countdown deadline={session.triadAnnounceDeadline} urgentAt={3} />}
          {session.phase === 'category-announce' && <Countdown deadline={session.categoryAnnounceDeadline} urgentAt={2} />}
          {session.phase === 'tiebreaker-announce' && <Countdown deadline={session.tiebreakerAnnounceDeadline} urgentAt={2} />}
          {session.phase === 'tiebreaker-active' && <Countdown deadline={session.tiebreakerDeadline} urgentAt={5} />}
        </div>

        {session.phase === 'lobby' && (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Čekamo sudionike. Pokreni rundu 1 kad ih bude najmanje 2.
            </p>
            <button className="pu-btn" onClick={startRound} disabled={participantList.length < 2} style={{
              background: '#FF8906', color: '#0F0E17', fontSize: 15, padding: '14px 20px', borderRadius: 12, width: '100%',
            }}>Pokreni rundu 1 →</button>
          </>
        )}

        {session.phase === 'between' && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: 0 }}>
            Runda {session.round} završena. Krećemo dalje…
          </p>
        )}

        {session.phase === 'category-announce' && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: 0 }}>
            Najavljujem kategoriju — {CATEGORY_TITLES[getCategoryForRound(session, session.round)] || '?'}
          </p>
        )}

        {session.phase === 'triad-announce' && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: 0 }}>
            Najavljujem trijadu — sudionici dobivaju grupe od 3.
          </p>
        )}

        {(session.phase === 'pairing' || session.phase === 'activity' || session.phase === 'voting') && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: 0, lineHeight: 1.5 }}>
            {session.phase === 'pairing' && `Traženje parova. ${confirmedCount}/${totalGroups} potvrđeno.${session.pairingExtended ? ' (produženo +10s)' : ''}`}
            {session.phase === 'activity' && `Aktivnost u tijeku — ${cfg?.label}.`}
            {session.phase === 'voting' && `Skupljam glasove.`}
          </p>
        )}

        {(session.phase === 'tiebreaker-announce' || session.phase === 'tiebreaker-active') && (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: '0 0 12px', lineHeight: 1.5 }}>
              {session.phase === 'tiebreaker-announce'
                ? `Najavljujem standoff za ${(session.tiebreakerIds || []).length} sudionika.`
                : `Standoff u tijeku — klikaju!`}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(session.tiebreakerIds || [])
                .map(id => ({
                  id,
                  name: session.participants?.[id]?.name || '?',
                  score: session.participants?.[id]?.score || 0,
                  taps: (session.tiebreakerTaps || {})[id] || 0,
                }))
                .sort((a, b) => b.taps - a.taps || (a.name || '').localeCompare(b.name || ''))
                .map((r, i) => (
                  <div key={r.id} style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: i === 0 && session.phase === 'tiebreaker-active' ? 'rgba(255,137,6,0.15)' : 'rgba(255,255,254,0.04)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13,
                  }}>
                    <span>
                      <span style={{ color: i === 0 ? '#FF8906' : 'rgba(255,255,254,0.5)', fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>
                      {r.name} <span style={{ opacity: 0.5 }}>· {r.score}</span>
                    </span>
                    <span className="pu-display" style={{ fontSize: 18 }}>{r.taps}</span>
                  </div>
                ))}
            </div>
          </>
        )}

        {session.phase === 'finished' && (
          <FinalLeaderboard session={session} />
        )}
      </div>

      {/* PENDING REJOINS */}
      {Object.keys(session.pendingRejoins || {}).length > 0 && (
        <div style={{
          background: 'rgba(255,137,6,0.08)',
          border: '1px solid rgba(255,137,6,0.3)',
          borderRadius: 16, padding: 14,
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#FF8906', marginBottom: 10 }}>
            ZAHTJEVI ZA POVRATAK
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(session.pendingRejoins || {}).map(([id, info]) => {
              const p = session.participants?.[id];
              if (!p) return null;
              return (
                <div key={id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'rgba(255,255,254,0.04)',
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: 15 }}>{p.name}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="pu-btn" onClick={() => admitRejoin(id)} style={{
                      background: '#FF8906', color: '#0F0E17', fontSize: 12, padding: '7px 12px',
                      borderRadius: 8, fontWeight: 700,
                    }}>pusti</button>
                    <button className="pu-btn" onClick={() => denyRejoin(id)} style={{
                      background: 'transparent', color: 'rgba(255,255,254,0.5)', fontSize: 12, padding: '7px 12px',
                      border: '1px solid rgba(255,255,254,0.15)', borderRadius: 8,
                    }}>odbij</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MINI LEADERBOARD */}
      {session.phase !== 'lobby' && session.phase !== 'finished' && participantList.length > 0 && (
        <MiniLeaderboard session={session} />
      )}

      {/* PARTICIPANT LIST */}
      {session.phase === 'lobby' && (
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginBottom: 10 }}>SUDIONICI</div>
          {participantList.length === 0 ? (
            <div style={{ fontSize: 14, color: 'rgba(255,255,254,0.4)', fontStyle: 'italic', padding: '12px 0' }}>Još nitko nije ušao…</div>
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
    .sort(makeLeaderboardSorter(session))
    .slice(0, 5);
  if (list.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginBottom: 10 }}>NAJBOLJIH 5</div>
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
    .sort(makeLeaderboardSorter(session));
  const stats = session.stats || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)' }}>Kraj igre. Konačni poredak:</div>
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
  // Each block: the leading sentence template with the gender-appropriate adjective.
  // {v} is replaced with the mode answer (ties shown joined with " i ").
  const blocks = [
    { key: 'season', sentence: 'Najdraže godišnje doba igrača je' },
    { key: 'snack',  sentence: 'Najdraži snack igrača je' },
    { key: 'drink',  sentence: 'Najdraže piće igrača je' },
  ];
  const summaries = blocks.map(b => {
    const entries = Object.entries(stats[b.key] || {});
    if (entries.length === 0) return null;
    const maxCount = Math.max(...entries.map(([_, c]) => c));
    const modes = entries.filter(([_, c]) => c === maxCount).map(([v]) => v);
    return { key: b.key, sentence: b.sentence, values: modes, count: maxCount };
  }).filter(Boolean);
  if (summaries.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>STATISTIKE</div>
      {summaries.map(s => (
        <div key={s.key} style={{
          background: 'rgba(255,255,254,0.04)', borderRadius: 10,
          padding: '12px 14px', fontSize: 15, lineHeight: 1.5,
        }}>
          <span style={{ color: 'rgba(255,255,254,0.7)' }}>{s.sentence}</span>{' '}
          <strong style={{ color: '#FF8906', textTransform: 'capitalize' }}>
            {s.values.join(' i ')}
          </strong>
          {s.values.length === 1 && s.count > 1 && (
            <span style={{ color: 'rgba(255,255,254,0.4)', fontSize: 13 }}>{' '}({s.count}×)</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PARTICIPANT FLOW
// ============================================================
function ParticipantFlow({ onBack }) {
  const [step, setStep] = useState('enter'); // enter | rulebook | profile | wait
  const [code, setCode] = useState(() => {
    const m = window.location.hash.match(/#join=(\d{4})/);
    return m ? m[1] : '';
  });
  const [codeConfirmed, setCodeConfirmed] = useState(false);
  const [name, setName] = useState('');
  const [profile, setProfile] = useState({ season: '', snack: '', drink: '' });
  const [error, setError] = useState('');
  const [session, setSessionState] = useState(null);
  const [myId, setMyId] = useState(null);

  // Subscribe once we're in (myId set)
  useEffect(() => {
    if (!myId || !code) return;
    const unsub = subscribeToSession(code, (s) => {
      if (!s) {
        setError('Sesija je završena.');
        setStep('enter');
        setMyId(null);
        setSessionState(null);
        setCodeConfirmed(false);
        return;
      }
      setSessionState(s);
      // Rejoin transitions
      if (step === 'rejoin-wait') {
        const stillPending = !!(s.pendingRejoins && s.pendingRejoins[myId]);
        const stillInGame = !!(s.participants && s.participants[myId]);
        if (!stillInGame) {
          // Host denied (removed from participants)
          setError('Host te nije pustio natrag.');
          setStep('enter');
          setMyId(null);
          setCodeConfirmed(false);
        } else if (!stillPending) {
          // Admitted — drop into the game
          setStep('wait');
        }
      }
    });
    return unsub;
  }, [myId, code, step]);

  // ----- ENTER CODE -----
  const submitCode = async () => {
    setError('');
    const trimmed = code.trim();
    if (!/^\d{4}$/.test(trimmed)) { setError('Unesi 4-znamenkasti kod.'); return; }
    const s = await getSession(trimmed);
    if (!s) { setError('Nema aktivne sesije s tim kodom.'); return; }
    setCode(trimmed);
    setCodeConfirmed(true);
    if (s.phase === 'lobby') {
      setStep('rulebook');
    } else if (s.phase === 'finished') {
      setError('Igra je završena.'); setCodeConfirmed(false);
    } else {
      // Mid-game: rejoin flow
      setSessionState(s); // store snapshot for the picker
      setStep('rejoin-pick');
    }
  };

  // ----- REJOIN: pick your name from the existing participants -----
  const requestRejoin = async (id) => {
    setError('');
    const s = await getSession(code);
    if (!s) { setError('Sesija je završena.'); setStep('enter'); setCodeConfirmed(false); return; }
    if (!s.participants?.[id]) { setError('Nema tog sudionika.'); return; }
    const pending = { ...(s.pendingRejoins || {}), [id]: { requestedAt: Date.now() } };
    const ok = await setSession(code, { ...s, pendingRejoins: pending });
    if (!ok) { setError('Greška. Pokušaj ponovno.'); return; }
    setMyId(id);
    setName(s.participants[id].name || '');
    setStep('rejoin-wait');
  };

  // ----- ACCEPT RULEBOOK -----
  const acceptRulebook = () => {
    setStep('profile');
  };

  // ----- SUBMIT PROFILE -----
  const submitProfile = async () => {
    setError('');
    if (!name.trim()) { setError('Upiši svoje ime.'); return; }
    if (!profile.season.trim() || !profile.snack.trim() || !profile.drink.trim()) {
      setError('Molimo te ispuni sva polja.');
      return;
    }
    const s = await getSession(code);
    if (!s) { setError('Sesija je završila.'); setStep('enter'); return; }
    if (s.phase !== 'lobby') { setError('Igra je već započela.'); setStep('enter'); return; }
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
    const ok = await setSession(code, updated);
    if (!ok) { setError('Greška pri pridruživanju. Pokušaj ponovno.'); return; }
    setMyId(id);
    setStep('wait');
  };

  // ----- RENDER BY STEP -----
  if (step === 'enter') {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', gap: 24 }}>
        <button onClick={onBack} className="pu-btn" style={{ alignSelf: 'flex-start', background: 'transparent', color: 'rgba(255,255,254,0.5)', fontSize: 14, padding: '8px 0' }}>← natrag</button>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>PRIDRUŽI SE</div>
          <h2 className="pu-display" style={{ fontSize: 48, margin: '0 0 8px' }}>
            Unesi<br/><em style={{ color: '#FF8906' }}>kod.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.5 }}>
            Host ima 4-znamenkasti kod na ekranu.
          </p>
        </div>
        <input type="tel" inputMode="numeric" maxLength={4} className="pu-input"
          placeholder="0000" value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{ fontSize: 36, textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'Fraunces, serif', fontWeight: 800, padding: '20px 16px' }} />
        {error && <div style={{ color: '#F25F4C', fontSize: 14 }}>{error}</div>}
        <button className="pu-btn" onClick={submitCode} style={{
          background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14,
        }}>Nastavi →</button>
      </div>
    );
  }

  if (step === 'rulebook') {
    return (
      <div className="pu-shell pu-fade" style={{ gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>PRAVILA</div>
          <h2 className="pu-display" style={{ fontSize: 38, margin: '0 0 8px' }}>
            Prije <em style={{ color: '#FF8906' }}>nego</em><br/>krenemo.
          </h2>
        </div>
        <ol style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, margin: 0, flex: 1 }}>
          {RULEBOOK.map((rule, i) => (
            <li key={i} style={{
              display: 'flex', gap: 14, padding: '14px 16px',
              background: 'rgba(255,255,254,0.04)', border: '1px solid rgba(255,255,254,0.08)',
              borderRadius: 12,
            }}>
              <div className="pu-display" style={{ fontSize: 24, color: '#FF8906', minWidth: 24, lineHeight: 1 }}>{i + 1}</div>
              <div style={{ fontSize: 15, lineHeight: 1.4, color: 'rgba(255,255,254,0.9)' }}>{rule}</div>
            </li>
          ))}
        </ol>
        <button className="pu-btn" onClick={acceptRulebook} style={{
          background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14,
        }}>Razumijem →</button>
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

  if (step === 'rejoin-pick') {
    const list = Object.entries((session && session.participants) || {})
      .map(([id, p]) => ({ id, name: p.name || '?' }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return (
      <div className="pu-shell pu-fade" style={{ gap: 20 }}>
        <button onClick={() => { setStep('enter'); setCodeConfirmed(false); setSessionState(null); }} className="pu-btn" style={{ alignSelf: 'flex-start', background: 'transparent', color: 'rgba(255,255,254,0.5)', fontSize: 14, padding: '8px 0' }}>← natrag</button>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>POVRATAK</div>
          <h2 className="pu-display" style={{ fontSize: 38, margin: '0 0 8px' }}>
            Tko si <em style={{ color: '#FF8906' }}>ti?</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.5 }}>
            Igra je već u tijeku. Odaberi svoje ime — host te mora pustiti natrag.
          </p>
        </div>
        {error && <div style={{ color: '#F25F4C', fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
          {list.length === 0 && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,254,0.4)', fontStyle: 'italic', padding: '12px 0' }}>
              U sesiji još nema sudionika.
            </div>
          )}
          {list.map(p => (
            <button key={p.id} className="pu-btn" onClick={() => requestRejoin(p.id)} style={{
              background: 'rgba(255,255,254,0.06)', color: '#FFFFFE',
              border: '1px solid rgba(255,255,254,0.12)', borderRadius: 12,
              padding: '14px 16px', fontSize: 16, textAlign: 'left',
            }}>{p.name}</button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'rejoin-wait') {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <Spinner />
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>ČEKAONICA</div>
        <h2 className="pu-display" style={{ fontSize: 36, margin: 0 }}>
          Čekamo<br/>da te host <em style={{ color: '#FF8906' }}>pusti.</em>
        </h2>
        <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 14, maxWidth: 280 }}>
          Pridružit ćeš se igri od sljedeće runde.
        </p>
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

  if (session.phase === 'category-announce') {
    const cat = getCategoryForRound(session, session.round);
    const title = CATEGORY_TITLES[cat] || '';
    const wasTransferred = (session.transferredIds || []).includes(myId);
    const myColorIdx = (session.colors || {})[myId];
    const myColor = myColorIdx !== undefined ? COLORS[myColorIdx] : null;
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>RUNDA {session.round}</div>
        <div className="pu-display" style={{ fontSize: 56, lineHeight: 1.05, color: '#FF8906' }}>
          {title}
        </div>
        {wasTransferred && myColor && (
          <div style={{
            padding: '14px 18px', borderRadius: 14,
            background: 'rgba(255,137,6,0.12)', border: '1px solid rgba(255,137,6,0.35)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 320,
          }}>
            <div style={{ fontSize: 12, letterSpacing: '0.2em', color: '#FF8906', fontWeight: 700 }}>
              PREMJESTILI SU TE
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,254,0.8)', lineHeight: 1.4 }}>
              Tvoja nova boja je{' '}
              <span style={{
                display: 'inline-block', background: myColor.bg, color: myColor.text,
                padding: '2px 10px', borderRadius: 6, fontWeight: 700,
              }}>{myColor.name}</span>
            </div>
          </div>
        )}
        <Countdown deadline={session.categoryAnnounceDeadline} urgentAt={2} />
      </div>
    );
  }

  if (session.phase === 'between') {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'rgba(255,255,254,0.5)' }}>RUNDA {session.round} GOTOVA</div>
        <div className="pu-display" style={{ fontSize: 40 }}>Spremi se za sljedeću…</div>
      </div>
    );
  }

  if (session.phase === 'triad-announce') {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>HEADS UP</div>
        <div className="pu-display" style={{ fontSize: 52, lineHeight: 1.05 }}>
          Ova runda —<br/><em style={{ color: '#FF8906' }}>grupe od troje.</em>
        </div>
        <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16, maxWidth: 280 }}>
          Ovaj put traži DVIJE osobe iste boje umjesto jedne.
        </p>
        <Countdown deadline={session.triadAnnounceDeadline} urgentAt={3} />
      </div>
    );
  }

  if (session.phase === 'pairing') {
    if (!myGroup) return <SitOutScreen />;
    if (myGroup.length === 1) {
      return (
        <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <div className="pu-display" style={{ fontSize: 60, color: '#FF8906' }}>solo</div>
          <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16, lineHeight: 1.6, maxWidth: 280 }}>
            Neparan broj — preskačeš ovu rundu. Vidimo se u sljedećoj.
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

  // 'results' phase no longer exists (per-round points hidden from participants).
  // Kept here as a safe fallback in case any old state arrives:
  if (session.phase === 'results') {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <div className="pu-display" style={{ fontSize: 40 }}>Sljedeća runda dolazi…</div>
      </div>
    );
  }

  if (session.phase === 'tiebreaker-announce' || session.phase === 'tiebreaker-active') {
    return <TiebreakerScreen session={session} myId={myId} />;
  }

  if (session.phase === 'finished') {
    return <ParticipantFinalScreen session={session} myId={myId} />;
  }

  return null;
}

function SitOutScreen() {
  return (
    <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 }}>
      <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16 }}>Preskačeš ovu rundu. Vidimo se u sljedećoj.</p>
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
  const groupConfirmed = (session.foundConfirmed || {})[myKey] || {};
  const allConfirmed = myGroup.every(id => groupConfirmed[id]);
  const isReunion = (session.hasReunion === true) && (session.pastGroups || []).some(past => {
    if (!past || past.length < 2) return false;
    for (let i = 0; i < myGroup.length; i++) for (let j = i + 1; j < myGroup.length; j++) {
      const a = myGroup[i], b = myGroup[j];
      if (past.includes(a) && past.includes(b)) return true;
    }
    return false;
  });

  // Blink during pairing extension if THIS group still has unconfirmed members
  const shouldBlink = !!session.pairingExtended && !allConfirmed;

  // Partner profile hints — show ONE fact only, formatted as a Croatian sentence.
  // Rotate which fact is shown per round (and per partner index in triads),
  // deterministically so all clients agree.
  const FACT_CATEGORIES = ['season', 'snack', 'drink'];
  const FACT_LABELS = {
    season: 'Najdraže godišnje doba',
    snack:  'Najdraži snack',
    drink:  'Najdraže piće',
  };
  const partners = myGroup.filter(id => id !== myId);
  const partnerHints = partners.map((pid, i) => {
    const p = session.participants?.[pid];
    if (!p) return null;
    const prof = p.profile || {};
    // Pick fact: rotate by round + partner index, but skip any empty profile fields
    const startIdx = ((session.round || 0) + i) % FACT_CATEGORIES.length;
    let fact = null;
    for (let off = 0; off < FACT_CATEGORIES.length; off++) {
      const cat = FACT_CATEGORIES[(startIdx + off) % FACT_CATEGORIES.length];
      if (prof[cat]) { fact = { cat, value: prof[cat] }; break; }
    }
    if (!fact) return null;
    return { name: p.name || '?', label: FACT_LABELS[fact.cat], value: fact.value };
  }).filter(Boolean);

  const confirmFound = async () => {
    if (myConfirmed) return;
    const s = await getSession(session.code);
    if (!s) return;
    const fc = s.foundConfirmed || {};
    const existing = fc[myKey] || {};
    await setSession(session.code, {
      ...s,
      foundConfirmed: { ...fc, [myKey]: { ...existing, [myId]: Date.now() } },
    });
  };

  if (!color) return <div className="pu-shell" style={{ justifyContent: 'center', alignItems: 'center' }}><Spinner /></div>;

  return (
    <div className={shouldBlink ? 'pu-blink' : ''} style={{
      position: 'fixed', inset: 0, background: color.bg, color: color.text,
      display: 'flex', flexDirection: 'column', padding: '24px 20px 32px',
      animation: 'pu-fade-in 0.4s ease forwards',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', opacity: 0.7 }}>TVOJA BOJA</div>
          {isReunion && <div style={{ fontSize: 12, marginTop: 4, fontStyle: 'italic', opacity: 0.85 }}>♻︎ Već ste se susreli!</div>}
        </div>
        <Countdown key={session.pairingDeadline} deadline={session.pairingDeadline} />
      </div>
      <div className="pu-display" style={{ fontSize: 96, margin: '8px 0 4px', lineHeight: 0.9 }}>
        {color.name}.
      </div>
      <div style={{ fontSize: 16, opacity: 0.7, marginBottom: 16, fontStyle: 'italic' }}>
        {myGroup.length === 3 ? 'Pronađi još DVIJE osobe iste boje. Požuri - ako ne nađeš grupu, preskačeš rundu.' : 'Pronađi osobu iste boje. Požuri - ako ne nađeš para, preskačeš rundu.'}
      </div>
      <div style={{
        height: 4, width: 80, background: color.text, opacity: 0.4, borderRadius: 2, marginBottom: 16,
      }} />
      <p style={{ fontSize: 16, lineHeight: 1.5, opacity: 0.9, maxWidth: 320, marginBottom: 12 }}>
        Pogledaj uokolo — tražiš nekoga čiji ekran je <strong>{color.name}</strong>.
      </p>

      {/* Hidden-profile hints to help find them */}
      {partnerHints.length > 0 && (
        <div style={{ marginBottom: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {partnerHints.map((h, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.12)',
              fontSize: 15, lineHeight: 1.4,
            }}>
              <span style={{ opacity: 0.75 }}>{h.label} tvog para je</span>{' '}
              <strong>{h.value}</strong>
            </div>
          ))}
        </div>
      )}
      {partnerHints.length === 0 && <div style={{ marginBottom: 'auto' }} />}

      {/* Extension banner */}
      {session.pairingExtended && !allConfirmed && (
        <div style={{
          padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.2)',
          fontSize: 14, fontWeight: 600, textAlign: 'center', marginBottom: 12,
        }}>
          ⏱ Dodatnih 10 sekundi — požurite!
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {!myConfirmed ? (
          <button className="pu-btn" onClick={confirmFound} style={{
            width: '100%', background: color.text, color: color.bg,
            fontSize: 17, padding: '20px 24px', borderRadius: 16, fontWeight: 700,
          }}>Pronašao/la sam {myGroup.length === 3 ? 'grupu' : 'para'} ✓</button>
        ) : (
          <div style={{
            padding: '20px 24px', borderRadius: 16, background: 'rgba(0,0,0,0.15)',
            textAlign: 'center', fontSize: 15, fontWeight: 500,
          }}>
            Potvrđeno. Pričekaj — aktivnost dolazi uskoro.
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
  const cfg = getRoundConfig(session, session.round);
  const partners = myGroup.filter(id => id !== myId).map(id => session.participants?.[id]?.name || '?').join(' & ');

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color.bg }} />
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>
          {color.name.toUpperCase()} · S {partners.toUpperCase()}
        </div>
      </div>
      <Countdown deadline={session.activityDeadline} urgentAt={Math.min(15, Math.floor(cfg.durationMs / 6000))} />
    </div>
  );

  if (activity.kind === 'thumbs') {
    return (
      <div className="pu-shell pu-fade" style={{ gap: 16 }}>
        {header}
        <ActivityCard color={color} type={activity.category === 'get-to-know' ? 'PITANJE' : 'IZAZOV'} prompt={activity.prompt} />
        <div style={{
          padding: '14px 16px', background: 'rgba(255,137,6,0.1)', border: '1px solid rgba(255,137,6,0.2)',
          borderRadius: 12, fontSize: 13, color: 'rgba(255,255,254,0.7)', textAlign: 'center',
        }}>
          Razgovarajte zajedno. Ocijenit ćete nakon isteka vremena.
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
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // 'wrong' temporarily; 'correct' is derived from group state
  const submitted = !!myVote.finishedAt; // group is locked only when SOMEONE got it right

  const submit = async () => {
    if (submitted || !answer.trim()) return;
    const isCorrect = checkAnswer(answer, activity.answers || []);
    if (!isCorrect) {
      // Wrong: flash feedback briefly, clear input, allow retry
      setFeedback('wrong');
      setAnswer('');
      setTimeout(() => setFeedback(null), 1500);
      return;
    }
    // Correct: lock the group's voting entry
    const s = await getSession(session.code);
    if (!s) return;
    const voting = s.voting || {};
    if (voting[myKey]?.finishedAt) return; // race: another member just finished it
    await setSession(session.code, {
      ...s,
      voting: { ...voting, [myKey]: { ...(voting[myKey] || {}), answer, correct: true, finishedAt: Date.now() } },
    });
  };

  return (
    <div className="pu-shell pu-fade" style={{ gap: 16 }}>
      {header}
      <ActivityCard color={color} type="ZAGONETKA" prompt={activity.prompt} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="text" className="pu-input" value={answer}
          onChange={e => setAnswer(e.target.value)} placeholder="Tvoj odgovor"
          disabled={submitted} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
        {!submitted ? (
          <button className="pu-btn" onClick={submit} disabled={!answer.trim()} style={{
            background: '#FF8906', color: '#0F0E17', fontSize: 16, padding: '14px 20px', borderRadius: 12,
          }}>Pošalji odgovor</button>
        ) : (
          <div style={{
            padding: '14px 20px', borderRadius: 12, textAlign: 'center', fontWeight: 600,
            background: 'rgba(124,179,66,0.15)', color: '#7CB342',
          }}>
            ✓ Točno!
          </div>
        )}
        {feedback === 'wrong' && !submitted && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, textAlign: 'center', fontSize: 14,
            background: 'rgba(242,95,76,0.15)', color: '#F25F4C',
          }}>
            ✗ Krivo — pokušaj ponovno
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
    const s = await getSession(session.code);
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

    await setSession(session.code, { ...s, voting: { ...v, [myKey]: updates } });
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
          fontSize: 11, letterSpacing: '0.2em', padding: '6px 12px', borderRadius: 100, fontWeight: 700 }}>MINI IGRA</div>
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

  // Compute time remaining locally so button disables exactly at expiry.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  const activityDeadline = session.activityDeadline || 0;
  // Activity duration is 60s; clicking starts after a 3-2-1 countdown derived from deadline.
  // We anchor the countdown to the deadline so all clients agree.
  const cfg = getRoundConfig(session, session.round);
  const activityStartedAt = activityDeadline - cfg.durationMs;
  const countdownEnd = activityStartedAt + CLICKING_COUNTDOWN_MS;
  const inCountdown = now < countdownEnd;
  const countdownSec = Math.max(0, Math.ceil((countdownEnd - now) / 1000));
  const timeExpired = now >= activityDeadline;
  const canTap = !finished && !inCountdown && !timeExpired;

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
      const s = await getSession(session.code);
      if (!s) return;
      const v = s.voting || {};
      const cur = v[myKey] || {};
      if (cur.finishedAt) return; // round resolved by host tick
      const curTaps = { ...(cur.taps || {}) };
      curTaps[myId] = Math.max(curTaps[myId] || 0, t);
      await setSession(session.code, { ...s, voting: { ...v, [myKey]: { ...cur, taps: curTaps } } });
      lastPushed.current = t;
    }, 250);
    return () => clearInterval(interval);
  }, [finished, myKey, myId]);

  const tap = () => { if (!canTap) return; setLocalTaps(t => t + 1); };
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
      {inCountdown && !finished ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,254,0.04)', border: `2px solid ${color.bg}40`,
          borderRadius: 24,
        }}>
          <div className="pu-display" style={{
            fontSize: 140, color: '#FF8906', fontWeight: 800, lineHeight: 1,
          }}>
            {countdownSec > 0 ? countdownSec : 'KRENI!'}
          </div>
        </div>
      ) : !finished && canTap ? (
        <button
          onPointerDown={(e) => { e.preventDefault(); tap(); }}
          onContextMenu={(e) => e.preventDefault()}
          style={{
          flex: 1, background: color.bg, color: color.text,
          border: 'none', borderRadius: 24, fontSize: 40, fontWeight: 800, fontFamily: 'Fraunces, serif',
          cursor: 'pointer', userSelect: 'none', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none',
        }}>KLIK!</button>
      ) : !finished && timeExpired ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,254,0.04)', borderRadius: 24,
          fontSize: 22, fontFamily: 'Fraunces, serif', fontWeight: 800,
          color: 'rgba(255,255,254,0.6)',
        }}>
          Vrijeme isteklo — čekamo rezultate…
        </div>
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

    const s = await getSession(session.code);
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

    await setSession(session.code, { ...s, voting: { ...v, [myKey]: updates } });

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
          fontSize: 11, letterSpacing: '0.2em', padding: '6px 12px', borderRadius: 100, fontWeight: 700 }}>MINI KVIZ</div>
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
    const s = await getSession(session.code);
    if (!s) return;
    const v = s.voting || {};
    const cur = v[myKey] || {};
    const newThumbs = { ...(cur.thumbs || {}), [myId]: choice };
    let updates = { ...cur, thumbs: newThumbs };
    if (myGroup.every(id => newThumbs[id])) {
      updates = { ...updates, finishedAt: Date.now() };
    }
    await setSession(session.code, { ...s, voting: { ...v, [myKey]: updates } });
  };

  return (
    <div className="pu-shell pu-fade" style={{ gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>OCJENA</div>
        <Countdown deadline={session.votingDeadline} urgentAt={5} />
      </div>
      <div>
        <h2 className="pu-display" style={{ fontSize: 36, margin: '0 0 8px' }}>
          Je li bilo <em style={{ color: '#FF8906' }}>zabavno?</em>
        </h2>
        <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 14, lineHeight: 1.5 }}>
          Ako svi u grupi daju palac gore, dobivate bod.
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
            <div style={{ fontSize: 14, fontWeight: 600 }}>Da</div>
          </button>
          <button className="pu-btn" onClick={() => vote('down')} style={{
            background: 'rgba(242,95,76,0.12)', color: '#F25F4C', fontSize: 64, padding: 0,
            border: '2px solid rgba(242,95,76,0.3)', borderRadius: 20, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <div>👎</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Ne</div>
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 80 }}>{myThumb === 'up' ? '👍' : '👎'}</div>
          <div style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15 }}>
            Poslano. Čekamo {myGroup.length === 3 ? 'ostale' : 'para'}…
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PARTICIPANT FINAL SCREEN
// ============================================================
// ============================================================
// TIEBREAKER — Solo clicking contest among everyone tied at any score
// Contestants click as fast as they can; non-contestants spectate.
// ============================================================
function TiebreakerScreen({ session, myId }) {
  const ids = session.tiebreakerIds || [];
  const amContestant = ids.includes(myId);
  const taps = session.tiebreakerTaps || {};
  const isAnnounce = session.phase === 'tiebreaker-announce';
  const isActive = session.phase === 'tiebreaker-active';
  const participants = session.participants || {};

  // Ranked contestants (live) by tap count desc
  const ranked = ids
    .map(id => ({ id, name: participants[id]?.name || '?', score: participants[id]?.score || 0, taps: taps[id] || 0 }))
    .sort((a, b) => b.taps - a.taps || (a.name || '').localeCompare(b.name || ''));

  // Local optimistic tap counter (for contestants)
  const [localTaps, setLocalTaps] = useState(taps[myId] || 0);
  const lastPushed = useRef(taps[myId] || 0);
  const localTapsRef = useRef(localTaps);
  localTapsRef.current = localTaps;
  useEffect(() => { const v = taps[myId] || 0; if (v > localTaps) setLocalTaps(v); }, [taps, myId]);

  useEffect(() => {
    if (!amContestant || !isActive) return;
    const interval = setInterval(async () => {
      const t = localTapsRef.current;
      if (t === lastPushed.current) return;
      const s = await getSession(session.code);
      if (!s || s.phase !== 'tiebreaker-active') return;
      const cur = s.tiebreakerTaps || {};
      const next = { ...cur, [myId]: Math.max(cur[myId] || 0, t) };
      await setSession(session.code, { ...s, tiebreakerTaps: next });
      lastPushed.current = t;
    }, 250);
    return () => clearInterval(interval);
  }, [amContestant, isActive, myId, session.code]);

  // Live clock for countdown display
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [isActive]);
  const tbStartedAt = (session.tiebreakerDeadline || 0) - TIEBREAKER_ACTIVE_MS;
  const tbCountdownEnd = tbStartedAt + TIEBREAKER_COUNTDOWN_MS;
  const inCountdown = isActive && now < tbCountdownEnd;
  const countdownSec = Math.max(0, Math.ceil((tbCountdownEnd - now) / 1000));

  const tap = () => { if (isActive && !inCountdown) setLocalTaps(t => t + 1); };

  // ----- ANNOUNCE -----
  if (isAnnounce) {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>IZJEDNAČENO</div>
        <div className="pu-display" style={{ fontSize: 56, lineHeight: 1, color: '#FF8906' }}>Tiebreaker!</div>
        <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 15, lineHeight: 1.5, maxWidth: 320 }}>
          {amContestant
            ? 'Ti si u standoffu — spremi prst! Najviše klikova u 15s pobjeđuje.'
            : 'Standoff za izjednačene sudionike. Pratiti uživo:'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 320 }}>
          {ranked.map(r => (
            <div key={r.id} style={{
              padding: '10px 14px', borderRadius: 10,
              background: r.id === myId ? 'rgba(255,137,6,0.2)' : 'rgba(255,255,254,0.06)',
              display: 'flex', justifyContent: 'space-between', fontSize: 14,
            }}>
              <span>{r.name}{r.id === myId ? ' (ti)' : ''}</span>
              <span style={{ opacity: 0.6 }}>{r.score} bod{r.score === 1 ? '' : (r.score >= 2 && r.score <= 4 ? 'a' : 'ova')}</span>
            </div>
          ))}
        </div>
        <Countdown deadline={session.tiebreakerAnnounceDeadline} urgentAt={2} />
      </div>
    );
  }

  // ----- 3-2-1 PREP COUNTDOWN (first 3s of tiebreaker-active for both contestants and spectators) -----
  if (inCountdown) {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 30 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>STANDOFF</div>
        <div className="pu-display" style={{ fontSize: 42, lineHeight: 1.1 }}>
          Pripremi se za <em style={{ color: '#FF8906' }}>igru.</em>
        </div>
        <div className="pu-display" style={{
          fontSize: 160, color: '#FF8906', fontWeight: 800, lineHeight: 1,
        }}>
          {countdownSec > 0 ? countdownSec : 'KRENI!'}
        </div>
        <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 14, maxWidth: 320 }}>
          {amContestant ? 'Klikaj što brže možeš.' : 'Gledaj uživo tko vodi.'}
        </p>
      </div>
    );
  }

  // ----- ACTIVE: CONTESTANT VIEW -----
  if (amContestant) {
    const myRank = ranked.findIndex(r => r.id === myId) + 1;
    const myDisplay = Math.max(taps[myId] || 0, localTaps);
    return (
      <div className="pu-shell pu-fade" style={{ gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#FF8906' }}>TIEBREAKER · #{myRank}</div>
          <Countdown deadline={session.tiebreakerDeadline} urgentAt={5} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8 }}>
          <div className="pu-display" style={{ fontSize: 64, color: '#FF8906' }}>{myDisplay}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,254,0.5)' }}>klikova</div>
        </div>
        <button
          onPointerDown={(e) => { e.preventDefault(); tap(); }}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            flex: 1, background: '#FF8906', color: '#0F0E17',
            border: 'none', borderRadius: 24, fontSize: 44, fontWeight: 800, fontFamily: 'Fraunces, serif',
            cursor: 'pointer', userSelect: 'none', touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none',
          }}>KLIK!</button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginBottom: 4 }}>UŽIVO</div>
          {ranked.map((r, i) => (
            <div key={r.id} style={{
              padding: '6px 12px', borderRadius: 8,
              background: r.id === myId ? 'rgba(255,137,6,0.15)' : 'rgba(255,255,254,0.04)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13,
            }}>
              <span><span style={{ color: i === 0 ? '#FF8906' : 'rgba(255,255,254,0.5)', fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>{r.name}</span>
              <span className="pu-display" style={{ fontSize: 18 }}>{r.taps}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ----- ACTIVE: SPECTATOR VIEW -----
  return (
    <div className="pu-shell pu-fade" style={{ gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#FF8906' }}>TIEBREAKER U TIJEKU</div>
        <Countdown deadline={session.tiebreakerDeadline} urgentAt={5} />
      </div>
      <div className="pu-display" style={{ fontSize: 32, lineHeight: 1.1 }}>
        Standoff <em style={{ color: '#FF8906' }}>uživo.</em>
      </div>
      <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 14, margin: 0 }}>
        Tko najviše klikne u 15s, prolazi izjednačene iznad sebe.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {ranked.map((r, i) => (
          <div key={r.id} style={{
            padding: '14px 16px', borderRadius: 12,
            background: i === 0 ? 'rgba(255,137,6,0.15)' : 'rgba(255,255,254,0.05)',
            border: i === 0 ? '1px solid rgba(255,137,6,0.4)' : '1px solid rgba(255,255,254,0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 16 }}>
              <span style={{ color: i === 0 ? '#FF8906' : 'rgba(255,255,254,0.5)', fontWeight: 700, marginRight: 10 }}>{i + 1}.</span>
              {r.name}
            </span>
            <span className="pu-display" style={{ fontSize: 28, color: i === 0 ? '#FF8906' : '#FFFFFE' }}>{r.taps}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantFinalScreen({ session, myId }) {
  const list = Object.entries(session.participants || {})
    .map(([id, p]) => ({ id, name: p.name, score: p.score || 0 }))
    .sort(makeLeaderboardSorter(session));
  const myRank = list.findIndex(p => p.id === myId) + 1;
  const myScore = session.participants?.[myId]?.score || 0;

  return (
    <div className="pu-shell pu-fade" style={{ gap: 22 }}>
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 8 }}>KRAJ IGRE</div>
        <div className="pu-display" style={{ fontSize: 52, lineHeight: 1 }}>
          {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : `#${myRank}`}
        </div>
        <div style={{ marginTop: 10, fontSize: 16, color: 'rgba(255,255,254,0.7)' }}>
          Skupio/la si <strong className="pu-display" style={{ fontSize: 26, color: '#FF8906' }}>{myScore}</strong> bodova
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginBottom: 10 }}>POREDAK</div>
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
              <span style={{ flex: 1 }}>{p.name}{p.id === myId ? ' (ti)' : ''}</span>
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
  // Hash patterns: #host, #host=1234, #join, #join=1234
  const parseMode = (h) => {
    if (h.startsWith('host')) return 'host';
    if (h.startsWith('join')) return 'join';
    return null;
  };
  const [mode, setMode] = useState(() => parseMode(window.location.hash.replace('#', '')));
  useEffect(() => {
    const onHash = () => setMode(parseMode(window.location.hash.replace('#', '')));
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
