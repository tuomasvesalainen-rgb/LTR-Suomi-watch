import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql, ensureSchema } from '@/lib/db';
import { generateToken, SESSION_COOKIE } from '@/lib/session';

export async function POST(request: Request) {
  await ensureSchema();
  const { name } = await request.json();

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Enter a name to join.' }, { status: 400 });
  }

  const token = generateToken();
  const rows = await sql`
    INSERT INTO members (name, session_token)
    VALUES (${name.trim()}, ${token})
    RETURNING id, name
  `;

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ member: rows[0] });
}
