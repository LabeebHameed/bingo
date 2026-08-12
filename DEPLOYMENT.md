# 🚀 Hosting Human Bingo (100% Free & Zero Cost)

Human Bingo is designed to run entirely on zero-cost infrastructure without requiring external paid APIs or databases.

---

## Option 1: Vercel (Recommended - 1 Click & Free)

1. Push your project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Human Bingo ready for production"
   git remote add origin https://github.com/your-username/human-bingo.git
   git push -u origin main
   ```
2. Log into [Vercel.com](https://vercel.com) using your GitHub account.
3. Click **"Add New"** → **"Project"** → Select your `human-bingo` repository.
4. Click **Deploy**. Vercel will automatically build the Next.js App Router project and assign a public HTTPS link (e.g. `https://human-bingo.vercel.app`).
5. Open the link on your laptop/projector, click **Log In**, set up your event, and display the QR code!

---

## Option 2: Render.com (100% Free Web Service)

1. Push your repository to GitHub.
2. Sign up for a free account on [Render.com](https://render.com).
3. Click **"New +"** → **"Blueprint"** and connect your GitHub repo (it will automatically pick up `render.yaml`).
4. Render will deploy your Node.js application for free.

---

## Option 3: Local Network Hosting (For In-Person Rallies / Offline Campus Networks)

If your campus rally is taking place in a room connected to local Wi-Fi:

1. Find your laptop's local IP address:
   - **macOS / Linux**: run `ifconfig | grep "inet "` (e.g. `192.168.1.45`)
   - **Windows**: run `ipconfig`
2. Start the app bound to all network interfaces:
   ```bash
   npm run dev -- -H 0.0.0.0 -p 3000
   ```
3. Share the IP link with participants on the same Wi-Fi: `http://192.168.1.45:3000/join`

---

## How End-to-End Gameplay Works

1. **Host Setup**:
   - The host visits `/admin/login` on desktop/laptop.
   - Click "Login", configure title and duration, pick optional FREE square position, and go to Launch.
   - The server creates a live event code (e.g. `BINGO-A3X9`).

2. **Participant Onboarding**:
   - Participants scan the QR code on the projector or visit `/join`.
   - The server validates the code (`GET /api/events/BINGO-A3X9`). If invalid or non-existent, access is blocked with a clear warning.
   - Participants complete profile setup in `/lobby` and enter the Waiting Room.

3. **Live Gameplay**:
   - Host clicks **"START GAME NOW!"**.
   - Server generates unique 5x5 cards for all participants and pushes `game_started` over real-time Server-Sent Events (SSE).
   - Participants are automatically taken to `/bingo`, tap squares, snap selfies with their camera, and submit.
   - Live Leaderboard & Activity Feed on the projector update in real-time.

4. **Low Network / Disconnect Recovery**:
   - If a student loses Wi-Fi or closes their mobile browser, their session is saved in `localStorage` and `cookies`.
   - Upon reopening the app, the client automatically restores state via `/api/events/[code]/reconnect`.
