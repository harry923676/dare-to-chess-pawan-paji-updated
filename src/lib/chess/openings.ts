/** Opening book + recognition. Keys are SAN move sequences from the start. */
interface OpeningEntry {
  moves: string;
  name: string;
  /** book replies (SAN) the engine may choose from */
  replies?: string[];
}

export const OPENINGS: OpeningEntry[] = [
  { moves: "", name: "Starting Position", replies: ["e4", "d4", "c4", "Nf3"] },
  { moves: "e4", name: "King's Pawn Opening", replies: ["e5", "c5", "e6", "c6", "d5", "d6", "g6"] },
  { moves: "d4", name: "Queen's Pawn Opening", replies: ["d5", "Nf6", "f5", "e6"] },
  { moves: "c4", name: "English Opening", replies: ["e5", "Nf6", "c5", "e6"] },
  { moves: "Nf3", name: "Réti Opening", replies: ["d5", "Nf6", "c5"] },
  { moves: "e4 e5", name: "Open Game", replies: ["Nf3", "Bc4", "f4", "Nc3"] },
  { moves: "e4 e5 Nf3", name: "King's Knight Opening", replies: ["Nc6", "Nf6", "d6"] },
  { moves: "e4 e5 Nf3 Nc6", name: "King's Knight Opening", replies: ["Bb5", "Bc4", "d4", "Nc3"] },
  { moves: "e4 e5 Nf3 Nc6 Bb5", name: "Ruy Lopez (Spanish)", replies: ["a6", "Nf6", "Bc5"] },
  { moves: "e4 e5 Nf3 Nc6 Bc4", name: "Italian Game", replies: ["Bc5", "Nf6"] },
  { moves: "e4 e5 Nf3 Nc6 Bc4 Bc5", name: "Giuoco Piano", replies: ["c3", "d3", "O-O"] },
  { moves: "e4 e5 Nf3 Nc6 d4", name: "Scotch Game", replies: ["exd4"] },
  { moves: "e4 e5 f4", name: "King's Gambit", replies: ["exf4", "Bc5", "d5"] },
  { moves: "e4 e5 Nc3", name: "Vienna Game", replies: ["Nf6", "Nc6"] },
  { moves: "e4 c5", name: "Sicilian Defense", replies: ["Nf3", "Nc3", "c3", "d4"] },
  { moves: "e4 c5 Nf3", name: "Sicilian Defense", replies: ["d6", "Nc6", "e6"] },
  { moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3", name: "Sicilian, Open", replies: ["a6", "g6", "Nc6"] },
  { moves: "e4 e6", name: "French Defense", replies: ["d4", "Nc3", "Nd2"] },
  { moves: "e4 e6 d4 d5", name: "French Defense", replies: ["Nc3", "Nd2", "e5", "exd5"] },
  { moves: "e4 c6", name: "Caro-Kann Defense", replies: ["d4", "Nc3", "Nf3"] },
  { moves: "e4 c6 d4 d5", name: "Caro-Kann Defense", replies: ["Nc3", "e5", "exd5"] },
  { moves: "e4 d5", name: "Scandinavian Defense", replies: ["exd5"] },
  { moves: "e4 d6", name: "Pirc Defense", replies: ["d4", "Nf3"] },
  { moves: "e4 g6", name: "Modern Defense", replies: ["d4", "Nc3"] },
  { moves: "e4 Nf6", name: "Alekhine Defense", replies: ["e5", "Nc3"] },
  { moves: "d4 d5", name: "Closed Game", replies: ["c4", "Nf3", "Bf4"] },
  { moves: "d4 d5 c4", name: "Queen's Gambit", replies: ["e6", "c6", "dxc4"] },
  { moves: "d4 d5 c4 e6", name: "Queen's Gambit Declined", replies: ["Nc3", "Nf3"] },
  { moves: "d4 d5 c4 c6", name: "Slav Defense", replies: ["Nf3", "Nc3"] },
  { moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6", name: "Semi-Slav Defense", replies: ["Bg5", "e3"] },
  { moves: "d4 d5 c4 dxc4", name: "Queen's Gambit Accepted", replies: ["Nf3", "e3", "e4"] },
  { moves: "d4 Nf6", name: "Indian Defense", replies: ["c4", "Nf3", "Bg5"] },
  { moves: "d4 Nf6 c4 g6", name: "King's Indian Defense", replies: ["Nc3", "Nf3", "g3"] },
  { moves: "d4 Nf6 c4 g6 Nc3 d5", name: "Grünfeld Defense", replies: ["cxd5", "Nf3", "Bf4"] },
  { moves: "d4 Nf6 c4 e6", name: "Indian Defense", replies: ["Nc3", "Nf3", "g3"] },
  { moves: "d4 Nf6 c4 e6 Nc3 Bb4", name: "Nimzo-Indian Defense", replies: ["e3", "Qc2", "a3"] },
  { moves: "d4 Nf6 c4 e6 Nf3 b6", name: "Queen's Indian Defense", replies: ["g3", "a3", "Nc3"] },
  { moves: "d4 Nf6 c4 c5", name: "Benoni Defense", replies: ["d5", "Nf3"] },
  { moves: "d4 Nf6 c4 c5 d5 b5", name: "Benko Gambit", replies: ["cxb5", "Nf3"] },
  { moves: "d4 f5", name: "Dutch Defense", replies: ["g3", "c4", "Nf3"] },
];

const bookIndex = new Map<string, OpeningEntry>();
for (const entry of OPENINGS) bookIndex.set(entry.moves, entry);

/** Longest known opening name matching the played move list. */
export function identifyOpening(sanMoves: string[]): string | null {
  let best: string | null = null;
  for (let i = Math.min(sanMoves.length, 14); i >= 0; i--) {
    const key = sanMoves.slice(0, i).join(" ");
    const hit = bookIndex.get(key);
    if (hit && hit.moves !== "") return hit.name;
    if (hit && !best) best = hit.name;
  }
  return best;
}

/** Book reply for the current line, or null when out of book. */
export function bookMove(sanMoves: string[], legalSan: string[]): string | null {
  if (sanMoves.length > 12) return null;
  const entry = bookIndex.get(sanMoves.join(" "));
  if (!entry?.replies?.length) return null;
  const candidates = entry.replies.filter((m) => legalSan.includes(m));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}
