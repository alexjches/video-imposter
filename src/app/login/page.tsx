'use client';
// src/app/login/page.tsx
// Access console styled on the identity modal in vhs-frontend-example/home.html.

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CrtShell } from '@/components/vhs/CrtShell';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (result?.error) setError('INVALID EMAIL OR PASSWORD');
    else router.push('/dashboard');
  }

  return (
    <CrtShell home badge="SIGN IN" badgeColor="var(--neon-cyan)">
      <div style={{ display: 'grid', placeItems: 'center', flex: 1, padding: 20 }}>
        <div className="modal-card" style={{ maxWidth: 440 }}>
          <h2 className="brutal-title modal-title">📼 INSERT PROFILE CASSETTE</h2>
          <p className="modal-subtitle">SIGN IN TO YOUR DECK</p>

          {error && (
            <div className="word-phase-banner" style={{ display: 'block', margin: '12px 0' }}>
              ⛔ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form">
            <label className="brutal-label" htmlFor="login-email">
              EMAIL:
            </label>
            <input
              id="login-email"
              type="email"
              className="brutal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <label className="brutal-label" style={{ marginTop: 10 }} htmlFor="login-password">
              PASSWORD:
            </label>
            <input
              id="login-password"
              type="password"
              className="brutal-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            <div className="modal-actions">
              <button
                id="login-submit-btn"
                type="submit"
                className="btn-brutal green large-brutal-btn"
                disabled={loading}
              >
                {loading ? 'READING TAPE…' : 'SIGN IN ⏵'}
              </button>
            </div>
          </form>

          <div
            className="osd-text"
            style={{ textAlign: 'center', color: '#888', margin: '14px 0 10px' }}
          >
            ─── OR ───
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              id="login-google-btn"
              type="button"
              className="btn-brutal cyan"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              CONTINUE WITH GOOGLE
            </button>
            <button
              id="login-discord-btn"
              type="button"
              className="btn-brutal magenta"
              onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
            >
              CONTINUE WITH DISCORD
            </button>
          </div>

          <p className="osd-text" style={{ textAlign: 'center', color: '#aaa', marginTop: 16 }}>
            NO ACCOUNT?{' '}
            <Link href="/signup" style={{ color: 'var(--neon-cyan)' }}>
              FORMAT A NEW ONE
            </Link>
            {' · '}
            <Link href="/" style={{ color: '#888' }}>
              HOME
            </Link>
          </p>
        </div>
      </div>
    </CrtShell>
  );
}
