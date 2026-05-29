import React, { useState, useEffect, useRef } from 'react';
import { ref, get, set, remove, onValue } from 'firebase/database';
import { db } from './firebase';

// ============================================================
// PAIR UP — Team Bonding Game
// ============================================================
// One single-file React app. Three modes via URL hash or buttons:
//   #host    → Host dashboard (creates session, starts rounds)
//   #join    → Participant join screen
//   (none)   → Landing
// State syncs via Firebase Realtime Database (real-time push, no polling).
// ============================================================

const SESSION_PATH = 'session';

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
];

// ============================================================
// ACTIVITIES — questions + challenges
// ============================================================
const ACTIVITIES = [
  { type: 'question', prompt: "If you could instantly master any skill, what would it be — and what's the first thing you'd do with it?" },
  { type: 'question', prompt: "What's a small, weirdly specific thing that brings you genuine joy?" },
  { type: 'question', prompt: "If your life had a theme song that played whenever you entered a room, what would it be?" },
  { type: 'question', prompt: "What's the most useless skill you have that you're secretly proud of?" },
  { type: 'question', prompt: "What's something you believed as a kid that you'd be embarrassed to admit now?" },
  { type: 'question', prompt: "If you could have dinner with any 3 people, living or dead, who would they be?" },
  { type: 'question', prompt: "What's a hill you'd die on — about something completely trivial?" },
  { type: 'question', prompt: "What's the best advice you've ever received that sounded terrible at the time?" },
  { type: 'question', prompt: "If you got a tattoo today that had to relate to your job, what would it be?" },
  { type: 'question', prompt: "What's a hobby or interest most people would never guess you have?" },
  { type: 'question', prompt: "What's the most spontaneous thing you've ever done?" },
  { type: 'question', prompt: "If you could live in any fictional universe for a week, which one and why?" },

  { type: 'challenge', prompt: "Find 3 things you have in common — they can't be obvious (no 'we both work here').", icon: 'ti-puzzle' },
  { type: 'challenge', prompt: "Each of you: share a 30-second story about a scar (physical or metaphorical).", icon: 'ti-bandage' },
  { type: 'challenge', prompt: "Trade phones and each pick one song from the other's library to play.", icon: 'ti-music' },
  { type: 'challenge', prompt: "Rock-paper-scissors, best of 5. Loser shares their most embarrassing autocorrect fail.", icon: 'ti-hand-rock' },
  { type: 'challenge', prompt: "Without looking — describe what the other person is wearing in as much detail as possible. Then look." },
  { type: 'challenge', prompt: "Show each other the last photo on your camera roll (any photo!) and tell its story.", icon: 'ti-photo' },
  { type: 'challenge', prompt: "Together, invent a fake startup based on a problem you both genuinely have. Name it." },
  { type: 'challenge', prompt: "Take turns: each name one thing you'd take to a desert island. Build a survival pack of 6 items together.", icon: 'ti-palm-tree' },
  { type: 'challenge', prompt: "Teach each other one word in a language the other doesn't speak — including the gesture that goes with it." },
  { type: 'challenge', prompt: "Quick-fire: 60 seconds to find the most surprising thing about each other's commute." },
  { type: 'challenge', prompt: "Each pick an emoji that represents your week so far. Explain why." },
  { type: 'challenge', prompt: "Together, agree on the perfect office snack. You must reach consensus." },
];

// ============================================================
// HELPERS — Firebase Realtime Database
// ============================================================
async function getSession() {
  try {
    const snap = await get(ref(db, SESSION_PATH));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    console.error('Firebase read failed', e);
    return null;
  }
}

async function setSession(s) {
  try {
    await set(ref(db, SESSION_PATH), s);
    return true;
  } catch (e) {
    console.error('Firebase write failed', e);
    return false;
  }
}

async function deleteSession() {
  try {
    await remove(ref(db, SESSION_PATH));
    return true;
  } catch (e) {
    console.error('Firebase delete failed', e);
    return false;
  }
}

// Subscribe to session changes — pushes updates instantly, no polling.
// Returns an unsubscribe function.
function subscribeToSession(callback) {
  const r = ref(db, SESSION_PATH);
  return onValue(r, (snap) => {
    callback(snap.exists() ? snap.val() : null);
  }, (err) => {
    console.error('Firebase subscription error', err);
  });
}

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function shufflePairs(participantIds) {
  const ids = [...participantIds].sort(() => Math.random() - 0.5);
  const pairs = [];
  for (let i = 0; i < ids.length; i += 2) {
    pairs.push(ids.slice(i, i + 2));
  }
  return pairs;
}

