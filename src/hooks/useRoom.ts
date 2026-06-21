// src/hooks/useRoom.ts
// Room state machine — subscribes to all socket events for a room

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import {
  RoomPublic,
  GameAssignment,
  VoteTally,
  GameResults,
  ChatMessage,
  GamePhase,
  DiscussionWord,
} from '@/types';

export interface DiscussionStatus {
  wordsUsed: Record<string, number>;
  readyPlayers: Record<string, boolean>;
  isOpen: boolean;
  wordsPerPlayer: number;
  activePlayerId?: string | null;
  turnTimeLeft?: number;
}

export interface DiscussionReadyCount {
  ready: number;
  total: number;
  readyPlayers: Record<string, boolean>;
}

export interface RoomState {
  room: RoomPublic | null;
  phase: GamePhase;
  assignment: GameAssignment | null;
  readyCount: { ready: number; total: number } | null;
  voteTally: VoteTally | null;
  results: GameResults | null;
  chatMessages: ChatMessage[];
  discussionWords: DiscussionWord[];
  discussionStatus: DiscussionStatus | null;
  discussionReadyCount: DiscussionReadyCount | null;
  error: string | null;
  isKicked: boolean;
}

const initialState: RoomState = {
  room: null,
  phase: 'lobby',
  assignment: null,
  readyCount: null,
  voteTally: null,
  results: null,
  chatMessages: [],
  discussionWords: [],
  discussionStatus: null,
  discussionReadyCount: null,
  error: null,
  isKicked: false,
};

