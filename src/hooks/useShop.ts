// src/hooks/useShop.ts
// localStorage-based coin economy and shop management

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShopItem } from '@/types';

const COINS_KEY = 'imposter_coins';
const OWNED_KEY = 'imposter_shop_owned';

// All available shop items
export const SHOP_ITEMS: ShopItem[] = [
  // Avatar emojis
  { id: 'avatar_alien', name: 'Alien', description: 'Extraterrestrial disguise', price: 50, type: 'avatar_emoji', value: '👽', icon: '👽', rarity: 'common' },
  { id: 'avatar_robot', name: 'Robot', description: 'Mechanical deception unit', price: 50, type: 'avatar_emoji', value: '🤖', icon: '🤖', rarity: 'common' },
  { id: 'avatar_ninja', name: 'Ninja', description: 'Silent and deadly', price: 75, type: 'avatar_emoji', value: '🥷', icon: '🥷', rarity: 'common' },
  { id: 'avatar_vampire', name: 'Vampire', description: 'Creature of the night', price: 100, type: 'avatar_emoji', value: '🧛', icon: '🧛', rarity: 'rare' },
  { id: 'avatar_devil', name: 'Devil', description: 'Born to deceive', price: 100, type: 'avatar_emoji', value: '😈', icon: '😈', rarity: 'rare' },
  { id: 'avatar_skull', name: 'Skull', description: 'Fear the unknown', price: 120, type: 'avatar_emoji', value: '💀', icon: '💀', rarity: 'rare' },
  { id: 'avatar_ghost', name: 'Ghost', description: 'Haunt the competition', price: 150, type: 'avatar_emoji', value: '👻', icon: '👻', rarity: 'rare' },
  { id: 'avatar_wizard', name: 'Wizard', description: 'Master of illusion', price: 200, type: 'avatar_emoji', value: '🧙', icon: '🧙', rarity: 'epic' },
  { id: 'avatar_dragon', name: 'Dragon', description: 'Legendary deceiver', price: 300, type: 'avatar_emoji', value: '🐉', icon: '🐉', rarity: 'epic' },
  { id: 'avatar_crown', name: 'King', description: 'Royally suspicious', price: 500, type: 'avatar_emoji', value: '👑', icon: '👑', rarity: 'legendary' },

  // Avatar frames (CSS class-based)
  { id: 'frame_gold', name: 'Gold Frame', description: 'Gleaming golden border', price: 150, type: 'avatar_frame', value: 'frame-gold', icon: '🥇', rarity: 'rare' },
  { id: 'frame_neon', name: 'Neon Frame', description: 'Electric neon glow', price: 200, type: 'avatar_frame', value: 'frame-neon', icon: '⚡', rarity: 'epic' },
  { id: 'frame_rainbow', name: 'Rainbow Frame', description: 'Prismatic perfection', price: 350, type: 'avatar_frame', value: 'frame-rainbow', icon: '🌈', rarity: 'epic' },
  { id: 'frame_fire', name: 'Fire Frame', description: 'Burning with suspicion', price: 500, type: 'avatar_frame', value: 'frame-fire', icon: '🔥', rarity: 'legendary' },

  // Themes
  { id: 'theme_ocean', name: 'Ocean Theme', description: 'Deep blue aesthetic', price: 250, type: 'theme', value: 'theme-ocean', icon: '🌊', rarity: 'epic' },
  { id: 'theme_crimson', name: 'Crimson Theme', description: 'Blood red danger', price: 250, type: 'theme', value: 'theme-crimson', icon: '🩸', rarity: 'epic' },
  { id: 'theme_midnight', name: 'Midnight Theme', description: 'Pure darkness', price: 400, type: 'theme', value: 'theme-midnight', icon: '🌙', rarity: 'legendary' },
];

export function useShop() {
  const [coins, setCoins] = useState(0);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedCoins = parseInt(localStorage.getItem(COINS_KEY) || '0', 10);
    const storedOwned = JSON.parse(localStorage.getItem(OWNED_KEY) || '[]') as string[];
    setCoins(isNaN(storedCoins) ? 0 : storedCoins);
    setOwnedItems(storedOwned);
  }, []);

  const saveCoins = useCallback((amount: number) => {
    localStorage.setItem(COINS_KEY, String(amount));
    setCoins(amount);
  }, []);

  const saveOwned = useCallback((items: string[]) => {
    localStorage.setItem(OWNED_KEY, JSON.stringify(items));
    setOwnedItems(items);
  }, []);

  const addCoins = useCallback((amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      localStorage.setItem(COINS_KEY, String(next));
      return next;
    });
  }, []);

  const buy = useCallback((itemId: string): boolean => {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;

    const currentCoins = parseInt(localStorage.getItem(COINS_KEY) || '0', 10);
    if (currentCoins < item.price) return false;

    const currentOwned = JSON.parse(localStorage.getItem(OWNED_KEY) || '[]') as string[];
    if (currentOwned.includes(itemId)) return false; // already owned

    const newCoins = currentCoins - item.price;
    const newOwned = [...currentOwned, itemId];

    localStorage.setItem(COINS_KEY, String(newCoins));
    localStorage.setItem(OWNED_KEY, JSON.stringify(newOwned));
    setCoins(newCoins);
    setOwnedItems(newOwned);
    return true;
  }, []);

  const ownsItem = useCallback(
    (itemId: string) => ownedItems.includes(itemId),
    [ownedItems]
  );

  return { coins, ownedItems, addCoins, buy, ownsItem, SHOP_ITEMS };
}
