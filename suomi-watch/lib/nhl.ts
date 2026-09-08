// Talks to the NHL's public (but unofficial and undocumented) stats API.
// If the Players tab ever comes back empty, this is the first file to check -
// the field names below (especially nationalityCode) are the most likely thing
// to have changed. Log `rows[0]` to see the raw shape the API is returning.

const SEASON = process.env.NHL_SEASON || '20262027';

export type FinnishSkater = {
  id: number;
  name: string;
  team: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
};

export async function fetchFinnishSkaters(): Promise<FinnishSkater[]> {
  const cayenne = encodeURIComponent(`seasonId=${SEASON} and gameTypeId=2`);
  const url = `https://api.nhle.com/stats/rest/en/skater/summary?isAggregate=false&isGame=false&start=0&limit=-1&cayenneExp=${cayenne}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`NHL stats request failed with status ${res.status}`);
  }

  const json = await res.json();
  const rows: any[] = json.data ?? [];

  const finnish = rows.filter((row) => row.nationalityCode === 'FIN');

  if (finnish.length === 0 && rows.length > 0) {
    console.warn(
      'No players matched nationalityCode "FIN". Sample row from the API, for debugging:',
      rows[0]
    );
  }

  return finnish
    .map((row) => ({
      id: row.playerId,
      name: row.skaterFullName,
      team: Array.isArray(row.teamAbbrevs) ? row.teamAbbrevs.join('/') : row.teamAbbrevs,
      gamesPlayed: row.gamesPlayed,
      goals: row.goals,
      assists: row.assists,
      points: row.points,
    }))
    .sort((a, b) => b.points - a.points);
}
