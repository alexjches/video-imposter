'use client';
// src/app/shop/page.tsx
// Coin shop — buy cosmetic items with earned coins

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShop, SHOP_ITEMS } from '@/hooks/useShop';
import { ShopItem } from '@/types';

const RARITY_COLORS = {
  common: 'border-zinc-600 bg-zinc-800/50',
  rare: 'border-blue-500/50 bg-blue-900/20',
  epic: 'border-violet-500/50 bg-violet-900/20',
  legendary: 'border-amber-500/50 bg-amber-900/20',
};

const RARITY_TEXT = {
  common: 'text-zinc-400',
  rare: 'text-blue-400',
  epic: 'text-violet-400',
  legendary: 'text-amber-400',
};

const RARITY_BADGE = {
  common: 'bg-zinc-700 text-zinc-300',
  rare: 'bg-blue-900/60 text-blue-300',
  epic: 'bg-violet-900/60 text-violet-300',
  legendary: 'bg-amber-900/60 text-amber-300',
};

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: '🛒' },
  { id: 'avatar_emoji', label: 'Avatars', icon: '😀' },
  { id: 'avatar_frame', label: 'Frames', icon: '🖼️' },
  { id: 'theme', label: 'Themes', icon: '🎨' },
];

export default function ShopPage() {
  const router = useRouter();
  const { coins, ownedItems, buy, ownsItem } = useShop();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [purchasedId, setPurchasedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const filteredItems = SHOP_ITEMS.filter(
    (item) => selectedCategory === 'all' || item.type === selectedCategory
  );

  function handleBuy(item: ShopItem) {
    if (ownsItem(item.id)) return;
    const success = buy(item.id);
    if (success) {
      setPurchasedId(item.id);
      setNotification(`✅ Purchased ${item.name}!`);
      setTimeout(() => { setPurchasedId(null); setNotification(null); }, 2500);
    } else {
      setErrorId(item.id);
      setNotification(`❌ Not enough coins!`);
      setTimeout(() => { setErrorId(null); setNotification(null); }, 2000);
    }
  }

  return (
    <div className="min-h-dvh grid-bg flex flex-col">
      {/* Header */}
      <header className="glass-dark border-b border-bg-600 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-zinc-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
          >
            ← Dashboard
          </button>

          <h1 className="text-2xl font-black gradient-text">🛒 SHOP</h1>

          {/* Coin balance */}
          <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl border border-amber-500/20">
            <span className="text-xl">🪙</span>
            <span className="text-amber-300 font-black text-lg tabular-nums">{coins}</span>
            <span className="text-zinc-500 text-sm">coins</span>
          </div>
        </div>
      </header>

      {/* Notification toast */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3 rounded-xl text-sm font-semibold animate-bounce-in border border-zinc-600 shadow-lg">
          {notification}
        </div>
      )}

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* How to earn coins */}
        <div className="glass rounded-2xl p-5 mb-6 border border-amber-500/15">
          <h2 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
            <span>🪙</span> How to Earn Coins
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-bg-800/50 rounded-xl p-3">
              <div className="text-2xl mb-1">🎮</div>
              <p className="text-xs font-bold text-zinc-300">Participate</p>
              <p className="text-amber-300 text-sm font-bold">+50 🪙</p>
              <p className="text-xs text-zinc-500">Per game played</p>
            </div>
            <div className="bg-bg-800/50 rounded-xl p-3">
              <div className="text-2xl mb-1">🚀</div>
              <p className="text-xs font-bold text-zinc-300">Crew Wins</p>
              <p className="text-amber-300 text-sm font-bold">+100 🪙</p>
              <p className="text-xs text-zinc-500">Win as crewmate</p>
            </div>
            <div className="bg-bg-800/50 rounded-xl p-3">
              <div className="text-2xl mb-1">👁️</div>
              <p className="text-xs font-bold text-zinc-300">Imposter Wins</p>
              <p className="text-amber-300 text-sm font-bold">+150 🪙</p>
              <p className="text-xs text-zinc-500">Fool the crew</p>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`category-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'glass text-zinc-400 hover:text-white hover:bg-bg-700'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const owned = ownsItem(item.id);
            const canAfford = coins >= item.price;
            const isJustBought = purchasedId === item.id;
            const isError = errorId === item.id;

            return (
              <div
                key={item.id}
                id={`shop-item-${item.id}`}
                className={`relative rounded-2xl border-2 p-4 flex flex-col items-center text-center transition-all duration-200 ${
                  RARITY_COLORS[item.rarity]
                } ${
                  owned
                    ? 'opacity-70 ring-2 ring-emerald-500/40'
                    : canAfford
                    ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                } ${isError ? 'animate-shake ring-2 ring-rose-500' : ''}`}
              >
                {/* Rarity badge */}
                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold capitalize ${RARITY_BADGE[item.rarity]}`}>
                  {item.rarity}
                </div>

                {/* Owned badge */}
                {owned && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                )}

                {/* Item icon */}
                <div className={`text-5xl mb-2 transition-transform ${isJustBought ? 'scale-125' : ''}`}>
                  {item.icon}
                </div>

                <p className="font-bold text-zinc-200 text-sm mb-0.5">{item.name}</p>
                <p className="text-xs text-zinc-500 mb-3 leading-tight">{item.description}</p>

                {/* Price / Buy button */}
                <button
                  onClick={() => !owned && handleBuy(item)}
                  disabled={owned}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    owned
                      ? 'bg-emerald-900/40 text-emerald-400 cursor-not-allowed border border-emerald-500/30'
                      : canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-95'
                      : 'bg-bg-700 text-zinc-600 cursor-not-allowed border border-zinc-700'
                  }`}
                >
                  {owned ? '✓ Owned' : `🪙 ${item.price}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
