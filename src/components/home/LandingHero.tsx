'use client';
// src/components/home/LandingHero.tsx
// Landing "Access Deck" box — mirrors #hero-section in
// vhs-frontend-example/home.html (spec section 21).

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShop } from '@/hooks/useShop';

const SLIDES = [
  {
    title: '1. INSERT TAPE',
    desc: 'Everyone loads a tape and watches. One of them is formatted differently — that player is the Suspect.',
    graphic: (
      <div
        className="vhs-tape shop-tape-preview"
        style={{
          backgroundColor: '#0d0d1a',
          borderColor: '#00f0ff',
          width: 140,
          margin: '0 auto',
        }}
      >
        <div
          className="tape-tag"
          style={{ background: '#00f0ff', color: '#000', fontSize: '0.6rem' }}
        >
          TAPE_01
        </div>
        <div className="tape-window-panel" style={{ marginTop: 5 }}>
          <div className="spool spinning">
            <div className="spool-gear" />
          </div>
          <div className="spool spinning">
            <div className="spool-gear" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: '2. WATCH THE FEED',
    desc: 'The tape rolls for everyone at once. No pausing, no scrubbing — watch closely.',
    graphic: (
      <div className="crt-mini-screen">
        <div className="rec-icon">● PLAY</div>
        <div className="static-mini" />
        <span className="mini-glitch-text">VIDEO FEED</span>
      </div>
    ),
  },
  {
    title: '3. ONE WORD EACH',
    desc: 'Take turns describing what you saw in a single word. 10 seconds on the clock, then it passes on.',
    graphic: (
      <>
        <div className="chat-mini-bubble">
          <span className="chat-author" style={{ color: 'var(--neon-magenta)' }}>
            Alex:
          </span>{' '}
          &quot;fireworks&quot;
        </div>
        <div className="chat-mini-bubble right">
          <span className="chat-author" style={{ color: 'var(--neon-cyan)' }}>
            Sam:
          </span>{' '}
          &quot;…fireworks?&quot;
        </div>
      </>
    ),
  },
  {
    title: '4. EJECT THE SUSPECT',
    desc: 'Ninety seconds to argue and vote. Catch the Suspect and the crew wins — miss and they walk.',
    graphic: (
      <div className="eject-graphic">
        <div className="eject-button-mini">⏏ EJECT</div>
        <div className="ejecting-mini-tape">📼 SUSPECT_TAPE</div>
      </div>
    ),
  },
];

export function LandingHero() {
  const router = useRouter();
  const { coins } = useShop();
  const [slide, setSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Coins come from localStorage, so hold the SSR value until after mount.
  useEffect(() => setMounted(true), []);

  const go = useCallback((n: number) => {
    setSlide((s) => (s + n + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-advance, but stop the moment the visitor takes control.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  const takeControl = (fn: () => void) => () => {
    setPaused(true);
    fn();
  };

  return (
    <section id="hero-section" className="gartic-hero-section">
      <div className="gartic-container-wrapper">
        <div className="gartic-main-box">
          <div className="gartic-logo-top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Tape Suspect" className="gartic-logo-img" />
          </div>

          <div className="gartic-inner-grid">
            {/* ── Access Deck ─────────────────────────────────── */}
            <div className="gartic-panel play-setup-panel">
              <h3 className="gartic-panel-title">Access Deck</h3>

              <div className="player-setup-intro">
                <p className="intro-heading">INSERT PROFILE CASSETTE</p>
                <p className="intro-sub">
                  Choose your access mode to enter the lobby router.
                </p>
              </div>

              <div className="setup-actions">
                <button
                  id="hero-guest-btn"
                  className="btn-brutal magenta large-brutal-btn"
                  onClick={() => router.push('/dashboard?guest=1')}
                >
                  👤 PLAY AS GUEST
                </button>
                <button
                  id="hero-login-btn"
                  className="btn-brutal cyan large-brutal-btn"
                  onClick={() => router.push('/login')}
                >
                  🔑 SIGN UP / SIGN IN
                </button>
              </div>

              <p className="setup-note osd-text">SYSTEM STATUS: ONLINE</p>
            </div>

            {/* ── How to play ─────────────────────────────────── */}
            <div className="gartic-panel how-to-play-panel">
              <h3 className="gartic-panel-title">How To Play</h3>

              <div className="carousel-container">
                <div className="carousel-track">
                  {SLIDES.map((s, i) => (
                    <div
                      key={s.title}
                      className={`carousel-slide${i === slide ? ' active-slide' : ''}`}
                    >
                      <div className="slide-graphic">{s.graphic}</div>
                      <div className="slide-content">
                        <h4 className="slide-title">{s.title}</h4>
                        <p className="slide-desc">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="carousel-controls">
                  <button
                    className="carousel-arrow prev-arrow"
                    aria-label="Previous slide"
                    onClick={takeControl(() => go(-1))}
                  >
                    ◀
                  </button>
                  <div className="carousel-dots">
                    {SLIDES.map((s, i) => (
                      <span
                        key={s.title}
                        role="button"
                        tabIndex={0}
                        aria-label={`Slide ${i + 1}`}
                        className={`carousel-dot${i === slide ? ' active-dot' : ''}`}
                        onClick={takeControl(() => setSlide(i))}
                        onKeyDown={(e) => e.key === 'Enter' && takeControl(() => setSlide(i))()}
                      />
                    ))}
                  </div>
                  <button
                    className="carousel-arrow next-arrow"
                    aria-label="Next slide"
                    onClick={takeControl(() => go(1))}
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="gartic-box-footer">
            <div className="balance-pill">
              <span className="coin-icon">🪙</span>
              <span className="box-coin-amount">{mounted ? coins : 0}</span>
              <span className="coin-label">REWIND COINS</span>
            </div>
            <button
              id="hero-shop-btn"
              className="scroll-to-shop-link"
              onClick={() => router.push('/shop')}
            >
              <span>🛒</span> ENTER COSMETICS SHOP
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
