import { useState } from "react";
import { THEMES, PIECE_SETS, useSettings } from "@/lib/settings";
import { LEVELS } from "@/lib/chess/levels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export function Onboarding() {
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);

  const finish = () => update({ onboarded: true });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/95 p-4 backdrop-blur sm:items-center">
      <div className="surface-card w-full max-w-md p-6">
        {step === 0 && (
          <div className="text-center">
            <img src={logo} alt="Dare to Chess" width={96} height={96} className="mx-auto h-24 w-24 rounded-2xl" />
            <h2 className="display mt-4 text-3xl font-bold">Welcome to Dare to Chess</h2>
            <p className="mt-2 text-sm text-muted-foreground">Play. Think. Improve.</p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold">Choose your look</h2>
            <p className="text-sm text-muted-foreground">You can change this any time in Settings.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update({ theme: t.id })}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-sm",
                    settings.theme === t.id ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{t.hint}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {PIECE_SETS.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => update({ pieceSet: p.id })}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-xs font-medium",
                    settings.pieceSet === p.id ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold">Pick a starting difficulty</h2>
            <div className="mt-4 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => update({ defaultLevel: l.id })}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left",
                    settings.defaultLevel === l.id ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <span className="text-sm font-semibold">{l.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{l.strength}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Beta version</p>
            <h2 className="display mt-2 text-2xl font-bold">Limited server capacity</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We're testing with a limited number of players. All chess features work offline — only cloud
              sync needs a connection.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={finish}>
            Skip
          </Button>
          <Button onClick={() => (step === 3 ? finish() : setStep(step + 1))}>
            {step === 3 ? "Start playing" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
