# PairUp — Team Bonding Game (v2.1)

Mobile-first browser game. Participants join via 4-digit code/QR, get paired by matching colors on their phones, and complete bonding activities over 10 rounds.

## What's in this version

**10 rounds, 3 categories:**
- Rounds 1–4: *Get to know* — Croatian conversation prompts (3 min each, thumbs voting)
- Rounds 5–7: *Riddles & challenges* — vic, zdravica, plus mathematical/verbal puzzles (2 min each)
- Rounds 8–10: *Mini games* — Clicking Contest, Kamen/Papir/Škare, Mini Quiz (1 min each)

**Scoring:**
- *Thumbs categories:* all thumbs up = 2 pts each, mostly up = 1 pt each, otherwise 0
- *Equations:* 1 pt if correct, 0 if wrong
- *Mini games:* winner gets 1 pt
- **Speed bonus (hidden):** fastest 3 groups per round get 2× points

**Triads:** rounds 3 and 6 use groups of 3 (round 9 stays as pairs since mini-games can't be triads). 5-second heads-up screen first.

**Hidden profile:** 3 Croatian questions on join (godišnje doba, snack, piće). Grouped statistics shown at game end.

**Returning pairs:** Pairings are random; a "♻︎ Reunion" badge appears when re-paired.

**30 colors total**, each with its name shown.

## Mini games (specific)

1. **Clicking Contest** — Most clicks in 1 minute wins. Local optimistic counter for snappy feel, throttled push to Firebase every 250ms.
2. **Kamen, Papir, Škare** — Best of 3 (first to 2 wins). Croatian labels (Kamen / Papir / Škare).
3. **Mini Quiz** — 3 sequential questions (Valcon-specific). Each player progresses independently. Winner = most correct, tiebreak by fastest total time.

## Setup

### 1. Firebase
1. Create a free Firebase project at https://console.firebase.google.com
2. Add a Web app, copy the config into `src/firebase.js`
3. Enable **Realtime Database** (start in test mode)
4. Set rules to:
```json
{ "rules": { "session": { ".read": true, ".write": true } } }
```

### 2. Local
```bash
npm install
npm run dev
```
Open http://localhost:5173 — `#host` for host, `#join` for participants.

### 3. Deploy
- Push to GitHub → import to Vercel → done.

## Customizing
- Questions/riddles in `src/App.jsx`: search for `GET_TO_KNOW`, `RIDDLES`, `MINI_QUIZ_QUESTIONS`
- Colors: search for `const COLORS`
- Round timing: search for `getRoundConfig` and the `PAIRING_MS`/`VOTING_MS`/`RESULTS_MS` constants

## Notes / limitations
- One session at a time globally (single event)
- No host auth — keep the URL private
- If host disconnects mid-round, timers stall until they reconnect
- Activity prompts and labels are now mostly in Croatian; some chrome (HOST DASHBOARD, MINI GAME tags) stays in English
