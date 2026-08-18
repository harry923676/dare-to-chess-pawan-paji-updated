import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Sparkles } from "lucide-react";

/**
 * Ad placement. Only rendered outside active play, and never for premium
 * members. Swap the inner content for a real ad network later.
 */
export function AdSlot({ label = "Sponsored" }: { label?: string }) {
  const { profile } = useAuth();
  if (profile?.is_premium) return null;
  return (
    <Link
      to="/premium"
      className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted"
    >
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">Play ad-free for ₹49</p>
      </div>
      <Sparkles className="h-4 w-4 shrink-0 text-primary" />
    </Link>
  );
}
