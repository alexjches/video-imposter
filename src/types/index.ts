// src/types/index.ts
// Shared types used across frontend and backend

// Phase flow per docs/BUILD-PLAN.md sections 6-8:
//   playing      video + Ready Check
//   words        turn-based word phase, 10s each
//   deliberation ONE 90s window, chat and voting live simultaneously
export type GamePhase = 'lobby' | 'playing' | 'words' | 'deliberation' | 'results';

export type ChatType = 'text' | 'voice' | 'video' | 'none';

export interface PlayerPublic {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  status: 'connected' | 'disconnected';
}

export interface RoomPublic {
  code: string;
  hostId: string;
  phase: GamePhase;
  players: PlayerPublic[];
  settings: {
    isPublic: boolean;
    maxPlayers: number;
    hasNormalVideo: boolean;
    hasImposterVideo: boolean;
    wordsPerPlayer: number;
    imposterCount: number;
    chatType: ChatType;
    videoCategory: string | null;
  };
  votes: Record<string, string>;
  createdAt: number;
}

// Spec section 3: role is hidden from the player for the whole round —
// there is deliberately no `isImposter` here. A client that knows its own
// role can read it out of devtools, which defeats the core mechanic. The
// role is only ever revealed in GameResults, after voting closes.
export interface GameAssignment {
  videoUrl: string;
}

export interface VoteTally {
  tally: Record<string, number>;  // socketId -> vote count
  votescast: number;
  totalVoters: number;
}

export interface GameResults {
  imposterId: string;       // primary imposter (backwards compat)
  imposterIds: string[];    // all imposters
  imposterName: string;
  imposterAvatar: string;
  mostVotedId: string | null;
  mostVotedName: string;
  crewWins: boolean;
  tally: Record<string, number>;
  // Safe to send only now that voting has closed — compare the two tapes.
  normalVideoUrl: string;
  imposterVideoUrl: string;
  players: {
    id: string;
    name: string;
    avatar: string;
    votes: number;
    isImposter: boolean;
    coinReward: CoinReward;
  }[];
}

export interface CoinReward {
  baseCoins: number;
  bonusCoins: number;
  total: number;
  reasons: string[];
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  avatar: string;
  message: string;
  timestamp: number;
  isWord?: boolean;  // true if this is a restricted single-word message
}

/** A word submitted during the turn-based word phase (section 7). */
export interface GameWord {
  playerId: string;
  playerName: string;
  avatar: string;
  word: string;
  wordIndex: number;   // which word this is for that player (1-based)
  timestamp: number;
}

/** Ready Check progress while the video phase winds down (section 6). */
export interface ReadyState {
  videoEnded: Record<string, boolean>;
  readyToAdvance: Record<string, boolean>;
  ready: number;
  total: number;
  /** Epoch ms the 10s post-imposter grace expires, or null before it starts. */
  graceEndsAt: number | null;
}

/** Live turn state during the word phase (section 7). */
export interface TurnState {
  activePlayerId: string | null;
  turnTimeLeft: number;
  turnIndex: number;
  wordsUsed: Record<string, number>;
}

/** The single 90s chat+vote window (section 8). */
export interface DeliberationState {
  endsAt: number;
  durationSeconds: number;
  voteRound: number;
  /** Non-null while a tie is being re-voted; ballot is restricted to these. */
  revoteCandidates: string[] | null;
  eligibleVoters: string[] | null;
}

export interface Preset {
  id: string;
  name: string;
  normalVideoUrl: string;
  imposterVideoUrl: string;
  userId: string;
  createdAt: string;
}

export type VideoType = 'youtube' | 'vimeo' | 'mp4' | 'unknown';

export interface ParsedVideo {
  type: VideoType;
  id: string | null;
  originalUrl: string;
  embedUrl: string | null;
}

// Shop types
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'avatar_frame' | 'avatar_emoji' | 'theme' | 'cosmetic';
  value: string;       // the actual value (emoji, css class, etc.)
  icon: string;        // display emoji
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
