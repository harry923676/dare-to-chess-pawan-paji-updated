import { Phone, Sparkles } from "lucide-react";

export function DeveloperCredit() {
  return (
    <footer className="developer-credit mt-8 rounded-2xl border border-primary/20 bg-card/70 px-4 py-4 text-center backdrop-blur">
      <div className="flex items-center justify-center gap-2 text-sm font-bold">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Developed by Pawan Paji</span>
      </div>
      <a
        href="tel:+918143395375"
        className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-80"
        aria-label="Contact Pawan Paji at plus 91 81433 95375"
      >
        <Phone className="h-3.5 w-3.5" />
        +91 81433 95375
      </a>
      <p className="mt-1 text-[10px] text-muted-foreground">Contact / payment support</p>
    </footer>
  );
}
