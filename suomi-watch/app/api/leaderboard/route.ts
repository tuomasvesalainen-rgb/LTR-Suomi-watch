import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { fetchFinnishSkaters } from '@/lib/nhl';
import { scoreMember, type Pick } from '@/lib/scoring';

export async function GET() {
  await ensureSchema();

  const members = await sql`SELECT id, name FROM members ORDER BY created_at`;
  const allPicks = await sql`SELECT member_id, rank, player_id, player_name, player_team FROM picks`;

  let top10: Awaited<ReturnType<typeof fetchFinnishSkaters>> = [];
  try {
    top10 = (await fetchFinnishSkaters()).slice(0, 10);
  } catch {
    top10 = [];
  }

  const leaderboard = (members as any[])
    .map((m) => {
      const picks = (allPicks as any[]).filter((p) => p.member_id === m.id) as Pick[];
      const { score, correct } = scoreMember(picks, top10);
      return { id: m.id, name: m.name, score, correct, pickCount: picks.length };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ leaderboard, top10 });
}
