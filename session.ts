import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { sql, ensureSchema } from './db';

export const SESSION_COOKIE = 'sw_session';

export function generateToken() {
  return randomBytes(24).toString('hex');
}

// Reads the session cookie and looks up the matching member.
// Returns null if there's no cookie or it doesn't match anyone (e.g. cleared cookies).
export async function getCurrentMember() {
  await ensureSchema();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await sql`SELECT id, name FROM members WHERE session_token = ${token}`;
  return (rows[0] as { id: number; name: string } | undefined) ?? null;
}
