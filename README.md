# PairUp — Team Bonding Game (v2.2)

Mobile-first browser game. Participants join via 4-digit code/QR, get paired by matching colors on their phones, and complete bonding activities over 10 rounds.

## What's new in v2.2

- **Multi-session.** Multiple hosts can each run an independent session. Code-keyed so they don't collide. Refresh-safe (the host URL becomes `#host=1234`).
- **Randomized category order** per session. Constrained so triad rounds (positions 3, 6, 9) never fall on mini-games.
- **Rulebook screen** shown to participants on join (5 placeholder points — see `RULEBOOK` in `src/App.jsx` to edit).
- **Category-announce screen** before every round, with the right Croatian title: *Upoznaj svog para* / *Izazov ili zagonetka* / *Brza igra*.
- **Hidden-profile hints in pairing.** While looking for their partner, players see *"Ova osoba voli {season}, {snack}, {drink}"* — useful when scanning the room.
- **Pairing extension.** If 60s elapses without everyone confirming, +10s are added and the unconfirmed groups' screens **blink** to draw attention.
- **Clicking contest: 3-2-1 countdown** before clicks start; button **disables when the timer hits 0** (bug fix).
- **Voting shortened to 15s** (was 30s).
- **Thumbs scoring tightened:** ALL up = 1 pt; anything else = 0.
- **Per-round point reveals removed** for participants. They only see scores at the end.
- **Timer color** updated to fit the design — white normally, red in the last 10 seconds.

## Round structure

- Rounds 1–10 use a randomized mix of three categories: 4 *get-to-know* (3 min), 3 *riddles & challenges* (2 min), 3 *mini games* (1 min)
- Every 3rd round is a triad (groups of 3) unless that slot landed on a mini-game (shuffle constraint prevents that)
- **Scoring** *(hidden from participants until the end)*: thumbs ALL-up = 1 pt each, equations correct = 1 pt, mini-game winner = 1 pt. Fastest 3 groups per round get a hidden 2× speed bonus.

## Mini games

1. **Clicking Contest** — 60s, most clicks wins. 3-2-1 countdown before play.
2. **Kamen, Papir, Škare** — best of 3 (first to 2 wins).
3. **Mini Quiz** — 3 Valcon questions; winner = most correct (tiebreak: fastest total time).

## Setup

### 1. Firebase
1. Create a free Firebase project at https://console.firebase.google.com
2. Add a Web app, copy the config into `src/firebase.js`
3. Enable **Realtime Database** (start in test mode)
4. **Update the rules to use the new `sessions` path** (changed from `session` for multi-session support):
```json
{ "rules": { "sessions": { ".read": true, ".write": true } } }
```

### 2. Local
```bash
npm install
npm run dev
```
Open http://localhost:5173 — `#host` for host, `#join` for participants. The host URL gets `=1234` appended once they create a session, and join links use `#join=1234` so QR codes pre-fill the code.

### 3. Deploy
- Push to GitHub → import to Vercel → done.

## Multi-session model

- Each host clicks "Create session" → gets a unique 4-digit code → URL becomes `#host=1234`.
- Refresh-safe: refreshing the host's page reconnects to the same session.
- Participants enter the code at `#join` (or follow `#join=1234` link, which pre-fills it).
- Ending a session deletes only that session — other hosts' sessions are untouched.
- If someone visits an old `#host=1234` URL whose session no longer exists, they'll be prompted to create a new one.

## Customizing
- Rulebook: search `RULEBOOK` in `src/App.jsx`
- Get-to-know questions: `GET_TO_KNOW`
- Riddles: `RIDDLES`
- Mini-quiz questions: `MINI_QUIZ_QUESTIONS`
- Colors: `COLORS`
- Timing: `PAIRING_MS`, `PAIRING_EXT_MS`, `VOTING_MS`, `CATEGORY_ANNOUNCE_MS`, `BETWEEN_MS`, `CLICKING_COUNTDOWN_MS`

## Notes / limitations
- Host's device is the "brain" — if a host disconnects mid-round, timers stall until they reconnect.
- No host auth — anyone with a `#host=1234` URL can manage that session.
- Up to ~20 collision retries when generating a code (allows ~9000 active sessions before retry pressure).
