# Suomi Watch

Track Finnish-born NHL players' points for the 2026-27 season and run a prediction
pool with friends — real invite link, real accounts, real database, live-ish stats.

## How it works

- **Joining**: no passwords. Share `<your-url>/join` — anyone who opens it and
  types a name becomes a member (tracked with a private session cookie).
- **Players**: pulled server-side from the NHL's public stats API and filtered
  to Finnish-born skaters.
- **Picks**: each member ranks their predicted top 10 Finnish points leaders.
- **Scoring**: exact rank match = 2 pts, anywhere else in the real top 10 = 1 pt,
  outside the top 10 = 0 pts.
- **Leaderboard**: everyone's total score, recomputed live from current stats.

## Deploy it (no local setup needed)

1. Create a free GitHub account if you don't have one, and a new empty repository.
2. Upload this whole folder into that repository (GitHub's "Add file → Upload
   files" page accepts dragging a folder in).
3. Create a free Vercel account and sign in with GitHub.
4. Click "Add New Project" and import the repository you just created.
5. Before or after the first deploy: in the Vercel project, go to
   **Storage → Create Database**, choose a **Postgres** option (Neon is the
   default) — this automatically adds a `DATABASE_URL` environment variable.
6. In **Settings → Environment Variables**, add `PICKS_LOCK_AT` and
   `NHL_SEASON` (copy the values from `.env.example`, or your own dates).
7. Deploy (or redeploy, if step 5 happened after your first deploy).
8. Visit the live URL, type your name to join, then share `<that-url>/join`
   with friends.

## Troubleshooting

- **Players tab stays empty**: the NHL API is public but unofficial and
  undocumented, so field names can change without notice. Open the project's
  Vercel dashboard → your deployment → Functions/Logs, look for the
  `/api/players` request, and check for a console warning about
  `nationalityCode`. Open `lib/nhl.ts` and adjust the field name to match
  whatever the API is actually returning.
- **Picks won't save**: check `PICKS_LOCK_AT` — after that moment, picks lock
  automatically for everyone.
- **You get logged out unexpectedly**: session cookies are tied to this
  browser. Clearing cookies means rejoining at `/join` (your old picks stay
  in the database under your old name if you rejoin with the same name, but
  a brand-new join always starts a fresh member).

## Local development (optional)

Requires Node.js 20+.

```
npm install
npm run dev
```

You still need a real `DATABASE_URL` — create a `.env.local` file and paste
in the connection string from your Vercel project's Storage tab, or create a
free database directly at neon.com.
