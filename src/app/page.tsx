// src/app/page.tsx — Landing page ("Access Deck")
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CrtShell } from '@/components/vhs/CrtShell';
import { LandingHero } from '@/components/home/LandingHero';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <CrtShell home badge="HOME" recording>
      <LandingHero />
    </CrtShell>
  );
}
