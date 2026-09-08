import { NextResponse } from 'next/server';
import { getCurrentMember } from '@/lib/session';

export async function GET() {
  const member = await getCurrentMember();
  return NextResponse.json({
    member,
    lockAt: process.env.PICKS_LOCK_AT || null,
  });
}
