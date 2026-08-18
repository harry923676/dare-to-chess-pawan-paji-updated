import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Go Ad-Free — Dare to Chess" },
      { name: "description", content: "Remove all ads from Dare to Chess with a one-time ₹49 purchase and unlock premium board themes." },
      { property: "og:title", content: "Go Ad-Free — Dare to Chess" },
      { property: "og:description", content: "One-time ₹49. No ads, premium themes, all chess features stay free." },
    ],
  }),
  component: Premium,
});

const PERKS = [
  "No ads anywhere in the app",
  "Premium board themes and piece sets",
  "Unlimited cloud game backups",
  "Priority access to new features",
];

function Premium() {
  const { profile, user } = useAuth();

  return (
    <AppShell title="Remove Ads" subtitle="One-time purchase">
      <section className="surface-card p-6 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="display mt-4 text-2xl font-bold">Ad-Free Forever</h2>
        <p className="mt-1 text-sm text-muted-foreground">Support development and play without interruptions.</p>
        <p className="mt-4 text-4xl font-bold">₹49</p>
        <p className="text-xs text-muted-foreground">One-time payment · no subscription</p>

        <ul className="mt-6 space-y-2 text-left">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {p}
            </li>
          ))}
        </ul>

        {profile?.is_premium ? (
          <p className="mt-6 rounded-xl bg-success/15 px-4 py-3 text-sm font-semibold text-success">
            You already have the ad-free upgrade. Thank you!
          </p>
        ) : (
          <Button
            className="mt-6 h-13 w-full text-base font-bold"
            onClick={() =>
              toast.info(
                user
                  ? "Payments are not enabled yet in this Beta. Ad-free access will be purchasable soon."
                  : "Sign in first so your ad-free upgrade follows you across devices.",
              )
            }
          >
            Upgrade for ₹49
          </Button>
        )}
      </section>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Every chess feature — all 8 engine levels, local play, history and progress — stays completely free.
      </p>
    </AppShell>
  );
}
