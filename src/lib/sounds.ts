/**
 * Lightweight sound feedback using Web Audio API (no audio files).
 * Call playSound('click' | 'success' | 'error') on user actions.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioContext;
}

function beep(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = type;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

export type SoundType = "click" | "success" | "error" | "add";

export function playSound(type: SoundType) {
  try {
    switch (type) {
      case "click":
        beep(600, 0.06, "sine", 0.12);
        break;
      case "success":
        beep(523, 0.08, "sine", 0.12);
        setTimeout(() => beep(659, 0.08, "sine", 0.1), 80);
        setTimeout(() => beep(784, 0.12, "sine", 0.1), 160);
        break;
      case "error":
        beep(200, 0.15, "sawtooth", 0.12);
        setTimeout(() => beep(180, 0.2, "sawtooth", 0.1), 120);
        break;
      case "add":
        beep(400, 0.07, "sine", 0.12);
        setTimeout(() => beep(500, 0.07, "sine", 0.1), 70);
        break;
      default:
        beep(500, 0.08, "sine", 0.1);
    }
  } catch (_) {}
}
