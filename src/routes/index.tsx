import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Cpu, Users, History, TrendingUp, Settings as SettingsIcon, PlayCircle, Sparkles } from "lucide-react";
import { BetaBadge, BetaNotice } from "@/components/app/BetaBadge";
import { AdSlot } from "@/components/app/AdSlot";
import { getSavedGame, type SavedGame } from "@/lib/games";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { getLevel } from "@/lib/chess/levels";
import { Onboarding } from "@/components/app/Onboarding";
import logo from "@/assets/logo.png";
import { DeveloperCredit } from "@/components/app/DeveloperCredit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dare to Chess — Play. Learn. Improve." },
      {
        name: "description",
        content:
          "Play chess against an 8-level engine, challenge a friend on the same device, review every game and watch your Chess Maturity score grow.",
      },
      { property: "og:title", content: "Dare to Chess" },
      { property: "og:description", content: "Play a powerful engine, challenge a friend, track your improvement." },
    ],
  }),
  component: Home,
});

function Home() {
  const { settings, hydrated } = useSettings();
  const { profile, user } = useAuth();
  const [saved, setSaved] = useState<SavedGame | null>(null);

  useEffect(() => {
    setSaved(getSavedGame());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {hydrated && !settings.onboarded && <Onboarding />}
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <div className="flex items-start justify-between">
          <BetaBadge />
          <div className="flex items-center gap-2">
            <Link
              to="/premium"
              className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {profile?.is_premium ? "Premium" : "Remove ads ₹49"}
            </Link>
            <Link
              to="/settings"
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <header className="mt-8 flex flex-col items-center text-center">
          <img src={logo} alt="Dare to Chess logo" className="h-24 w-24 rounded-2xl shadow-[var(--elev)]" />
          <h1 className="display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Dare to Chess</h1>
          <p className="mt-1 text-sm uppercase tracking-[0.25em] text-muted-foreground">Play. Learn. Improve.</p>
        </header>

        <div className="mt-8 grid gap-3">
          <Link
            to="/play/computer"
            className="group flex items-center gap-4 rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-[var(--elev)] transition-transform active:scale-[0.99]"
          >
            <Cpu className="h-7 w-7" />
            <div className="flex-1">
              <p className="text-lg font-bold">Play vs Computer</p>
              <p className="text-xs opacity-80">8 difficulty levels, tactical engine</p>
            </div>
          </Link>
          <Link
            to="/play/local"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-5 shadow-[var(--elev)] transition-transform active:scale-[0.99]"
          >
            <Users className="h-7 w-7 text-primary" />
            <div className="flex-1">
              <p className="text-lg font-bold">Play Local</p>
              <p className="text-xs text-muted-foreground">Two players, same device</p>
            </div>
          </Link>
        </div>

        {saved && (
          <Link
            to="/game"
            className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/50 bg-primary/10 px-5 py-4"
          >
            <PlayCircle className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">Continue game</p>
              <p className="text-xs text-muted-foreground">
                {saved.mode === "computer"
                  ? `vs Computer — ${getLevel(saved.level).name}`
                  : `${saved.whiteName} vs ${saved.blackName}`}
              </p>
            </div>
          </Link>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link to="/progress" className="surface-card p-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="mt-3 font-semibold">Your Progress</p>
            <p className="text-xs text-muted-foreground">Maturity score & stats</p>
          </Link>
          <Link to="/history" className="surface-card p-4">
            <History className="h-5 w-5 text-primary" />
            <p className="mt-3 font-semibold">Game History</p>
            <p className="text-xs text-muted-foreground">Replay & review games</p>
          </Link>
        </div>

        {!user && (
          <Link
            to="/auth"
            className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4"
          >
            <Crown className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">Sign in to sync</p>
              <p className="text-xs text-muted-foreground">Back up games and progress to the cloud</p>
            </div>
          </Link>
        )}

        <div className="mt-6 space-y-3">
          <AdSlot />
          <BetaNotice />
        </div>
        <DeveloperCredit />
      </div>
    </div>
  );
}
