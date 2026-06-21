'use client';
// src/app/room/[code]/page.tsx
// Phase-aware room shell

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/lib/socket';
import { useRoom } from '@/hooks/useRoom';
import { LobbyScreen } from '@/components/lobby/LobbyScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { DiscussionScreen } from '@/components/game/DiscussionScreen';
import { VotingScreen } from '@/components/voting/VotingScreen';
import { ResultsScreen } from '@/components/results/ResultsScreen';
import Link from 'next/link';

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { state, actions } = useRoom(code);
  const [socketId, setSocketId] = useState<string>('');
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);

  const socket = getSocket();

  // Guest name input state if no cached guest data exists
  const [localGuestName, setLocalGuestName] = useState('');
  const [localGuestAvatar] = useState(() => {
    const GUEST_AVATARS = ['🎮', '👾', '🕵️', '🎭', '🦊', '🐺', '🦁', '🐸'];
    return GUEST_AVATARS[Math.floor(Math.random() * GUEST_AVATARS.length)];
  });

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const handleConnect = () => setSocketId(socket.id || '');
    socket.on('connect', handleConnect);
    if (socket.connected) setSocketId(socket.id || '');
    return () => { socket.off('connect', handleConnect); };
  }, [socket]);

  useEffect(() => {
    if (state.isKicked) {
      router.push('/dashboard');
    }
  }, [state.isKicked, router]);

  // Automatically join the room when socket is ready and credentials loaded
  useEffect(() => {
    if (!socketId || !code || status === 'loading' || state.room || hasAttemptedJoin) return;

    const storedName = localStorage.getItem('imposter_guest_name');
    const storedAvatar = localStorage.getItem('imposter_guest_avatar') || '🎮';

    if (session?.user?.name) {
      setHasAttemptedJoin(true);
      actions.joinRoom(
        session.user.name,
        (session.user as any).image || '🎮',
        (session.user as any).id || null,
        code
      ).catch((err) => {
        console.error('Auto-join failed:', err);
      });
    } else if (storedName) {
      setHasAttemptedJoin(true);
      actions.joinRoom(storedName, storedAvatar, null, code).catch((err) => {
        console.error('Guest auto-join failed:', err);
      });
    }
  }, [socketId, code, status, session, state.room, hasAttemptedJoin, actions]);

  const handleGuestJoin = () => {
    if (localGuestName.trim().length >= 2 && code) {
      localStorage.setItem('imposter_guest_name', localGuestName.trim());
      localStorage.setItem('imposter_guest_avatar', localGuestAvatar);
      setHasAttemptedJoin(true);
      actions.joinRoom(localGuestName.trim(), localGuestAvatar, null, code).catch((err) => {
        console.error('Guest join failed:', err);
      });
    }
  };

  if (!code) return null;

  const isHost = state.room?.hostId === socketId;
  const myPlayer = state.room?.players.find((p) => p.id === socketId);

  // Show error screen if join failed and room is null
  if (state.error && !state.room) {
    return (
      <div className="min-h-dvh flex items-center justify-center grid-bg px-4">
        <div className="glass rounded-2xl p-8 w-full max-w-sm text-center border border-rose-500/20">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Join</h2>
          <p className="text-zinc-400 text-sm mb-6">{state.error}</p>
          <Link href="/dashboard" className="btn-primary w-full inline-block text-center py-3">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show guest setup form if user is not authenticated and has no cached display name
  const hasCachedGuestName = typeof window !== 'undefined' && !!localStorage.getItem('imposter_guest_name');
  if (!session && status !== 'loading' && !hasCachedGuestName && !state.room) {
    return (
      <div className="min-h-dvh flex items-center justify-center grid-bg px-4">
        <div className="glass rounded-2xl p-8 w-full max-w-sm animate-scale-in">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Join Room</h2>
          <p className="text-zinc-400 text-sm text-center mb-6">Enter a display name to join room <span className="font-mono text-violet-400 font-bold">{code}</span></p>
          <div className="text-5xl text-center mb-4">{localGuestAvatar}</div>
          <input
            id="guest-join-name-input"
            type="text"
            value={localGuestName}
            onChange={(e) => setLocalGuestName(e.target.value)}
            className="input-field mb-4"
            placeholder="Your display name"
            maxLength={20}
            onKeyDown={(e) => e.key === 'Enter' && localGuestName.trim().length >= 2 && handleGuestJoin()}
          />
          <button
            id="guest-join-btn"
            className="btn-primary w-full"
            disabled={localGuestName.trim().length < 2}
            onClick={handleGuestJoin}
          >
            Join Room →
          </button>
          <p className="text-center text-zinc-500 text-xs mt-4">
            <Link href="/login" className="text-violet-400 hover:underline">Log in</Link> to use your account
          </p>
        </div>
      </div>
    );
  }

  // Loading / not joined yet
  if (!state.room) {
    return (
      <div className="min-h-dvh flex items-center justify-center grid-bg">
        <div className="text-center animate-pulse">
          <div className="text-5xl mb-4">🎮</div>
          <p className="text-zinc-400">Connecting to room {code}…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-950">
      {state.phase === 'lobby' && (
        <LobbyScreen
          room={state.room}
          socketId={socketId}
          isHost={isHost}
          actions={actions}
          code={code}
          error={state.error}
        />
      )}

      {state.phase === 'playing' && state.assignment && (
        <GameScreen
          code={code}
          assignment={state.assignment}
          readyCount={state.readyCount}
          isHost={isHost}
          actions={actions}
          socketId={socketId}
        />
      )}

      {state.phase === 'discussion' && state.room && (
        <DiscussionScreen
          room={state.room}
          socketId={socketId}
          actions={actions}
          code={code}
          discussionWords={state.discussionWords}
          discussionStatus={state.discussionStatus}
          discussionReadyCount={state.discussionReadyCount}
          chatMessages={state.chatMessages}
        />
      )}

      {state.phase === 'voting' && (
        <VotingScreen
          room={state.room}
          socketId={socketId}
          voteTally={state.voteTally}
          actions={actions}
          code={code}
          isHost={isHost}
        />
      )}

      {state.phase === 'results' && state.results && (
        <ResultsScreen
          results={state.results}
          socketId={socketId}
          isHost={isHost}
          actions={actions}
          code={code}
        />
      )}
    </div>
  );
}
