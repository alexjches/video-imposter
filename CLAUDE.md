# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Two things that must not be confused:

- **The spec** — `docs/BUILD-PLAN.md` ("Video Imposter — Build Plan", 21 sections). This is the **authoritative target**. Its Section 20 is a confirmed-decisions log; treat those values as binding, not suggestions.
- **The code in `src/`** — an early, partial sketch of the functional plumbing. Per spec Section 21, it is **missing most of the spec** and its **visual design should be ignored entirely**. Do not treat the current feature set as the goal.

**The visual target is `vhs-frontend-example/`**, not `src/`. Spec §21 is explicit: where `vhs-frontend-example` and the general style direction in §18 conflict on a visual detail, `vhs-frontend-example` wins. The current Tailwind theme and `src/app/globals.css` component classes are *not* the design to build toward.

When a request is ambiguous, the spec decides. When the spec and the code disagree, the code is what's wrong — see the divergence table below.

## Commands

```bash
npm install
npx prisma generate && npx prisma db push   # required before first run (creates prisma/dev.db)
npm run dev                                 # tsx server.js — Next.js + Socket.io on :3000
npm run build                               # next build
npm run lint                                # next lint
node vhs-frontend-example/server.js         # visual reference, static, :9000
```

- **Never start the app with `next dev`.** Socket.io is attached to a custom HTTP server in `server.js`; the plain Next dev server has no websocket layer and every room/game feature silently breaks.
- `npm start` is written as `NODE_ENV=production tsx server.js` (POSIX syntax). On this Windows machine that fails in PowerShell — use the Bash tool, or `$env:NODE_ENV='production'; npx tsx server.js`.
- No test framework is configured. Verification is `npm run lint`, `npx tsc --noEmit`, and driving the app manually with two browser windows (a second window is needed for anything involving rooms).

## Current architecture

Next.js 14 App Router frontend + a Socket.io game server in the same process. `server.js` (CommonJS) boots Next, creates the socket.io `Server`, and calls `registerSocketHandlers(io)` from `src/server/socketHandlers.ts` — `tsx` is what lets a `.js` entrypoint `require` that TS module.

Note the stack already diverges from spec §15, which recommended React+Vite / Supabase / LiveKit. The existing Next.js + Prisma + custom-socket-server choice is what's actually built; don't rewrite it wholesale without asking.

**Two separate stores, deliberately:**
- **Game state is in-memory only** — a `Map<code, RoomState>` in `src/server/gameState.ts`. Restarting the dev server destroys every active room. Player identity *is* `socket.id`, so a refresh or reconnect creates a brand-new player; there is no rejoin path. This blocks several spec features (persistent currency, host transfer across reconnects) and will need to change.
- **Prisma/SQLite holds only durable, non-game data** — users, NextAuth accounts/sessions, video presets. The `GameHistory` model exists in the schema but nothing reads or writes it.

**The core secrecy invariant.** The game rests on players not knowing their role. `sanitizeRoom()` in `socketHandlers.ts` strips `normalVideoUrl`/`imposterVideoUrl` from every room broadcast, exposing only `hasNormalVideo`/`hasImposterVideo` booleans. URLs reach clients only through the per-socket `game:assigned` emit. Any new broadcast, event payload, or API response touching room settings must preserve this — leaking a URL breaks the game silently, not loudly.

⚠️ **This invariant is currently incomplete.** `game:assigned` also ships `isImposter: boolean` to the client. No in-game UI renders it, but it's visible in devtools, which violates spec §3 ("role is never shown to anyone"). Under the spec the client should never receive its role until results.

**Phase machine** — `lobby → playing → discussion → voting → results`, back to `lobby`. The server owns `room.phase`; `src/hooks/useRoom.ts` mirrors it into React state, and `src/app/room/[code]/page.tsx` is a switch rendering `LobbyScreen` / `GameScreen` / `DiscussionScreen` / `VotingScreen` / `ResultsScreen`. Transitions:
- `playing → discussion`: only the **host's** `game:videoEnded` fires it (non-hosts' events are ignored).
- `playing → voting`: shortcut when every player emits `game:readyToSkip`.
- `discussion → voting`: when every player emits `game:discussionReady`.
- `voting → results`: when `votescast >= players.length`, via `finalizeResults()`.

**Discussion phase** is turn-based with server-side timers. `startDiscussionTurns` builds a turn order of connected players, gives each a 10s window to submit one word, then flips `discussionOpen` to unlock free chat. The countdown is a `setInterval` tracked in the module-level `roomTimers` Map — **every path that ends or restarts a turn must call `clearRoomTimer(code)`**, including disconnects, `game:backToLobby`, and room deletion, or intervals leak and tick against a dead room. Disconnect handling has bespoke logic to splice the leaver out of `discussionTurnOrder` and fix up `discussionTurnIndex`.

**Adding a socket event requires edits in three places**, and doing two of three fails silently:
1. `src/server/socketHandlers.ts` — the handler, plus any `gameState.ts` mutator it needs.
2. `src/hooks/useRoom.ts` — a listener in the `useEffect`, *and* the matching `socket.off` in the cleanup.
3. `src/hooks/useRoom.ts` — a `useCallback` in the `actions` object, which is what components call.

**Type duplication is intentional.** `src/server/gameState.ts` holds the full server-side `RoomState` (URLs, imposter IDs, votes); `src/types/index.ts` holds the sanitized `RoomPublic` the client sees. Changing a room field means touching both plus `sanitizeRoom()`.

