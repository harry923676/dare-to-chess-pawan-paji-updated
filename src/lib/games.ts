import { supabase } from "@/integrations/supabase/client";

export type GameMode = "computer" | "local";
export type GameResult = "win" | "loss" | "draw";

export interface GameRecord {
  id: string;
  mode: GameMode;
  computerLevel: number | null;
  playerColor: "w" | "b" | null;
  whiteName: string;
  blackName: string;
  /** result from the perspective of the device owner */
  result: GameResult;
  termination: string;
  moveCount: number;
  durationSeconds: number;
  opening: string | null;
  pgn: string;
  finalFen: string | null;
  playedAt: string;
  blunders?: number;
  mistakes?: number;
  inaccuracies?: number;
  tacticsHit?: number;
  tacticsTotal?: number;
}

export interface SavedGame {
  mode: GameMode;
  level: number;
  playerColor: "w" | "b";
  fen: string;
  pgn: string;
  whiteName: string;
  blackName: string;
  elapsedSeconds: number;
  clockWhite: number | null;
  clockBlack: number | null;
  savedAt: string;
}

const GAMES_KEY = "dtc.games";
const SAVED_KEY = "dtc.saved";

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function listGames(): GameRecord[] {
  return read<GameRecord[]>(GAMES_KEY, []).sort((a, b) => b.playedAt.localeCompare(a.playedAt));
}

export function getGame(id: string): GameRecord | undefined {
  return listGames().find((g) => g.id === id);
}

export function writeGames(games: GameRecord[]) {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
}

export async function saveGame(record: GameRecord) {
  const games = listGames().filter((g) => g.id !== record.id);
  writeGames([record, ...games].slice(0, 500));
  await pushGame(record);
}

export async function pushGame(record: GameRecord) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("games").upsert({
    id: record.id,
    user_id: data.user.id,
    mode: record.mode,
    computer_level: record.computerLevel,
    player_color: record.playerColor,
    white_name: record.whiteName,
    black_name: record.blackName,
    result: record.result,
    termination: record.termination,
    move_count: record.moveCount,
    duration_seconds: record.durationSeconds,
    opening: record.opening,
    pgn: record.pgn,
    final_fen: record.finalFen,
    played_at: record.playedAt,
  });
}

/** Pull cloud games and merge them with what is stored on this device. */
export async function syncGames(): Promise<GameRecord[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return listGames();
  const { data } = await supabase
    .from("games")
    .select("*")
    .order("played_at", { ascending: false })
    .limit(500);
  const local = listGames();
  const merged = new Map<string, GameRecord>();
  for (const g of local) merged.set(g.id, g);
  for (const row of data ?? []) {
    merged.set(row.id, {
      id: row.id,
      mode: row.mode as GameMode,
      computerLevel: row.computer_level,
      playerColor: (row.player_color as "w" | "b" | null) ?? null,
      whiteName: row.white_name,
      blackName: row.black_name,
      result: row.result as GameResult,
      termination: row.termination ?? "",
      moveCount: row.move_count,
      durationSeconds: row.duration_seconds,
      opening: row.opening,
      pgn: row.pgn,
      finalFen: row.final_fen,
      playedAt: row.played_at,
    });
  }
  const all = [...merged.values()].sort((a, b) => b.playedAt.localeCompare(a.playedAt));
  writeGames(all);
  // push anything the cloud has not seen yet
  const cloudIds = new Set((data ?? []).map((r) => r.id));
  for (const g of local) if (!cloudIds.has(g.id)) await pushGame(g);
  return all;
}

export async function clearHistory() {
  writeGames([]);
  const { data } = await supabase.auth.getUser();
  if (data.user) await supabase.from("games").delete().eq("user_id", data.user.id);
}

export function getSavedGame(): SavedGame | null {
  return read<SavedGame | null>(SAVED_KEY, null);
}

export async function setSavedGame(state: SavedGame) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(state));
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase.from("saved_games").upsert({ user_id: data.user.id, state: state as never });
  }
}

export async function clearSavedGame() {
  localStorage.removeItem(SAVED_KEY);
  const { data } = await supabase.auth.getUser();
  if (data.user) await supabase.from("saved_games").delete().eq("user_id", data.user.id);
}

export function toPgnFile(record: GameRecord): string {
  const date = new Date(record.playedAt);
  const tag = (k: string, v: string | number) => `[${k} "${v}"]`;
  return [
    tag("Event", "Dare to Chess"),
    tag("Site", "Dare to Chess"),
    tag("Date", date.toISOString().slice(0, 10).replace(/-/g, ".")),
    tag("White", record.whiteName),
    tag("Black", record.blackName),
    tag("Opening", record.opening ?? "?"),
    tag("Termination", record.termination),
    "",
    record.pgn,
  ].join("\n");
}
