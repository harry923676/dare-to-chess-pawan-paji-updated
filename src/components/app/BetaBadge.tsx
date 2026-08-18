import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type CapacityStatus = "Available" | "Limited" | "Nearly Full" | "Full";

export function useBetaCapacity() {
  return useQuery({
    queryKey: ["beta-capacity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_capacity")
        .select("seat_limit, seats_taken")
        .eq("id", 1)
        .maybeSingle();
      if (error || !data) return { status: "Available" as CapacityStatus, ratio: 0, offline: true };
      const ratio = data.seat_limit ? data.seats_taken / data.seat_limit : 0;
      const status: CapacityStatus =
        ratio >= 1 ? "Full" : ratio >= 0.85 ? "Nearly Full" : ratio >= 0.4 ? "Limited" : "Available";
      return { status, ratio, offline: false, ...data };
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Beta • Limited seats
    </span>
  );
}

export function BetaNotice() {
  const { data } = useBetaCapacity();
  const status = data?.status ?? "Available";
  const message =
    status === "Full"
      ? "Beta access is temporarily full. Please try again later — offline play keeps working."
      : status === "Nearly Full"
        ? "Beta access is currently limited. Additional seats may become available as testing capacity increases."
        : "This app is being tested with a limited number of users. Server capacity is limited during Beta. Your feedback helps us improve the game.";

  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Beta version</p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              status === "Full" ? "bg-destructive" : status === "Available" ? "bg-success" : "bg-warning",
            )}
          />
          Beta server: {status}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
