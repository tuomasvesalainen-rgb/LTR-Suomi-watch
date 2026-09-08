import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

let schemaReady: Promise<void> | null = null;

// Creates the tables the first time anything touches the database.
// Safe to call on every request - IF NOT EXISTS makes it a no-op after the first run.
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS members (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          session_token TEXT UNIQUE NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS picks (
          member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
          rank INTEGER NOT NULL,
          player_id INTEGER NOT NULL,
          player_name TEXT NOT NULL,
          player_team TEXT,
          PRIMARY KEY (member_id, rank)
        )
      `;
    })();
  }
  return schemaReady;
}
