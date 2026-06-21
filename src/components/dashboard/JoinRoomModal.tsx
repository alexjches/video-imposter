'use client';
// src/components/dashboard/JoinRoomModal.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';

interface Props {
  onClose: () => void;
  playerName: string;
  avatar: string;
  userId: string | null;
}

export function JoinRoomModal({ onClose, playerName, avatar, userId }: Props) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }
    setLoading(true);
    setError('');

    const socket = getSocket();
    socket.emit(
      'room:join',
      { code: trimmed, playerName, avatar, userId },
      (res: { success: boolean; error?: string }) => {
        if (res.success) {
          router.push(`/room/${trimmed}`);
        } else {
          setError(res.error || 'Could not join room');
          setLoading(false);
        }
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Join Room</h2>
          <button id="join-modal-close" onClick={onClose} className="text-zinc-500 hover:text-white text-2xl">✕</button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-4 text-rose-300 text-sm">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="room-code-input">
          Room Code
        </label>
        <input
          id="room-code-input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          className="input-field text-center text-2xl font-mono tracking-widest uppercase mb-6"
          placeholder="ABC123"
          maxLength={6}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />

        <button
          id="join-room-btn"
          onClick={handleJoin}
          className="btn-primary w-full"
          disabled={loading || code.trim().length !== 6}
        >
          {loading ? 'Joining...' : 'Join Room →'}
        </button>
      </div>
    </div>
  );
}
