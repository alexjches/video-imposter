'use client';
// src/components/results/ResultsScreen.tsx
// Dramatic reveal + win/lose screen with confetti + coin rewards

import { useEffect, useState, useRef, useCallback } from 'react';
import { GameResults } from '@/types';
import { useRouter } from 'next/navigation';
import { useShop } from '@/hooks/useShop';

interface Props {
  results: GameResults;
  socketId: string;
  isHost: boolean;
  actions: any;
  code: string;
}

export function ResultsScreen({ results, socketId, isHost, actions, code }: Props) {
  const router = useRouter();
  const { addCoins } = useShop();
  const [revealed, setRevealed] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [coinCount, setCoinCount] = useState(0);
  const confettiContainer = useRef<HTMLDivElement>(null);
  const coinsAdded = useRef(false);

  // Find my player's result
  const myPlayer = results.players.find((p) => p.id === socketId);
  const myCoinReward = (results as any).players?.find((p: any) => p.id === socketId)?.coinReward
    ?? results.coinReward;

  const isImposter = results.imposterIds?.includes(socketId) ?? socketId === results.imposterId;
  const crewWins = results.crewWins;
  const iWon = (isImposter && !crewWins) || (!isImposter && crewWins);

  // Reveal sequence
  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), 1200);
    const t2 = setTimeout(() => {
      setShowWinner(true);
      if (crewWins) launchConfetti();
    }, 3000);
    const t3 = setTimeout(() => setShowCoins(true), 4200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [crewWins]);

  // Award coins once
  useEffect(() => {
    if (showCoins && !coinsAdded.current && myCoinReward) {
      coinsAdded.current = true;
      // Animate coin counter
      const target = myCoinReward.total ?? 0;
      let current = 0;
      const step = Math.ceil(target / 40);
      const interval = setInterval(() => {
        current = Math.min(current + step, target);
        setCoinCount(current);
        if (current >= target) clearInterval(interval);
      }, 30);
      // Add to wallet
      addCoins(target);
    }
  }, [showCoins, myCoinReward, addCoins]);

  function launchConfetti() {
    const colors = ['#8b5cf6', '#10b981', '#f43f5e', '#fbbf24', '#38bdf8'];
    for (let i = 0; i < 120; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'confetti-particle';
        el.style.left = `${Math.random() * 100}vw`;
        el.style.width = `${Math.random() * 10 + 6}px`;
        el.style.height = `${Math.random() * 6 + 4}px`;
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        el.style.animationDuration = `${Math.random() * 2 + 2}s`;
        el.style.animationDelay = `${Math.random() * 1}s`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
      }, i * 20);
    }
  }

  // Show all imposters (multi-imposter support)
  const imposterIds = results.imposterIds ?? [results.imposterId];
  const imposterPlayers = results.players.filter((p) => imposterIds.includes(p.id));

  return (
    <div className="min-h-dvh grid-bg flex flex-col items-center justify-center px-6 py-10">
      <div ref={confettiContainer} />

      {/* Phase label */}
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-6">Results</p>

      {/* Imposter Card Flip */}
      <div className="flip-container w-56 h-72 mb-8 relative">
        <div className={`flip-card w-full h-full ${revealed ? 'flipped' : ''}`}>
          {/* Front face — mystery */}
          <div className="flip-front glass rounded-2xl flex flex-col items-center justify-center">
            <div className="text-6xl animate-pulse-slow">❓</div>
            <p className="text-zinc-400 mt-4 font-semibold">
              The Imposter{imposterIds.length > 1 ? 's were' : ' was'}…
            </p>
          </div>
          {/* Back face — reveal */}
          <div className={`flip-back rounded-2xl flex flex-col items-center justify-center gap-2
            ${crewWins ? 'bg-rose-900/80 border border-rose-500/50' : 'bg-violet-900/80 border border-violet-500/50'}`}>
            {imposterPlayers.length > 0 ? (
              imposterPlayers.map((imp) => (
                <div key={imp.id} className="text-center">
                  <div className="text-4xl mb-1">{imp.avatar || '👁️'}</div>
                  <p className="text-base font-bold text-white">{imp.name}</p>
                </div>
              ))
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-2">{results.imposterAvatar || '👁️'}</div>
                <p className="text-lg font-bold text-white">{results.imposterName}</p>
              </div>
            )}
            <p className="text-sm text-zinc-400 mt-1">
              {imposterIds.length > 1 ? 'were the Imposters' : 'was the Imposter'}
            </p>
          </div>
        </div>
      </div>

      {/* Winner Banner */}
      {showWinner && (
        <div className={`text-center animate-bounce-in mb-6 ${crewWins ? 'neon-emerald' : 'neon-rose'} rounded-2xl px-10 py-6 glass`}>
          <div className="text-5xl mb-2">
            {crewWins ? '🚀' : '👁️'}
          </div>
          <h2 className={`text-4xl font-black ${crewWins ? 'text-emerald-300 neon-text-emerald' : 'text-rose-300 neon-text-rose'}`}>
            {crewWins ? 'CREW WINS!' : 'IMPOSTER WINS!'}
          </h2>
          <p className="text-zinc-400 mt-2 text-sm">
            {crewWins
              ? `The crew correctly identified ${results.imposterName}!`
              : `${results.imposterName} fooled everyone!`}
          </p>
          <p className={`mt-4 font-bold text-lg ${iWon ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isImposter
              ? crewWins ? '😅 You lost!' : '😈 You won!'
              : crewWins ? '🎉 You won!' : '😞 You lost!'}
          </p>
        </div>
      )}

      {/* Coin Reward */}
      {showCoins && myCoinReward && (
        <div className="w-full max-w-md glass rounded-2xl p-5 mb-6 animate-slide-up border border-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-zinc-300 flex items-center gap-2">
              <span className="text-xl">🪙</span> Coins Earned
            </h3>
            <span className="text-2xl font-black text-amber-300 tabular-nums">
              +{coinCount}
            </span>
          </div>
          <div className="space-y-1.5 text-sm">
            {myCoinReward.baseCoins > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Participation</span>
                <span className="text-amber-400">+{myCoinReward.baseCoins} 🪙</span>
              </div>
            )}
            {myCoinReward.bonusCoins > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>
                  {isImposter && !crewWins ? '👁️ Imposter victory bonus' : '🚀 Crew victory bonus'}
                </span>
                <span>+{myCoinReward.bonusCoins} 🪙</span>
              </div>
            )}
            <div className="h-px bg-zinc-700 my-1" />
            <div className="flex justify-between text-white font-bold">
              <span>Total</span>
              <span className="text-amber-300">+{myCoinReward.total} 🪙</span>
            </div>
          </div>
        </div>
      )}

      {/* Final Vote Tally */}
      {showWinner && (
        <div className="w-full max-w-md glass rounded-2xl p-6 mb-8 animate-slide-up">
          <h3 className="font-bold text-zinc-300 mb-4 text-center">Final Vote Count</h3>
          <div className="space-y-3">
            {results.players
              .sort((a, b) => b.votes - a.votes)
              .map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <span className="text-xl">{player.avatar}</span>
                  <span className={`text-sm font-medium flex-1 ${
                    imposterIds.includes(player.id) ? 'text-rose-300' : 'text-zinc-300'
                  }`}>
                    {player.name}
                    {imposterIds.includes(player.id) && ' 👁️'}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: player.votes }).map((_, i) => (
                      <div key={i} className="w-2 h-5 bg-rose-500 rounded-sm" />
                    ))}
                  </div>
                  <span className="text-sm text-zinc-400 w-4 text-right">{player.votes}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {showWinner && (
        <div className="flex gap-4 animate-fade-in">
          {isHost && (
            <button
              id="play-again-btn"
              onClick={() => actions.backToLobby(code)}
              className="btn-primary"
            >
              🔄 Play Again
            </button>
          )}
          <button
            id="shop-btn"
            onClick={() => router.push('/shop')}
            className="btn-ghost"
          >
            🛒 Shop
          </button>
          <button
            id="leave-room-btn"
            onClick={() => router.push('/dashboard')}
            className="btn-ghost"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
}
