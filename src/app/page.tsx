// src/app/page.tsx — Landing Page
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden grid-bg">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-3/4 left-1/2 w-60 h-60 bg-rose-500/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }} />
      </div>

      {/* Hero */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto animate-fade-in">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/30 text-violet-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Real-time Multiplayer · Up to 12 Players
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none">
          <span className="gradient-text neon-text-violet">IMPOSTER</span>
        </h1>

        <p className="text-xl md:text-2xl text-zinc-400 mb-4 leading-relaxed">
          Watch a video together. One of you sees something{' '}
          <span className="text-rose-400 font-semibold">completely different.</span>
        </p>
        <p className="text-base md:text-lg text-zinc-500 mb-12 max-w-2xl mx-auto">
          Debate. Deceive. Discover. Can you find the Imposter before they fool everyone?
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/signup"
            id="hero-signup-btn"
            className="btn-primary btn-lg w-full sm:w-auto neon-violet"
          >
            🎮 Create Account
          </Link>
          <Link
            href="/login"
            id="hero-login-btn"
            className="btn-ghost btn-lg w-full sm:w-auto"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard?guest=1"
            id="hero-guest-btn"
            className="btn-ghost btn-lg w-full sm:w-auto text-zinc-400"
          >
            👀 Play as Guest
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 text-left">
          {[
            {
              icon: '🎬',
              title: 'Synced Playback',
              desc: 'Videos start at the exact same time for every player. No pausing, no scrubbing.',
            },
            {
              icon: '🕵️',
              title: 'Secret Identities',
              desc: 'Only one player gets a different video. They must blend in and avoid detection.',
            },
            {
              icon: '🗳️',
              title: 'Live Voting',
              desc: 'Debate, argue, and cast your vote. Live tallies update as votes come in.',
            },
          ].map((f) => (
            <div key={f.title} className="card animate-slide-up">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-zinc-600 text-sm">
        Inspired by Sidemen Reacts: Imposter
      </footer>
    </main>
  );
}
