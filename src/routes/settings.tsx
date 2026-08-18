import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { PIECE_SETS, THEMES, useSettings } from "@/lib/settings";
import { LEVELS } from "@/lib/chess/levels";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Piece } from "@/components/chess/Piece";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Dare to Chess" },
      { name: "description", content: "Choose your board theme, piece set, sound, haptics and gameplay preferences." },
      { property: "og:title", content: "Settings — Dare to Chess" },
      { property: "og:description", content: "Themes, piece sets, sound and gameplay options." },
    ],
  }),
  component: SettingsPage,
});

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { settings, update } = useSettings();
  const { user, profile, signOut } = useAuth();

  return (
    <AppShell title="Settings" subtitle="Appearance and gameplay">
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Board theme</h2>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ theme: t.id })}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left",
                settings.theme === t.id ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              <span className="text-sm font-semibold">{t.name}</span>
              <span className="block text-[11px] text-muted-foreground">{t.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Piece set</h2>
        <div className="grid grid-cols-3 gap-2">
          {PIECE_SETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update({ pieceSet: p.id })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border py-3",
                settings.pieceSet === p.id ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              <span className="flex text-2xl">
                <Piece type="n" color="w" setId={p.id} />
                <Piece type="q" color="b" setId={p.id} />
              </span>
              <span className="text-[11px] font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card mt-6 overflow-hidden p-0">
        <Row label="Show legal moves" hint="Highlight where the selected piece can go">
          <Switch checked={settings.showLegalMoves} onCheckedChange={(v) => update({ showLegalMoves: v })} />
        </Row>
        <Row label="Highlight last move">
          <Switch checked={settings.showLastMove} onCheckedChange={(v) => update({ showLastMove: v })} />
        </Row>
        <Row label="Board coordinates">
          <Switch checked={settings.showCoordinates} onCheckedChange={(v) => update({ showCoordinates: v })} />
        </Row>
        <Row label="Auto-promote to queen" hint="Skip the promotion picker">
          <Switch checked={settings.autoPromoteQueen} onCheckedChange={(v) => update({ autoPromoteQueen: v })} />
        </Row>
        <Row label="Rotate board in local play">
          <Switch checked={settings.rotateBoard} onCheckedChange={(v) => update({ rotateBoard: v })} />
        </Row>
        <Row label="Sound effects">
          <Switch checked={settings.sound} onCheckedChange={(v) => update({ sound: v })} />
        </Row>
        <Row label="Vibration">
          <Switch checked={settings.haptics} onCheckedChange={(v) => update({ haptics: v })} />
        </Row>
        <Row label="Show engine info" hint="Depth and evaluation while thinking">
          <Switch checked={settings.showEngineInfo} onCheckedChange={(v) => update({ showEngineInfo: v })} />
        </Row>
      </section>

      <section className="surface-card mt-4 p-4">
        <p className="text-sm font-medium">Piece size</p>
        <Slider
          className="mt-3"
          value={[settings.pieceSize]}
          min={70}
          max={100}
          step={2}
          onValueChange={([v]) => update({ pieceSize: v ?? 88 })}
        />
        <p className="mt-1 text-xs text-muted-foreground">{settings.pieceSize}%</p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Default difficulty</h2>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => update({ defaultLevel: l.id })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                settings.defaultLevel === l.id ? "border-primary bg-primary/10 text-primary" : "border-border",
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card mt-6 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <User className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.display_name ?? user?.email ?? "Playing offline"}</p>
            <p className="text-xs text-muted-foreground">
              {user ? (profile?.is_premium ? "Premium · games synced" : "Games synced to the cloud") : "Sign in to back up your games"}
            </p>
          </div>
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </section>

      <Button variant="ghost" className="mt-4 w-full" onClick={() => update({ onboarded: false })}>
        Replay the welcome tour
      </Button>
    </AppShell>
  );
}
