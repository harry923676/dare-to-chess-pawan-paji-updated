import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const THEMES = [
  { id: "royal", name: "Royal", hint: "Premium gold & black" },
  { id: "classic", name: "Classic", hint: "Green & cream board" },
  { id: "tournament", name: "Tournament", hint: "Professional blue" },
  { id: "wooden", name: "Wooden", hint: "Natural wood tones" },
  { id: "midnight", name: "Midnight", hint: "Dark blue night mode" },
  { id: "emerald", name: "Emerald", hint: "Modern green" },
  { id: "minimal", name: "Minimal", hint: "Distraction free" },
  { id: "neon", name: "Neon", hint: "Gaming aesthetic" },
  { id: "acrylic", name: "Acrylic Aurora", hint: "Glass, glow & motion" },
  { id: "acrylic-rose", name: "Acrylic Rose", hint: "Crystal pink & violet" },
] as const;

export const PIECE_SETS = [
  { id: "classic", name: "Classic" },
  { id: "staunton", name: "Staunton" },
  { id: "modern", name: "Modern" },
  { id: "minimal", name: "Minimal" },
  { id: "wooden", name: "Wooden" },
  { id: "tournament", name: "Tournament" },
  { id: "metallic", name: "Metallic" },
  { id: "solid3d", name: "3D Style" },
  { id: "artistic", name: "Artistic", premium: true },
] as const;

export interface Settings {
  theme: string;
  pieceSet: string;
  showLegalMoves: boolean;
  showLastMove: boolean;
  showCoordinates: boolean;
  confirmMoves: boolean;
  autoPromoteQueen: boolean;
  rotateBoard: boolean;
  sound: boolean;
  haptics: boolean;
  animationSpeed: number;
  pieceSize: number;
  defaultLevel: number;
  showEngineInfo: boolean;
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "classic",
  pieceSet: "classic",
  showLegalMoves: true,
  showLastMove: true,
  showCoordinates: true,
  confirmMoves: false,
  autoPromoteQueen: false,
  rotateBoard: false,
  sound: true,
  haptics: true,
  animationSpeed: 200,
  pieceSize: 110,
  defaultLevel: 4,
  showEngineInfo: false,
  onboarded: false,
};

const KEY = "dtc.settings";
const VISUAL_RESET_KEY = "dtc.visual-reset.v1";

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  hydrated: boolean;
}

const SettingsContext = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
  hydrated: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const saved = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
      const next = { ...DEFAULT_SETTINGS, ...saved };
      if (!localStorage.getItem(VISUAL_RESET_KEY)) {
        next.theme = "classic";
        next.pieceSet = "classic";
        localStorage.setItem(VISUAL_RESET_KEY, "true");
      }
      setSettings(next);
    } catch {
      /* corrupted settings are ignored */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(settings));
    document.documentElement.dataset['theme'] = settings.theme;
  }, [settings, hydrated]);

  const value = useMemo<Ctx>(
    () => ({
      settings,
      hydrated,
      update: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
    }),
    [settings, hydrated],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
