'use client';
// src/components/game/DiscussionScreen.tsx
// Word-limited discussion phase before voting

import { useState, useEffect, useRef, useCallback } from 'react';
import { RoomPublic, DiscussionWord } from '@/types';
import { DiscussionStatus, DiscussionReadyCount } from '@/hooks/useRoom';

interface Props {
  room: RoomPublic;
  socketId: string;
  actions: any;
  code: string;
  discussionWords: DiscussionWord[];
  discussionStatus: DiscussionStatus | null;
  discussionReadyCount: DiscussionReadyCount | null;
  chatMessages: any[];
}

export function DiscussionScreen({
  room,
  socketId,
  actions,
  code,
  discussionWords,
  discussionStatus,
  discussionReadyCount,
  chatMessages,
}: Props) {
  const [wordInput, setWordInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [hasClickedReady, setHasClickedReady] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  const chatType = room.settings.chatType || 'text';
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [speakingPlayers, setSpeakingPlayers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (chatType !== 'text') {
      const interval = setInterval(() => {
        const speaking: Record<string, boolean> = {};
        room.players.forEach(p => {
          speaking[p.id] = Math.random() > 0.8; // 20% chance to be speaking randomly
        });
        if (isMuted) speaking[socketId] = false;
        setSpeakingPlayers(speaking);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [chatType, room.players, socketId, isMuted]);

  const isOpen = discussionStatus?.isOpen ?? false;
  const activePlayerId = discussionStatus?.activePlayerId ?? null;
  const turnTimeLeft = discussionStatus?.turnTimeLeft ?? 0;
  const isMyTurn = activePlayerId === socketId;

  const wordsPerPlayer = discussionStatus?.wordsPerPlayer ?? room.settings.wordsPerPlayer ?? 1;
  const myWordsUsed = discussionStatus?.wordsUsed?.[socketId] ?? 0;
  const myWordsLeft = Math.max(0, wordsPerPlayer - myWordsUsed);
  const canSendWord = isMyTurn && myWordsLeft > 0 && !isOpen;

  // Count players who still have words left
  const playersWithWordsLeft = room.players.filter(
    (p) => (discussionStatus?.wordsUsed?.[p.id] ?? 0) < wordsPerPlayer
  ).length;

  // Ready counts
  const readyCount = discussionReadyCount?.ready ?? 0;
  const totalPlayers = room.players.length;
  const amIReady = discussionReadyCount?.readyPlayers?.[socketId] ?? false;

  // Flash animation when chat unlocks
  useEffect(() => {
    if (isOpen) {
      setJustUnlocked(true);
      const t = setTimeout(() => setJustUnlocked(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discussionWords, chatMessages]);

  const handleSendWord = useCallback(() => {
    const word = wordInput.trim().replace(/\s+/g, '');
    if (!word || !canSendWord) return;
    actions.sendDiscussionWord(code, word);
    setWordInput('');
    wordInputRef.current?.focus();
  }, [wordInput, canSendWord, code, actions]);

  const handleSendChat = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg || !isOpen) return;
    actions.sendDiscussionChat(code, msg);
    setChatInput('');
  }, [chatInput, isOpen, code, actions]);

  const handleReady = useCallback(() => {
    if (hasClickedReady) return;
    setHasClickedReady(true);
    actions.signalDiscussionReady(code);
  }, [hasClickedReady, code, actions]);

  // Combine word messages + chat messages for display
  const allMessages = [
    ...discussionWords.map((w) => ({
      id: `word-${w.playerId}-${w.wordIndex}-${w.timestamp}`,
      type: 'word' as const,
      playerId: w.playerId,
      playerName: w.playerName,
      avatar: w.avatar,
      text: w.word,
      wordIndex: w.wordIndex,
      timestamp: w.timestamp,
    })),
    ...chatMessages.map((m) => ({
      id: `chat-${m.playerId}-${m.timestamp}`,
      type: 'chat' as const,
      playerId: m.playerId,
      playerName: m.playerName,
      avatar: m.avatar,
      text: m.message,
      timestamp: m.timestamp,
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="fixed inset-0 bg-bg-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="glass-dark border-b border-bg-600 px-6 py-3 flex-shrink-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black gradient-text">DISCUSSION</h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              {isOpen
                ? '💬 Free discussion — say anything!'
                : `🔤 Word phase — sequential turns (10s limit per player)`}
            </p>
          </div>

          {/* Player word progress */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {room.players.map((p) => {
                const used = discussionStatus?.wordsUsed?.[p.id] ?? 0;
                const done = used >= wordsPerPlayer;
                return (
                  <div
                    key={p.id}
                    title={`${p.name}: ${used}/${wordsPerPlayer} words`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                      done
                        ? 'border-emerald-500 bg-emerald-500/20'
                        : 'border-zinc-700 bg-zinc-800/50'
                    }`}
                  >
                    {p.avatar}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-zinc-400 text-right">
              <div>{playersWithWordsLeft === 0 ? '✅ All done' : `${room.players.length - playersWithWordsLeft}/${room.players.length} done`}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Unlock banner */}
      {justUnlocked && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-6 py-3 text-center animate-bounce-in flex-shrink-0">
          <p className="text-emerald-300 font-bold text-sm">
            🎉 All words used — free discussion is now open!
          </p>
        </div>
      )}

      {/* Phase indicator bar */}
      <div className={`h-1 flex-shrink-0 transition-colors duration-1000 ${isOpen ? 'bg-emerald-500' : 'bg-violet-500'}`} />

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden max-w-5xl mx-auto w-full">

        {chatType === 'text' && (
          <>
            {/* Left: Player word status sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-bg-600 p-3 overflow-y-auto hidden md:block">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Word Usage</p>
          <div className="space-y-2">
            {room.players.map((p) => {
              const used = discussionStatus?.wordsUsed?.[p.id] ?? 0;
              const isReady = discussionReadyCount?.readyPlayers?.[p.id] ?? false;
              const isMe = p.id === socketId;
              const isActive = p.id === activePlayerId && !isOpen;
              return (
                <div
                  key={p.id}
                  className={`rounded-lg p-2 transition-all ${
                    isActive
                      ? 'bg-violet-500/20 border-2 border-violet-400 animate-pulse shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                      : isMe
                      ? 'bg-violet-900/30 border border-violet-500/30'
                      : 'bg-bg-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{p.avatar}</span>
                    <span className="text-xs font-medium text-zinc-300 truncate flex-1">
                      {p.name}{isMe ? ' (you)' : ''}
                    </span>
                    {isReady && <span className="text-emerald-400 text-xs">✅</span>}
                  </div>
                  {/* Word progress dots */}
                  <div className="flex gap-1">
                    {Array.from({ length: wordsPerPlayer }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < used ? 'bg-violet-400' : 'bg-bg-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">{used}/{wordsPerPlayer} words</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Chat feed */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {allMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-zinc-400 text-sm">
                  {isOpen
                    ? 'Start the discussion!'
                    : 'Players will submit their words here…'}
                </p>
              </div>
            )}

            {allMessages.map((msg) => {
              const isMe = msg.playerId === socketId;
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <span className="text-xl flex-shrink-0">{msg.avatar}</span>
                  <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    <span className="text-xs text-zinc-500 px-1">{msg.playerName}</span>
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                        msg.type === 'word'
                          ? isMe
                            ? 'bg-violet-600 text-white rounded-br-md'
                            : 'bg-bg-700 text-zinc-200 rounded-bl-md border border-violet-500/30'
                          : isMe
                          ? 'bg-violet-700 text-white rounded-br-md'
                          : 'bg-bg-700 text-zinc-200 rounded-bl-md'
                      }`}
                    >
                      {msg.type === 'word' && (
                        <span className="text-xs text-violet-300 mr-1.5 font-mono">#{msg.wordIndex}</span>
                      )}
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Input area */}
          <div className={`border-t px-4 py-3 flex-shrink-0 transition-colors duration-500 ${
            isOpen ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-bg-600 bg-bg-900/50'
          }`}>
            {!isOpen && activePlayerId && (
              <div className={`mb-3 flex items-center justify-between p-3 rounded-xl border transition-all ${
                isMyTurn
                  ? 'bg-violet-950/50 border-violet-500/40 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                  : 'bg-bg-800/40 border-bg-700 text-zinc-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                  {isMyTurn ? (
                    <span className="text-sm font-bold tracking-wide">
                      👉 <span className="text-violet-300 font-extrabold uppercase animate-pulse">YOUR TURN!</span> Say your word now.
                    </span>
                  ) : (
                    <span className="text-sm">
                      🕒 Waiting for <span className="text-zinc-200 font-semibold">{room.players.find(p => p.id === activePlayerId)?.name || 'Player'}</span> to say their word...
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-mono transition-all ${
                  turnTimeLeft <= 3
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 animate-bounce'
                    : 'bg-black/40 border-violet-500/30 text-violet-300'
                }`}>
                  {turnTimeLeft}s
                </div>
              </div>
            )}

            {!isOpen ? (
              /* Word input — restricted phase */
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={wordInputRef}
                    id="discussion-word-input"
                    type="text"
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value.replace(/\s/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendWord()}
                    placeholder={
                      isMyTurn
                        ? `Say your word (${myWordsLeft} left)…`
                        : activePlayerId
                        ? `Waiting for ${room.players.find(p => p.id === activePlayerId)?.name || 'player'}…`
                        : 'Please wait…'
                    }
                    disabled={!canSendWord}
                    maxLength={30}
                    className="input-field w-full pr-16 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                    {myWordsUsed}/{wordsPerPlayer}
                  </div>
                </div>
                <button
                  id="send-word-btn"
                  onClick={handleSendWord}
                  disabled={!canSendWord || !wordInput.trim()}
                  className="btn-primary px-5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            ) : (
              /* Free chat — open phase */
              <div className="flex gap-2">
                <input
                  id="discussion-chat-input"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Say anything…"
                  maxLength={300}
                  className="input-field flex-1"
                  style={{ borderColor: 'rgba(16,185,129,0.4)' }}
                />
                <button
                  id="send-chat-btn"
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {chatType === 'voice' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full max-w-3xl">
              {room.players.map((p) => {
                const isSpeaking = speakingPlayers[p.id];
                const isMe = p.id === socketId;
                const muted = isMe && isMuted;
                return (
                  <div key={p.id} className="flex flex-col items-center gap-3">
                    <div className={`relative w-24 h-24 rounded-full flex items-center justify-center text-4xl bg-bg-800 transition-all duration-300 ${
                      isSpeaking ? 'shadow-[0_0_30px_rgba(16,185,129,0.5)] border-2 border-emerald-400 scale-110' : 'border border-bg-600'
                    } ${muted ? 'opacity-50' : ''}`}>
                      {p.avatar}
                      {muted && (
                        <div className="absolute -bottom-2 -right-2 bg-rose-500 rounded-full p-1 border-2 border-bg-950">
                          <span className="text-xs">🔇</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-zinc-200">{p.name} {isMe && '(You)'}</span>
                      <p className={`text-xs ${isSpeaking ? 'text-emerald-400 font-bold animate-pulse' : 'text-zinc-500'}`}>
                        {muted ? 'Muted' : (isSpeaking ? 'Speaking...' : 'Silent')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Audio Controls */}
            <div className="mt-12 flex gap-4">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                  isMuted 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                }`}
              >
                <span className="text-xl">{isMuted ? '🔇' : '🎤'}</span>
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          </div>
        )}

        {chatType === 'video' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {room.players.map((p) => {
                const isSpeaking = speakingPlayers[p.id];
                const isMe = p.id === socketId;
                const muted = isMe && isMuted;
                const videoOff = isMe && isVideoOff;
                return (
                  <div key={p.id} className={`relative aspect-video rounded-2xl overflow-hidden bg-bg-900 border-2 transition-all duration-300 ${
                    isSpeaking ? 'border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.4)] scale-[1.02]' : 'border-bg-700'
                  }`}>
                    {/* Placeholder Video Content */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-800 to-bg-900">
                      {videoOff ? (
                        <div className="flex flex-col items-center opacity-50">
                          <span className="text-4xl mb-2">🚫</span>
                          <span className="text-xs text-zinc-400">Video Off</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className={`text-6xl ${isSpeaking ? 'animate-bounce' : ''}`}>{p.avatar}</span>
                          <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Name tag */}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                      <span className="text-xs font-semibold text-white truncate max-w-[100px]">{p.name} {isMe && '(You)'}</span>
                      {muted ? (
                        <span className="text-xs bg-rose-500/80 rounded-full w-5 h-5 flex items-center justify-center">🔇</span>
                      ) : (
                        isSpeaking && <span className="text-xs text-sky-400 animate-pulse">🔊</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Video Controls */}
            <div className="mt-8 flex gap-4 glass-dark rounded-full p-2 border border-bg-600">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                  isMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-bg-700 text-white hover:bg-bg-600'
                }`}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button 
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                  isVideoOff ? 'bg-rose-500/20 text-rose-400' : 'bg-bg-700 text-white hover:bg-bg-600'
                }`}
              >
                {isVideoOff ? '🚫' : '📷'}
              </button>
            </div>
          </div>
        )}

        {/* Right: Ready panel */}
        <div className="w-44 flex-shrink-0 border-l border-bg-600 p-3 flex flex-col hidden md:flex">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Ready to Vote</p>

          <div className="space-y-2 flex-1">
            {room.players.map((p) => {
              const isReady = discussionReadyCount?.readyPlayers?.[p.id] ?? false;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all ${
                    isReady ? 'bg-emerald-900/30 border border-emerald-500/30' : 'bg-bg-800/30'
                  }`}
                >
                  <span className="text-sm">{p.avatar}</span>
                  <span className="text-xs text-zinc-300 truncate flex-1">{p.name}</span>
                  <span className={`text-sm ${isReady ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {isReady ? '✅' : '○'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-zinc-500 mb-2">
              <span className="text-emerald-400 font-bold">{readyCount}</span>/{totalPlayers} ready
            </p>
            <button
              id="discussion-ready-btn"
              onClick={handleReady}
              disabled={hasClickedReady || amIReady}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                hasClickedReady || amIReady
                  ? 'bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {hasClickedReady || amIReady ? '✅ Ready!' : '✅ Ready\nto Vote'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar — ready button + word count */}
      <div className="md:hidden border-t border-bg-600 px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0 glass-dark">
        <div className="text-sm text-zinc-400">
          {chatType === 'text' ? (isOpen ? '💬 Free chat' : (isMyTurn ? '👉 Your turn!' : `⏳ ${room.players.find(p => p.id === activePlayerId)?.name || 'Player'}'s turn (${turnTimeLeft}s)`)) : '📞 Voice / Video Active'}
        </div>
        <div className="text-xs text-zinc-500">{readyCount}/{totalPlayers} ready</div>
        <button
          id="discussion-ready-btn-mobile"
          onClick={handleReady}
          disabled={hasClickedReady || amIReady}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            hasClickedReady || amIReady
              ? 'bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
          }`}
        >
          {hasClickedReady || amIReady ? '✅ Ready' : '✅ Ready to Vote'}
        </button>
      </div>
    </div>
  );
}
