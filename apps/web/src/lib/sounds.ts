/** SFX leves via Web Audio API — sem arquivos externos */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.08,
  when = 0,
) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  open() {
    // subida tipo "power-up"
    tone(220, 0.08, "triangle", 0.06);
    tone(330, 0.1, "triangle", 0.07, 0.05);
    tone(440, 0.12, "sine", 0.05, 0.1);
  },
  close() {
    tone(330, 0.07, "sine", 0.05);
    tone(180, 0.1, "triangle", 0.04, 0.05);
  },
  success() {
    tone(523.25, 0.1, "sine", 0.07); // C5
    tone(659.25, 0.12, "sine", 0.07, 0.08); // E5
    tone(783.99, 0.18, "triangle", 0.06, 0.16); // G5
  },
  click() {
    tone(600, 0.04, "square", 0.03);
  },
  whoosh() {
    const ac = getCtx();
    if (!ac) return;
    const t0 = ac.currentTime;
    const bufferSize = ac.sampleRate * 0.2;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, t0);
    filter.frequency.exponentialRampToValueAtTime(200, t0 + 0.2);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.04, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    noise.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    noise.start(t0);
    noise.stop(t0 + 0.22);
  },
};
