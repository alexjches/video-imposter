'use client';
// src/components/game/GameScreen.tsx
// Full-screen video playback with synchronized start + player-driven ready gate

import { useRef, useEffect, useState, useCallback } from 'react';
import { GameAssignment } from '@/types';
import { VideoPlayer, VideoPlayerHandle } from './VideoPlayer';
import { getSocket } from '@/lib/socket';

interface Props {
  code: string;
  assignment: GameAssignment;
  readyCount: { ready: number; total: number } | null;
  isHost: boolean;
  actions: any;
  socketId: string;
}

type PlayState = 'loading' | 'waiting' | 'countdown' | 'playing' | 'ended';

export function GameScreen({ code, assignment, readyCount, isHost, actions, socketId }: Props) {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [playState, setPlayState] = useState<PlayState>('loading');
  const [countdown, setCountdown] = useState(3);
  const [hasSignaledReady, setHasSignaledReady] = useState(false);
  const [hasClickedReadyToVote, setHasClickedReadyToVote] = useState(false);
  const [voteReadyCount, setVoteReadyCount] = useState<{ ready: number; total: number } | null>(null);
  
  const [skipReadyCount, setSkipReadyCount] = useState<{ ready: number; total: number } | null>(null);
  const [hasClickedSkip, setHasClickedSkip] = useState(false);

  // When video is loaded and ready
  const handleVideoReady = useCallback(() => {
    if (!hasSignaledReady) {
      setHasSignaledReady(true);
      setPlayState('waiting');
      actions.signalReady(code);
    }
  }, [hasSignaledReady, code, actions]);

  // Listen for the play signal from server
  useEffect(() => {
    const socket = getSocket();

    const handlePlay = ({ playAt }: { playAt: number }) => {
      const now = Date.now();
      const delay = Math.max(0, playAt - now);

      setPlayState('countdown');
      setCountdown(3);

      // Countdown ticks
      let c = 3;
      const interval = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) clearInterval(interval);
      }, 1000);

      // Play video at the exact scheduled time
      setTimeout(() => {
        playerRef.current?.play();
        setPlayState('playing');
      }, delay);
    };

    const handleDiscussionReadyCount = (data: { ready: number; total: number }) => {
      setVoteReadyCount(data);
    };

    const handleSkipReadyCount = (data: { ready: number; total: number }) => {
      setSkipReadyCount(data);
    };

    socket.on('game:play', handlePlay);
    socket.on('game:discussionReadyCount', handleDiscussionReadyCount);
    socket.on('game:skipReadyCount', handleSkipReadyCount);
    return () => {
      socket.off('game:play', handlePlay);
      socket.off('game:discussionReadyCount', handleDiscussionReadyCount);
      socket.off('game:skipReadyCount', handleSkipReadyCount);
    };
  }, []);

  // Handle natural video end — go to discussion (player-driven)
  const handleVideoEnded = useCallback(() => {
    setPlayState('ended');
    if (isHost) {
      actions.videoEnded(code);
    }
  }, [isHost, code, actions]);

  const handleReadyToVote = useCallback(() => {
    if (hasClickedReadyToVote) return;
    setHasClickedReadyToVote(true);
    actions.signalDiscussionReady(code);
  }, [hasClickedReadyToVote, code, actions]);

  const handleSkipToVoting = useCallback(() => {
    if (hasClickedSkip) return;
    setHasClickedSkip(true);
    getSocket().emit('game:readyToSkip', { code });
  }, [hasClickedSkip, code]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Video Player — absolute full screen, no controls or interference */}
      <div className="absolute inset-0">
        <VideoPlayer
          ref={playerRef}
          url={assignment.videoUrl}
          onReady={handleVideoReady}
          onEnded={handleVideoEnded}
        />
      </div>

      {/* Scan line decoration while playing */}
      {playState === 'playing' && (
        <div className="scan-line pointer-events-none" style={{ zIndex: 5 }} />
      )}

      {/* Loading overlay */}
      {playState === 'loading' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="text-5xl animate-pulse mb-4">📺</div>
          <p className="text-zinc-300 font-semibold text-lg">Loading your video…</p>
          <div className="mt-4 w-48 h-1 bg-bg-700 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 animate-pulse rounded-full w-1/2" />
          </div>
        </div>
      )}

      {/* Waiting for others overlay */}
      {playState === 'waiting' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="text-4xl mb-4 animate-bounce">✅</div>
          <p className="text-zinc-200 font-semibold text-xl mb-2">Video ready!</p>
          <p className="text-zinc-500 mb-6">Waiting for all players…</p>
          {readyCount && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: readyCount.total }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${i < readyCount.ready ? 'bg-emerald-400' : 'bg-bg-600'}`}
                  />
                ))}
              </div>
              <span className="text-zinc-400 text-sm">
                {readyCount.ready}/{readyCount.total} ready
              </span>
            </div>
          )}
        </div>
      )}

      {/* Countdown overlay */}
      {playState === 'countdown' && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <div
              className="text-9xl font-black gradient-text neon-text-violet animate-bounce-in"
              key={countdown}
            >
              {countdown > 0 ? countdown : '🎬'}
            </div>
            <p className="text-zinc-400 mt-4 text-xl">Get ready…</p>
          </div>
        </div>
      )}

      {/* Video ended overlay — player-driven ready gate */}
      {playState === 'ended' && (
        <div className="absolute inset-0 bg-black/92 flex flex-col items-center justify-center z-10">
          <div className="text-center max-w-md px-6">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-black text-white mb-2">Video Finished!</h2>
            <p className="text-zinc-400 mb-8 text-sm">
              When you're ready to discuss and vote, click the button below.
            </p>

            {/* Ready to vote button */}
            <button
              id="ready-to-vote-btn"
              onClick={handleReadyToVote}
              disabled={hasClickedReadyToVote}
              className={`
                relative px-10 py-5 rounded-2xl text-lg font-black transition-all duration-300
                ${hasClickedReadyToVote
                  ? 'bg-emerald-900/60 border-2 border-emerald-500/50 text-emerald-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 text-white hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95'
                }
              `}
            >
              {hasClickedReadyToVote ? (
                <span className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  Ready! Waiting for others…
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  I'm Ready to Vote
                </span>
              )}
            </button>

            {/* Ready count indicator */}
            <div className="mt-6">
              {voteReadyCount && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    {Array.from({ length: voteReadyCount.total }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${
                          i < voteReadyCount.ready
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                            : 'bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-zinc-400 text-sm">
                    <span className="text-emerald-400 font-bold">{voteReadyCount.ready}</span>
                    {' / '}
                    <span className="text-zinc-300">{voteReadyCount.total}</span>
                    {' players ready'}
                  </p>
                </div>
              )}
              {!voteReadyCount && hasClickedReadyToVote && (
                <p className="text-zinc-500 text-sm mt-2">Waiting for others to finish…</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collective Skip to voting controls — during playback */}
      {playState === 'playing' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <button
            id="ready-to-skip-btn"
            onClick={handleSkipToVoting}
            disabled={hasClickedSkip}
            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg text-white ${
              hasClickedSkip
                ? 'bg-emerald-900/80 border border-emerald-500/50 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 active:scale-95'
            }`}
          >
            {hasClickedSkip ? '✅ Ready to skip' : '✅ Ready to skip to voting'}
          </button>
          
          {skipReadyCount && skipReadyCount.ready > 0 && (
            <div className="mt-2 text-sm font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
              {skipReadyCount.ready} / {skipReadyCount.total} ready
            </div>
          )}
        </div>
      )}
    </div>
  );
}
