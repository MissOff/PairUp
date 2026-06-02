# PairUp — Team Bonding Game (v2.3)

Mobile-first browser game. Participants join via 4-digit code/QR, get paired by matching colors on their phones, and complete bonding activities over 10 rounds.

## What's new in v2.3

- **Fully Croatian UI** — host dashboard, landing, voting, leaderboard, mini-game tags, all participant-facing strings.
- **Hidden profile reveal** — one fact per partner, formatted as e.g. *"Najdraže piće tvog para je kava"*, rotated each round.
- **Category title moved to after pairing** — flow is now triad-announce (if applicable) → pairing → category title → activity.
- **Clicking sensitivity fixed** — switched to `onPointerDown` only, so taps no longer double-count from touchstart+click both firing.
- **Question dedup fixed** — slot calculation now counts how many times the category has appeared in earlier rounds rather than using the absolute round number. With randomized categories, the old formula was reading wrong indices and falling back to question #0 every time.
- **Thumbs scoring strictly capped at 1 pt** — speed bonus no longer applies to thumbs activities.
- **Pairing extension timer fixed** — replaced the `brightness(0.55)` filter (which dimmed the red text and made it look broken) with an inset red pulse, and added a `key` prop so the Countdown remounts cleanly when the deadline extends.
- **Snappier transitions** — tick loop 1000ms → 500ms, BETWEEN_MS 3000 → 1500, TRIAD_ANNOUNCE_MS 5000 → 3000, CATEGORY_ANNOUNCE_MS 3000 → 2500.

## Round structure

- 10 rounds in randomized category order: 4 *Upoznaj svog para* (3 min), 3 *Izazov ili zagonetka* (2 min), 3 *Brza igra* (1 min)
- Every 3rd round is a triad (groups of 3); shuffle constraint guarantees those slots are never mini-games
- **Scoring** *(hidden until the end)*:
  - Thumbs: ALL up = **1 pt each**, anything else = 0. No speed bonus.
  - Equation: correct = 1 pt × speed multiplier
  - Mini-game: winner = 1 pt × speed multiplier
  - **Speed bonus**: the fastest 3 groups in a round (non-thumbs only) get 2× points

## Mini games

1. **Clicking Contest** — 60s, most clicks wins. 3-2-1 countdown before play. Uses `onPointerDown` for accurate 1:1 tap counting.
2. **Kamen, Papir, Škare** — best of 3 (first to 2 wins).
3. **Mini Quiz** — 3 Valcon questions; winner = most correct (tiebreak: fastest total time).

## Setup

### 1. Firebase
1. Create a free Firebase project at https://console.firebase.google.com
2. Add a Web app, copy the config into `src/firebase.js`
3. Enable **Realtime Database** (start in test mode)
4. Set rules to:
```json
{ "rules": { "sessions": { ".read": true, ".write": true } } }
```

### 2. Local
```bash
npm install
npm run dev
```

### 3. Deploy
- Push to GitHub → import to Vercel → done.

## Multi-session
- Each host clicks "Pokreni sesiju" → gets a unique 4-digit code → URL becomes `#host=1234`.
- Refresh-safe: refreshing the host's page reconnects to the same session.
- Participants enter the code at `#join` (or follow `#join=1234` link, which pre-fills it).
- Ending a session deletes only that session.

## Customizing
- Rulebook: search `RULEBOOK` in `src/App.jsx`
- Get-to-know questions: `GET_TO_KNOW`
- Riddles: `RIDDLES`
- Mini-quiz questions: `MINI_QUIZ_QUESTIONS`
- Colors: `COLORS`
- Timing: `PAIRING_MS`, `PAIRING_EXT_MS`, `VOTING_MS`, `CATEGORY_ANNOUNCE_MS`, `BETWEEN_MS`, `CLICKING_COUNTDOWN_MS`
