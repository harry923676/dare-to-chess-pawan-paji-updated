import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { AppShell } from "@/components/app/AppShell";
import { LEVELS } from "@/lib/chess/levels";
import { THEMES, useSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { setSavedGame } from "@/lib/games";
import { cn } from "@/lib/utils";
import { Cpu } from "lucide-react";

export const Route = createFileRoute("/play/computer")({
  head: () => ({
    meta: [
      { title: "Play vs Computer — Dare to Chess" },
      { name: "description", content: "Choose from 8 engine levels, pick your colour and start a game against the Dare to Chess engine." },
      { property: "og:title", content: "Play vs Computer — Dare to Chess" },
      { property: "og:description", content: "Eight tuned difficulty levels, from Beginner to Grandmaster." },
    ],
  }),
  component: PlayComputer,
});

function PlayComputer() {
  const { settings, update, hydrated } = useSettings();
  const navigate = useNavigate();
  const [level, setLevel] = useState(4);
  const [color, setColor] = useState<"w" | "b">("w");

  useEffect(() => {
    if (hydrated) setLevel(settings.defaultLevel);
  }, [hydrated, settings.defaultLevel]);

  const start = async () => {
    update({ defaultLevel: level });
    const game = new Chess();
    await setSavedGame({
      mode: "computer",
      level,
      playerColor: color,
      fen: game.fen(),
      pgn: game.pgn(),
      whiteName: color === "w" ? "You" : `Computer L${level}`,
      blackName: color === "b" ? "You" : `Computer L${level}`,
      elapsedSeconds: 0,
      clockWhite: null,
      clockBlack: null,
      savedAt: new Date().toISOString(),
    });
    void navigate({ to: "/game" });
  };

  return (
    <AppShell title="Play vs Computer" subtitle="Select level, colour and theme">
      <div className="space-y-2">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLevel(l.id)}
            aria-pressed={level === l.id}
            className={cn(
              "flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors",
              level === l.id ? "border-primary bg-primary/10" : "border-border bg-card",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-bold">
              {l.id}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{l.name}</p>
                <span className="text-[11px] text-muted-foreground">{l.strength}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{l.description}</p>
            </div>
            <div className="flex gap-0.5" aria-label={`Difficulty ${l.id} of 8`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className={cn("h-4 w-1 rounded-full", i < l.id ? "bg-primary" : "bg-border")}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your colour</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["w", "b"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "rounded-2xl border py-3 font-semibold",
                color === c ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              {c === "w" ? "Play as White" : "Play as Black"}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Theme</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ theme: t.id })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                settings.theme === t.id ? "border-primary bg-primary/10 text-primary" : "border-border",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <Button className="mt-8 h-14 w-full text-base font-bold" onClick={() => void start()}>
        <Cpu className="mr-2 h-5 w-5" /> Start Game
      </Button>
    </AppShell>
  );
}
