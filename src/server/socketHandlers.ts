// src/server/socketHandlers.ts
// All Socket.io event handlers

import { Server, Socket } from 'socket.io';
import {
  createRoom,
  getRoom,
  deleteRoom,
  getPublicRooms,
  addPlayer,
  removePlayer,
  getPlayerRoom,
  setPlayerReady,
  allPlayersReady,
  castVote,
  getVoteTally,
  getMostVoted,
  generateRoomCode,
  addDiscussionWord,
  setDiscussionReady,
  resetDiscussion,
  Player,
  RoomSettings,
  RoomState,
} from './gameState';
import { getRandomVideoPair } from '../lib/videoCategories';

function sanitizeRoom(room: RoomState) {
  // Never send video URLs to clients here — they're sent individually during game:assigned
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      status: p.status,
    })),
    settings: {
      isPublic: room.settings.isPublic,
      maxPlayers: room.settings.maxPlayers,
      // Deliberately exclude video URLs from broadcast
      hasNormalVideo: !!room.settings.normalVideoUrl,
      hasImposterVideo: !!room.settings.imposterVideoUrl,
      wordsPerPlayer: room.settings.wordsPerPlayer,
      imposterCount: room.settings.imposterCount,
      chatType: room.settings.chatType,
      videoCategory: room.settings.videoCategory,
    },
    votes: room.votes,
    createdAt: room.createdAt,
  };
}

// Keep track of active intervals for turn count-downs
const roomTimers = new Map<string, NodeJS.Timeout>();

function clearRoomTimer(code: string) {
  const existing = roomTimers.get(code);
  if (existing) {
    clearInterval(existing);
    roomTimers.delete(code);
  }
}

function startDiscussionTurns(room: RoomState, io: Server) {
  clearRoomTimer(room.code);
  
  room.discussionWords = {};
  room.discussionReady = {};
  room.discussionOpen = false;

  // Build the turn order: only connected players
  room.discussionTurnOrder = room.players
    .filter((p) => p.status === 'connected')
    .map((p) => p.id);
  room.discussionTurnIndex = 0;
  room.activePlayerId = room.discussionTurnOrder[0] || null;
  room.turnTimeLeft = 10;

  if (room.activePlayerId) {
    startTurnTimer(room, io);
  } else {
    room.discussionOpen = true;
  }
}

function startTurnTimer(room: RoomState, io: Server) {
  clearRoomTimer(room.code);
  const timer = setInterval(() => {
    room.turnTimeLeft--;
    if (room.turnTimeLeft <= 0) {
      // Time is up! Move to the next player
      advanceDiscussionTurn(room, io);
    } else {
      broadcastDiscussionStatus(room, io);
    }
  }, 1000);
  roomTimers.set(room.code, timer);
}

function advanceDiscussionTurn(room: RoomState, io: Server) {
  room.discussionTurnIndex++;
  if (room.discussionTurnIndex >= room.discussionTurnOrder.length) {
    // All players have had their turn to say their word!
    clearRoomTimer(room.code);
    room.activePlayerId = null;
    room.discussionOpen = true;
    
    // Broadcast discussion open
    io.to(room.code).emit('game:discussionOpen', {
      message: 'All words said — free discussion now open!',
    });
  } else {
    // Next player's turn
    room.activePlayerId = room.discussionTurnOrder[room.discussionTurnIndex];
    room.turnTimeLeft = 10;
    startTurnTimer(room, io);
  }
  
  broadcastDiscussionStatus(room, io);
}

