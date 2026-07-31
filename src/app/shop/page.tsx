'use client';
// src/app/shop/page.tsx — Cosmetics shop
// Layout mirrors #shop-section in vhs-frontend-example/home.html (spec §21).
//
// Coins are still localStorage-only (see useShop). Nothing bought here
// affects a live game yet — applying an equipped skin to the lobby consoles
// and the results cassette is Phase 3, alongside account-bound currency.

import { useState } from 'react';
import Link from 'next/link';
import { useShop, SHOP_ITEMS, COSMETIC_CATEGORIES } from '@/hooks/useShop';
import { CosmeticPreview } from '@/components/shop/CosmeticPreview';
import { CrtShell } from '@/components/vhs/CrtShell';
import type { CosmeticCategory, ShopItem } from '@/types';

// Mirrors the reward split in socketHandlers.ts (section 9).
const EARNINGS = [
  { icon: '🎮', what: 'PLAY A ROUND', amount: '+50' },
  { icon: '🚀', what: 'CREW CATCHES THE SUSPECT', amount: '+75' },
  { icon: '👁️', what: 'SUSPECT SURVIVES', amount: '+100' },
];

export default function ShopPage() {
  const { coins, equipped, buy, equip, ownsItem } = useShop();
  const [tab, setTab] = useState<CosmeticCategory>('tape-skin');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [brokeId, setBrokeId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const items = SHOP_ITEMS.filter((i) => i.category === tab);

  function handleBuy(item: ShopItem) {
    if (ownsItem(item.id)) return;

    if (buy(item.id)) {
      setBuyingId(item.id);
      setNotice(`✅ ${item.name.toUpperCase()} PURCHASED & EQUIPPED`);
      setTimeout(() => {
        setBuyingId(null);
        setNotice(null);
      }, 2500);
    } else {
      setBrokeId(item.id);
      setNotice('❌ NOT ENOUGH REWIND COINS');
      setTimeout(() => {
        setBrokeId(null);
        setNotice(null);
      }, 2000);
    }
  }

  const headerExtra = (
    <div className="coin-balance-display">
      <span className="coin-icon">🪙</span>
      <span className="coin-amount">{coins}</span>
      <span className="coin-label">REWIND COINS</span>
    </div>
  );

  return (
    <CrtShell home badge="SHOP" badgeColor="var(--neon-yellow)" headerExtra={headerExtra}>
      {notice && (
        <div
          className="brutal-card yellow"
          style={{
            position: 'fixed',
            top: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            padding: '10px 20px',
            fontFamily: 'var(--font-brutal)',
            color: '#000',
          }}
        >
          {notice}
        </div>
      )}

      <div>
        <section className="shop-section">
        <div className="shop-header">
          <h2 className="brutal-title" style={{ fontSize: '2.4rem' }}>
            🛒 COSMETICS SHOP
          </h2>
          <p className="osd-text" style={{ color: '#aaa', marginTop: 6 }}>
            Customize your VHS tapes &amp; VCR players
          </p>
        </div>

        {/* How coins are earned — values come from the server's reward split. */}
        <div className="osd-menu" style={{ maxWidth: 560, margin: '0 auto 32px' }}>
          <div className="osd-menu-title">--- Earning Rewind Coins ---</div>
          {EARNINGS.map((e) => (
            <div className="osd-menu-row" key={e.what}>
              <span>
                {e.icon} {e.what}
              </span>
              <span style={{ color: 'var(--neon-yellow)' }}>{e.amount} 🪙</span>
            </div>
          ))}
        </div>

        <div className="shop-tabs">
          {COSMETIC_CATEGORIES.map((c) => (
            <button
              key={c.id}
              id={`category-${c.id}`}
              className={`shop-tab${tab === c.id ? ' active' : ''}`}
              onClick={() => setTab(c.id)}
            >
              <span>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>

        <div className="shop-grid active-grid">
          {items.map((item) => {
            const owned = ownsItem(item.id);
            const isEquipped = equipped[item.category] === item.id;
            const canAfford = coins >= item.price;

            return (
              <div
                key={item.id}
                id={`shop-item-${item.id}`}
                className={`shop-item-card${owned ? ' purchased' : ''}${
                  buyingId === item.id ? ' buying' : ''
                }`}
              >
                <div
                  className={`shop-item-preview${
                    item.category === 'tape-label' ? ' label-preview-wrap' : ''
                  }`}
                >
                  <CosmeticPreview item={item} />
                </div>

                <div className="shop-item-info">
                  <div className="shop-item-name">{item.name}</div>
                  <div className="shop-item-price">
                    <span className="coin-icon">🪙</span> {item.price}
                  </div>
                </div>

                {owned ? (
                  <button
                    className="btn-brutal cyan shop-equip-btn"
                    disabled={isEquipped}
                    onClick={() => equip(item.id)}
                  >
                    {isEquipped ? '✓ EQUIPPED' : 'EQUIP'}
                  </button>
                ) : (
                  <button
                    className={`btn-brutal magenta shop-buy-btn${
                      brokeId === item.id ? ' insufficient' : ''
                    }`}
                    onClick={() => handleBuy(item)}
                    title={canAfford ? undefined : 'Not enough coins'}
                  >
                    BUY
                  </button>
                )}

                <div className="shop-owned-stamp">OWNED ✓</div>
              </div>
            );
          })}
        </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
            <Link href="/dashboard" className="btn-brutal dark">
              ◀ BACK TO LOBBY ROUTER
            </Link>
          </div>
        </section>
      </div>
    </CrtShell>
  );
}
