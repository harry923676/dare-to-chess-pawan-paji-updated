import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Chess } from "chess.js";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setSavedGame } from "@/lib/games";
import { useSettings } from "@/lib/settings";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

const CLOCKS = [
  { label: "No clock", minutes: 0 },
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "30 min", minutes: 30 },
];

export const Route = createFileRoute("/play/local")({
  head: () => ({
    meta: [
      { title: "Play Local — Dare to Chess" },
      { name: "description", content: "Two players, one device. Set names, an optional clock and board rotation, then play." },
      { property: "og:title", content: "Play Local — Dare to Chess" },
      { property: "og:description", content: "Pass-and-play chess with clocks, undo and full rules detection." },
    ],
  }),
  component: PlayLocal,
});

function PlayLocal() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const [white, setWhite] = useState("Player 1");
  const [black, setBlack] = useState("Player 2");
  const [clock, setClock] = useState(0);

  const start = async () => {
    const game = new Chess();
    await setSavedGame({
      mode: "local",
      level: 0,
      playerColor: "w",
      fen: game.fen(),
      pgn: game.pgn(),
      whiteName: white || "Player 1",
      blackName: black || "Player 2",
      elapsedSeconds: 0,
      clockWhite: clock ? clock * 60 : null,
      clockBlack: clock ? clock * 60 : null,
      savedAt: new Date().toISOString(),
    });
    void navigate({ to: "/game" });
  };

  return (
    <AppShell title="Play Local" subtitle="Two players on this device">
      <div className="surface-card space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="white">White player</Label>
          <Input id="white" value={white} onChange={(e) => setWhite(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="black">Black player</Label>
          <Input id="black" value={black} onChange={(e) => setBlack(e.target.value)} />
        </div>
      </div>

      <section className="mt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Chess clock</h2>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {CLOCKS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setClock(c.minutes)}
              className={cn(
                "rounded-xl border py-2.5 text-xs font-semibold",
                clock === c.minutes ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <div className="surface-card mt-4 flex items-center justify-between p-4">
        <div>
          <p className="font-medium">Rotate board each move</p>
          <p className="text-xs text-muted-foreground">Each player sees the board from their side</p>
        </div>
        <Switch checked={settings.rotateBoard} onCheckedChange={(v) => update({ rotateBoard: v })} />
      </div>

      <Button className="mt-8 h-14 w-full text-base font-bold" onClick={() => void start()}>
        <Users className="mr-2 h-5 w-5" /> Start Game
      </Button>
    </AppShell>
  );
}
