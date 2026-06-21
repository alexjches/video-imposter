'use client';
// src/components/voting/VotingScreen.tsx

import { useState, useEffect, useCallback } from 'react';
import { RoomPublic, VoteTally } from '@/types';

interface Props {
  room: RoomPublic;
  socketId: string;
  voteTally: VoteTally | null;
  actions: any;
  code: string;
  isHost: boolean;
}

const VOTE_DURATION = 90; // seconds

export function VotingScreen({ room, socketId, voteTally, actions, code, isHost }: Props) {
  const [voted, setVoted] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(VOTE_DURATION);
  const [error, setError] = useState('');
  const totalVoters = room.players.length;
  const votescast = voteTally?.votescast ?? 0;

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = useCallback(
    async (targetId: string) => {
      if (voted || targetId === socketId) return;
      setVoted(targetId);
      setError('');
      try {
        await actions.castVote(code, targetId);
      } catch (err: any) {
        setError(err.message || 'Vote failed');
        setVoted(null);
      }
    },
    [voted, socketId, code, actions]
  );

  const timerPct = (timeLeft / VOTE_DURATION) * 100;
  const timerColor = timeLeft > 30 ? 'bg-emerald-500' : timeLeft > 10 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="min-h-dvh grid-bg flex flex-col">
      {/* Header */}
      <header className="glass-dark border-b border-bg-600 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black gradient-text">VOTING PHASE</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Who watched a different video? Discuss and vote!
            </p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-mono font-bold ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-zinc-200'}`}>
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
            </p>
            <p className="text-zinc-500 text-xs">{votescast}/{totalVoters} voted</p>
          </div>
        </div>
        {/* Timer bar */}
        <div className="max-w-5xl mx-auto mt-3 h-1 bg-bg-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-6 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {voted && (
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 mb-6 text-violet-300 text-sm text-center">
            ✓ You voted! Waiting for others… ({votescast}/{totalVoters})
          </div>
        )}

        {/* Player Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {room.players.map((player) => {
            const isMe = player.id === socketId;
            const voteCount = voteTally?.tally[player.id] ?? 0;
            const isVotedByMe = voted === player.id;
            const canVote = !voted && !isMe;

            return (
              <div
                key={player.id}
                id={`vote-card-${player.id}`}
                className={`card text-center cursor-pointer transition-all duration-200 relative
                  ${isVotedByMe ? 'ring-2 ring-rose-500 neon-rose' : ''}
                  ${isMe ? 'opacity-60 cursor-not-allowed' : ''}
                  ${canVote ? 'hover:ring-1 hover:ring-violet-500 hover:-translate-y-1' : ''}
                `}
                onClick={canVote ? () => handleVote(player.id) : undefined}
              >
                {/* Vote count badge */}
                {voteTally && voteCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {voteCount}
                  </div>
                )}

                <div className="text-4xl mb-2">{player.avatar}</div>
                <p className="font-semibold text-zinc-200 text-sm">{player.name}</p>
                {isMe && <p className="text-xs text-zinc-500 mt-1">You</p>}
                {player.isHost && <p className="text-xs text-amber-400 mt-1">👑 Host</p>}

                {canVote && !voted && (
                  <button
                    id={`vote-btn-${player.id}`}
                    className="btn-danger btn-sm mt-3 w-full text-xs"
                    onClick={(e) => { e.stopPropagation(); handleVote(player.id); }}
                  >
                    Vote
                  </button>
                )}
                {isVotedByMe && (
                  <div className="mt-3 text-rose-400 text-xs font-semibold">✓ Voted</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Tally */}
        {voteTally && voteTally.votescast > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-zinc-200 mb-4">📊 Live Tally</h3>
            <div className="space-y-3">
              {room.players
                .map((p) => ({
                  player: p,
                  votes: voteTally.tally[p.id] ?? 0,
                }))
                .sort((a, b) => b.votes - a.votes)
                .map(({ player, votes }) => (
                  <div key={player.id} className="flex items-center gap-3">
                    <span className="text-lg">{player.avatar}</span>
                    <span className="text-sm text-zinc-300 w-24 truncate">{player.name}</span>
                    <div className="flex-1 h-3 bg-bg-700 rounded-full overflow-hidden">
                      <div
                        className="vote-bar h-full bg-rose-500 rounded-full"
                        style={{ width: `${(votes / totalVoters) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-zinc-400 w-6 text-right">{votes}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
