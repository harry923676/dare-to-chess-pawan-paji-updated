import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { AdSlot } from "@/components/app/AdSlot";
import { clearHistory, listGames, syncGames, toPgnFile, type GameRecord } from "@/lib/games";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Download, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Game History — Dare to Chess" },
      { name: "description", content: "Every game you have played, with result, opening, length and downloadable PGN." },
      { property: "og:title", content: "Game History — Dare to Chess" },
      { property: "og:description", content: "Review results, openings and export your games as PGN." },
    ],
  }),
  component: HistoryPage,
});

const FILTERS = ["All", "Wins", "Losses", "Draws", "Computer", "Local"] as const;

function HistoryPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setGames(listGames());
    if (user) void refresh();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => {
    setSyncing(true);
    try {
      setGames(await syncGames());
    } finally {
      setSyncing(false);
    }
  };

  const filtered = games.filter((g) =>
    filter === "All" ? true
      : filter === "Wins" ? g.result === "win"
      : filter === "Losses" ? g.result === "loss"
      : filter === "Draws" ? g.result === "draw"
      : filter === "Computer" ? g.mode === "computer"
      : g.mode === "local",
  );

  const download = (g: GameRecord) => {
    const blob = new Blob([toPgnFile(g)], { type: "application/x-chess-pgn" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dare-to-chess-${g.playedAt.slice(0, 10)}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Game History"
      subtitle={`${games.length} game${games.length === 1 ? "" : "s"} recorded`}
      action={
        user ? (
          <button type="button" onClick={() => void refresh()} aria-label="Sync games" className="rounded-full border border-border p-2">
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          </button>
        ) : null
      }
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
              filter === f ? "border-primary bg-primary/10 text-primary" : "border-border",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((g) => (
          <div key={g.id} className="surface-card flex items-center gap-3 p-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase",
                g.result === "win" ? "bg-success/15 text-success" : g.result === "loss" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground",
              )}
            >
              {g.result === "win" ? "W" : g.result === "loss" ? "L" : "D"}
            </span>
            <Link to="/review/$id" params={{ id: g.id }} className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {g.whiteName} vs {g.blackName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {new Date(g.playedAt).toLocaleDateString()} · {g.moveCount} moves · {g.opening ?? "Unknown opening"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{g.termination}</p>
            </Link>
            <button type="button" aria-label="Download PGN" onClick={() => download(g)} className="rounded-full border border-border p-2">
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))}
        {!filtered.length && (
          <p className="py-12 text-center text-sm text-muted-foreground">No games yet. Play one to start your history.</p>
        )}
      </div>

      {games.length > 0 && (
        <Button
          variant="ghost"
          className="mt-6 w-full text-destructive"
          onClick={() => {
            void clearHistory();
            setGames([]);
            toast("History cleared");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Clear history
        </Button>
      )}

      <div className="mt-6">
        <AdSlot />
      </div>
    </AppShell>
  );
}
