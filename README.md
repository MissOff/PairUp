# PairUp — Deployment Guide

A team-bonding game where strangers find each other by color-matching their phones, then complete bonding activities together.

## What you're deploying

A static React app + a Firebase Realtime Database. Total cost: **$0** on free tiers, even for ~100 concurrent participants.

---

## Part 1 — Set up Firebase (10 min)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project**. Name it `pairup` (or whatever). Disable Google Analytics — you don't need it. Click **Create project**.
3. In the left sidebar, click **Build → Realtime Database**. Click **Create Database**.
   - Pick a region close to your event.
   - Choose **Start in test mode**. (We'll lock it down in a moment.)
4. Once created, click the **Rules** tab and paste this in, then **Publish**:
   ```json
   {
     "rules": {
       "session": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```
   This allows anyone to read/write the single session object. Fine for a one-off event — see the "Hardening" section if you want stricter rules.
5. Click the **gear icon** at the top left → **Project settings**.
6. Scroll down to **Your apps**. Click the **`</>`** (web) icon to register a web app. Name it `pairup-web`. **Skip** Firebase Hosting (we'll use Vercel). Click **Register app**.
7. Firebase shows you a `firebaseConfig` object. Copy it. It looks like:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSyB...",
     authDomain: "pairup-abc12.firebaseapp.com",
     databaseURL: "https://pairup-abc12-default-rtdb.firebaseio.com",
     projectId: "pairup-abc12",
     ...
   };
   ```
8. Open `src/firebase.js` in this project and replace the placeholder `firebaseConfig` object with yours.

> **Important:** The `databaseURL` field is required and isn't in every Firebase template — make sure it's present and points to your Realtime Database. If your DB region is europe or asia it'll look like `https://...europe-west1.firebasedatabase.app`.

---

## Part 2 — Test locally (2 min)

```bash
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`). Open it again in an incognito window to simulate a second device. One window picks "I'm hosting", the other picks "I'm a participant" and uses the code. Confirm pairing works.

---

## Part 3 — Deploy to Vercel (5 min)

The fastest free hosting for a Vite app. You'll need a GitHub account.

1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a new empty repo on github.com first, then:
   git remote add origin https://github.com/YOUR_USERNAME/pairup.git
   git branch -M main
   git push -u origin main
   ```

2. Go to https://vercel.com and sign in with GitHub.
3. Click **Add New → Project**. Pick your `pairup` repo. Click **Import**.
4. Vercel auto-detects Vite — leave all settings as default. Click **Deploy**.
5. About 60 seconds later, you'll get a URL like `pairup-abc.vercel.app`. Open it. You're live.

Every `git push` to `main` from now on redeploys automatically.

---

## Part 4 — Day of the event

1. Open the deployed URL on your laptop. Tap **"I'm hosting"** → **"Create session"**.
2. Project your screen (HDMI/AirPlay/etc) so attendees see the join code and QR.
3. Tell people: *"Scan the QR or visit [your URL] and enter the code."*
4. Watch participants appear in the list. Once you have enough, tap **"Start round 1"**.
5. Wait until most pairs have confirmed (the counter shows live progress), then tap **"Reveal activity"**.
6. Give pairs 3–5 minutes per activity, then tap **"New round"** for a fresh shuffle.

---

## Customizing

- **Activities**: edit the `ACTIVITIES` array near the top of `src/App.jsx`.
- **Colors**: edit `COLORS` (15 colors → supports up to 30 people per round before reuse — add more if your event is bigger).
- **Branding**: search for `"PairUp"` and the orange hex `#FF8906` in `src/App.jsx`.

After any change, push to GitHub — Vercel redeploys automatically.

---

## Hardening (optional, recommended if you'll reuse this)

The default rules allow anyone with your Firebase URL to overwrite the session. For a single event behind a known URL this is fine, but for repeated use:

**Option A — Multiple sessions keyed by code.** Restructure storage so each code has its own path (`sessions/1234`, `sessions/5678`). Add a host password check before allowing writes to a session.

**Option B — Add a time limit.** Use Firebase rules to reject writes older than X hours, so abandoned sessions auto-expire.

**Option C — Add Firebase Auth (anonymous)** and tie session ownership to a uid. Heavier lift, but proper.

For a single company event, none of this is required — just delete the Realtime Database when you're done.
