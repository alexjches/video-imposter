'use client';
// src/app/signup/page.tsx
// Account creation, styled on the identity modal in
// vhs-frontend-example/home.html.

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AVATARS } from '@/lib/avatars';
import { CrtShell } from '@/components/vhs/CrtShell';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The server vets `avatar` against the allowed set before storing it.
        body: JSON.stringify({ name, email, password, avatar: selectedAvatar }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError((data.error || 'SIGNUP FAILED').toUpperCase());
        setLoading(false);
        return;
      }

      await signIn('credentials', { email, password, redirect: false });
      router.push('/dashboard');
    } catch {
      setError('SOMETHING WENT WRONG');
      setLoading(false);
    }
  }

  return (
    <CrtShell home badge="SIGN UP" badgeColor="var(--neon-green)">
      <div style={{ display: 'grid', placeItems: 'center', flex: 1, padding: 20 }}>
        <div className="modal-card" style={{ maxWidth: 460 }}>
          <h2 className="brutal-title modal-title">📼 FORMAT NEW PROFILE</h2>
          <p className="modal-subtitle">CHOOSE A CHARACTER AND A NICKNAME</p>

          {error && (
            <div className="word-phase-banner" style={{ display: 'block', margin: '12px 0' }}>
              ⛔ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="signup-form">
            <label className="brutal-label">CHARACTER:</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: 6,
                margin: '6px 0 12px',
              }}
            >
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  id={`avatar-${avatar}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  aria-pressed={selectedAvatar === avatar}
                  style={{
                    aspectRatio: '1',
                    fontSize: '1.2rem',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: '2px solid #000',
                    background:
                      selectedAvatar === avatar ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)',
                    boxShadow: selectedAvatar === avatar ? '2px 2px 0px #000' : 'none',
                    transform: selectedAvatar === avatar ? 'scale(1.08)' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {avatar}
                </button>
              ))}
            </div>

            <label className="brutal-label" htmlFor="signup-name">
              NICKNAME:
            </label>
            <input
              id="signup-name"
              type="text"
              className="brutal-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CoolNickname2774"
              required
              minLength={2}
              maxLength={20}
            />

            <label className="brutal-label" style={{ marginTop: 10 }} htmlFor="signup-email">
              EMAIL:
            </label>
            <input
              id="signup-email"
              type="email"
              className="brutal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <label className="brutal-label" style={{ marginTop: 10 }} htmlFor="signup-password">
              PASSWORD:
            </label>
            <input
              id="signup-password"
              type="password"
              className="brutal-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />

            <div className="modal-actions">
              <button
                id="signup-submit-btn"
                type="submit"
                className="btn-brutal green large-brutal-btn"
                disabled={loading}
              >
                {loading ? 'FORMATTING…' : 'START PLAYING ⏵'}
              </button>
            </div>
          </form>

          <p className="osd-text" style={{ textAlign: 'center', color: 'var(--ink-soft)', marginTop: 14 }}>
            ALREADY HAVE A TAPE?{' '}
            <Link href="/login" style={{ color: 'var(--link-warm)' }}>
              SIGN IN
            </Link>
            {' · '}
            <Link href="/" style={{ color: 'var(--ink-soft)' }}>
              HOME
            </Link>
          </p>
        </div>
      </div>
    </CrtShell>
  );
}
