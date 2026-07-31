'use client';
// src/components/vhs/CrtShell.tsx
// The VHS/CRT viewport frame every game screen renders inside.
// Markup mirrors #crt-viewport in vhs-frontend-example/index.html — the
// authoritative visual reference (spec section 21).

import { useEffect, useState, type ReactNode } from 'react';

const CRT_PREF_KEY = 'imposter_crt_effect';

interface Props {
  children: ReactNode;
  /** Shown next to the logo, e.g. a room code. */
  badge?: string;
  /** Colour of the badge text. */
  badgeColor?: string;
  /** Right-hand header slot, rendered before the CRT toggle. */
  headerExtra?: ReactNode;
  /** REC dot pulses while true — on during the watch phase. */
  recording?: boolean;
  /**
   * Marketing/console layout (home.html, join-host.html) rather than the
   * in-game `.view-panel` stack: fixed-height scroll area plus a footer.
   */
  home?: boolean;
}

export function CrtShell({
  children,
  badge,
  badgeColor = 'var(--neon-magenta)',
  headerExtra,
  recording = false,
  home = false,
}: Props) {
  // Default the effect on, matching the prototype's `crt-active` markup.
  const [crtOn, setCrtOn] = useState(true);

  // Restore the saved preference after mount. Reading localStorage during
  // render would desync server and client HTML and trip hydration.
  useEffect(() => {
    const stored = localStorage.getItem(CRT_PREF_KEY);
    if (stored !== null) setCrtOn(stored === 'on');
  }, []);

  useEffect(() => {
    localStorage.setItem(CRT_PREF_KEY, crtOn ? 'on' : 'off');
  }, [crtOn]);

  // The shell owns the full viewport, so suppress body scroll while mounted.
  useEffect(() => {
    document.body.classList.add('crt-locked');
    return () => document.body.classList.remove('crt-locked');
  }, []);

  return (
    <div
      id="crt-viewport"
      className={`crt-viewport${crtOn ? ' crt-active' : ''}${home ? ' home-viewport' : ''}`}
    >
      <header>
        <div className="logo-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Tape Suspect" className="site-logo" />
          <h1 className="brutal-title" style={{ fontSize: '2.2rem' }}>
            TAPE SUSPECT
          </h1>
          {badge && (
            <span
              className="osd-text"
              style={{ color: badgeColor, fontWeight: 'bold', marginLeft: 10 }}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="header-controls">
          {headerExtra}
          <button
            id="crt-toggle"
            className="btn-brutal yellow"
            onClick={() => setCrtOn((v) => !v)}
          >
            VHS EFFECT: {crtOn ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      {/* Camcorder HUD overlays */}
      <div className="camcorder-hud">
        <div className="hud-row">
          <div className="rec-indicator osd-text">
            <span className={`rec-dot${recording ? ' active' : ''}`} />
            <span>REC</span>
          </div>
        </div>
        <div className="hud-bracket-tl" />
        <div className="hud-bracket-tr" />
        <div className="hud-bracket-bl" />
        <div className="hud-bracket-br" />
      </div>

      <div className="static-noise" />
      <div className="tracking-line" />

      {home ? (
        <div className="home-scroll-area">
          {children}
          <footer>
            <p>📼 TAPE SUSPECT — © {new Date().getFullYear()} VHS CREW</p>
          </footer>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
