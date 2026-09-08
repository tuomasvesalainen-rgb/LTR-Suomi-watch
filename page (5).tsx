'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Player = {
  id: number;
  name: string;
  team: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
};
type Pick = { rank: number; player_id: number; player_name: string; player_team: string | null };
type LeaderboardRow = { id: number; name: string; score: number; correct: number; pickCount: number };

const TABS = ['overview', 'players', 'picks', 'leaderboard', 'invite'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  players: 'Players',
  picks: 'Picks',
  leaderboard: 'Leaders',
  invite: 'Invite',
};

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [me, setMe] = useState<{ id: number; name: string } | null>(null);
  const [lockAt, setLockAt] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [picks, setPicks] = useState<(Pick | null)[]>(Array(10).fill(null));
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/me').then((r) => r.json());
      if (!meRes.member) {
        router.push('/join');
        return;
      }
      setMe(meRes.member);
      setLockAt(meRes.lockAt);

      const [playersRes, picksRes, leaderboardRes] = await Promise.all([
        fetch('/api/players').then((r) => r.json()),
        fetch('/api/picks').then((r) => r.json()),
        fetch('/api/leaderboard').then((r) => r.json()),
      ]);

      setPlayers(playersRes.players || []);

      const filled: (Pick | null)[] = Array(10).fill(null);
      (picksRes.picks || []).forEach((p: Pick) => {
        filled[p.rank - 1] = p;
      });
      setPicks(filled);
      setLeaderboard(leaderboardRes.leaderboard || []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLocked = lockAt ? Date.now() > new Date(lockAt).getTime() : false;

  function addPlayerToPicks(player: Player) {
    if (isLocked) return;
    const firstEmpty = picks.findIndex((p) => p === null);
    if (firstEmpty === -1) return;
    const next = [...picks];
    next[firstEmpty] = {
      rank: firstEmpty + 1,
      player_id: player.id,
      player_name: player.name,
      player_team: player.team,
    };
    setPicks(next);
  }

  function removePick(index: number) {
    if (isLocked) return;
    const next = [...picks];
    next[index] = null;
    setPicks(next);
  }

  async function savePicks() {
    setSaveState('saving');
    const payload = picks.filter(Boolean) as Pick[];
    const res = await fetch('/api/picks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ picks: payload }),
    });
    if (res.ok) {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
      const lb = await fetch('/api/leaderboard').then((r) => r.json());
      setLeaderboard(lb.leaderboard || []);
    } else {
      setSaveState('idle');
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Could not save picks.');
    }
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteUrl);
    setCopyState('copied');
    setTimeout(() => setCopyState('idle'), 1500);
  }

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/join` : '';
  const top10 = players.slice(0, 10);
  const myIndex = leaderboard.findIndex((r) => r.id === me?.id);
  const myRow = myIndex >= 0 ? leaderboard[myIndex] : null;

  if (loading) return <main className="loading-screen">Loading…</main>;

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <p className="eyebrow">Suomi Watch</p>
        {me && <p className="signed-in-as">{me.name}</p>}
      </header>

      <nav className="tabs" role="tablist" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'tab active' : 'tab'}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <section className="panel">
          <div className="stat-row">
            <div className="stat-card">
              <p className="stat-label">Your rank</p>
              <p className="stat-value">{myRow ? `${myIndex + 1} of ${leaderboard.length}` : '—'}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Your score</p>
              <p className="stat-value">{myRow ? myRow.score : 0} pts</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Correct picks</p>
              <p className="stat-value">{myRow ? `${myRow.correct} of 10` : '0 of 10'}</p>
            </div>
          </div>

          <div className="two-col">
            <div className="card">
              <h2>Top Finnish scorers</h2>
              {top10.slice(0, 5).map((p, i) => (
                <div className="list-row" key={p.id}>
                  <span>
                    {i + 1}. {p.name} <span className="muted">{p.team}</span>
                  </span>
                  <span className="bold">{p.points}</span>
                </div>
              ))}
              {top10.length === 0 && (
                <p className="muted">No stats yet — check back once the season starts.</p>
              )}
            </div>
            <div className="card">
              <h2>Leaderboard</h2>
              {leaderboard.slice(0, 5).map((r, i) => (
                <div className="list-row" key={r.id}>
                  <span>
                    {i + 1}. {r.id === me?.id ? 'You' : r.name}
                  </span>
                  <span className="bold">{r.score}</span>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="muted">No one's joined yet.</p>}
            </div>
          </div>
        </section>
      )}

      {tab === 'players' && (
        <section className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Team</th>
                <th>GP</th>
                <th>G</th>
                <th>A</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td className="muted">{p.team}</td>
                  <td>{p.gamesPlayed}</td>
                  <td>{p.goals}</td>
                  <td>{p.assists}</td>
                  <td className="bold">{p.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {players.length === 0 && (
            <p className="muted">
              No player data yet. If the season has started and this stays empty, check the
              README's troubleshooting section.
            </p>
          )}
        </section>
      )}

      {tab === 'picks' && (
        <section className="panel">
          <p className="banner">
            Rank your top 10 predicted Finnish points leaders. Exact rank match = 2 pts ·
            anywhere in the top 10 = 1 pt.
            {isLocked && ' Picks are locked for this season.'}
          </p>
          <div className="pick-slots">
            {picks.map((p, i) => (
              <div key={i} className={p ? 'pick-slot filled' : 'pick-slot'}>
                <span className="slot-number">{i + 1}</span>
                {p ? (
                  <>
                    <span className="slot-name">
                      {p.player_name} <span className="muted">{p.player_team}</span>
                    </span>
                    {!isLocked && (
                      <button aria-label="Remove player" onClick={() => removePick(i)}>
                        ×
                      </button>
                    )}
                  </>
                ) : (
                  <span className="slot-placeholder">Empty — add a player below</span>
                )}
              </div>
            ))}
          </div>

          {!isLocked && (
            <>
              <h2>Add a player</h2>
              <div className="player-picker">
                {players.map((p) => (
                  <button
                    key={p.id}
                    className="player-chip"
                    onClick={() => addPlayerToPicks(p)}
                    disabled={picks.some((pick) => pick?.player_id === p.id)}
                  >
                    {p.name} <span className="muted">{p.team}</span>
                  </button>
                ))}
              </div>
              <button className="primary" onClick={savePicks} disabled={saveState === 'saving'}>
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save picks'}
              </button>
            </>
          )}
        </section>
      )}

      {tab === 'leaderboard' && (
        <section className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>Score</th>
                <th>Correct</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r, i) => (
                <tr key={r.id} className={r.id === me?.id ? 'me-row' : ''}>
                  <td>{i + 1}</td>
                  <td>{r.id === me?.id ? 'You' : r.name}</td>
                  <td className="bold">{r.score}</td>
                  <td>{r.correct}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.length === 0 && <p className="muted">No one's joined yet.</p>}
        </section>
      )}

      {tab === 'invite' && (
        <section className="panel">
          <div className="card">
            <h2>Invite link</h2>
            <div className="invite-row">
              <input readOnly value={inviteUrl} />
              <button onClick={copyInviteLink}>{copyState === 'copied' ? 'Copied' : 'Copy link'}</button>
            </div>
            <p className="muted">Anyone with this link can join instantly.</p>
          </div>
          <div className="card">
            <h2>Members ({leaderboard.length})</h2>
            {leaderboard.map((r) => (
              <div className="list-row" key={r.id}>
                <span>{r.id === me?.id ? 'You' : r.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
