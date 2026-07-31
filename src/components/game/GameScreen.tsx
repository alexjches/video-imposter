'use client';
// src/components/game/GameScreen.tsx
// Locked-down fullscreen playback, then the Ready Check (section 6).
//
// The player is never told their role, so this screen looks identical for
// crew and imposter — that is the point (section 3).

import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameAssignment, ReadyState } from '@/types';
import type { RoomActions } from '@/hooks/useRoom';
import { VideoPlayer, VideoPlayerHandle } from './VideoPlayer';
import { getSocket } from '@/lib/socket';

interface Props {
  code: string;
  assignment: GameAssignment;
  loadedCount: { ready: number; total: number } | null;
  readyState: ReadyState | null;
  socketId: string;
  actions: RoomActions;
}

type PlayState = 'loading' | 'waiting' | 'countdown' | 'playing' | 'ended';

export function GameScreen({
  code,
  assignment,
  loadedCount,
  readyState,
  socketId,
  actions,
}: Props) {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [playState, setPlayState] = useState<PlayState>('loading');
  const [countdown, setCountdown] = useState(3);
  const [hasSignaledLoaded, setHasSignaledLoaded] = useState(false);
  const [clickedReady, setClickedReady] = useState(false);
  const [graceLeft, setGraceLeft] = useState<number | null>(null);

  const handleVideoReady = useCallback(() => {
    if (hasSignaledLoaded) return;
    setHasSignaledLoaded(true);
    setPlayState('waiting');
    actions.signalLoaded(code);
  }, [hasSignaledLoaded, code, actions]);

  // Synchronized start: the server picks a wall-clock moment ~1s out and
  // every client schedules against it.
  useEffect(() => {
    const socket = getSocket();

    const handlePlay = ({ playAt }: { playAt: number }) => {
      const delay = Math.max(0, playAt - Date.now());
      setPlayState('countdown');
      setCountdown(3);

      let c = 3;
      const interval = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) clearInterval(interval);
      }, 1000);

      setTimeout(() => {
        playerRef.current?.play();
        setPlayState('playing');
      }, delay);
    };

    socket.on('game:play', handlePlay);
    return () => {
      socket.off('game:play', handlePlay);
    };
  }, []);

  // Section 6: the phase advances 10s after the imposter's video ends even if
  // someone never clicks Ready. Render that countdown so it isn't a surprise.
  useEffect(() => {
    const endsAt = readyState?.graceEndsAt;
    if (!endsAt) {
      setGraceLeft(null);
      return;
    }
    const tick = () => setGraceLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [readyState?.graceEndsAt]);

  const handleVideoEnded = useCallback(() => {
    setPlayState('ended');
    // Every player reports their own end — video lengths differ between the
    // crew tape and the imposter tape.
    actions.videoEnded(code);
  }, [code, actions]);

  const handleReady = useCallback(() => {
    if (clickedReady) return;
    setClickedReady(true);
    actions.readyToAdvance(code);
  }, [clickedReady, code, actions]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      <div className="absolute inset-0">
        <VideoPlayer
          ref={playerRef}
          url={assignment.videoUrl}
          onReady={handleVideoReady}
          onEnded={handleVideoEnded}
        />
      </div>

      {/* Loading / waiting for everyone to buffer */}
      {(playState === 'loading' || playState === 'waiting') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="osd-text" style={{ color: 'var(--neon-cyan)', fontSize: '1.2rem' }}>
              {playState === 'loading' ? 'TAPE INJECTING…' : 'WAITING FOR ALL DECKS…'}
            </div>
            {loadedCount && (
              <div className="osd-text" style={{ color: '#aaa', marginTop: 8 }}>
                {loadedCount.ready}/{loadedCount.total} READY
              </div>
            )}
          </div>
        </div>
      )}

      {playState === 'countdown' && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="brutal-title" style={{ fontSize: '8rem', color: 'var(--neon-yellow)' }}>
            {countdown}
          </div>
        </div>
      )}

      {/* Ready Check (section 6) */}
      {playState === 'ended' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-20 px-4">
          <div className="brutal-card" style={{ maxWidth: 460, textAlign: 'center' }}>
            <h2 className="brutal-title" style={{ fontSize: '1.6rem', marginBottom: 8 }}>
              ⏏ TAPE FINISHED
            </h2>
            <p className="osd-text" style={{ color: '#aaa', marginBottom: 16 }}>
              Hit ready when you are done thinking about what you saw.
            </p>

            {readyState && (
              <div className="osd-text" style={{ color: 'var(--neon-cyan)', marginBottom: 12 }}>
                {readyState.ready}/{readyState.total} DECKS READY
              </div>
            )}

            {graceLeft !== null && (
              <div className="osd-text" style={{ color: 'var(--neon-magenta)', marginBottom: 12 }}>
                AUTO-ADVANCING IN {graceLeft}s
              </div>
            )}

            <button
              className="btn-brutal green"
              disabled={clickedReady}
              onClick={handleReady}
            >
              {clickedReady ? '✓ READY' : "I'M READY"}
            </button>
          </div>
        </div>
      )}

      {playState === 'playing' && (
        <div className="scan-line pointer-events-none" style={{ zIndex: 5 }} />
      )}
    </div>
  );
}
