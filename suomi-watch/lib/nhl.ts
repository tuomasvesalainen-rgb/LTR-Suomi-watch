// Talks to the NHL's public (but unofficial and undocumented) APIs.
// Two different hosts are involved:
//  - api-web.nhle.com          -> team rosters (who's on a team right now,
//                                 including birth country)
//  - api.nhle.com/stats/rest   -> season stats (points, goals, assists)
//
// Rosters exist year-round; stats are empty until the season actually starts.
// The player pool is built from rosters so it's never empty, then stats are
// layered on top (defaulting to 0 for anyone who hasn't played yet).

const SEASON = process.env.NHL_SEASON || '20262027';

// The 32 current NHL team codes. Update this list if the league expands or a
// team relocates/renames (this happened with Arizona -> Utah in 2024).
const TEAM_CODES = [
  'ANA', 'BOS', 'BUF', 'CGY', 'CAR', 'CHI', 'COL', 'CBJ',
  'DAL', 'DET', 'EDM', 'FLA', 'LAK', 'MIN', 'MTL', 'NSH',
  'NJD', 'NYI', 'NYR', 'OTT', 'PHI', 'PIT', 'SJS', 'SEA',
  'STL', 'TBL', 'TOR', 'UTA', 'VAN', 'VGK', 'WSH', 'WPG',
];

export type FinnishSkater = {
  id: number;
  name: string;
  team: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
};

function pickName(field: any): string {
  if (!field) return '';
  return typeof field === 'string' ? field : field.default ?? '';
}

async function fetchTeamRoster(team: string): Promise<{ id: number; name: string; team: string }[]> {
  const res = await fetch(`https://api-web.nhle.com/v1/roster/${team}/current`, {
    next: { revalidate: 21600 }, // 6 hours - rosters don't change minute to minute
  });
  if (!res.ok) return [];
  const json = await res.json();
  const skaters = [...(json.forwards ?? []), ...(json.defensemen ?? [])];
  return skaters
    .filter((p: any) => p.birthCountry === 'FIN')
    .map((p: any) => ({
      id: p.id,
      name: `${pickName(p.firstName)} ${pickName(p.lastName)}`.trim(),
      team,
    }));
}

async function fetchStatsMap() {
  const cayenne = encodeURIComponent(`seasonId=${SEASON} and gameTypeId=2`);
  const url = `https://api.nhle.com/stats/rest/en/skater/summary?isAggregate=false&isGame=false&start=0&limit=-1&cayenneExp=${cayenne}`;
  const map = new Map<number, { gamesPlayed: number; goals: number; assists: number; points: number }>();
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return map;
    const json = await res.json();
    for (const row of json.data ?? []) {
      map.set(row.playerId, {
        gamesPlayed: row.gamesPlayed ?? 0,
        goals: row.goals ?? 0,
        assists: row.assists ?? 0,
        points: row.points ?? 0,
      });
    }
  } catch {
    // Stats genuinely don't exist yet (e.g. before the season starts) -
    // that's fine, everyone below falls back to zeros.
  }
  return map;
}

export async function fetchFinnishSkaters(): Promise<FinnishSkater[]> {
  const rosters = await Promise.all(TEAM_CODES.map((t) => fetchTeamRoster(t).catch(() => [])));
  const players = rosters.flat();

  if (players.length === 0) {
    console.warn(
      'No Finnish players found on any team roster. This usually means the ' +
        'birthCountry field name changed on the NHL side - fetch a single ' +
        'roster (e.g. api-web.nhle.com/v1/roster/FLA/current) and inspect a ' +
        'player object to check.'
    );
  }

  const stats = await fetchStatsMap();

  return players
    .map((p) => {
      const s = stats.get(p.id);
      return {
        id: p.id,
        name: p.name,
        team: p.team,
        gamesPlayed: s?.gamesPlayed ?? 0,
        goals: s?.goals ?? 0,
        assists: s?.assists ?? 0,
        points: s?.points ?? 0,
      };
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}
