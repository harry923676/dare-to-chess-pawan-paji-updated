type SoundName = "move" | "capture" | "check" | "end" | "click";

let ctx: AudioContext | null = null;

const TONES: Record<SoundName, { freq: number; dur: number; type: OscillatorType }> = {
  move: { freq: 420, dur: 0.06, type: "triangle" },
  capture: { freq: 220, dur: 0.09, type: "square" },
  check: { freq: 720, dur: 0.12, type: "sawtooth" },
  end: { freq: 300, dur: 0.35, type: "sine" },
  click: { freq: 620, dur: 0.03, type: "sine" },
};

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const { freq, dur, type } = TONES[name];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {
    /* audio is best-effort */
  }
}

export function vibrate(pattern: number | number[], enabled: boolean) {
  if (!enabled || typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* haptics are best-effort */
  }
}