function broadcastDiscussionStatus(room: RoomState, io: Server) {
  io.to(room.code).emit('game:discussionStatus', {
    wordsUsed: room.discussionWords,
    readyPlayers: room.discussionReady,
    isOpen: room.discussionOpen,
    wordsPerPlayer: room.settings.wordsPerPlayer,
    activePlayerId: room.activePlayerId,
    turnTimeLeft: room.turnTimeLeft,
  });
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── Room: Create ───────────────────────────────────────────────
    socket.on(
      'room:create',
      (
        data: {
          playerName: string;
          avatar: string;
          userId: string | null;
          isPublic: boolean;
          normalVideoUrl?: string;
          imposterVideoUrl?: string;
          wordsPerPlayer?: number;
          imposterCount?: number;
          chatType?: 'text' | 'voice' | 'video';
          videoCategory?: string | null;
        },
        callback: (res: { success: boolean; code?: string; error?: string }) => void
      ) => {
        const code = generateRoomCode();

        const host: Player = {
          id: socket.id,
          userId: data.userId,
          name: data.playerName,
          avatar: data.avatar,
          isHost: true,
          isReady: false,
          status: 'connected',
        };

        const settings: RoomSettings = {
          isPublic: data.isPublic,
          normalVideoUrl: data.normalVideoUrl || '',
          imposterVideoUrl: data.imposterVideoUrl || '',
          maxPlayers: 12,
          wordsPerPlayer: data.wordsPerPlayer ?? 1,
          imposterCount: data.imposterCount ?? 1,
          chatType: data.chatType ?? 'text',
          videoCategory: data.videoCategory ?? null,
        };

        const room = createRoom(code, host, settings);
        socket.join(code);

        io.emit('rooms:updated', getPublicRooms().map(sanitizeRoom));
        callback({ success: true, code });

        console.log(`[Room] Created: ${code} by ${data.playerName}`);
      }
    );

    // ─── Room: Join ─────────────────────────────────────────────────
    socket.on(
      'room:join',
      (
        data: { code: string; playerName: string; avatar: string; userId: string | null },
        callback: (res: { success: boolean; room?: ReturnType<typeof sanitizeRoom>; error?: string }) => void
      ) => {
        const room = getRoom(data.code);
        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }
        if (room.phase !== 'lobby') {
          return callback({ success: false, error: 'Game already in progress' });
        }
        if (room.players.length >= room.settings.maxPlayers) {
          return callback({ success: false, error: 'Room is full' });
        }

        const player: Player = {
          id: socket.id,
          userId: data.userId,
          name: data.playerName,
          avatar: data.avatar,
          isHost: false,
          isReady: false,
          status: 'connected',
        };

        const updatedRoom = addPlayer(data.code, player);
        if (!updatedRoom) return callback({ success: false, error: 'Could not join room' });

        socket.join(data.code);
        io.to(data.code).emit('room:updated', sanitizeRoom(updatedRoom));
        io.emit('rooms:updated', getPublicRooms().map(sanitizeRoom));

        callback({ success: true, room: sanitizeRoom(updatedRoom) });
        console.log(`[Room] ${data.playerName} joined ${data.code}`);
      }
    );

    // ─── Room: Update Settings (host only) ──────────────────────────
    socket.on(
      'room:updateSettings',
      (data: {
        code: string;
        isPublic?: boolean;
        normalVideoUrl?: string;
        imposterVideoUrl?: string;
        wordsPerPlayer?: number;
        imposterCount?: number;
        videoCategory?: string | null;
      }) => {
        const room = getRoom(data.code);
        if (!room || room.hostId !== socket.id) return;

        if (data.isPublic !== undefined) room.settings.isPublic = data.isPublic;
        if (data.normalVideoUrl !== undefined) room.settings.normalVideoUrl = data.normalVideoUrl;
        if (data.imposterVideoUrl !== undefined) room.settings.imposterVideoUrl = data.imposterVideoUrl;
        if (data.wordsPerPlayer !== undefined) room.settings.wordsPerPlayer = Math.max(1, Math.min(10, data.wordsPerPlayer));
        if (data.imposterCount !== undefined) {
          const maxImposters = Math.max(1, Math.floor(room.players.length / 2));
          room.settings.imposterCount = Math.max(1, Math.min(3, Math.min(maxImposters, data.imposterCount)));
        }
        if (data.videoCategory !== undefined) room.settings.videoCategory = data.videoCategory;

        io.to(data.code).emit('room:updated', sanitizeRoom(room));
        io.emit('rooms:updated', getPublicRooms().map(sanitizeRoom));
      }
    );

    // ─── Room: Kick Player (host only) ──────────────────────────────
    socket.on('room:kick', (data: { code: string; targetId: string }) => {
      const room = getRoom(data.code);
      if (!room || room.hostId !== socket.id) return;

      const targetSocket = io.sockets.sockets.get(data.targetId);
      if (targetSocket) {
        targetSocket.emit('room:kicked', { reason: 'You were kicked by the host' });
        targetSocket.leave(data.code);
      }

      const updatedRoom = removePlayer(data.code, data.targetId);
      if (updatedRoom) {
        io.to(data.code).emit('room:updated', sanitizeRoom(updatedRoom));
      }
    });

    // ─── Game: Start ────────────────────────────────────────────────
    socket.on('game:start', (data: { code: string }) => {
      const room = getRoom(data.code);
      if (!room || room.hostId !== socket.id) return;
      if (room.players.length < 2) {
        socket.emit('game:error', { message: 'Need at least 2 players to start' });
        return;
      }
      
      // If a category is selected, try to pick a random video pair for this round
      if (room.settings.videoCategory && room.settings.videoCategory !== 'custom') {
        const randomVideo = getRandomVideoPair(room.settings.videoCategory);
        if (randomVideo) {
          room.settings.normalVideoUrl = randomVideo.crewmateVideoUrl;
          room.settings.imposterVideoUrl = randomVideo.imposterVideoUrl;
        }
      }

      if (!room.settings.normalVideoUrl || !room.settings.imposterVideoUrl) {
        socket.emit('game:error', { message: 'Both video URLs must be set before starting' });
        return;
      }

      // Pick N random imposters (no duplicates)
      const imposterCount = Math.max(1, Math.min(
        room.settings.imposterCount,
        Math.floor(room.players.length / 2)
      ));

      const shuffled = [...room.players].sort(() => Math.random() - 0.5);
      const imposters = shuffled.slice(0, imposterCount);
      const imposterIds = imposters.map((p) => p.id);

      room.imposterIds = imposterIds;
      room.imposterId = imposterIds[0]; // backwards compat
      room.phase = 'playing';
      room.gameStartedAt = Date.now();

      // Reset ready flags & discussion state
      room.players.forEach((p) => (p.isReady = false));
      resetDiscussion(room);

      // Send each player their individual video URL (secret!)
      room.players.forEach((player) => {
        const isImposter = imposterIds.includes(player.id);
        io.to(player.id).emit('game:assigned', {
          isImposter,
          videoUrl: isImposter ? room.settings.imposterVideoUrl : room.settings.normalVideoUrl,
        });
      });

      // Notify the room that game started (no video URLs in this broadcast)
      io.to(data.code).emit('room:updated', sanitizeRoom(room));
      console.log(`[Game] Started in room ${data.code}, imposters: ${imposters.map(p => p.name).join(', ')}`);
    });

    // ─── Game: Player Ready (video loaded) ──────────────────────────
    socket.on('game:syncReady', (data: { code: string }) => {
      const room = getRoom(data.code);
      if (!room || room.phase !== 'playing') return;

      const updatedRoom = setPlayerReady(data.code, socket.id);
      if (!updatedRoom) return;

      // Broadcast ready count
      const readyCount = updatedRoom.players.filter((p) => p.isReady).length;
      io.to(data.code).emit('game:readyCount', {
        ready: readyCount,
        total: updatedRoom.players.length,
      });

      // All ready → everyone play NOW
      if (allPlayersReady(updatedRoom)) {
        const playTimestamp = Date.now() + 1000; // 1s grace period
        io.to(data.code).emit('game:play', { playAt: playTimestamp });
        console.log(`[Game] All players ready in ${data.code}, playing at ${playTimestamp}`);
      }
    });

    // ─── Game: Ready to Skip Video to Voting (collective) ───────────
    socket.on('game:readyToSkip', (data: { code: string }) => {
      const room = getRoom(data.code);
      if (!room || room.phase !== 'playing') return;

      // Track readiness using discussionReady state
      room.discussionReady[socket.id] = true;
      const readyCount = Object.values(room.discussionReady).filter(Boolean).length;
      
      io.to(data.code).emit('game:skipReadyCount', {
        ready: readyCount,
        total: room.players.length,
      });

      if (readyCount >= room.players.length) {
        // Skip straight to voting
        room.phase = 'voting';
        room.votes = {};
        io.to(data.code).emit('game:votingStart', sanitizeRoom(room));
        console.log(`[Game] All players ready to skip to voting in ${data.code}`);
      }
    });

    // ─── Game: Video Ended (natural end) — goes to discussion phase ──
    socket.on('game:videoEnded', (data: { code: string }) => {
      const room = getRoom(data.code);
      if (!room || room.phase !== 'playing') return;
      if (room.hostId !== socket.id) return; // Only host triggers this

      startDiscussionTurns(room, io);
      io.to(data.code).emit('game:discussionStart', {
        ...sanitizeRoom(room),
        wordsPerPlayer: room.settings.wordsPerPlayer,
        wordsUsed: room.discussionWords,
        readyPlayers: room.discussionReady,
        isOpen: room.discussionOpen,
        activePlayerId: room.activePlayerId,
        turnTimeLeft: room.turnTimeLeft,
      });
      console.log(`[Game] Discussion phase started in ${data.code}`);
    });

    // ─── Discussion: Player video-ended and clicked ready ───────────
    socket.on('game:playerVideoEnded', (data: { code: string }) => {
      const room = getRoom(data.code);
      if (!room || room.phase !== 'playing') return;

      // Signal to the room this player has finished watching
      io.to(data.code).emit('game:playerFinishedVideo', { playerId: socket.id });
    });

    // ─── Discussion: Send a restricted word ─────────────────────────
    socket.on('game:discussionWord', (data: { code: string; word: string }) => {
      const room = getRoom(data.code);
      if (!room || room.phase !== 'discussion') return;
      if (room.discussionOpen) return; // words phase is over
      if (room.activePlayerId !== socket.id) return; // only allowed when it is this player's turn

      const player = room.players.find((p) => p.id === socket.id);
      if (!player) return;

      const wordsUsed = room.discussionWords[socket.id] || 0;
      if (wordsUsed >= room.settings.wordsPerPlayer) return; // quota exceeded

      // Sanitize: one word only (no spaces, max 30 chars)
      const word = data.word.trim().replace(/\s+/g, '').slice(0, 30);
      if (!word) return;

      const { room: updatedRoom } = addDiscussionWord(data.code, socket.id);
      if (!updatedRoom) return;

      const wordIndex = updatedRoom.discussionWords[socket.id];

      // Broadcast the word as a message
      io.to(data.code).emit('game:discussionWord', {
        playerId: socket.id,
        playerName: player.name,
        avatar: player.avatar,
        word,
        wordIndex,
        timestamp: Date.now(),
      });

      // Move to the next player if they used all their words
      const currentUserWordsUsed = updatedRoom.discussionWords[socket.id] || 0;
      if (currentUserWordsUsed >= updatedRoom.settings.wordsPerPlayer) {
        advanceDiscussionTurn(updatedRoom, io);
      } else {
        broadcastDiscussionStatus(updatedRoom, io);
      }
    });

    // ─── Discussion: Send free chat message (after words used) ───────
    socket.on('game:discussionChat', (data: { code: string; message: string }) => {
      const room = getRoom(data.code);
      if (!room || room.phase !== 'discussion') return;
      if (!room.discussionOpen) return; // only allowed once free chat is open

      const player = room.players.find((p) => p.id === socket.id);
      if (!player) return;

      const message = data.message.trim().slice(0, 300);
      if (!message) return;

      io.to(data.code).emit('room:chatMessage', {
        playerId: socket.id,
        playerName: player.name,
        avatar: player.avatar,
        message,
        timestamp: Date.now(),
        isWord: false,
      });
    });

    // ─── Discussion: Player signals ready to vote ────────────────────
    socket.on('game:discussionReady', (data: { code: string }) => {
      const room = getRoom(data.code);
      if (!room || room.phase !== 'discussion') return;

      const { room: updatedRoom, allReady } = setDiscussionReady(data.code, socket.id);
      if (!updatedRoom) return;

      const readyCount = Object.values(updatedRoom.discussionReady).filter(Boolean).length;
      io.to(data.code).emit('game:discussionReadyCount', {
        ready: readyCount,
        total: updatedRoom.players.length,
        readyPlayers: updatedRoom.discussionReady,
      });

      if (allReady) {
        // Transition to voting
        updatedRoom.phase = 'voting';
        updatedRoom.votes = {};
        io.to(data.code).emit('game:votingStart', sanitizeRoom(updatedRoom));
        console.log(`[Discussion] All ready → voting in ${data.code}`);
      }
    });

    // ─── Vote: Cast ─────────────────────────────────────────────────
    socket.on(
      'vote:cast',
      (
        data: { code: string; targetId: string },
        callback?: (res: { success: boolean; error?: string }) => void
      ) => {
        const room = getRoom(data.code);
        if (!room || room.phase !== 'voting') {
          callback?.({ success: false, error: 'Voting not active' });
          return;
        }
        if (data.targetId === socket.id) {
          callback?.({ success: false, error: 'Cannot vote for yourself' });
          return;
        }
        if (room.votes[socket.id]) {
          callback?.({ success: false, error: 'Already voted' });
          return;
        }

        const updatedRoom = castVote(data.code, socket.id, data.targetId);
        if (!updatedRoom) return;

        const tally = getVoteTally(updatedRoom);
        const totalVoters = updatedRoom.players.length;
        const votescast = Object.keys(updatedRoom.votes).length;

        // Broadcast live tally (hide who voted for whom — just show counts per player)
        io.to(data.code).emit('vote:tally', {
          tally,
          votescast,
          totalVoters,
        });

        callback?.({ success: true });

        // All votes in → go to results
        if (votescast >= totalVoters) {
          finalizeResults(data.code, io);
        }
      }
    );

    // ─── Room: Chat (lobby chat) ─────────────────────────────────────
    socket.on('room:chat', (data: { code: string; message: string }) => {
      const room = getRoom(data.code);
      if (!room) return;
      const player = room.players.find((p) => p.id === socket.id);
      if (!player) return;
      if (data.message.trim().length === 0) return;

      io.to(data.code).emit('room:chatMessage', {
        playerId: socket.id,
        playerName: player.name,
        avatar: player.avatar,
        message: data.message.trim().slice(0, 300),
        timestamp: Date.now(),
      });
    });

    // ─── Game: Results Acknowledge (play again) ──────────────────────
    socket.on('game:backToLobby', (data: { code: string }) => {
      const room = getRoom(data.code);
      if (!room || room.hostId !== socket.id) return;

      room.phase = 'lobby';
      room.imposterId = null;
      room.imposterIds = [];
      room.votes = {};
      room.gameStartedAt = null;
      room.players.forEach((p) => (p.isReady = false));
      resetDiscussion(room);
      clearRoomTimer(data.code);

      io.to(data.code).emit('room:updated', sanitizeRoom(room));
    });

    // ─── Rooms: List (initial fetch) ─────────────────────────────────
    socket.on('rooms:list', (_data: any, callback: (rooms: any[]) => void) => {
      if (typeof callback === 'function') {
        callback(getPublicRooms().map(sanitizeRoom));
      }
    });

    // ─── Disconnect ──────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const room = getPlayerRoom(socket.id);
      if (!room) return;

      const code = room.code;

      // Handle active player disconnect during discussion turns
      if (room.phase === 'discussion' && !room.discussionOpen && room.discussionTurnOrder) {
        const idx = room.discussionTurnOrder.indexOf(socket.id);
        if (idx !== -1) {
          room.discussionTurnOrder.splice(idx, 1);
          
          if (room.activePlayerId === socket.id) {
            if (room.discussionTurnIndex >= room.discussionTurnOrder.length) {
              clearRoomTimer(room.code);
              room.activePlayerId = null;
              room.discussionOpen = true;
              io.to(room.code).emit('game:discussionOpen', {
                message: 'All words said — free discussion now open!',
              });
            } else {
              room.activePlayerId = room.discussionTurnOrder[room.discussionTurnIndex];
              room.turnTimeLeft = 10;
              startTurnTimer(room, io);
            }
          } else {
            if (idx < room.discussionTurnIndex) {
              room.discussionTurnIndex--;
            }
          }
        }
      }

      const updatedRoom = removePlayer(code, socket.id);

      if (updatedRoom) {
        io.to(code).emit('room:updated', sanitizeRoom(updatedRoom));
        // If voting was in progress and all remaining have voted, finalize
        if (
          updatedRoom.phase === 'voting' &&
          Object.keys(updatedRoom.votes).length >= updatedRoom.players.length
        ) {
          finalizeResults(code, io);
        }
        // If discussion: check if all remaining now ready
        if (updatedRoom.phase === 'discussion') {
          const readyCount = Object.values(updatedRoom.discussionReady).filter(Boolean).length;
          if (readyCount >= updatedRoom.players.length && updatedRoom.players.length > 0) {
            updatedRoom.phase = 'voting';
            updatedRoom.votes = {};
            io.to(code).emit('game:votingStart', sanitizeRoom(updatedRoom));
          }
        }
      }

      io.emit('rooms:updated', getPublicRooms().map(sanitizeRoom));
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

