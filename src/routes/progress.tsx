import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { AdSlot } from "@/components/app/AdSlot";
import { listGames, syncGames, type GameRecord } from "@/lib/games";
import { computeStats, MATURITY_BANDS } from "@/lib/stats";
import { useAuth } from "@/lib/auth";
import { getLevel } from "@/lib/chess/levels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your Progress — Dare to Chess" },
      { name: "description", content: "Track your Chess Maturity score, win rate, tactical accuracy and the strongest engine level you have beaten." },
      { property: "og:title", content: "Your Progress — Dare to Chess" },
      { property: "og:description", content: "A clear picture of how your chess is improving over time." },
    ],
  }),
  component: ProgressPage,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ProgressPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);

  useEffect(() => {
    setGames(listGames());
    if (user) void syncGames().then(setGames);
  }, [user]);

  const stats = useMemo(() => computeStats(games), [games]);
  const recent = games.slice(0, 10).reverse();

  return (
    <AppShell title="Your Progress" subtitle="Chess Maturity & performance">
      <section className="surface-card p-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Chess Maturity</p>
        <div className="relative mx-auto mt-3 h-32 w-32">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(stats.maturity / 100) * 327} 327`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums">{stats.maturity}</span>
            <span className="text-[11px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <p className="mt-3 text-lg font-semibold text-primary">{stats.band}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          An internal progress measure based on your results, opponent strength and tactical play — not an official rating.
        </p>
        <div className="mt-4 flex justify-between text-[10px] text-muted-foreground">
          {MATURITY_BANDS.map((b) => (
            <span key={b.label} className={cn(stats.band === b.label && "font-bold text-primary")}>{b.label}</span>
          ))}
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="Games played" value={String(stats.played)} />
        <Stat label="Win rate" value={`${stats.winRate.toFixed(0)}%`} hint={`${stats.wins}W · ${stats.losses}L · ${stats.draws}D`} />
        <Stat label="Best level beaten" value={stats.highestLevelBeaten ? getLevel(stats.highestLevelBeaten).name : "—"} />
        <Stat label="Tactical accuracy" value={`${stats.tacticalAccuracy.toFixed(0)}%`} hint="Moves creating a tactical idea" />
        <Stat label="Best win streak" value={String(stats.bestStreak)} />
        <Stat label="Checkmate wins" value={String(stats.checkmateWins)} />
        <Stat label="Avg. game length" value={`${stats.avgMoves.toFixed(0)} moves`} />
        <Stat label="Blunders / game" value={stats.blundersPerGame.toFixed(1)} hint={`Mistakes ${stats.mistakesPerGame.toFixed(1)}`} />
      </div>

      {recent.length > 1 && (
        <section className="surface-card mt-3 p-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Recent results</h2>
          <div className="mt-3 flex items-end gap-1.5">
            {recent.map((g) => (
              <div
                key={g.id}
                title={`${g.result} · ${new Date(g.playedAt).toLocaleDateString()}`}
                className={cn(
                  "flex-1 rounded-t",
                  g.result === "win" ? "h-16 bg-success" : g.result === "draw" ? "h-9 bg-muted-foreground/50" : "h-4 bg-destructive",
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Oldest to newest — taller is better.</p>
        </section>
      )}

      <div className="mt-6">
        <AdSlot />
      </div>
    </AppShell>
  );
}
