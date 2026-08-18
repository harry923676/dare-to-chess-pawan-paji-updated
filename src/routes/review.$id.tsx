import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { AppShell } from "@/components/app/AppShell";
import { Board } from "@/components/chess/Board";
import { getGame, type GameRecord } from "@/lib/games";
import { useSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";

export const Route = createFileRoute("/review/$id")({
  head: () => ({
    meta: [
      { title: "Game Review — Dare to Chess" },
      { name: "description", content: "Step through a finished game move by move and study the position at every turn." },
      { property: "og:title", content: "Game Review — Dare to Chess" },
      { property: "og:description", content: "Replay your finished games move by move." },
    ],
  }),
  component: Review,
});

function Review() {
  const { id } = useParams({ from: "/review/$id" });
  const { settings } = useSettings();
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [ply, setPly] = useState(0);

  useEffect(() => {
    setRecord(getGame(id) ?? null);
  }, [id]);

  const { positions, sans } = useMemo(() => {
    const g = new Chess();
    const positions: string[] = [g.fen()];
    const sans: string[] = [];
    if (record) {
      try {
        const full = new Chess();
        full.loadPgn(record.pgn);
        const moves = full.history();
        for (const san of moves) {
          g.move(san);
          sans.push(san);
          positions.push(g.fen());
        }
      } catch {
        /* unreadable pgn falls back to the start position */
      }
    }
    return { positions, sans };
  }, [record]);

  useEffect(() => setPly(positions.length - 1), [positions.length]);

  const board = useMemo(() => new Chess(positions[Math.min(ply, positions.length - 1)] ?? positions[0]!), [ply, positions]);

  if (!record) {
    return (
      <AppShell title="Game Review" back="/history">
        <p className="py-12 text-center text-sm text-muted-foreground">This game is no longer stored on this device.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${record.whiteName} vs ${record.blackName}`} subtitle={record.termination} back="/history">
      <Board
        game={board}
        orientation={record.playerColor ?? "w"}
        selected={null}
        legalTargets={[]}
        lastMove={null as { from: Square; to: Square } | null}
        checkSquare={null}
        pieceSet={settings.pieceSet}
        pieceSize={settings.pieceSize}
        showCoordinates={settings.showCoordinates}
        showLegalMoves={false}
        showLastMove={false}
        interactive={false}
        onSquare={() => {}}
      />

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Button variant="secondary" onClick={() => setPly(0)} aria-label="First move"><SkipBack className="h-4 w-4" /></Button>
        <Button variant="secondary" onClick={() => setPly((p) => Math.max(0, p - 1))} aria-label="Previous move"><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="secondary" onClick={() => setPly((p) => Math.min(positions.length - 1, p + 1))} aria-label="Next move"><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="secondary" onClick={() => setPly(positions.length - 1)} aria-label="Last move"><SkipForward className="h-4 w-4" /></Button>
      </div>

      <section className="surface-card mt-4 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs text-muted-foreground">Opening</dt><dd className="font-medium">{record.opening ?? "Unknown"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Moves</dt><dd className="font-medium">{record.moveCount}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Result</dt><dd className="font-medium capitalize">{record.result}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Played</dt><dd className="font-medium">{new Date(record.playedAt).toLocaleString()}</dd></div>
        </dl>
      </section>

      <section className="surface-card mt-3 p-3">
        <div className="grid max-h-56 grid-cols-2 gap-x-4 overflow-y-auto text-xs">
          {Array.from({ length: Math.ceil(sans.length / 2) }).map((_, i) => (
            <div key={i} className="flex gap-2 font-mono">
              <span className="w-6 text-muted-foreground">{i + 1}.</span>
              <button type="button" className="w-14 text-left hover:text-primary" onClick={() => setPly(i * 2 + 1)}>{sans[i * 2]}</button>
              <button type="button" className="w-14 text-left hover:text-primary" onClick={() => setPly(i * 2 + 2)}>{sans[i * 2 + 1] ?? ""}</button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