function pickActivity(roundNum, seed = 0) {
  // Deterministic for a given round so both partners see the same thing
  const idx = (roundNum * 7 + seed * 3) % ACTIVITIES.length;
  return ACTIVITIES[idx];
}

// ============================================================
// SHARED STYLES
// ============================================================
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
  @keyframes pu-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.04); }
  }
  .pu-pulse { animation: pu-pulse 1.6s ease-in-out infinite; }
  @keyframes pu-spin { to { transform: rotate(360deg); } }
  .pu-spin { animation: pu-spin 1s linear infinite; }
`;

// ============================================================
// LANDING SCREEN
// ============================================================
function Landing({ onChoose }) {
  return (
    <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 32 }}>
      <div>
        <div style={{ fontSize: 12, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 16 }}>
          TEAM BONDING
        </div>
        <h1 className="pu-display" style={{ fontSize: 72, margin: '0 0 8px', color: '#FFFFFE' }}>
          Pair<br/><span style={{ color: '#FF8906', fontStyle: 'italic' }}>Up.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
          Meet strangers. Find your color. Discover something unexpected.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button
          className="pu-btn"
          onClick={() => onChoose('join')}
          style={{
            background: '#FF8906',
            color: '#0F0E17',
            fontSize: 17,
            padding: '18px 24px',
            borderRadius: 14,
          }}
        >
          I'm a participant →
        </button>
        <button
          className="pu-btn"
          onClick={() => onChoose('host')}
          style={{
            background: 'transparent',
            color: 'rgba(255,255,254,0.8)',
            fontSize: 15,
            padding: '14px 24px',
            borderRadius: 14,
            border: '2px solid rgba(255,255,254,0.15)',
          }}
        >
          I'm hosting this event
        </button>
      </div>
    </div>
  );
}

// ============================================================
// HOST DASHBOARD
// ============================================================
function HostDashboard({ onBack }) {
  const [session, setSessionState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSession((s) => {
      setSessionState(s);
      setLoading(false);
    });
    return unsub;
  }, []);

  const createSession = async () => {
    setCreating(true);
    const newSession = {
      code: generateCode(),
      createdAt: Date.now(),
      phase: 'lobby', // lobby | paired | activity
      round: 0,
      participants: {}, // { id: { name, joinedAt } }
      pairs: [],       // [[id1, id2], ...]
      colors: {},      // { id: colorIndex }
      confirmed: {},   // { pairKey: { [id]: true } }
    };
    await setSession(newSession);
    setCreating(false);
  };

  const startRound = async () => {
    const s = await getSession();
    if (!s) return;
    const ids = Object.keys(s.participants || {});
    if (ids.length < 2) {
      alert('Need at least 2 participants to start a round.');
      return;
    }
    const pairs = shufflePairs(ids);
    const colors = {};
    pairs.forEach((pair, i) => {
      const colorIdx = i % COLORS.length;
      pair.forEach(id => { colors[id] = colorIdx; });
    });
    const updated = {
      ...s,
      phase: 'paired',
      round: (s.round || 0) + 1,
      pairs,
      colors,
      confirmed: {},
    };
    await setSession(updated);
  };

  const advanceToActivity = async () => {
    const s = await getSession();
    if (!s) return;
    await setSession({ ...s, phase: 'activity' });
  };

  const backToLobby = async () => {
    const s = await getSession();
    if (!s) return;
    await setSession({ ...s, phase: 'lobby', pairs: [], colors: {}, confirmed: {} });
  };

  const endSession = async () => {
    if (!confirm('End the session? All participants will be disconnected.')) return;
    await deleteSession();
  };

  if (loading) {
    return (
      <div className="pu-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,254,0.2)', borderTopColor: '#FF8906', borderRadius: '50%' }} className="pu-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', gap: 24 }}>
        <button onClick={onBack} className="pu-btn" style={{ alignSelf: 'flex-start', background: 'transparent', color: 'rgba(255,255,254,0.5)', fontSize: 14, padding: '8px 0' }}>
          ← back
        </button>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>HOST</div>
          <h2 className="pu-display" style={{ fontSize: 42, margin: '0 0 16px' }}>
            Start a<br/><em style={{ color: '#FF8906' }}>new session</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.6 }}>
            You'll get a 4-digit code participants can use to join. Then you control the pace — start rounds when the room is warmed up.
          </p>
        </div>
        <button
          className="pu-btn"
          onClick={createSession}
          disabled={creating}
          style={{
            background: '#FF8906',
            color: '#0F0E17',
            fontSize: 17,
            padding: '18px 24px',
            borderRadius: 14,
          }}
        >
          {creating ? 'Creating…' : 'Create session →'}
        </button>
      </div>
    );
  }

  const participantList = Object.entries(session.participants || {});
  const pairs = session.pairs || [];
  const confirmed = session.confirmed || {};
  const colors = session.colors || {};
  const pairCount = pairs.length;
  const confirmedCount = Object.values(confirmed).filter(c => c && Object.keys(c).length === 2).length;

  return (
    <div className="pu-shell pu-fade" style={{ gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906' }}>HOST DASHBOARD</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,254,0.5)', marginTop: 2 }}>Round {session.round}</div>
        </div>
        <button onClick={endSession} className="pu-btn" style={{ background: 'transparent', color: 'rgba(255,255,254,0.4)', fontSize: 12, padding: '6px 10px', border: '1px solid rgba(255,255,254,0.15)', borderRadius: 8 }}>
          end session
        </button>
      </div>

      {/* CODE + QR CARD */}
      <JoinCard code={session.code} />

      {/* COPY LINK */}
      <CopyLinkRow />


      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Stat label="people" value={participantList.length} />
        <Stat label="pairs" value={pairCount} />
        <Stat label="found" value={`${confirmedCount}/${pairCount}`} />
      </div>

      {/* PHASE CONTROL */}
      <div style={{ background: 'rgba(255,255,254,0.04)', border: '1px solid rgba(255,255,254,0.08)', borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginBottom: 12 }}>
          PHASE · {session.phase.toUpperCase()}
        </div>
        {session.phase === 'lobby' && (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Waiting for participants. Start the round when you have enough people.
            </p>
            <button
              className="pu-btn"
              onClick={startRound}
              disabled={participantList.length < 2}
              style={{ background: '#FF8906', color: '#0F0E17', fontSize: 15, padding: '14px 20px', borderRadius: 12, width: '100%' }}
            >
              Start round {session.round + 1} ({participantList.length} people)
            </button>
          </>
        )}
        {session.phase === 'paired' && (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Participants are looking for their color match. <strong style={{ color: '#FF8906' }}>{confirmedCount}/{pairCount}</strong> pairs have confirmed.
            </p>
            <button
              className="pu-btn"
              onClick={advanceToActivity}
              style={{ background: '#FF8906', color: '#0F0E17', fontSize: 15, padding: '14px 20px', borderRadius: 12, width: '100%' }}
            >
              Reveal activity →
            </button>
          </>
        )}
        {session.phase === 'activity' && (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,255,254,0.7)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Pairs are doing their activity. Move to a new round when ready.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="pu-btn"
                onClick={backToLobby}
                style={{ background: 'transparent', color: 'rgba(255,255,254,0.7)', fontSize: 14, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,254,0.15)', flex: 1 }}
              >
                Back to lobby
              </button>
              <button
                className="pu-btn"
                onClick={startRound}
                style={{ background: '#FF8906', color: '#0F0E17', fontSize: 14, padding: '12px 16px', borderRadius: 12, flex: 1.4 }}
              >
                New round →
              </button>
            </div>
          </>
        )}
      </div>

      {/* PARTICIPANT LIST */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginBottom: 10 }}>
          PARTICIPANTS
        </div>
        {participantList.length === 0 ? (
          <div style={{ fontSize: 14, color: 'rgba(255,255,254,0.4)', fontStyle: 'italic', padding: '12px 0' }}>
            No one has joined yet…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {participantList.map(([id, p]) => {
              const colorIdx = colors[id];
              const color = colorIdx !== undefined ? COLORS[colorIdx] : null;
              return (
                <div key={id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'rgba(255,255,254,0.04)',
                  borderRadius: 10,
                  fontSize: 14,
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: color ? color.bg : 'rgba(255,255,254,0.2)',
                  }} />
                  <span style={{ flex: 1 }}>{p.name}</span>
                  {color && <span style={{ fontSize: 11, color: 'rgba(255,255,254,0.5)' }}>{color.name}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// JOIN CARD — big code, QR, URL
// ============================================================
function getJoinUrl() {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#join`;
}

