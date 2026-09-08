import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: 'Not joined' }, { status: 401 });

  const rows = await sql`
    SELECT rank, player_id, player_name, player_team
    FROM picks WHERE member_id = ${member.id}
    ORDER BY rank
  `;
  return NextResponse.json({ picks: rows });
}

export async function POST(request: Request) {
  await ensureSchema();
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: 'Not joined' }, { status: 401 });

  const lockAt = process.env.PICKS_LOCK_AT;
  if (lockAt && Date.now() > new Date(lockAt).getTime()) {
    return NextResponse.json({ error: 'Picks are locked for this season.' }, { status: 403 });
  }

  const { picks } = await request.json();
  if (!Array.isArray(picks) || picks.length > 10) {
    return NextResponse.json({ error: 'Send at most 10 picks.' }, { status: 400 });
  }

  await sql`DELETE FROM picks WHERE member_id = ${member.id}`;
  for (const p of picks) {
    await sql`
      INSERT INTO picks (member_id, rank, player_id, player_name, player_team)
      VALUES (${member.id}, ${p.rank}, ${p.player_id}, ${p.player_name}, ${p.player_team ?? null})
    `;
  }

  return NextResponse.json({ ok: true });
}