**Video playback** — `src/components/game/VideoPlayer.tsx` handles YouTube (IFrame API, loaded once behind a global `window._ytReady` guard), Vimeo (postMessage), and MP4 (`<video>`) behind one imperative `play()`/`pause()` handle; `src/lib/videoParser.ts` picks the type. Sync works by each client emitting `game:syncReady` on load, then the server broadcasting `game:play` with a `playAt` timestamp ~1s out that clients schedule against. Players render with `pointerEvents: 'none'` and no controls. The lockdown player vars the spec asks for in §5 (`controls=0`, `disablekb=1`, `fs=0`, `modestbranding=1`, `rel=0`) are already set.

**Coins/shop are client-side only.** `src/hooks/useShop.ts` reads/writes `localStorage` (`imposter_coins`, `imposter_shop_owned`). The server computes a `coinReward` in `game:results` but nothing persists it. Guest identity is likewise localStorage (`imposter_guest_name`, `imposter_guest_avatar`).

**Auth** — NextAuth, JWT sessions, credentials (bcrypt) plus Google/Discord providers conditionally spliced in only when their env vars exist. The `jwt`/`session` callbacks thread the DB user id onto `session.user.id`, passed as the optional `userId` on `room:create`/`room:join`.

## Where the code contradicts the spec

Verified against `src/` as of this file's writing. These are bugs-against-spec, not design choices — fix toward the spec column, and don't "preserve existing behavior" here.

| Area | Spec (`docs/BUILD-PLAN.md`) | Code today |
|---|---|---|
| Role secrecy | Never revealed until results (§3) | `game:assigned` sends `isImposter` to the client |
| Imposter count | 1 default; 2 only at 7+ players (§3) | Up to 3, clamped to `min(3, floor(players/2))` |
| 2-imposter flow | Two full word+vote rounds, accused removed between them (§3) | Not implemented — single round |
| Lobby size | 4–10 (§20) | `maxPlayers: 12`, starts at 2 |
| 1-imposter rewards | Crew win 75 / lose 50; imposter win 100 / lose 50 (§9) | `BASE 50` + `CREW_WIN_BONUS 100` / `IMPOSTER_WIN_BONUS 150` → 150 / 200 |
| Tie-breaks | Elaborate re-vote loops, imposter-vs-imposter auto-resolve (§8) | `getMostVoted()` returns the first max; no tie handling |
| Vote timer | 90s window, server-authoritative (§8) | `VOTE_DURATION = 90` is client-side cosmetic; server never times out a vote |
| Discussion + vote | One combined 90s window, chat and voting simultaneous (§8) | Separate `discussion` then `voting` phases |
| Ready check | Per-player Ready button; advance on all-ready **or** 10s after the imposter's video ends (§6) | Host-only `game:videoEnded` triggers the transition |
| Genres | Sports, Memes, Video Games, Music, Custom (§4) | `src/lib/videoCategories.ts` has memes, sports, music only |
| Video config | `/content/videos.json`, store bare YouTube IDs, no-repeat per lobby session (§14) | Hardcoded full-URL pairs in a `.ts` file; no no-repeat tracking |
| Comms modes | text / voice / video / **none** (§4) | `chatType` is `'text' \| 'voice' \| 'video'`; no `none` |
| Voting visibility | Host picks Public or Anonymous (§4) | Always broadcasts a live tally |
| Currency | Persistent, account-bound (§9, §11) | localStorage only |
| Accounts | Email / Google / **Apple**; Discord later (§11) | Email / Google / **Discord**; no Apple |
| Host controls | Manual host transfer, mid-lobby settings changes (§4) | Auto-transfer on host leave only |
| Not built at all | Emoji reactions during video (§5), premium tier (§12), ads (§13), shop/loot boxes (§10), profanity filter (§17), report/block (§17), friends list (§11), public matchmaking (§16) | — |

Spec §16 gives the intended build order (Phase 1 core loop → 2 social → 3 economy → 4 growth). Most of the table above is Phase 1–2 work.

## Conventions

- Import via `@/*` → `src/*`.
- **Styling: build toward `vhs-frontend-example/`** (VHS/CRT theme — `styles.css` there is the reference). The existing `src/app/globals.css` classes (`glass`, `card`, `btn-primary`, `input-field`, `grid-bg`, `neon-*`) and the `tailwind.config.js` palette are the *old* look the spec says to discard. Reuse them only for consistency inside screens you aren't reskinning yet; don't extend that system for new work, and don't cite it as "the project's design language."
- Server-side sanitize all user input at the handler: words stripped of whitespace and capped at 30 chars, chat at 300, `wordsPerPlayer` clamped 1–10, `imposterCount` clamped. Keep this up for new events.
- Env: `.env.example` is the template; `.env` and `.env.local` exist locally and are gitignored. `DATABASE_URL` points at SQLite (`file:./dev.db`); switching to Postgres also means editing `provider` in `prisma/schema.prisma`.
- YouTube access stays on the official IFrame API — no scraping or downloading (spec §5, ToS).

## Deployment note

Vercel cannot host this — serverless functions don't hold persistent websockets. Target Railway/Render running the custom Node server. In-memory rooms also mean this can't scale past one instance without moving room state to a shared store.

## `vhs-frontend-example/`

Standalone static prototype of the VHS/CRT UI ("Tape Suspect") — plain HTML/CSS/JS on its own file server at port 9000. Shares no code with `src/` and isn't part of the Next build. It is currently **untracked in git**; since the spec makes it the authoritative visual reference, consider committing it.