function finalizeResults(code: string, io: Server) {
  const room = getRoom(code);
  if (!room || room.phase === 'results') return;

  room.phase = 'results';

  const mostVotedId = getMostVoted(room);
  const imposterIds = room.imposterIds;
  const imposterId = room.imposterId;
  const imposter = room.players.find((p) => p.id === imposterId);
  const mostVotedPlayer = room.players.find((p) => p.id === mostVotedId);
  const crewWins = imposterIds.length > 0 && imposterIds.includes(mostVotedId || '');

  // Calculate coin rewards
  const BASE_COINS = 50;
  const CREW_WIN_BONUS = 100;
  const IMPOSTER_WIN_BONUS = 150;

  io.to(code).emit('game:results', {
    imposterId,
    imposterIds,
    imposterName: imposter?.name ?? 'Unknown',
    imposterAvatar: imposter?.avatar ?? '',
    mostVotedId,
    mostVotedName: mostVotedPlayer?.name ?? 'Nobody',
    crewWins,
    tally: getVoteTally(room),
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      votes: Object.values(room.votes).filter((t) => t === p.id).length,
      isImposter: imposterIds.includes(p.id),
      // Per-player coin reward (calculated client-side based on role + outcome)
      coinReward: {
        baseCoins: BASE_COINS,
        bonusCoins: imposterIds.includes(p.id)
          ? (!crewWins ? IMPOSTER_WIN_BONUS : 0)
          : (crewWins ? CREW_WIN_BONUS : 0),
        total: BASE_COINS + (imposterIds.includes(p.id)
          ? (!crewWins ? IMPOSTER_WIN_BONUS : 0)
          : (crewWins ? CREW_WIN_BONUS : 0)),
        reasons: [
          'Participated in game',
          ...(imposterIds.includes(p.id) && !crewWins ? ['Imposter victory bonus!'] : []),
          ...(!imposterIds.includes(p.id) && crewWins ? ['Crew victory bonus!'] : []),
        ],
      },
    })),
  });

  console.log(`[Game] Results in ${code}: ${crewWins ? 'Crew' : 'Imposter'} wins`);
}
