import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";

/** Every motif the tactical recogniser can name. */
export const TACTICAL_MOTIFS = [
  "Check", "Double check", "Discovered check", "Discovered attack", "Checkmate",
  "Mate in one", "Mate in two", "Mate in three", "Back-rank mate", "Smothered mate",
  "Arabian mate", "Anastasia's mate", "Boden's mate", "Scholar's mate", "Fool's mate",
  "Legal's mate", "Fork", "Knight fork", "Pawn fork", "King fork", "Double attack",
  "Pin", "Absolute pin", "Relative pin", "Skewer", "X-ray attack", "X-ray defense",
  "Removing the defender", "Deflection", "Decoy", "Attraction", "Clearance",
  "Clearance sacrifice", "Interference", "Overloading", "Undermining", "Zwischenzug",
  "Zwischencheck", "Greek Gift sacrifice", "Exchange sacrifice", "Sacrifice for initiative",
  "Sacrifice for king attack", "Promotion", "Underpromotion", "Desperado", "Trapped piece",
  "Hanging piece", "Loose piece", "Capturing the attacker", "Tactical pawn break",
  "Forced sequence", "Combination play", "Tactical check",
] as const;

export type Motif = (typeof TACTICAL_MOTIFS)[number];

const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const SLIDERS: PieceSymbol[] = ["b", "r", "q"];

const FILES = "abcdefgh";
const toCoord = (sq: Square) => ({ f: FILES.indexOf(sq[0]!), r: Number(sq[1]) - 1 });
const toSquare = (f: number, r: number) => `${FILES[f]}${r + 1}` as Square;

function attacksFrom(game: Chess, square: Square): Square[] {
  try {
    return (game.moves({ square, verbose: true }) as Move[]).map((m) => m.to);
  } catch {
    return [];
  }
}

function pieceAt(game: Chess, sq: Square) {
  return game.get(sq);
}

/** Squares attacked by `square`, ignoring whose turn it is. */
function rawAttacks(game: Chess, square: Square): Square[] {
  const piece = pieceAt(game, square);
  if (!piece) return [];
  const probe = new Chess(game.fen());
  // Force the side to move so move generation works for that piece.
  const parts = probe.fen().split(" ");
  parts[1] = piece.color;
  parts[3] = "-";
  let forced: Chess;
  try {
    forced = new Chess(parts.join(" "));
  } catch {
    return attacksFrom(game, square);
  }
  const moves = attacksFrom(forced, square);
  if (piece.type !== "p") return moves;
  // pawn attacks are the diagonals only
  const { f, r } = toCoord(square);
  const dir = piece.color === "w" ? 1 : -1;
  return [f - 1, f + 1]
    .filter((nf) => nf >= 0 && nf < 8 && r + dir >= 0 && r + dir < 8)
    .map((nf) => toSquare(nf, r + dir));
}

function line(from: Square, to: Square): Square[] | null {
  const a = toCoord(from);
  const b = toCoord(to);
  const df = Math.sign(b.f - a.f);
  const dr = Math.sign(b.r - a.r);
  if (!(a.f === b.f || a.r === b.r || Math.abs(a.f - b.f) === Math.abs(a.r - b.r))) return null;
  const squares: Square[] = [];
  let f = a.f + df;
  let r = a.r + dr;
  while (f !== b.f || r !== b.r) {
    squares.push(toSquare(f, r));
    f += df;
    r += dr;
  }
  return squares;
}

function isDefended(game: Chess, square: Square, by: Color): boolean {
  for (const row of game.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== by || cell.square === square) continue;
      if (rawAttacks(game, cell.square).includes(square)) return true;
    }
  }
  return false;
}