function JoinCard({ code }) {
  const joinUrl = getJoinUrl();
  return (
    <div style={{
      background: 'linear-gradient(135deg, #FF8906 0%, #F25F4C 100%)',
      borderRadius: 20,
      padding: '24px 20px',
      color: '#0F0E17',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, letterSpacing: '0.3em', opacity: 0.7, marginBottom: 8 }}>JOIN CODE</div>
      <div className="pu-display" style={{ fontSize: 72, letterSpacing: '0.05em', lineHeight: 1 }}>{code}</div>

      <div style={{
        marginTop: 16,
        background: '#FFFFFE',
        borderRadius: 14,
        padding: 12,
        display: 'inline-flex',
      }}>
        <QRCode value={joinUrl} size={140} />
      </div>

      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 12, wordBreak: 'break-all', lineHeight: 1.4 }}>
        Scan or visit<br />
        <strong style={{ fontWeight: 700 }}>{joinUrl}</strong>
      </div>
    </div>
  );
}

// Lightweight QR component using a tiny inline encoder.
// Uses qrcode-generator (loaded once from a CDN) and renders to SVG.
function QRCode({ value, size = 140 }) {
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let cancelled = false;

    const render = (qrcodeLib) => {
      try {
        // Type 0 = auto-detect smallest version that fits; error correction M
        const qr = qrcodeLib(0, 'M');
        qr.addData(value);
        qr.make();
        const count = qr.getModuleCount();
        const cell = size / count;
        let rects = '';
        for (let r = 0; r < count; r++) {
          for (let c = 0; c < count; c++) {
            if (qr.isDark(r, c)) {
              rects += `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="#0F0E17"/>`;
            }
          }
        }
        const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${rects}</svg>`;
        if (!cancelled) setSvg(out);
      } catch (e) {
        console.error('QR render failed', e);
      }
    };

    if (window.qrcode) {
      render(window.qrcode);
      return;
    }
    // Load qrcode-generator from CDN
    const existing = document.querySelector('script[data-qrcode-lib]');
    if (existing) {
      existing.addEventListener('load', () => window.qrcode && render(window.qrcode));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
    s.dataset.qrcodeLib = 'true';
    s.onload = () => window.qrcode && render(window.qrcode);
    s.onerror = () => console.error('Failed to load QR library');
    document.head.appendChild(s);

    return () => { cancelled = true; };
  }, [value, size]);

  if (!svg) {
    return (
      <div style={{
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#888', fontSize: 12,
      }}>
        Loading QR…
      </div>
    );
  }
  return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function CopyLinkRow() {
  const [copied, setCopied] = useState(false);
  const joinUrl = getJoinUrl();
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select-and-copy via temporary input
      const ta = document.createElement('textarea');
      ta.value = joinUrl;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
      document.body.removeChild(ta);
    }
  };
  return (
    <button
      className="pu-btn"
      onClick={onCopy}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'rgba(255,255,254,0.06)',
        color: copied ? '#7CB342' : 'rgba(255,255,254,0.85)',
        fontSize: 14,
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,254,0.1)',
      }}
    >
      {copied ? '✓ Link copied' : '⎘ Copy join link'}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{
      background: 'rgba(255,255,254,0.04)',
      borderRadius: 12,
      padding: '12px 10px',
      textAlign: 'center',
    }}>
      <div className="pu-display" style={{ fontSize: 26, color: '#FFFFFE' }}>{value}</div>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)', marginTop: 2 }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

// ============================================================
// PARTICIPANT FLOW
// ============================================================
function ParticipantFlow({ onBack }) {
  const [step, setStep] = useState('enter'); // enter | name | wait | paired | activity
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [session, setSessionState] = useState(null);
  const [myId, setMyId] = useState(null);
  const myIdRef = useRef(null);
  const lastPhase = useRef(null);
  const [foundConfirmed, setFoundConfirmed] = useState(false);

  // Subscribe to session changes (real-time)
  useEffect(() => {
    if (!myId) return;
    const unsub = subscribeToSession((s) => {
      if (!s || s.code !== code) {
        setError('Session ended by host.');
        setStep('enter');
        setMyId(null);
        myIdRef.current = null;
        return;
      }
      setSessionState(s);
      // Phase transitions
      if (s.phase !== lastPhase.current) {
        lastPhase.current = s.phase;
        if (s.phase === 'lobby') setStep('wait');
        else if (s.phase === 'paired') {
          setStep('paired');
          setFoundConfirmed(false);
        }
        else if (s.phase === 'activity') setStep('activity');
      }
    });
    return unsub;
  }, [myId, code]);

  const submitCode = async () => {
    setError('');
    const trimmed = code.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setError('Enter the 4-digit code.');
      return;
    }
    const s = await getSession();
    if (!s) {
      setError('No active session. Ask the host to start one.');
      return;
    }
    if (s.code !== trimmed) {
      setError("That code doesn't match the active session.");
      return;
    }
    setStep('name');
  };

  const submitName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError('Please enter a name.');
      return;
    }
    const s = await getSession();
    if (!s) {
      setError('Session ended.');
      setStep('enter');
      return;
    }
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const updated = {
      ...s,
      participants: {
        ...(s.participants || {}),
        [id]: { name: trimmed, joinedAt: Date.now() }
      }
    };
    const ok = await setSession(updated);
    if (!ok) {
      setError('Could not join. Try again.');
      return;
    }
    setMyId(id);
    myIdRef.current = id;
    setStep('wait');
    lastPhase.current = updated.phase;
  };

  const confirmFound = async () => {
    if (foundConfirmed) return;
    setFoundConfirmed(true);
    const s = await getSession();
    if (!s || !myIdRef.current) return;
    // Find my pair
    const pairs = s.pairs || [];
    const myPair = pairs.find(p => p.includes(myIdRef.current));
    if (!myPair) return;
    const pairKey = myPair.slice().sort().join('|');
    const existing = (s.confirmed || {})[pairKey] || {};
    const updated = {
      ...s,
      confirmed: {
        ...(s.confirmed || {}),
        [pairKey]: { ...existing, [myIdRef.current]: true }
      }
    };
    await setSession(updated);
  };

  // ========== RENDER ==========
  if (step === 'enter') {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', gap: 24 }}>
        <button onClick={onBack} className="pu-btn" style={{ alignSelf: 'flex-start', background: 'transparent', color: 'rgba(255,255,254,0.5)', fontSize: 14, padding: '8px 0' }}>
          ← back
        </button>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>JOIN</div>
          <h2 className="pu-display" style={{ fontSize: 48, margin: '0 0 8px' }}>
            Enter the<br/><em style={{ color: '#FF8906' }}>code.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.5 }}>
            Your host has a 4-digit code on screen.
          </p>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={4}
          className="pu-input"
          placeholder="0000"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{
            fontSize: 36,
            textAlign: 'center',
            letterSpacing: '0.3em',
            fontFamily: 'Fraunces, serif',
            fontWeight: 800,
            padding: '20px 16px',
          }}
        />
        {error && <div style={{ color: '#F25F4C', fontSize: 14 }}>{error}</div>}
        <button
          className="pu-btn"
          onClick={submitCode}
          style={{ background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14 }}
        >
          Continue →
        </button>
      </div>
    );
  }

  if (step === 'name') {
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FF8906', marginBottom: 12 }}>YOU'RE IN</div>
          <h2 className="pu-display" style={{ fontSize: 48, margin: '0 0 8px' }}>
            What should<br/>we <em style={{ color: '#FF8906' }}>call you?</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.6)', fontSize: 15, lineHeight: 1.5 }}>
            First name is plenty.
          </p>
        </div>
        <input
          type="text"
          className="pu-input"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value.slice(0, 30))}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && submitName()}
        />
        {error && <div style={{ color: '#F25F4C', fontSize: 14 }}>{error}</div>}
        <button
          className="pu-btn"
          onClick={submitName}
          style={{ background: '#FF8906', color: '#0F0E17', fontSize: 17, padding: '18px 24px', borderRadius: 14 }}
        >
          Join the room →
        </button>
      </div>
    );
  }

  if (step === 'wait') {
    const count = session ? Object.keys(session.participants || {}).length : 0;
    return (
      <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 28 }}>
        <div className="pu-pulse" style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,137,6,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FF8906' }} />
        </div>
        <div>
          <h2 className="pu-display" style={{ fontSize: 40, margin: '0 0 12px' }}>
            Hey <em style={{ color: '#FF8906' }}>{name}.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16, lineHeight: 1.5, maxWidth: 280 }}>
            You're in the room. Waiting for the host to start a round.
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,254,0.4)' }}>
          {count} {count === 1 ? 'person' : 'people'} here
        </div>
      </div>
    );
  }

  if (step === 'paired' && session && myId) {
    const colors = session.colors || {};
    const pairs = session.pairs || [];
    const colorIdx = colors[myId];
    const color = colorIdx !== undefined ? COLORS[colorIdx] : null;
    const myPair = pairs.find(p => p.includes(myId));
    const isUnpaired = myPair && myPair.length === 1;

    if (isUnpaired) {
      return (
        <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <div className="pu-display" style={{ fontSize: 60, color: '#FF8906' }}>solo</div>
          <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16, lineHeight: 1.6, maxWidth: 280 }}>
            Odd number this round — you're sitting out. Find someone else who's solo, or wait for the next round.
          </p>
        </div>
      );
    }

    if (!color) {
      return (
        <div className="pu-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,254,0.2)', borderTopColor: '#FF8906', borderRadius: '50%' }} className="pu-spin" />
        </div>
      );
    }

    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: color.bg,
        color: color.text,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px 32px',
        animation: 'pu-fade-in 0.4s ease forwards',
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', opacity: 0.7 }}>YOUR COLOR</div>
        <div className="pu-display" style={{ fontSize: 84, margin: '8px 0 16px' }}>
          {color.name}.
        </div>
        <p style={{ fontSize: 18, lineHeight: 1.5, opacity: 0.85, marginBottom: 'auto', maxWidth: 320 }}>
          Find the other person in the room showing this color. They're your partner.
        </p>

        <div style={{ marginTop: 32 }}>
          {!foundConfirmed ? (
            <button
              className="pu-btn"
              onClick={confirmFound}
              style={{
                width: '100%',
                background: color.text,
                color: color.bg,
                fontSize: 17,
                padding: '20px 24px',
                borderRadius: 16,
                fontWeight: 700,
              }}
            >
              I found my partner ✓
            </button>
          ) : (
            <div style={{
              padding: '20px 24px',
              borderRadius: 16,
              background: 'rgba(0,0,0,0.15)',
              textAlign: 'center',
              fontSize: 15,
              fontWeight: 500,
            }}>
              Confirmed. Hang tight — activity coming up.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'activity' && session && myId) {
    const pairs = session.pairs || [];
    const colors = session.colors || {};
    const participants = session.participants || {};
    const myPair = pairs.find(p => p.includes(myId));
    if (!myPair || myPair.length < 2) {
      return (
        <div className="pu-shell pu-fade" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 }}>
          <p style={{ color: 'rgba(255,255,254,0.7)', fontSize: 16 }}>You sat this round out. Stand by for the next one.</p>
        </div>
      );
    }
    const partnerId = myPair.find(id => id !== myId);
    const partnerName = participants[partnerId]?.name || 'your partner';
    const colorIdx = colors[myId];
    const color = COLORS[colorIdx];
    // Pick activity deterministic to this round + pair so both partners see the same one
    const pairSeed = myPair.slice().sort().join('').length;
    const activity = pickActivity(session.round, pairSeed);

    return (
      <div className="pu-shell pu-fade" style={{ gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color.bg }} />
          <div style={{ fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,254,0.5)' }}>
            ROUND {session.round} · WITH {partnerName.toUpperCase()}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,254,0.04)',
          border: `2px solid ${color.bg}40`,
          borderRadius: 20,
          padding: '28px 24px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 20,
        }}>
          <div style={{
            alignSelf: 'flex-start',
            background: color.bg,
            color: color.text,
            fontSize: 11,
            letterSpacing: '0.2em',
            padding: '6px 12px',
            borderRadius: 100,
            fontWeight: 700,
          }}>
            {activity.type === 'question' ? 'QUESTION' : 'CHALLENGE'}
          </div>
          <div className="pu-serif" style={{
            fontSize: 26,
            lineHeight: 1.3,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>
            {activity.prompt}
          </div>
          {activity.type === 'question' && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,254,0.5)', lineHeight: 1.5 }}>
              Take turns answering. There's no wrong way to do this.
            </div>
          )}
        </div>

        <div style={{
          padding: '14px 16px',
          background: 'rgba(255,137,6,0.1)',
          border: '1px solid rgba(255,137,6,0.2)',
          borderRadius: 12,
          fontSize: 13,
          color: 'rgba(255,255,254,0.7)',
          textAlign: 'center',
        }}>
          Host will start the next round when everyone's ready.
        </div>
      </div>
    );
  }

  return null;
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

  const goTo = (m) => {
    setMode(m);
    if (m) window.location.hash = m;
    else window.location.hash = '';
  };

  return (
    <>
      <style>{baseStyles}</style>
      {mode === null && <Landing onChoose={goTo} />}
      {mode === 'host' && <HostDashboard onBack={() => goTo(null)} />}
      {mode === 'join' && <ParticipantFlow onBack={() => goTo(null)} />}
    </>
  );
}
