'use client';
// src/components/shop/CosmeticPreview.tsx
// Renders a cosmetic the way it will look in game. Markup mirrors the shop
// item previews in vhs-frontend-example/home.html — a repainted .vhs-tape,
// .vhs-player, or label sticker.

import type { ShopItem } from '@/types';

function TapePreview({ item }: { item: ShopItem }) {
  const p = item.palette!;
  return (
    <div
      className="vhs-tape shop-tape-preview"
      style={{ background: p.body, borderColor: p.border, boxShadow: `4px 4px 0px ${p.border}` }}
    >
      <div className="tape-tag" style={{ background: p.tagBg, color: p.tagColor }}>
        {item.tag}
      </div>
      <div className="tape-label" style={{ background: p.labelBg, borderColor: p.labelBorder }}>
        <div className="tape-title" style={{ color: p.titleColor, fontSize: '0.85rem' }}>
          {item.title}
        </div>
        <div className="tape-sublabel" style={{ color: p.subColor }}>
          <span>{item.subLeft}</span>
          <span>{item.subRight}</span>
        </div>
      </div>
      <div className="tape-window-panel" style={{ background: p.innerBg, borderColor: p.border }}>
        {[0, 1].map((i) => (
          <div key={i} className="spool" style={{ background: p.accentDark, borderColor: p.border }}>
            <div className="spool-gear" style={{ background: p.accentBright }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function VcrPreview({ item }: { item: ShopItem }) {
  const p = item.palette!;
  return (
    <div
      className="vhs-player shop-vcr-preview ready"
      style={{
        backgroundImage: p.body,
        borderColor: p.border,
        boxShadow: `4px 4px 0px ${p.border}`,
      }}
    >
      <div className="player-tag" style={{ background: p.tagBg, color: p.tagColor }}>
        {item.tag}
      </div>
      <div className="player-display" style={{ background: p.labelBg, borderColor: p.labelBorder }}>
        <div
          className="player-display-text"
          style={{ color: p.titleColor, textShadow: `0 0 4px ${p.titleColor}` }}
        >
          {item.title}
        </div>
        <div className="player-display-status" style={{ color: p.subColor }}>
          <span>{item.subLeft}</span>
          <span>{item.subRight}</span>
        </div>
      </div>
      <div className="player-vcr-slot" style={{ borderColor: p.accentDark }}>
        <div
          className="player-vcr-door-flap"
          style={{ background: p.innerBg, borderColor: p.accentDark }}
        />
      </div>
      <div className="player-controls">
        <div
          className="player-led active"
          style={{ backgroundColor: p.accentBright, boxShadow: `0 0 6px ${p.accentBright}` }}
        />
        <div className="vcr-btns">
          {[0, 1, 2].map((i) => (
            <div key={i} className="vcr-btn" style={{ background: p.accentDark }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LabelPreview({ item }: { item: ShopItem }) {
  const s = item.sticker!;
  return (
    <div className="label-preview-card">
      <div
        className="label-preview-sticker"
        style={{ background: s.bg, color: s.color, borderColor: s.border }}
      >
        <div className="label-stamp-text">{s.text}</div>
        <div className="label-stamp-sub">{s.sub}</div>
      </div>
    </div>
  );
}

export function CosmeticPreview({ item }: { item: ShopItem }) {
  if (item.category === 'tape-label') return <LabelPreview item={item} />;
  if (item.category === 'vcr-skin') return <VcrPreview item={item} />;
  return <TapePreview item={item} />;
}
