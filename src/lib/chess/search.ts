import { Chess, type Move } from "chess.js";
import type { EngineLevel } from "./levels";
import { bookMove } from "./openings";

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-square tables from White's point of view (a8..h1 reading order).
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5,
    10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20,
    -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10,
    0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10,
    5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0,
    -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10,
    -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0,
    0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0,
    5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0,
    0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
    -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
    -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
    10, 30, 20,
  ],
  kEnd: [
    -50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30,
    30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30,
    -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30,
    -30, -50,
  ],
};

const MATE = 100000;

function evaluate(game: Chess, positional: boolean): number {
  const board = game.board();
  let score = 0;
  let material = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r]![f];
      if (!sq) continue;
      const v = VALUE[sq.type]!;
      if (sq.type !== "k") material += v;
      score += sq.color === "w" ? v : -v;
    }
  }
  if (!positional) return score;

  const endgame = material < 2400;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r]![f];
      if (!sq) continue;
      const idx = r * 8 + f;
      const table = sq.type === "k" && endgame ? PST['kEnd']! : PST[sq.type]!;
      const bonus = sq.color === "w" ? table[idx]! : table[(7 - r) * 8 + f]!;
      score += sq.color === "w" ? bonus : -bonus;
    }
  }
  // small mobility term
  const mobility = game.moves().length;
  score += game.turn() === "w" ? mobility * 2 : -mobility * 2;
  return score;
}

function moveScore(m: Move): number {
  let s = 0;
  if (m.captured) s += 10 * VALUE[m.captured]! - VALUE[m.piece]!;
  if (m.promotion) s += VALUE[m.promotion]!;
  if (m.san.includes("+")) s += 50;
  if (m.san.includes("#")) s += 100000;
  return s;
}

function ordered(game: Chess, capturesOnly = false): Move[] {
  const moves = game.moves({ verbose: true }) as Move[];
  const list = capturesOnly ? moves.filter((m) => m.captured || m.promotion) : moves;
  return list.sort((a, b) => moveScore(b) - moveScore(a));
}

interface Ctx {
  deadline: number;
  nodes: number;
  aborted: boolean;
  positional: boolean;
}

function quiesce(game: Chess, alpha: number, beta: number, depth: number, ctx: Ctx): number {
  ctx.nodes++;
  const sign = game.turn() === "w" ? 1 : -1;
  const stand = evaluate(game, ctx.positional) * sign;
  if (depth <= 0) return stand;
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  for (const m of ordered(game, true)) {
    if (Date.now() > ctx.deadline) {
      ctx.aborted = true;
      break;
    }
    game.move(m);
    const score = -quiesce(game, -beta, -alpha, depth - 1, ctx);
    game.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(game: Chess, depth: number, alpha: number, beta: number, ctx: Ctx): number {
  ctx.nodes++;
  if (game.isCheckmate()) return -MATE + (10 - depth);
  if (game.isDraw() || game.isStalemate()) return 0;
  if (depth <= 0) return quiesce(game, alpha, beta, ctxQDepth, ctx);
  for (const m of ordered(game)) {
    if (Date.now() > ctx.deadline) {
      ctx.aborted = true;
      break;
    }
    game.move(m);
    const score = -negamax(game, depth - 1, -beta, -alpha, ctx);
    game.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

let ctxQDepth = 4;

export interface SearchResult {
  san: string;
  evaluation: number;
  depth: number;
  nodes: number;
  fromBook: boolean;
}

export function findBestMove(fen: string, history: string[], level: EngineLevel): SearchResult | null {
  const game = new Chess(fen);
  const legal = game.moves();
  if (!legal.length) return null;

  if (level.useBook) {
    const book = bookMove(history, legal);
    if (book) return { san: book, evaluation: 0, depth: 0, nodes: 0, fromBook: true };
  }

  ctxQDepth = level.quiescence;
  const ctx: Ctx = {
    deadline: Date.now() + level.timeMs,
    nodes: 0,
    aborted: false,
    positional: level.positional,
  };

  const root = ordered(game);
  let scored: { san: string; score: number }[] = [];
  let reachedDepth = 1;

  for (let depth = 1; depth <= level.depth; depth++) {
    const current: { san: string; score: number }[] = [];
    let broke = false;
    for (const m of root) {
      game.move(m);
      const score = -negamax(game, depth - 1, -MATE * 2, MATE * 2, ctx);
      game.undo();
      current.push({ san: m.san, score });
      if (Date.now() > ctx.deadline) {
        broke = true;
        break;
      }
    }
    if (current.length === root.length) {
      scored = current;
      reachedDepth = depth;
    } else if (!scored.length) {
      scored = current;
      reachedDepth = depth;
    }
    if (broke) break;
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!;

  // Level personality: randomise between near-equal moves, and allow
  // deliberate inaccuracies at the lower levels.
  let pick = best;
  const pool = scored.filter((s) => best.score - s.score <= level.randomWindow);
  if (pool.length > 1) pick = pool[Math.floor(Math.random() * pool.length)]!;

  if (level.blunderChance > 0 && Math.random() < level.blunderChance && scored.length > 2) {
    const weaker = scored.slice(1, Math.min(scored.length, 5));
    const candidate = weaker[Math.floor(Math.random() * weaker.length)]!;
    // never throw away a forced mate for the engine
    if (best.score < MATE - 200) pick = candidate;
  }

  return {
    san: pick.san,
    evaluation: Math.round(best.score * (game.turn() === "w" ? 1 : -1)),
    depth: reachedDepth,
    nodes: ctx.nodes,
    fromBook: false,
  };
}
