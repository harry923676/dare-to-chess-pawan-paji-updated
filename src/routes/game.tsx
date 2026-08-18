import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { toast } from "sonner";
import { Board } from "@/components/chess/Board";
import { Piece } from "@/components/chess/Piece";
import { useSettings } from "@/lib/settings";
import { useEngine } from "@/lib/chess/useEngine";
import { getLevel } from "@/lib/chess/levels";
import { identifyOpening } from "@/lib/chess/openings";
import { analyseMove } from "@/lib/chess/tactics";
import { playSound, vibrate } from "@/lib/sound";
import { clearSavedGame, getSavedGame, saveGame, setSavedGame, type GameResult, type SavedGame } from "@/lib/games";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Flag, Handshake, Lightbulb, RotateCcw, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeveloperCredit } from "@/components/app/DeveloperCredit";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Game — Dare to Chess" },
      { name: "description", content: "Your live chess game: move list, clocks, hints, undo and instant tactical feedback." },
      { property: "og:title", content: "Game — Dare to Chess" },
      { property: "og:description", content: "Play your game with full rules, clocks and engine analysis." },
    ],
  }),
  component: GameScreen,
});

const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const fmtClock = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;

interface EndState {
  result: GameResult;
  termination: string;
  title: string;
}

function GameScreen() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { think, thinking, cancel } = useEngine();

  const [saved, setSaved] = useState<SavedGame | null>(null);
  const gameRef = useRef(new Chess());
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [end, setEnd] = useState<EndState | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [clocks, setClocks] = useState<{ w: number | null; b: number | null }>({ w: null, b: null });
  const [tactics, setTactics] = useState<string[]>([]);
  const startedAt = useRef(Date.now());
  const stats = useRef({ blunders: 0, mistakes: 0, inaccuracies: 0, tacticsHit: 0, tacticsTotal: 0 });

  // ---- load saved game -------------------------------------------------
  useEffect(() => {
    const s = getSavedGame();
    if (!s) {
      void navigate({ to: "/" });
      return;
    }
    const g = new Chess();
    try {
      g.loadPgn(s.pgn);
    } catch {
      g.load(s.fen);
    }
    gameRef.current = g;
    setSaved(s);
    setElapsed(s.elapsedSeconds);
    setClocks({ w: s.clockWhite, b: s.clockBlack });
    bump();
  }, [navigate, bump]);

  const game = gameRef.current;
  const mode = saved?.mode ?? "local";
  const level = getLevel(saved?.level ?? 4);
  const playerColor = saved?.playerColor ?? "w";
  const turn = game.turn();
  const history = game.history({ verbose: true }) as Move[];
  const lastMove = history.length ? { from: history[history.length - 1]!.from as Square, to: history[history.length - 1]!.to as Square } : null;
  const isPlayerTurn = mode === "local" || turn === playerColor;
  const opening = useMemo(() => identifyOpening(game.history()), [history.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const orientation: "w" | "b" =
    mode === "computer" ? playerColor : settings.rotateBoard ? turn : "w";

  const checkSquare = useMemo(() => {
    if (!game.inCheck()) return null;
    for (const row of game.board())
      for (const sq of row)
        if (sq && sq.type === "k" && sq.color === turn) return sq.square as Square;
    return null;
  }, [history.length, turn]); // eslint-disable-line react-hooks/exhaustive-deps

  const legalTargets = useMemo(
    () => (selected ? (game.moves({ square: selected, verbose: true }) as Move[]).map((m) => m.to as Square) : []),
    [selected, history.length], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ---- timers ----------------------------------------------------------
  useEffect(() => {
    if (end) return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      setClocks((c) => {
        if (c[turn] === null) return c;
        const next = { ...c, [turn]: Math.max(0, (c[turn] ?? 0) - 1) };
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [turn, end]);

  useEffect(() => {
    if (end || !saved) return;
    const side = clocks[turn];
    if (side !== null && side <= 0) {
      const playerLost = mode === "local" ? false : turn === playerColor;
      finish(
        mode === "local" ? "draw" : playerLost ? "loss" : "win",
        `Timeout — ${turn === "w" ? saved.whiteName : saved.blackName} ran out of time`,
        "Time out",
      );
    }
  }, [clocks, turn, end]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- persistence -----------------------------------------------------
  const persist = useCallback(() => {
    if (!saved) return;
    void setSavedGame({
      ...saved,
      fen: gameRef.current.fen(),
      pgn: gameRef.current.pgn(),
      elapsedSeconds: elapsed,
      clockWhite: clocks.w,
      clockBlack: clocks.b,
      savedAt: new Date().toISOString(),
    });
  }, [saved, elapsed, clocks]);

  // ---- finishing -------------------------------------------------------
  const finish = useCallback(
    (result: GameResult, termination: string, title: string) => {
      if (!saved || end) return;
      cancel();
      playSound("end", settings.sound);
      vibrate([40, 60, 40], settings.haptics);
      setEnd({ result, termination, title });
      const g = gameRef.current;
      void saveGame({
        id: crypto.randomUUID(),
        mode: saved.mode,
        computerLevel: saved.mode === "computer" ? saved.level : null,
        playerColor: saved.mode === "computer" ? saved.playerColor : null,
        whiteName: saved.whiteName,
        blackName: saved.blackName,
        result,
        termination,
        moveCount: Math.ceil(g.history().length / 2),
        durationSeconds: Math.round((Date.now() - startedAt.current) / 1000) + (saved.elapsedSeconds ?? 0),
        opening: identifyOpening(g.history()),
        pgn: g.pgn(),
        finalFen: g.fen(),
        playedAt: new Date().toISOString(),
        ...stats.current,
      });
      void clearSavedGame();
    },
    [saved, end, cancel, settings.sound, settings.haptics],
  );

  const checkGameOver = useCallback(() => {
    const g = gameRef.current;
    if (!g.isGameOver() || !saved) return false;
    if (g.isCheckmate()) {
      const loser = g.turn();
      const winnerName = loser === "w" ? saved.blackName : saved.whiteName;
      const result: GameResult =
        saved.mode === "local" ? "win" : loser === saved.playerColor ? "loss" : "win";
      finish(result, `Checkmate — ${winnerName} wins`, `${winnerName} wins by checkmate`);
    } else if (g.isStalemate()) finish("draw", "Draw — Stalemate", "Draw by stalemate");
    else if (g.isThreefoldRepetition()) finish("draw", "Draw — Threefold repetition", "Draw by repetition");
    else if (g.isInsufficientMaterial()) finish("draw", "Draw — Insufficient material", "Draw — insufficient material");
    else if (g.isDraw()) finish("draw", "Draw — 50-move rule", "Draw by the 50-move rule");
    return true;
  }, [saved, finish]);

  // ---- move application ------------------------------------------------
  const applyMove = useCallback(
    (from: Square, to: Square, promo?: string) => {
      const g = gameRef.current;
      const fenBefore = g.fen();
      let move: Move | null = null;
      try {
        move = g.move({ from, to, promotion: promo ?? "q" }) as Move;
      } catch {
        move = null;
      }
      if (!move) return false;

      const captured = move.captured;
      playSound(g.inCheck() ? "check" : captured ? "capture" : "move", settings.sound);
      vibrate(captured ? 25 : 12, settings.haptics);

      const isHuman = saved?.mode === "local" || move.color === (saved?.playerColor ?? "w");
      if (isHuman) {
        const analysis = analyseMove(fenBefore, move);
        stats.current.tacticsTotal += 1;
        if (analysis.motifs.length) {
          stats.current.tacticsHit += 1;
          setTactics(analysis.motifs);
          if (settings.showEngineInfo || analysis.motifs.length > 0) {
            toast.success(analysis.motifs.join(" • "), { duration: 1800 });
          }
        } else {
          setTactics([]);
        }
        if (analysis.gain <= -5) stats.current.blunders += 1;
        else if (analysis.gain <= -3) stats.current.mistakes += 1;
        else if (analysis.gain <= -1) stats.current.inaccuracies += 1;
      }

      setSelected(null);
      setHint(null);
      bump();
      return true;
    },
    [saved, settings.sound, settings.haptics, settings.showEngineInfo, bump],
  );

  useEffect(() => {
    if (!saved || end) return;
    if (checkGameOver()) return;
    persist();
  }, [history.length, saved]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- engine turn -----------------------------------------------------
  useEffect(() => {
    if (!saved || end || saved.mode !== "computer") return;
    if (turn === saved.playerColor || gameRef.current.isGameOver()) return;
    let alive = true;
    const run = async () => {
      const g = gameRef.current;
      const result = await think(g.fen(), g.history(), level);
      if (!alive || !result) return;
      try {
        const move = g.move(result.san) as Move;
        playSound(g.inCheck() ? "check" : move.captured ? "capture" : "move", settings.sound);
        vibrate(12, settings.haptics);
      } catch {
        const legal = g.moves();
        if (legal.length) g.move(legal[Math.floor(Math.random() * legal.length)]!);
      }
      bump();
    };
    const timer = setTimeout(() => void run(), 320);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [turn, saved, end, history.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- interactions ----------------------------------------------------
  const onSquare = (square: Square) => {
    if (end || !isPlayerTurn || thinking) return;
    const g = gameRef.current;
    const piece = g.get(square);
    if (selected) {
      if (square === selected) return setSelected(null);
      const moves = g.moves({ square: selected, verbose: true }) as Move[];
      const target = moves.find((m) => m.to === square);
      if (target) {
        const isPromotion = target.piece === "p" && (square[1] === "8" || square[1] === "1");
        if (isPromotion && !settings.autoPromoteQueen) {
          setPromotion({ from: selected, to: square });
          return;
        }
        applyMove(selected, square);
        return;
      }
    }
    if (piece && piece.color === turn) {
      playSound("click", settings.sound);
      setSelected(square);
    } else setSelected(null);
  };

  const undo = () => {
    if (end) return;
    const g = gameRef.current;
    if (!g.history().length) return;
    g.undo();
    if (mode === "computer" && g.turn() !== playerColor && g.history().length) g.undo();
    setSelected(null);
    setHint(null);
    bump();
    toast("Move taken back");
  };

  const requestHint = async () => {
    if (end || !isPlayerTurn) return;
    const g = gameRef.current;
    const result = await think(g.fen(), g.history(), getLevel(6));
    if (result) {
      setHint(result.san);
      toast.info(`Try ${result.san}`);
    }
  };

  const resign = () => {
    if (!saved) return;
    const loserName = turn === "w" ? saved.whiteName : saved.blackName;
    finish(mode === "local" ? "loss" : turn === playerColor ? "loss" : "win", `Resignation — ${loserName} resigned`, `${loserName} resigned`);
  };

  const rematch = async () => {
    if (!saved) return;
    const fresh = new Chess();
    await setSavedGame({ ...saved, fen: fresh.fen(), pgn: fresh.pgn(), elapsedSeconds: 0, savedAt: new Date().toISOString() });
    gameRef.current = fresh;
    stats.current = { blunders: 0, mistakes: 0, inaccuracies: 0, tacticsHit: 0, tacticsTotal: 0 };
    startedAt.current = Date.now();
    setEnd(null);
    setElapsed(0);
    setTactics([]);
    bump();
  };

  // ---- captured material ----------------------------------------------
  const material = useMemo(() => {
    const capturedBy: Record<"w" | "b", string[]> = { w: [], b: [] };
    let score = 0;
    for (const m of history) {
      if (m.captured) {
        capturedBy[m.color as "w" | "b"].push(m.captured);
        score += (m.color === "w" ? 1 : -1) * (PIECE_VALUE[m.captured] ?? 0);
      }
    }
    return { capturedBy, score };
  }, [history.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!saved) return null;

  const topColor: "w" | "b" = orientation === "w" ? "b" : "w";
  const nameFor = (c: "w" | "b") => (c === "w" ? saved.whiteName : saved.blackName);

  const PlayerBar = ({ color }: { color: "w" | "b" }) => (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2",
        turn === color && !end ? "border-primary bg-primary/10" : "border-border bg-card",
      )}
    >
      <div className={cn("h-2.5 w-2.5 rounded-full", color === "w" ? "bg-white" : "bg-neutral-900 ring-1 ring-border")} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{nameFor(color)}</p>
        <div className="flex h-4 items-center gap-0.5 text-xs">
          {material.capturedBy[color].map((p, i) => (
            <span key={i} className="opacity-70">
              <Piece type={p} color={color === "w" ? "b" : "w"} setId={settings.pieceSet} className="text-[10px]" />
            </span>
          ))}
          {material.score !== 0 && (color === "w" ? material.score > 0 : material.score < 0) && (
            <span className="ml-1 text-muted-foreground">+{Math.abs(material.score)}</span>
          )}
        </div>
      </div>
      {clocks[color] !== null && (
        <span className={cn("font-mono text-sm tabular-nums", (clocks[color] ?? 0) < 30 && "text-destructive")}>
          {fmtClock(clocks[color] ?? 0)}
        </span>
      )}
      {saved.mode === "computer" && color !== saved.playerColor && thinking && (
        <span className="text-xs text-muted-foreground">thinking…</span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
        <button
          type="button"
          aria-label="Leave game"
          onClick={() => setConfirmExit(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {saved.mode === "computer" ? `vs Computer — ${level.name}` : "Local match"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {opening ?? "Move " + (Math.floor(history.length / 2) + 1)} · {fmtClock(elapsed)}
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-[520px] flex-col items-center px-3 py-3">
        <PlayerBar color={topColor} />
        <div className="my-2">
          <Board
            game={game}
            orientation={orientation}
            selected={selected}
            legalTargets={legalTargets}
            lastMove={lastMove}
            checkSquare={checkSquare}
            pieceSet={settings.pieceSet}
            pieceSize={settings.pieceSize}
            showCoordinates={settings.showCoordinates}
            showLegalMoves={settings.showLegalMoves}
            showLastMove={settings.showLastMove}
            interactive={!end && isPlayerTurn && !thinking}
            onSquare={onSquare}
          />
        </div>
        <PlayerBar color={orientation} />

        {(tactics.length > 0 || hint) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {hint && (
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">Hint: {hint}</span>
            )}
            {tactics.map((t) => (
              <span key={t} className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 grid grid-cols-4 gap-2">
          <Button variant="secondary" className="h-12 flex-col gap-0.5 text-[11px]" onClick={undo}>
            <Undo2 className="h-4 w-4" /> Undo
          </Button>
          <Button variant="secondary" className="h-12 flex-col gap-0.5 text-[11px]" onClick={() => void requestHint()} disabled={saved.mode !== "computer"}>
            <Lightbulb className="h-4 w-4" /> Hint
          </Button>
          <Button
            variant="secondary"
            className="h-12 flex-col gap-0.5 text-[11px]"
            onClick={() => finish("draw", "Draw — agreed", "Draw agreed")}
            disabled={!!end}
          >
            <Handshake className="h-4 w-4" /> Draw
          </Button>
          <Button variant="secondary" className="h-12 flex-col gap-0.5 text-[11px]" onClick={resign} disabled={!!end}>
            <Flag className="h-4 w-4" /> Resign
          </Button>
        </div>

        <section className="surface-card mt-3 w-full p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Moves</h2>
          <ol className="mt-2 grid max-h-40 grid-cols-2 gap-x-4 overflow-y-auto text-sm">
            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
              <li key={i} className="flex gap-2 font-mono text-xs">
                <span className="w-6 text-muted-foreground">{i + 1}.</span>
                <span className="w-14">{history[i * 2]?.san}</span>
                <span className="w-14">{history[i * 2 + 1]?.san ?? ""}</span>
              </li>
            ))}
            {!history.length && <li className="text-xs text-muted-foreground">No moves yet</li>}
          </ol>
        </section>
        <DeveloperCredit />
      </div>

      <Dialog open={!!promotion} onOpenChange={(o) => !o && setPromotion(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Promote pawn</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {(["q", "r", "b", "n"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className="flex aspect-square items-center justify-center rounded-xl border border-border bg-secondary"
                onClick={() => {
                  if (promotion) applyMove(promotion.from, promotion.to, p);
                  setPromotion(null);
                }}
              >
                <Piece type={p} color={turn} setId={settings.pieceSet} className="text-3xl" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!end}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{end?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {end?.termination} · {Math.ceil(history.length / 2)} moves · {fmtClock(elapsed)}
              {opening ? ` · ${opening}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => void navigate({ to: "/history" })}>View history</AlertDialogCancel>
            <AlertDialogAction onClick={() => void rematch()}>
              <RotateCcw className="mr-2 h-4 w-4" /> Rematch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this game?</AlertDialogTitle>
            <AlertDialogDescription>
              Your position is saved — you can continue it from the home screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep playing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                persist();
                void navigate({ to: "/" });
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
