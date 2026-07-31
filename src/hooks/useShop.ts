// src/hooks/useShop.ts
// Coin wallet + cosmetics ownership.
//
// NOTE: everything here is localStorage. Spec sections 9 and 11 call for
// persistent, account-bound currency; the server already computes a
// coinReward in game:results but nothing writes it down. Moving this to the
// database is Phase 3 — keep the API surface stable so that swap is local.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { CosmeticCategory, EquippedCosmetics, ShopItem } from '@/types';

const COINS_KEY = 'imposter_coins';
const OWNED_KEY = 'imposter_shop_owned';
const EQUIPPED_KEY = 'imposter_shop_equipped';

export const COSMETIC_CATEGORIES: { id: CosmeticCategory; icon: string; label: string }[] = [
  { id: 'tape-skin', icon: '📼', label: 'VHS TAPE SKINS' },
  { id: 'vcr-skin', icon: '📟', label: 'VCR PLAYER SKINS' },
  { id: 'tape-label', icon: '🏷️', label: 'TAPE LABELS' },
];

// Catalogue and prices ported from vhs-frontend-example/home.html.
export const SHOP_ITEMS: ShopItem[] = [
  // ── VHS tape skins ────────────────────────────────────────────────
  {
    id: 'tape-neon-noir',
    name: 'Neon Noir',
    category: 'tape-skin',
    price: 150,
    tag: 'NEON NOIR',
    title: 'NEON NOIR',
    subLeft: 'LIMITED',
    subRight: '● SP',
    palette: {
      body: '#0a0a12', border: '#ff0077', tagBg: '#ff0077', tagColor: '#fff',
      labelBg: 'linear-gradient(135deg, #1a0020, #0a0018)', labelBorder: '#ff0077',
      titleColor: '#ff0077', subColor: '#aa0055',
      innerBg: '#05050a', accentDark: '#1a001a', accentBright: '#ff0077',
    },
  },
  {
    id: 'tape-retro-sunset',
    name: 'Retro Sunset',
    category: 'tape-skin',
    price: 200,
    tag: 'RETRO SUNSET',
    title: 'RETRO SUNSET',
    subLeft: 'RARE',
    subRight: '● HQ',
    palette: {
      body: '#2b1800', border: '#ff8800', tagBg: '#ff8800', tagColor: '#000',
      labelBg: 'linear-gradient(135deg, #ff8800, #ff4400)', labelBorder: '#000',
      titleColor: '#fff', subColor: '#ffe0b0',
      innerBg: '#1a0a00', accentDark: '#3d1e00', accentBright: '#ffaa33',
    },
  },
  {
    id: 'tape-glitch-core',
    name: 'Glitch Core',
    category: 'tape-skin',
    price: 175,
    tag: 'GLITCH CORE',
    title: 'GL1TCH_C0RE',
    subLeft: 'ERR0R',
    subRight: '● 404',
    palette: {
      body: '#0d0d1a', border: '#00f0ff', tagBg: '#00f0ff', tagColor: '#000',
      labelBg: 'linear-gradient(135deg, #001a22, #002233)', labelBorder: '#00f0ff',
      titleColor: '#00f0ff', subColor: '#00aabb',
      innerBg: '#000a0d', accentDark: '#001a22', accentBright: '#00f0ff',
    },
  },
  {
    id: 'tape-pastel-wave',
    name: 'Pastel Wave',
    category: 'tape-skin',
    price: 125,
    tag: 'PASTEL WAVE',
    title: 'PASTEL WAVE',
    subLeft: 'DREAMY',
    subRight: '● LP',
    palette: {
      body: '#2a1e3a', border: '#cc88ff', tagBg: '#cc88ff', tagColor: '#1a0033',
      labelBg: 'linear-gradient(135deg, #eeddff, #ffddee)', labelBorder: '#aa66dd',
      titleColor: '#6633aa', subColor: '#9966cc',
      innerBg: '#1a0d2a', accentDark: '#331155', accentBright: '#cc88ff',
    },
  },
  {
    id: 'tape-toxic-waste',
    name: 'Toxic Waste',
    category: 'tape-skin',
    price: 100,
    tag: 'TOXIC WASTE',
    title: 'TOX1C_WASTE',
    subLeft: '☢ HAZARD',
    subRight: '● EP',
    palette: {
      body: '#0a1a0a', border: '#00ff66', tagBg: '#00ff66', tagColor: '#000',
      labelBg: 'linear-gradient(135deg, #001a00, #003300)', labelBorder: '#00ff66',
      titleColor: '#00ff66', subColor: '#00aa44',
      innerBg: '#001100', accentDark: '#002200', accentBright: '#00ff66',
    },
  },
  {
    id: 'tape-gold-standard',
    name: 'Gold Standard',
    category: 'tape-skin',
    price: 200,
    tag: 'GOLD STANDARD',
    title: 'GOLD STANDARD',
    subLeft: '★ PREMIUM',
    subRight: '● HI-FI',
    palette: {
      body: '#1a1500', border: '#ffd700', tagBg: '#ffd700', tagColor: '#000',
      labelBg: 'linear-gradient(135deg, #ffd700, #ffaa00)', labelBorder: '#000',
      titleColor: '#1a1000', subColor: '#8a7000',
      innerBg: '#0d0a00', accentDark: '#332b00', accentBright: '#ffd700',
    },
  },

  // ── VCR player skins ──────────────────────────────────────────────
  {
    id: 'vcr-midnight-chrome',
    name: 'Midnight Chrome',
    category: 'vcr-skin',
    price: 250,
    tag: 'MIDNIGHT',
    title: 'MIDNIGHT CHROME',
    subLeft: 'CH. ∞',
    subRight: '● PREMIUM',
    palette: {
      body: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a16 100%)', border: '#8888ff',
      tagBg: '#8888ff', tagColor: '#000',
      labelBg: '#0b0b10', labelBorder: '#8888ff',
      titleColor: '#8888ff', subColor: '#6666cc',
      innerBg: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d18 100%)',
      accentDark: '#4444aa', accentBright: '#8888ff',
    },
  },
  {
    id: 'vcr-arctic-frost',
    name: 'Arctic Frost',
    category: 'vcr-skin',
    price: 200,
    tag: 'ARCTIC',
    title: 'ARCTIC FROST',
    subLeft: 'CH. ❄',
    subRight: '● COOL',
    palette: {
      body: 'linear-gradient(180deg, #c8d8e8 0%, #8899aa 100%)', border: '#ddeeff',
      tagBg: '#ddeeff', tagColor: '#223344',
      labelBg: '#1a2a3a', labelBorder: '#aabbcc',
      titleColor: '#88ddff', subColor: '#66bbdd',
      innerBg: 'linear-gradient(180deg, #aabbcc 0%, #8899aa 100%)',
      accentDark: '#667788', accentBright: '#88ddff',
    },
  },
  {
    id: 'vcr-magma-deck',
    name: 'Magma Deck',
    category: 'vcr-skin',
    price: 300,
    tag: 'MAGMA',
    title: 'MAGMA DECK',
    subLeft: 'CH. 🔥',
    subRight: '● HOT',
    palette: {
      body: 'linear-gradient(180deg, #3a1010 0%, #1a0505 100%)', border: '#ff3300',
      tagBg: '#ff3300', tagColor: '#fff',
      labelBg: '#1a0505', labelBorder: '#ff3300',
      titleColor: '#ff6633', subColor: '#ff4411',
      innerBg: 'linear-gradient(180deg, #2a0808 0%, #1a0404 100%)',
      accentDark: '#661100', accentBright: '#ff3300',
    },
  },
  {
    id: 'vcr-cyber-punk',
    name: 'Cyber Punk',
    category: 'vcr-skin',
    price: 275,
    tag: 'CYBER',
    title: 'CYBER PUNK',
    subLeft: 'CH. ⚡',
    subRight: '● WIRED',
    palette: {
      body: 'linear-gradient(180deg, #1a0028 0%, #0d0016 100%)', border: '#ff00ff',
      tagBg: 'linear-gradient(90deg, #ff00ff, #00f0ff)', tagColor: '#000',
      labelBg: '#0d0016', labelBorder: '#ff00ff',
      titleColor: '#ff00ff', subColor: '#cc00cc',
      innerBg: 'linear-gradient(180deg, #1a0028 0%, #0d0016 100%)',
      accentDark: '#660066', accentBright: '#ff00ff',
    },
  },
  {
    id: 'vcr-military-ops',
    name: 'Military OPS',
    category: 'vcr-skin',
    price: 150,
    tag: 'MIL-OPS',
    title: 'MILITARY OPS',
    subLeft: 'CH. ★',
    subRight: '● TACTICAL',
    palette: {
      body: 'linear-gradient(180deg, #2a2a1a 0%, #1a1a0d 100%)', border: '#8a8a4a',
      tagBg: '#8a8a4a', tagColor: '#000',
      labelBg: '#0d0d08', labelBorder: '#6a6a3a',
      titleColor: '#aaaa66', subColor: '#888844',
      innerBg: 'linear-gradient(180deg, #22220e 0%, #16160a 100%)',
      accentDark: '#4a4a2a', accentBright: '#aaaa66',
    },
  },
  {
    id: 'vcr-vaporwave',
    name: 'Vaporwave',
    category: 'vcr-skin',
    price: 225,
    tag: 'VAPOR',
    title: 'V A P O R W A V E',
    subLeft: 'CH. 夢',
    subRight: '● AESTHETIC',
    palette: {
      body: 'linear-gradient(180deg, #2a1838 0%, #14081e 100%)', border: '#ee77ff',
      tagBg: 'linear-gradient(90deg, #ee77ff, #77eeff)', tagColor: '#000',
      labelBg: '#14081e', labelBorder: '#cc55dd',
      titleColor: '#ee77ff', subColor: '#cc55dd',
      innerBg: 'linear-gradient(180deg, #1e0e2a 0%, #140820 100%)',
      accentDark: '#882299', accentBright: '#ee77ff',
    },
  },

  // ── Tape labels ───────────────────────────────────────────────────
  {
    id: 'label-classified',
    name: 'Classified',
    category: 'tape-label',
    price: 75,
    tag: 'CLASSIFIED',
    title: 'CLASSIFIED',
    subLeft: '',
    subRight: '',
    sticker: {
      bg: '#ff3333', color: '#fff', border: '#aa0000',
      text: '⛔ CLASSIFIED', sub: 'SECURITY CLEARANCE REQUIRED',
    },
  },
  {
    id: 'label-top-secret',
    name: 'Top Secret',
    category: 'tape-label',
    price: 100,
    tag: 'TOP SECRET',
    title: 'TOP SECRET',
    subLeft: '',
    subRight: '',
    sticker: {
      bg: '#000', color: '#ff0000', border: '#ff0000',
      text: '🔒 TOP SECRET', sub: 'EYES ONLY — DO NOT DUPLICATE',
    },
  },
  {
    id: 'label-home-video',
    name: 'Home Video',
    category: 'tape-label',
    price: 50,
    tag: 'HOME VIDEO',
    title: 'HOME VIDEO',
    subLeft: '',
    subRight: '',
    sticker: {
      bg: '#fff8e0', color: '#5a4a00', border: '#ccaa00',
      text: '🏠 HOME VIDEO', sub: 'FAMILY MEMORIES — DO NOT ERASE',
    },
  },
  {
    id: 'label-directors-cut',
    name: "Director's Cut",
    category: 'tape-label',
    price: 100,
    tag: 'DIRECTORS CUT',
    title: "DIRECTOR'S CUT",
    subLeft: '',
    subRight: '',
    sticker: {
      bg: 'linear-gradient(135deg, #ffd700, #ff8800)', color: '#000', border: '#cc7700',
      text: "🎬 DIRECTOR'S CUT", sub: 'UNRATED — EXTENDED EDITION',
    },
  },
  {
    id: 'label-evidence',
    name: 'Evidence',
    category: 'tape-label',
    price: 75,
    tag: 'EVIDENCE',
    title: 'EVIDENCE',
    subLeft: '',
    subRight: '',
    sticker: {
      bg: '#1a1a2e', color: '#00f0ff', border: '#00f0ff',
      text: '🔍 EVIDENCE', sub: 'CASE FILE #VHS-0042',
    },
  },
  {
    id: 'label-bootleg',
    name: 'Bootleg',
    category: 'tape-label',
    price: 50,
    tag: 'BOOTLEG',
    title: 'BOOTLEG',
    subLeft: '',
    subRight: '',
    sticker: {
      bg: '#222', color: '#00ff66', border: '#00ff66',
      text: '💀 BOOTLEG', sub: 'UNOFFICIAL COPY — NOT FOR RESALE',
    },
  },
];

