'use client';
// src/app/dashboard/page.tsx
// Main hub: public room browser + create room

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { RoomPublic, Preset } from '@/types';
import { CreateRoomModal } from '@/components/dashboard/CreateRoomModal';
import { JoinRoomModal } from '@/components/dashboard/JoinRoomModal';
import { useShop } from '@/hooks/useShop';
import Link from 'next/link';

const GUEST_AVATARS = ['🎮', '👾', '🕵️', '🎭', '🦊', '🐺', '🦁', '🐸'];

function DashboardContent() {
  const { data: session, status } = useSession();
  const { coins } = useShop();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === '1';

  const [publicRooms, setPublicRooms] = useState<RoomPublic[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('🎮');
  const [guestSetup, setGuestSetup] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedName = localStorage.getItem('imposter_guest_name');
    if (savedName) {
      setGuestName(savedName);
      setGuestSetup(true);
    }
    const savedAvatar = localStorage.getItem('imposter_guest_avatar');
    if (savedAvatar) {
      setGuestAvatar(savedAvatar);
    } else {
      setGuestAvatar(GUEST_AVATARS[Math.floor(Math.random() * GUEST_AVATARS.length)]);
    }
  }, []);

  const completeGuestSetup = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed.length >= 2) {
      localStorage.setItem('imposter_guest_name', trimmed);
      localStorage.setItem('imposter_guest_avatar', guestAvatar);
      setGuestName(trimmed);
      setGuestSetup(true);
    }
  }, [guestAvatar]);

  const playerName = session?.user?.name || (guestSetup ? guestName : null);
  const playerAvatar = (session?.user as any)?.image || guestAvatar;
  const userId = (session?.user as any)?.id || null;

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleRoomsUpdated = (rooms: RoomPublic[]) => {
      setPublicRooms(rooms);
    };

    socket.on('rooms:updated', handleRoomsUpdated);
    // Request initial rooms list
    socket.emit('rooms:list', {}, (rooms: RoomPublic[]) => {
      setPublicRooms(rooms || []);
    });

    return () => {
      socket.off('rooms:updated', handleRoomsUpdated);
    };
  }, []);

  const handleCreateRoom = useCallback(
    async (opts: { isPublic: boolean; normalVideoUrl: string; imposterVideoUrl: string; chatType: 'text' | 'voice' | 'video'; videoCategory: string | null }) => {
      const socket = getSocket();
      const name = playerName || 'Guest';
      const avatar = playerAvatar || '🎮';

      return new Promise<string>((resolve, reject) => {
        socket.emit(
          'room:create',
          { playerName: name, avatar, userId, ...opts },
          (res: { success: boolean; code?: string; error?: string }) => {
            if (res.success && res.code) resolve(res.code);
            else reject(new Error(res.error || 'Failed to create room'));
          }
        );
      });
    },
    [playerName, playerAvatar, userId]
  );

  const handleJoinPublicRoom = useCallback(
    (code: string) => {
      const name = playerName || 'Guest';
      const socket = getSocket();
      socket.emit(
        'room:join',
        { code, playerName: name, avatar: playerAvatar, userId },
        (res: { success: boolean; error?: string }) => {
          if (res.success) {
            router.push(`/room/${code}`);
          }
        }
      );
    },
    [playerName, playerAvatar, userId, router]
  );

  // Redirect logged-out non-guests
  if (status === 'unauthenticated' && !isGuest) {
    router.push('/');
    return null;
  }

  // Prevent hydration mismatches
  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center grid-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-zinc-400 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Guest setup screen
  if (isGuest && !guestSetup) {
    return (
      <div className="min-h-dvh flex items-center justify-center grid-bg px-4">
        <div className="glass rounded-2xl p-8 w-full max-w-sm animate-scale-in">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Quick Play</h2>
          <p className="text-zinc-400 text-sm text-center mb-6">Enter a display name to continue as guest</p>
          <div className="text-5xl text-center mb-4">{guestAvatar}</div>
          <input
            id="guest-name-input"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="input-field mb-4"
            placeholder="Your display name"
            maxLength={20}
            onKeyDown={(e) => e.key === 'Enter' && completeGuestSetup(guestName)}
          />
          <button
            id="guest-continue-btn"
            className="btn-primary w-full"
            disabled={guestName.trim().length < 2}
            onClick={() => completeGuestSetup(guestName)}
          >
            Continue as Guest →
          </button>
          <p className="text-center text-zinc-500 text-xs mt-4">
            <Link href="/signup" className="text-violet-400 hover:underline">Create an account</Link> to save presets & history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh grid-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 glass-dark border-b border-bg-600 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-black gradient-text">IMPOSTER</Link>
        <div className="flex items-center gap-3">
          {/* Coin balance + shop */}
          <Link
            href="/shop"
            id="shop-nav-btn"
            className="flex items-center gap-2 glass rounded-xl px-3 py-2 hover:bg-bg-700 transition-colors border border-amber-500/20 hover:border-amber-500/40"
          >
            <span className="text-lg">🪙</span>
            <span className="text-amber-300 font-bold tabular-nums">{coins}</span>
            <span className="text-zinc-500 text-xs hidden sm:inline">🛒 Shop</span>
          </Link>

          {session?.user ? (
            <>
              <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
                <span className="text-xl">{(session.user as any)?.image || '🎮'}</span>
                <span className="text-sm font-medium text-zinc-200">{session.user.name}</span>
              </div>
              <button
                id="signout-btn"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-ghost btn-sm text-zinc-400"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
              <span className="text-xl">{playerAvatar}</span>
              <span className="text-sm font-medium text-zinc-400">{playerName} (guest)</span>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Action Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button
            id="create-room-btn"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary btn-lg flex-1"
          >
            + Create Room
          </button>
          <button
            id="join-by-code-btn"
            onClick={() => setShowJoinModal(true)}
            className="btn-ghost btn-lg flex-1"
          >
            🔑 Join by Code
          </button>
        </div>

        {/* Public Rooms */}
        <section>
          <h2 className="text-xl font-bold text-zinc-200 mb-4">
            🌐 Public Rooms
            <span className="ml-3 text-sm font-normal text-zinc-500">
              {publicRooms.length} available
            </span>
          </h2>

          {publicRooms.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🎮</div>
              <p className="text-zinc-400 mb-2">No public rooms right now.</p>
              <p className="text-zinc-500 text-sm">Create one and invite your friends!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicRooms.map((room) => (
                <RoomCard
                  key={room.code}
                  room={room}
                  onJoin={() => handleJoinPublicRoom(room.code)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (opts) => {
            const code = await handleCreateRoom(opts);
            router.push(`/room/${code}`);
          }}
          userId={userId}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal
          onClose={() => setShowJoinModal(false)}
          playerName={playerName || 'Guest'}
          avatar={playerAvatar}
          userId={userId}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center grid-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-zinc-400 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}


function RoomCard({ room, onJoin }: { room: RoomPublic; onJoin: () => void }) {
  const host = room.players.find((p) => p.id === room.hostId);
  const isFull = room.players.length >= room.settings.maxPlayers;

  return (
    <div className="card group cursor-pointer" onClick={!isFull ? onJoin : undefined}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{host?.avatar || '🎮'}</span>
          <div>
            <p className="font-semibold text-white text-sm">{host?.name || 'Host'}</p>
            <p className="text-xs text-zinc-500 font-mono">{room.code}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Lobby
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1">
          {room.players.slice(0, 5).map((p) => (
            <span key={p.id} className="text-lg" title={p.name}>
              {p.avatar}
            </span>
          ))}
          {room.players.length > 5 && (
            <span className="text-xs text-zinc-500 ml-1">+{room.players.length - 5}</span>
          )}
        </div>
        <span className="text-sm text-zinc-400">
          {room.players.length}/{room.settings.maxPlayers}
        </span>
      </div>

      <button
        className={`btn w-full mt-4 text-sm ${isFull ? 'btn-ghost opacity-50 cursor-not-allowed' : 'btn-primary'}`}
        disabled={isFull}
      >
        {isFull ? 'Full' : 'Join Room'}
      </button>
    </div>
  );
}
