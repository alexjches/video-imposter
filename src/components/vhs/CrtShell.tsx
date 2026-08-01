'use client';
// src/components/vhs/CrtShell.tsx
// The VHS/CRT viewport frame every game screen renders inside.
// Markup mirrors #crt-viewport in vhs-frontend-example/index.html — the
// authoritative visual reference (spec section 21).

import { useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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

  // Where the header logo goes. /dashboard gates on `?guest=1` alone — a
  // saved guest identity in localStorage is not enough — so a bare
  // /dashboard link bounces straight back to / for anyone without an
  // account. Resolve to a destination that is actually reachable:
  //   signed in            → /dashboard
  //   saved guest identity → /dashboard?guest=1
  //   neither              → /, which is where /dashboard would send them
  //                          anyway, minus the redirect flash.
  const { status } = useSession();
  const [hasGuestIdentity, setHasGuestIdentity] = useState(false);

  // Read after mount for the same reason as the CRT preference below:
  // touching localStorage during render desyncs server and client HTML.
  useEffect(() => {
    setHasGuestIdentity(localStorage.getItem('imposter_guest_name') !== null);
  }, []);

  const logoHref =
    status === 'authenticated'
      ? '/dashboard'
      : hasGuestIdentity
        ? '/dashboard?guest=1'
        : '/';

  // Restore the saved preference after mount. Reading localStorage during
  // render would desync server and client HTML and trip hydration.
  useEffect(() => {
    const stored = localStorage.getItem(CRT_PREF_KEY);
    if (stored !== null) setCrtOn(stored === 'on');
  }, []);

  useEffect(() => {
    localStorage.setItem(CRT_PREF_KEY, crtOn ? 'on' : 'off');
  }, [crtOn]);

  return (
    <div
      id="crt-viewport"
      className={`crt-viewport${crtOn ? ' crt-active' : ''}${home ? ' home-viewport' : ''}`}
    >
      <header>
        <div className="logo-container">
          {/* Clickable only on the marketing/console routes. In-game the
              logo is inert: player identity is socket.id with no rejoin
              path, so navigating away mid-round drops you from the game for
              good. LEAVE is the deliberate exit; the logo must not be a
              second, unlabelled one sitting beside the room code.
              The badge stays outside the link either way — it's a room code
              or page label, not part of the home affordance. */}
          {home ? (
            <Link
              href={logoHref}
              className="logo-home-link"
              aria-label="Tape Suspect — go to lobby router"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Tape Suspect" className="site-logo" />
              <h1 className="brutal-title" style={{ fontSize: '2.2rem' }}>
                TAPE SUSPECT
              </h1>
            </Link>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Tape Suspect" className="site-logo" />
              <h1 className="brutal-title" style={{ fontSize: '2.2rem' }}>
                TAPE SUSPECT
              </h1>
            </>
          )}
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