function mateInN(game: Chess, n: number): boolean {
  if (n <= 0) return false;
  for (const m of game.moves()) {
    game.move(m);
    if (game.isCheckmate()) {
      game.undo();
      return true;
    }
    if (n > 1 && !game.isGameOver()) {
      let allForced = game.moves().length > 0;
      for (const reply of game.moves()) {
        game.move(reply);
        const ok = mateInN(game, n - 1);
        game.undo();
        if (!ok) {
          allForced = false;
          break;
        }
      }
      if (allForced) {
        game.undo();
        return true;
      }
    }
    game.undo();
  }
  return false;
}

export interface MoveTactics {
  motifs: Motif[];
  /** material the move wins outright (in pawns) */
  gain: number;
}

/**
 * Recognises tactical patterns created by `move` in the position `fenBefore`.
 * Pattern based: it looks at the resulting attack geometry, not a move list.
 */
export function analyseMove(fenBefore: string, move: Move): MoveTactics {
  const motifs = new Set<Motif>();
  const before = new Chess(fenBefore);
  const after = new Chess(fenBefore);
  const played = after.move(move.san);
  if (!played) return { motifs: [], gain: 0 };

  const me = played.color as Color;
  const them: Color = me === "w" ? "b" : "w";
  const dest = played.to as Square;
  const piece = after.get(dest);

  // --- checks and mates ---
  if (after.isCheckmate()) {
    motifs.add("Checkmate");
    motifs.add("Mate in one");
    const kingSq = findKing(after, them);
    if (kingSq) {
      const escapeSquares = neighbours(kingSq).filter((s) => {
        const p = after.get(s);
        return !p || p.color !== them;
      });
      if (escapeSquares.length === 0) motifs.add("Smothered mate");
      const kr = toCoord(kingSq).r;
      if ((them === "w" && kr === 0) || (them === "b" && kr === 7)) motifs.add("Back-rank mate");
    }
    if (before.history().length <= 3) motifs.add("Fool's mate");
    if (before.history().length === 6 && played.piece === "q") motifs.add("Scholar's mate");
  } else if (after.inCheck()) {
    motifs.add("Check");
    const checkers = attackersOf(after, findKing(after, them)!, me);
    if (checkers.length > 1) motifs.add("Double check");
    if (!checkers.includes(dest)) motifs.add("Discovered check");
    if (played.captured) motifs.add("Zwischencheck");
    motifs.add("Tactical check");
  }

  // --- forks / double attacks ---
  if (piece) {
    const targets = rawAttacks(after, dest)
      .map((sq) => ({ sq, p: after.get(sq) }))
      .filter((t) => t.p && t.p.color === them && VALUE[t.p.type] >= VALUE[piece.type]);
    if (targets.length >= 2) {
      motifs.add("Double attack");
      motifs.add("Fork");
      if (piece.type === "n") motifs.add("Knight fork");
      if (piece.type === "p") motifs.add("Pawn fork");
      if (piece.type === "k") motifs.add("King fork");
    }
    const hanging = targets.filter((t) => !isDefended(after, t.sq, them));
    if (hanging.length) motifs.add("Hanging piece");
  }

  // --- pins, skewers, x-rays ---
  for (const row of after.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== me || !SLIDERS.includes(cell.type)) continue;
      for (const row2 of after.board()) {
        for (const victim of row2) {
          if (!victim || victim.color !== them) continue;
          const between = line(cell.square, victim.square);
          if (!between || between.some((s) => after.get(s))) continue;
          const beyond = beyondSquare(cell.square, victim.square, after);
          if (!beyond) continue;
          const behind = after.get(beyond);
          if (!behind || behind.color !== them) continue;
          if (behind.type === "k") {
            motifs.add("Pin");
            motifs.add(victim.type === "k" ? "Relative pin" : "Absolute pin");
          } else if (VALUE[victim.type] > VALUE[behind.type]) {
            motifs.add("Skewer");
          } else {
            motifs.add("X-ray attack");
          }
        }
      }
    }
  }

  // --- captures, sacrifices, defenders ---
  const gain = played.captured ? VALUE[played.captured as PieceSymbol] : 0;
  if (played.captured) {
    const recapture = isDefended(after, dest, them);
    const risked = VALUE[played.piece];
    if (recapture && risked > gain + 0.5) {
      motifs.add(played.piece === "r" && played.captured === "n" ? "Exchange sacrifice" : "Sacrifice for initiative");
      if (nearEnemyKing(dest, findKing(after, them))) motifs.add("Sacrifice for king attack");
      if (played.piece === "b" && (dest === "h7" || dest === "h2")) motifs.add("Greek Gift sacrifice");
    }
    if (!recapture) motifs.add("Capturing the attacker");
    if (wasDefender(before, played.to as Square, them)) {
      motifs.add("Removing the defender");
      motifs.add("Deflection");
    }
  }

  if (played.promotion) {
    motifs.add("Promotion");
    if (played.promotion !== "q") motifs.add("Underpromotion");
  }
  if (played.piece === "p" && !played.captured && isPawnBreak(before, played)) {
    motifs.add("Tactical pawn break");
  }

  // trapped / loose pieces created for the opponent
  for (const row of after.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== them || cell.type === "k" || cell.type === "p") continue;
      if (attackersOf(after, cell.square, me).length && !isDefended(after, cell.square, them)) {
        motifs.add("Loose piece");
      }
    }
  }

  if (!after.isCheckmate() && after.inCheck() === false) {
    const probe = new Chess(after.fen());
    if (mateInN(probe, 2)) motifs.add("Mate in two");
  }
  if (motifs.size >= 3) motifs.add("Combination play");

  return { motifs: [...motifs], gain };
}