const EMPTY_EQUIPPED: EquippedCosmetics = {
  'tape-skin': null,
  'vcr-skin': null,
  'tape-label': null,
};

function readOwned(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(OWNED_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function readEquipped(): EquippedCosmetics {
  try {
    const raw = JSON.parse(localStorage.getItem(EQUIPPED_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return { ...EMPTY_EQUIPPED };
    return { ...EMPTY_EQUIPPED, ...raw };
  } catch {
    return { ...EMPTY_EQUIPPED };
  }
}

export function useShop() {
  const [coins, setCoins] = useState(0);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<EquippedCosmetics>(EMPTY_EQUIPPED);

  // Read after mount — touching localStorage during render desyncs the
  // server and client HTML and trips hydration.
  useEffect(() => {
    const storedCoins = parseInt(localStorage.getItem(COINS_KEY) || '0', 10);
    setCoins(Number.isNaN(storedCoins) ? 0 : storedCoins);
    setOwnedItems(readOwned());
    setEquipped(readEquipped());
  }, []);

  const addCoins = useCallback((amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      localStorage.setItem(COINS_KEY, String(next));
      return next;
    });
  }, []);

  const equip = useCallback((itemId: string) => {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item || !readOwned().includes(itemId)) return;

    const next = { ...readEquipped(), [item.category]: itemId };
    localStorage.setItem(EQUIPPED_KEY, JSON.stringify(next));
    setEquipped(next);
  }, []);

  const unequip = useCallback((category: CosmeticCategory) => {
    const next = { ...readEquipped(), [category]: null };
    localStorage.setItem(EQUIPPED_KEY, JSON.stringify(next));
    setEquipped(next);
  }, []);

  const buy = useCallback((itemId: string): boolean => {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;

    // Re-read rather than trusting state: another tab may have spent first.
    const currentOwned = readOwned();
    if (currentOwned.includes(itemId)) return false;

    const currentCoins = parseInt(localStorage.getItem(COINS_KEY) || '0', 10) || 0;
    if (currentCoins < item.price) return false;

    const newOwned = [...currentOwned, itemId];
    localStorage.setItem(COINS_KEY, String(currentCoins - item.price));
    localStorage.setItem(OWNED_KEY, JSON.stringify(newOwned));
    setCoins(currentCoins - item.price);
    setOwnedItems(newOwned);

    // A fresh purchase goes straight into its slot — nothing else to pick.
    const nextEquipped = { ...readEquipped(), [item.category]: itemId };
    localStorage.setItem(EQUIPPED_KEY, JSON.stringify(nextEquipped));
    setEquipped(nextEquipped);
    return true;
  }, []);

  const ownsItem = useCallback((itemId: string) => ownedItems.includes(itemId), [ownedItems]);

  return { coins, ownedItems, equipped, addCoins, buy, equip, unequip, ownsItem, SHOP_ITEMS };
}
