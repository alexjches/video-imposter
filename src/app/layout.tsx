// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';

export const metadata: Metadata = {
  title: 'Imposter — The Video Deception Game',
  description:
    'Watch videos together, spot the imposter. A real-time multiplayer social deduction game inspired by Sidemen Reacts.',
  keywords: ['imposter game', 'sidemen', 'multiplayer', 'social deduction', 'video game'],
  openGraph: {
    title: 'Imposter — The Video Deception Game',
    description: 'Watch videos together, spot the imposter.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
