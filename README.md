# 🎮 Imposter — The Video Deception Game

A real-time multiplayer social deduction game inspired by Sidemen Reacts: Imposter. One player secretly watches a **completely different video** and must blend in during voting.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, Custom CSS animations |
| Real-time | Socket.io (via custom Node.js server) |
| Auth | NextAuth.js (Email/Password + Google/Discord OAuth) |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |

---

## 🚀 Quick Start

### 1. Install Node.js

Download from https://nodejs.org (LTS version recommended, v18+)

### 2. Clone / open the project

```bash
cd c:\Users\alexj\Desktop\backup\imposter
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

This creates a local SQLite database file (`dev.db`) — no external database needed!

### 5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 in your browser. 🎉

---

## 🎮 How to Play

1. **Sign up** for an account (or play as guest)
2. **Create a room** from the Dashboard
3. **Set video URLs** — paste a YouTube link for the normal video and a different one for the imposter
4. **Share the room code** with friends
5. **Start the game** when everyone has joined
6. Everyone watches their video — but one player gets a DIFFERENT video
7. After the video ends, go to the **Voting screen** to debate and vote
8. **Results reveal** who the imposter was and who won

---

## 🔧 Configuration

### Environment Variables (`.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | ✅ | Random secret string for JWT signing |
| `NEXTAUTH_URL` | ✅ | Your app's base URL |
| `DATABASE_URL` | ✅ | SQLite: `file:./dev.db` or Postgres URL |
| `GOOGLE_CLIENT_ID` | Optional | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | For Google OAuth |
| `DISCORD_CLIENT_ID` | Optional | For Discord OAuth |
| `DISCORD_CLIENT_SECRET` | Optional | For Discord OAuth |

### Switching to PostgreSQL (Production)

1. Change `DATABASE_URL` in `.env.local` to your Postgres connection string
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
3. Run `npx prisma db push` to migrate

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── login/page.tsx      # Login
│   ├── signup/page.tsx     # Signup with avatar picker
│   ├── dashboard/page.tsx  # Room browser
│   └── room/[code]/        # Game room (phase-aware)
├── components/
│   ├── lobby/              # LobbyScreen, VideoSetupPanel, PresetLibrary
│   ├── game/               # GameScreen, VideoPlayer
│   ├── voting/             # VotingScreen
│   └── results/            # ResultsScreen
├── hooks/
│   ├── useSocket.ts        # Socket.io connection
│   └── useRoom.ts          # Room state machine
├── lib/
│   ├── socket.ts           # Socket singleton
│   ├── prisma.ts           # DB client singleton
│   ├── auth.ts             # NextAuth config
│   └── videoParser.ts      # YouTube/Vimeo/MP4 URL parser
└── server/
    ├── gameState.ts         # In-memory room store
    └── socketHandlers.ts    # All Socket.io events
```

---

## 🎬 Supported Video Sources

| Source | Format |
|---|---|
| YouTube | `https://youtube.com/watch?v=VIDEO_ID` |
| YouTube Shorts | `https://youtube.com/shorts/VIDEO_ID` |
| Vimeo | `https://vimeo.com/VIDEO_ID` |
| Direct MP4 | `https://example.com/video.mp4` |

---

## 🏗️ Deployment

### Vercel (recommended for Next.js)
Note: Vercel serverless functions don't support persistent WebSocket connections. Use a service like **Railway** or **Render** instead to run the custom Node.js server.

### Railway / Render
1. Connect your Git repository
2. Set environment variables in the platform dashboard
3. Build command: `npm run build`
4. Start command: `npm start`

---

## 📡 Socket.io Event Reference

| Event | Direction | Description |
|---|---|---|
| `room:create` | Client→Server | Create a new room |
| `room:join` | Client→Server | Join an existing room |
| `room:updateSettings` | Client→Server | Host updates video URLs / privacy |
| `room:kick` | Client→Server | Host removes a player |
| `room:updated` | Server→Room | Full room state broadcast |
| `rooms:updated` | Server→All | Public room list update |
| `game:start` | Client→Server | Host starts the game |
| `game:assigned` | Server→Player | Individual role + video URL |
| `game:syncReady` | Client→Server | Player signals video loaded |
| `game:readyCount` | Server→Room | How many players are ready |
| `game:play` | Server→Room | Synchronized play trigger with timestamp |
| `game:forceEnd` | Client→Server | Host skips to voting |
| `vote:cast` | Client→Server | Player casts a vote |
| `vote:tally` | Server→Room | Live vote counts |
| `game:results` | Server→Room | Final results reveal |
| `game:backToLobby` | Client→Server | Host resets to lobby |
