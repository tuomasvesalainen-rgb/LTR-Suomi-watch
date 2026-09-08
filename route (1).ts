import { NextResponse } from 'next/server';
import { fetchFinnishSkaters } from '@/lib/nhl';

export async function GET() {
  try {
    const players = await fetchFinnishSkaters();
    return NextResponse.json({ players });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, players: [] }, { status: 502 });
  }
}
