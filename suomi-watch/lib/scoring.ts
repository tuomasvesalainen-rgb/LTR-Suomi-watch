import type { FinnishSkater } from './nhl';

export type Pick = {
  rank: number;
  player_id: number;
  player_name: string;
  player_team: string | null;
};

// Exact predicted rank match = 2 pts. Anywhere else in the real top 10 = 1 pt.
// Outside the top 10 entirely = 0 pts.
export function scoreMember(picks: Pick[], top10: FinnishSkater[]) {
  const actualRank = new Map(top10.map((p, i) => [p.id, i + 1]));
  let score = 0;
  let correct = 0;

  const breakdown = picks.map((pick) => {
    const rank = actualRank.get(pick.player_id);
    let points = 0;
    if (rank) {
      correct += 1;
      points = rank === pick.rank ? 2 : 1;
    }
    score += points;
    return { ...pick, actualRank: rank ?? null, points };
  });

  return { score, correct, breakdown };
}
