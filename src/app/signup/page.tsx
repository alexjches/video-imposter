'use client';
// src/app/signup/page.tsx

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AVATARS = ['🎮', '👾', '🕵️', '🎭', '🦊', '🐺', '🦁', '🐸', '🤖', '👽', '🧙', '🦄', '🐙', '🦋', '🐲', '🌙'];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
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
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Auto sign in after signup
      await signIn('credentials', { email, password, redirect: false });
      router.push('/dashboard');
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center grid-bg px-4 py-8">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black gradient-text">IMPOSTER</Link>
          <p className="text-zinc-400 mt-2">Create your account</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-6 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" id="signup-form">
            {/* Avatar picker */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Choose your avatar
              </label>
              <div className="grid grid-cols-8 gap-2">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    id={`avatar-${avatar}`}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all
                      ${selectedAvatar === avatar
                        ? 'bg-violet-600 ring-2 ring-violet-400 scale-110'
                        : 'bg-bg-700 hover:bg-bg-600'
                      }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="signup-name">
                Display Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="CoolPlayer99"
                required
                minLength={2}
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              className="btn-primary w-full btn-lg"
              disabled={loading}
            >
              {loading ? 'Creating account...' : '🎮 Create Account'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