export function useRoom(code: string | null) {
  const [state, setState] = useState<RoomState>(initialState);
  const socket = getSocket();

  useEffect(() => {
    if (!code) return;

    const handleRoomUpdated = (room: RoomPublic) => {
      setState((prev) => ({ ...prev, room, phase: room.phase, error: null }));
    };

    const handleAssigned = (assignment: GameAssignment) => {
      setState((prev) => ({ ...prev, assignment }));
    };

    const handleReadyCount = (data: { ready: number; total: number }) => {
      setState((prev) => ({ ...prev, readyCount: data }));
    };

    const handlePlay = (_data: { playAt: number }) => {
      // The video player component listens to this event directly
    };

    const handleVotingStart = (room: RoomPublic) => {
      setState((prev) => ({
        ...prev,
        room,
        phase: 'voting',
        voteTally: null,
        discussionStatus: null,
        discussionReadyCount: null,
      }));
    };

    const handleVoteTally = (tally: VoteTally) => {
      setState((prev) => ({ ...prev, voteTally: tally }));
    };

    const handleResults = (results: GameResults) => {
      setState((prev) => ({ ...prev, results, phase: 'results' }));
    };

    const handleKicked = () => {
      setState((prev) => ({ ...prev, isKicked: true }));
    };

    const handleError = (data: { message: string }) => {
      setState((prev) => ({ ...prev, error: data.message }));
    };

    const handleChatMessage = (msg: ChatMessage) => {
      setState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages.slice(-99), msg],
      }));
    };

    // ─── Discussion phase events ─────────────────────────────────────
    const handleDiscussionStart = (data: any) => {
      setState((prev) => ({
        ...prev,
        room: data,
        phase: 'discussion',
        discussionWords: [],
        chatMessages: [],
        discussionStatus: {
          wordsUsed: data.wordsUsed || {},
          readyPlayers: data.readyPlayers || {},
          isOpen: data.isOpen || false,
          wordsPerPlayer: data.wordsPerPlayer || 1,
          activePlayerId: data.activePlayerId || null,
          turnTimeLeft: data.turnTimeLeft || 0,
        },
        discussionReadyCount: null,
      }));
    };

    const handleDiscussionWord = (word: DiscussionWord) => {
      setState((prev) => ({
        ...prev,
        discussionWords: [...prev.discussionWords, word],
      }));
    };

    const handleDiscussionStatus = (status: DiscussionStatus) => {
      setState((prev) => ({ ...prev, discussionStatus: status }));
    };

    const handleDiscussionOpen = () => {
      setState((prev) => ({
        ...prev,
        discussionStatus: prev.discussionStatus
          ? { ...prev.discussionStatus, isOpen: true }
          : null,
      }));
    };

    const handleDiscussionReadyCount = (data: DiscussionReadyCount) => {
      setState((prev) => ({ ...prev, discussionReadyCount: data }));
    };

    socket.on('room:updated', handleRoomUpdated);
    socket.on('game:assigned', handleAssigned);
    socket.on('game:readyCount', handleReadyCount);
    socket.on('game:play', handlePlay);
    socket.on('game:votingStart', handleVotingStart);
    socket.on('vote:tally', handleVoteTally);
    socket.on('game:results', handleResults);
    socket.on('room:kicked', handleKicked);
    socket.on('game:error', handleError);
    socket.on('room:chatMessage', handleChatMessage);
    socket.on('game:discussionStart', handleDiscussionStart);
    socket.on('game:discussionWord', handleDiscussionWord);
    socket.on('game:discussionStatus', handleDiscussionStatus);
    socket.on('game:discussionOpen', handleDiscussionOpen);
    socket.on('game:discussionReadyCount', handleDiscussionReadyCount);

    return () => {
      socket.off('room:updated', handleRoomUpdated);
      socket.off('game:assigned', handleAssigned);
      socket.off('game:readyCount', handleReadyCount);
      socket.off('game:play', handlePlay);
      socket.off('game:votingStart', handleVotingStart);
      socket.off('vote:tally', handleVoteTally);
      socket.off('game:results', handleResults);
      socket.off('room:kicked', handleKicked);
      socket.off('game:error', handleError);
      socket.off('room:chatMessage', handleChatMessage);
      socket.off('game:discussionStart', handleDiscussionStart);
      socket.off('game:discussionWord', handleDiscussionWord);
      socket.off('game:discussionStatus', handleDiscussionStatus);
      socket.off('game:discussionOpen', handleDiscussionOpen);
      socket.off('game:discussionReadyCount', handleDiscussionReadyCount);
    };
  }, [code, socket]);

  const actions = {
    joinRoom: useCallback(
      (playerName: string, avatar: string, userId: string | null, code: string) => {
        return new Promise<RoomPublic>((resolve, reject) => {
          socket.emit(
            'room:join',
            { code, playerName, avatar, userId },
            (res: { success: boolean; room?: RoomPublic; error?: string }) => {
              if (res.success && res.room) {
                setState((prev) => ({
                  ...prev,
                  room: res.room!,
                  phase: res.room!.phase,
                }));
                resolve(res.room);
              } else {
                reject(new Error(res.error || 'Failed to join room'));
              }
            }
          );
        });
      },
      [socket]
    ),

    createRoom: useCallback(
      (data: {
        playerName: string;
        avatar: string;
        userId: string | null;
        isPublic: boolean;
        normalVideoUrl?: string;
        imposterVideoUrl?: string;
      }) => {
        return new Promise<string>((resolve, reject) => {
          socket.emit(
            'room:create',
            data,
            (res: { success: boolean; code?: string; error?: string }) => {
              if (res.success && res.code) {
                resolve(res.code);
              } else {
                reject(new Error(res.error || 'Failed to create room'));
              }
            }
          );
        });
      },
      [socket]
    ),

    updateSettings: useCallback(
      (code: string, settings: {
        isPublic?: boolean;
        normalVideoUrl?: string;
        imposterVideoUrl?: string;
        wordsPerPlayer?: number;
        imposterCount?: number;
      }) => {
        socket.emit('room:updateSettings', { code, ...settings });
      },
      [socket]
    ),

    kick: useCallback(
      (code: string, targetId: string) => {
        socket.emit('room:kick', { code, targetId });
      },
      [socket]
    ),

    startGame: useCallback(
      (code: string) => {
        socket.emit('game:start', { code });
      },
      [socket]
    ),

    signalReady: useCallback(
      (code: string) => {
        socket.emit('game:syncReady', { code });
      },
      [socket]
    ),

    forceEnd: useCallback(
      (code: string) => {
        socket.emit('game:forceEnd', { code });
      },
      [socket]
    ),

    videoEnded: useCallback(
      (code: string) => {
        socket.emit('game:videoEnded', { code });
      },
      [socket]
    ),

    castVote: useCallback(
      (code: string, targetId: string) => {
        return new Promise<void>((resolve, reject) => {
          socket.emit(
            'vote:cast',
            { code, targetId },
            (res: { success: boolean; error?: string }) => {
              if (res.success) resolve();
              else reject(new Error(res.error));
            }
          );
        });
      },
      [socket]
    ),

    sendChat: useCallback(
      (code: string, message: string) => {
        socket.emit('room:chat', { code, message });
      },
      [socket]
    ),

    // ─── Discussion actions ──────────────────────────────────────────
    sendDiscussionWord: useCallback(
      (code: string, word: string) => {
        socket.emit('game:discussionWord', { code, word });
      },
      [socket]
    ),

    sendDiscussionChat: useCallback(
      (code: string, message: string) => {
        socket.emit('game:discussionChat', { code, message });
      },
      [socket]
    ),

    signalDiscussionReady: useCallback(
      (code: string) => {
        socket.emit('game:discussionReady', { code });
      },
      [socket]
    ),

    backToLobby: useCallback(
      (code: string) => {
        socket.emit('game:backToLobby', { code });
      },
      [socket]
    ),

    clearError: useCallback(() => {
      setState((prev) => ({ ...prev, error: null }));
    }, []),
  };

  return { state, actions };
}
