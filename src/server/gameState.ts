// src/server/gameState.ts
// In-memory store for all active rooms

export type PlayerStatus = 'connected' | 'disconnected';

export interface Player {
  id: string;          // socket.id
  userId: string | null; // DB user id (null for guests)
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;    // true when their video is loaded & ready to play
  status: PlayerStatus;
}

export type GamePhase = 'lobby' | 'playing' | 'discussion' | 'voting' | 'results';

export interface RoomSettings {
  isPublic: boolean;
  normalVideoUrl: string;
  imposterVideoUrl: string;
  maxPlayers: number;
  wordsPerPlayer: number;   // words each player gets in restricted discussion (default 1)
  imposterCount: number;    // number of imposters (default 1)
  chatType: 'text' | 'voice' | 'video';
  videoCategory: string | null;
}

export interface RoomState {
  code: string;
  hostId: string;       // socket.id of host
  phase: GamePhase;
  players: Player[];
  imposterId: string | null;      // primary imposter (backwards compat)
  imposterIds: string[];          // all imposters
  settings: RoomSettings;
  votes: Record<string, string>;  // voter socketId -> target socketId
  discussionWords: Record<string, number>;   // socketId -> words used count
  discussionReady: Record<string, boolean>;  // socketId -> ready to vote
  discussionOpen: boolean;                   // true when all words used → free chat
  activePlayerId: string | null;             // socketId of active player whose turn it is
  discussionTurnOrder: string[];             // player IDs in turn order
  discussionTurnIndex: number;               // current index in turn order
  turnTimeLeft: number;                      // time left in seconds for the current turn
  createdAt: number;
  gameStartedAt: number | null;
}

// In-memory room store
const rooms = new Map<string, RoomState>();

export function createRoom(code: string, host: Player, settings: RoomSettings): RoomState {
  const room: RoomState = {
    code,
    hostId: host.id,
    phase: 'lobby',
    players: [host],
    imposterId: null,
    imposterIds: [],
    settings,
    votes: {},
    discussionWords: {},
    discussionReady: {},
    discussionOpen: false,
    activePlayerId: null,
    discussionTurnOrder: [],
    discussionTurnIndex: -1,
    turnTimeLeft: 0,
    createdAt: Date.now(),
    gameStartedAt: null,
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code);
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

export function getPublicRooms(): RoomState[] {
  return Array.from(rooms.values()).filter(
    (r) => r.settings.isPublic && r.phase === 'lobby'
  );
}

export function addPlayer(code: string, player: Player): RoomState | null {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.players.find((p) => p.id === player.id)) return room;
  room.players.push(player);
  return room;
}

export function removePlayer(code: string, socketId: string): RoomState | null {
  const room = rooms.get(code);
  if (!room) return null;
  room.players = room.players.filter((p) => p.id !== socketId);
  // Transfer host if host left
  if (room.hostId === socketId && room.players.length > 0) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
  }
  if (room.players.length === 0) {
    rooms.delete(code);
    return null;
  }
  return room;
}

export function getPlayerRoom(socketId: string): RoomState | undefined {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === socketId)) {
      return room;
    }
  }
  return undefined;
}

export function setPlayerReady(code: string, socketId: string): RoomState | null {
  const room = rooms.get(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === socketId);
  if (player) player.isReady = true;
  return room;
}

export function allPlayersReady(room: RoomState): boolean {
  return room.players.every((p) => p.isReady);
}

export function castVote(code: string, voterSocketId: string, targetSocketId: string): RoomState | null {
  const room = rooms.get(code);
  if (!room) return null;
  // Each player can only vote once
  if (room.votes[voterSocketId]) return room;
  room.votes[voterSocketId] = targetSocketId;
  return room;
}

export function getVoteTally(room: RoomState): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(room.votes)) {
    tally[targetId] = (tally[targetId] || 0) + 1;
  }
  return tally;
}

export function getMostVoted(room: RoomState): string | null {
  const tally = getVoteTally(room);
  let maxVotes = 0;
  let mostVotedId: string | null = null;
  for (const [id, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedId = id;
    }
  }
  return mostVotedId;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure uniqueness
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

// ─── Discussion helpers ──────────────────────────────────────────────────────

export function addDiscussionWord(code: string, socketId: string): { room: RoomState | null; allDone: boolean } {
  const room = rooms.get(code);
  if (!room) return { room: null, allDone: false };

  room.discussionWords[socketId] = (room.discussionWords[socketId] || 0) + 1;

  // Check if all players have used all their words
  const allDone = room.players.every(
    (p) => (room.discussionWords[p.id] || 0) >= room.settings.wordsPerPlayer
  );
  if (allDone && !room.discussionOpen) {
    room.discussionOpen = true;
  }

  return { room, allDone };
}

export function setDiscussionReady(code: string, socketId: string): { room: RoomState | null; allReady: boolean } {
  const room = rooms.get(code);
  if (!room) return { room: null, allReady: false };

  room.discussionReady[socketId] = true;

  const readyCount = Object.values(room.discussionReady).filter(Boolean).length;
  const allReady = readyCount >= room.players.length;

  return { room, allReady };
}

export function resetDiscussion(room: RoomState): void {
  room.discussionWords = {};
  room.discussionReady = {};
  room.discussionOpen = false;
  room.activePlayerId = null;
  room.discussionTurnOrder = [];
  room.discussionTurnIndex = -1;
  room.turnTimeLeft = 0;
}
