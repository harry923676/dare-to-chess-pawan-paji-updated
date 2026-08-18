export interface EngineLevel {
  id: number;
  name: string;
  strength: string;
  description: string;
  /** nominal search depth in plies */
  depth: number;
  /** hard time budget per move (ms) */
  timeMs: number;
  /** quiescence search depth */
  quiescence: number;
  /** probability of deliberately choosing a weaker move */
  blunderChance: number;
  /** centipawn window used to randomise between similar moves */
  randomWindow: number;
  /** use the opening book */
  useBook: boolean;
  /** include positional (piece-square / structure) terms */
  positional: boolean;
}

export const LEVELS: EngineLevel[] = [
  {
    id: 1, name: "Beginner", strength: "~400", depth: 1, timeMs: 300, quiescence: 0,
    blunderChance: 0.45, randomWindow: 220, useBook: false, positional: false,
    description: "Perfect for learning the fundamentals.",
  },
  {
    id: 2, name: "Easy", strength: "~700", depth: 2, timeMs: 400, quiescence: 0,
    blunderChance: 0.3, randomWindow: 160, useBook: false, positional: false,
    description: "An enjoyable opponent for casual games.",
  },
  {
    id: 3, name: "Casual", strength: "~1000", depth: 2, timeMs: 600, quiescence: 2,
    blunderChance: 0.18, randomWindow: 110, useBook: true, positional: true,
    description: "Plays sensibly but forgives your mistakes.",
  },
  {
    id: 4, name: "Intermediate", strength: "~1250", depth: 3, timeMs: 900, quiescence: 3,
    blunderChance: 0.1, randomWindow: 70, useBook: true, positional: true,
    description: "Tests your tactics and positional understanding.",
  },
  {
    id: 5, name: "Advanced", strength: "~1500", depth: 3, timeMs: 1400, quiescence: 4,
    blunderChance: 0.05, randomWindow: 40, useBook: true, positional: true,
    description: "Expect strong tactical and positional play.",
  },
  {
    id: 6, name: "Expert", strength: "~1750", depth: 4, timeMs: 2200, quiescence: 5,
    blunderChance: 0.02, randomWindow: 20, useBook: true, positional: true,
    description: "For experienced chess players.",
  },
  {
    id: 7, name: "Master", strength: "~1950", depth: 5, timeMs: 3200, quiescence: 6,
    blunderChance: 0, randomWindow: 8, useBook: true, positional: true,
    description: "A serious chess challenge.",
  },
  {
    id: 8, name: "Grandmaster", strength: "~2150", depth: 6, timeMs: 5000, quiescence: 6,
    blunderChance: 0, randomWindow: 0, useBook: true, positional: true,
    description: "Full engine strength. No mercy, no artificial mistakes.",
  },
];

export const getLevel = (id: number): EngineLevel =>
  LEVELS.find((l) => l.id === id) ?? LEVELS[3]!;