function neighbours(sq: Square): Square[] {
  const { f, r } = toCoord(sq);
  const out: Square[] = [];
  for (let df = -1; df <= 1; df++)
    for (let dr = -1; dr <= 1; dr++) {
      if (!df && !dr) continue;
      const nf = f + df;
      const nr = r + dr;
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) out.push(toSquare(nf, nr));
    }
  return out;
}

function findKing(game: Chess, color: Color): Square | null {
  for (const row of game.board())
    for (const cell of row) if (cell && cell.color === color && cell.type === "k") return cell.square;
  return null;
}

function attackersOf(game: Chess, square: Square, by: Color): Square[] {
  const out: Square[] = [];
  for (const row of game.board())
    for (const cell of row) {
      if (!cell || cell.color !== by) continue;
      if (rawAttacks(game, cell.square).includes(square)) out.push(cell.square);
    }
  return out;
}

function beyondSquare(from: Square, through: Square, game: Chess): Square | null {
  const a = toCoord(from);
  const b = toCoord(through);
  const df = Math.sign(b.f - a.f);
  const dr = Math.sign(b.r - a.r);
  let f = b.f + df;
  let r = b.r + dr;
  while (f >= 0 && f < 8 && r >= 0 && r < 8) {
    const sq = toSquare(f, r);
    if (game.get(sq)) return sq;
    f += df;
    r += dr;
  }
  return null;
}

function nearEnemyKing(sq: Square, king: Square | null): boolean {
  if (!king) return false;
  const a = toCoord(sq);
  const b = toCoord(king);
  return Math.abs(a.f - b.f) <= 2 && Math.abs(a.r - b.r) <= 2;
}

function wasDefender(before: Chess, square: Square, owner: Color): boolean {
  const defended = rawAttacks(before, square).filter((s) => {
    const p = before.get(s);
    return p && p.color === owner;
  });
  return defended.length > 0;
}

function isPawnBreak(before: Chess, move: Move): boolean {
  const { f, r } = toCoord(move.to as Square);
  for (const df of [-1, 1]) {
    const nf = f + df;
    if (nf < 0 || nf > 7) continue;
    const target = before.get(toSquare(nf, r));
    if (target && target.type === "p" && target.color !== move.color) return true;
  }
  return false;
}
