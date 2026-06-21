'use client';
// src/components/lobby/LobbyScreen.tsx

import { useState } from 'react';
import { RoomPublic } from '@/types';
import { VideoSetupPanel } from './VideoSetupPanel';
import { useRouter } from 'next/navigation';

interface Props {
  room: RoomPublic;
  socketId: string;
  isHost: boolean;
  actions: any;
  code: string;
  error: string | null;
}

export function LobbyScreen({ room, socketId, isHost, actions, code, error }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Local copies for settings inputs (synced on blur/confirm)
  const [wordsInput, setWordsInput] = useState<number>(room.settings.wordsPerPlayer ?? 1);
  const [impostorsInput, setImpostorsInput] = useState<number>(room.settings.imposterCount ?? 1);

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const maxImposters = Math.max(1, Math.floor(room.players.length / 2));

  function applyWords(val: number) {
    const clamped = Math.max(1, Math.min(10, val));
    setWordsInput(clamped);
    actions.updateSettings(code, { wordsPerPlayer: clamped });
  }

  function applyImpostors(val: number) {
    const clamped = Math.max(1, Math.min(3, Math.min(maxImposters, val)));
    setImpostorsInput(clamped);
    actions.updateSettings(code, { imposterCount: clamped });
  }

  const hasRandomVideoCategory = room.settings.videoCategory && room.settings.videoCategory !== 'custom';
  const canStart =
    room.players.length >= 2 &&
    (hasRandomVideoCategory || (room.settings.hasNormalVideo && room.settings.hasImposterVideo));

  return (
    <div className="min-h-dvh grid-bg flex flex-col">
      {/* Header */}
      <header className="glass-dark border-b border-bg-600 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-white text-sm flex items-center gap-2">
            ← Dashboard
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">Room Code</span>
            <button
              id="copy-code-btn"
              onClick={copyCode}
              className="font-mono text-lg font-bold text-violet-300 glass px-4 py-2 rounded-xl hover:bg-bg-700 transition-colors flex items-center gap-2"
            >
              {code}
              <span className="text-xs">{copied ? '✓ Copied!' : '📋'}</span>
            </button>
          </div>
          <div className="text-zinc-500 text-sm">
            {room.players.length}/{room.settings.maxPlayers} players
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player List */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-bold text-zinc-200 mb-4">Players</h2>
          <div className="space-y-3">
            {room.players.map((player) => (
              <div
                key={player.id}
                className="glass rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{player.avatar}</span>
                  <div>
                    <p className="font-medium text-zinc-200 text-sm">
                      {player.name}
                      {player.id === socketId && (
                        <span className="ml-2 text-xs text-violet-400">(you)</span>
                      )}
                    </p>
                    {player.isHost && (
                      <p className="text-xs text-amber-400">👑 Host</p>
                    )}
                  </div>
                </div>
                {isHost && player.id !== socketId && (
                  <button
                    id={`kick-${player.id}`}
                    onClick={() => actions.kick(code, player.id)}
                    className="text-zinc-600 hover:text-rose-400 text-xs transition-colors"
                    title="Kick player"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2 - room.players.length) }).map((_, i) => (
              <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3 opacity-30">
                <div className="w-8 h-8 rounded-full bg-bg-600 flex items-center justify-center text-zinc-500">?</div>
                <span className="text-zinc-500 text-sm">Waiting for player…</span>
              </div>
            ))}
          </div>

          {/* Share link */}
          <div className="mt-4 glass rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-2">Share this link:</p>
            <p className="text-xs font-mono text-violet-400 break-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/room/${code}` : `/room/${code}`}
            </p>
          </div>
        </div>

        {/* Host Controls / Video Setup */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <VideoSetupPanel
            room={room}
            isHost={isHost}
            actions={actions}
            code={code}
          />

          {/* ─── Game Settings Panel ──────────────────────────────────── */}
          <div className="glass rounded-2xl overflow-hidden">
            <button
              id="toggle-settings-btn"
              onClick={() => setSettingsOpen((v) => !v)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <div>
                  <h3 className="font-bold text-white">Game Settings</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {room.settings.wordsPerPlayer ?? 1} word{(room.settings.wordsPerPlayer ?? 1) !== 1 ? 's' : ''} each ·{' '}
                    {room.settings.imposterCount ?? 1} imposter{(room.settings.imposterCount ?? 1) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <span className={`text-zinc-400 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {settingsOpen && (
              <div className="border-t border-bg-600 px-6 py-5 space-y-5">
                {/* Words Per Player */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Words Per Player</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Each player says this many words before free chat opens
                      </p>
                    </div>
                    {isHost ? (
                      <div className="flex items-center gap-2">
                        <button
                          id="words-minus-btn"
                          onClick={() => applyWords(wordsInput - 1)}
                          disabled={wordsInput <= 1}
                          className="w-8 h-8 rounded-lg glass flex items-center justify-center text-zinc-300 hover:text-white hover:bg-bg-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          −
                        </button>
                        <span className="text-lg font-bold text-violet-300 w-6 text-center">{wordsInput}</span>
                        <button
                          id="words-plus-btn"
                          onClick={() => applyWords(wordsInput + 1)}
                          disabled={wordsInput >= 10}
                          className="w-8 h-8 rounded-lg glass flex items-center justify-center text-zinc-300 hover:text-white hover:bg-bg-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-violet-300">{room.settings.wordsPerPlayer ?? 1}</span>
                    )}
                  </div>
                  {/* Visual indicator */}
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < wordsInput ? 'bg-violet-500' : 'bg-bg-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-px bg-bg-600" />

                {/* Number of Imposters */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Number of Imposters</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Max {maxImposters} with {room.players.length} player{room.players.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {isHost ? (
                      <div className="flex items-center gap-2">
                        <button
                          id="imposters-minus-btn"
                          onClick={() => applyImpostors(impostorsInput - 1)}
                          disabled={impostorsInput <= 1}
                          className="w-8 h-8 rounded-lg glass flex items-center justify-center text-zinc-300 hover:text-white hover:bg-bg-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          −
                        </button>
                        <span className="text-lg font-bold text-rose-300 w-6 text-center">{impostorsInput}</span>
                        <button
                          id="imposters-plus-btn"
                          onClick={() => applyImpostors(impostorsInput + 1)}
                          disabled={impostorsInput >= Math.min(3, maxImposters)}
                          className="w-8 h-8 rounded-lg glass flex items-center justify-center text-zinc-300 hover:text-white hover:bg-bg-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-rose-300">{room.settings.imposterCount ?? 1}</span>
                    )}
                  </div>
                  {/* Visual imposter icons */}
                  <div className="flex gap-2 mt-2">
                    {Array.from({ length: Math.min(3, maxImposters) }).map((_, i) => (
                      <div
                        key={i}
                        className={`text-xl transition-all duration-200 ${
                          i < impostorsInput ? 'opacity-100 scale-100' : 'opacity-20 scale-90'
                        }`}
                      >
                        👁️
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Start button */}
          {isHost && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">Ready to Play?</h3>
                  <p className="text-zinc-500 text-sm mt-1">
                  {!canStart
                    ? room.players.length < 2
                      ? 'Need at least 2 players'
                      : 'Set both video URLs first'
                    : `Starting with ${room.players.length} players`}
                  </p>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className={room.players.length >= 2 ? 'text-emerald-400' : 'text-zinc-600'}>
                    {room.players.length >= 2 ? '✓' : '○'} Players
                  </span>
                  {!hasRandomVideoCategory && (
                    <>
                      <span className={room.settings.hasNormalVideo ? 'text-emerald-400' : 'text-zinc-600'}>
                        {room.settings.hasNormalVideo ? '✓' : '○'} Video
                      </span>
                      <span className={room.settings.hasImposterVideo ? 'text-emerald-400' : 'text-zinc-600'}>
                        {room.settings.hasImposterVideo ? '✓' : '○'} Imposter Video
                      </span>
                    </>
                  )}
                  {hasRandomVideoCategory && (
                    <span className="text-emerald-400">✓ Random Video Pair</span>
                  )}
                </div>
              </div>
              <button
                id="start-game-btn"
                onClick={() => actions.startGame(code)}
                disabled={!canStart}
                className="btn-success btn-lg w-full text-lg font-bold"
              >
                🚀 Start Game
              </button>
            </div>
          )}

          {!isHost && (
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3 animate-float">⏳</div>
              <p className="text-zinc-300 font-medium">Waiting for host to start…</p>
              <p className="text-zinc-500 text-sm mt-1">
                {hasRandomVideoCategory || (room.settings.hasNormalVideo && room.settings.hasImposterVideo)
                  ? 'Videos are set up. Get ready!'
                  : 'Host is setting up the videos…'}
              </p>
              {/* Show settings to non-host */}
              <div className="mt-4 flex justify-center gap-6 text-sm text-zinc-400">
                <span>💬 {room.settings.wordsPerPlayer ?? 1} word{(room.settings.wordsPerPlayer ?? 1) !== 1 ? 's' : ''} each</span>
                <span>👁️ {room.settings.imposterCount ?? 1} imposter{(room.settings.imposterCount ?? 1) !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
