// src/types/index.ts
// Shared types used across frontend and backend

export type GamePhase = 'lobby' | 'playing' | 'discussion' | 'voting' | 'results';

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
    chatType: 'text' | 'voice' | 'video';
    videoCategory: string | null;
  };
  votes: Record<string, string>;
  createdAt: number;
}

export interface GameAssignment {
  isImposter: boolean;
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
  players: {
    id: string;
    name: string;
    avatar: string;
    votes: number;
  }[];
  coinReward: CoinReward;
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

export interface DiscussionWord {
  playerId: string;
  playerName: string;
  avatar: string;
  word: string;
  wordIndex: number;   // which word this is for that player (1-based)
  timestamp: number;
}

export interface DiscussionState {
  words: DiscussionWord[];
  chatMessages: ChatMessage[];
  isOpen: boolean;                            // free chat unlocked
  wordsUsed: Record<string, number>;          // playerId -> words used
  readyPlayers: Record<string, boolean>;      // playerId -> ready to vote
  wordsPerPlayer: number;
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
