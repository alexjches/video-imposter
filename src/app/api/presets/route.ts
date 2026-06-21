// src/app/api/presets/route.ts
// GET /api/presets — list user presets
// POST /api/presets — create preset
// DELETE /api/presets?id=xxx — delete preset

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const presets = await prisma.preset.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(presets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  if (!body.name || !body.normalVideoUrl || !body.imposterVideoUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const preset = await prisma.preset.create({
    data: {
      name: body.name,
      normalVideoUrl: body.normalVideoUrl,
      imposterVideoUrl: body.imposterVideoUrl,
      userId,
    },
  });

  return NextResponse.json(preset, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Ensure the preset belongs to the user
  const preset = await prisma.preset.findFirst({ where: { id, userId } });
  if (!preset) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.preset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
