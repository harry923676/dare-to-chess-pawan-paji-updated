import type { GameRecord } from "./games";

export interface PlayerStats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgMoves: number;
  avgDuration: number;
  highestLevelBeaten: number;
  bestStreak: number;
  worstStreak: number;
  checkmateWins: number;
  maturity: number;
  band: string;
  tacticalAccuracy: number;
  blundersPerGame: number;
  mistakesPerGame: number;
  inaccuraciesPerGame: number;
}

export const MATURITY_BANDS = [
  { min: 0, label: "Beginner" },
  { min: 20, label: "Developing" },
  { min: 35, label: "Improving" },
  { min: 50, label: "Intermediate" },
  { min: 70, label: "Advanced" },
  { min: 85, label: "Expert" },
];

export function computeStats(games: GameRecord[]): PlayerStats {
  const played = games.length;
  const wins = games.filter((g) => g.result === "win").length;
  const losses = games.filter((g) => g.result === "loss").length;
  const draws = games.filter((g) => g.result === "draw").length;
  const highestLevelBeaten = games
    .filter((g) => g.mode === "computer" && g.result === "win")
    .reduce((max, g) => Math.max(max, g.computerLevel ?? 0), 0);

  let bestStreak = 0;
  let worstStreak = 0;
  let curWin = 0;
  let curLoss = 0;
  for (const g of [...games].reverse()) {
    if (g.result === "win") {
      curWin++;
      curLoss = 0;
    } else if (g.result === "loss") {
      curLoss++;
      curWin = 0;
    } else {
      curWin = 0;
      curLoss = 0;
    }
    bestStreak = Math.max(bestStreak, curWin);
    worstStreak = Math.max(worstStreak, curLoss);
  }

  const sum = (fn: (g: GameRecord) => number) => games.reduce((a, g) => a + fn(g), 0);
  const avg = (fn: (g: GameRecord) => number) => (played ? sum(fn) / played : 0);

  const tacticsTotal = sum((g) => g.tacticsTotal ?? 0);
  const tacticsHit = sum((g) => g.tacticsHit ?? 0);
  const winRate = played ? (wins / played) * 100 : 0;
  const blundersPerGame = avg((g) => g.blunders ?? 0);
  const tacticalAccuracy = tacticsTotal ? (tacticsHit / tacticsTotal) * 100 : 0;

  // Internal progress metric — not an Elo rating.
  const experience = Math.min(20, played * 1.2);
  const levelScore = highestLevelBeaten * 4.5;
  const resultScore = (winRate / 100) * 22;
  const tacticScore = (tacticalAccuracy / 100) * 12;
  const blunderPenalty = Math.min(12, blundersPerGame * 4);
  const maturity = Math.max(
    0,
    Math.min(100, Math.round(experience + levelScore + resultScore + tacticScore - blunderPenalty)),
  );

  const band = [...MATURITY_BANDS].reverse().find((b) => maturity >= b.min)?.label ?? "Beginner";

  return {
    played, wins, losses, draws, winRate,
    avgMoves: avg((g) => g.moveCount),
    avgDuration: avg((g) => g.durationSeconds),
    highestLevelBeaten, bestStreak, worstStreak,
    checkmateWins: games.filter((g) => g.result === "win" && g.termination.includes("Checkmate")).length,
    maturity, band, tacticalAccuracy,
    blundersPerGame,
    mistakesPerGame: avg((g) => g.mistakes ?? 0),
    inaccuraciesPerGame: avg((g) => g.inaccuracies ?? 0),
  };
}
