// WebAudio sound effects, synthesized — no audio files, no network.
// The context is created lazily on the first user gesture (browser autoplay rules).
// M toggles mute. Every function is a no-op when muted or when audio is unavailable.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, start, dur, type = 'sine', gain = 0.16) {
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + start;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    click() {
      tone(660, 0, 0.08, 'triangle', 0.1);
    },
    found() {
      tone(880, 0, 0.12, 'sine', 0.18);
      tone(1318, 0.09, 0.18, 'sine', 0.16);
    },
    wrong() {
      tone(160, 0, 0.22, 'sawtooth', 0.1);
      tone(120, 0.05, 0.22, 'sawtooth', 0.08);
    },
    hint() {
      tone(1046, 0, 0.1, 'triangle', 0.12);
      tone(1046, 0.14, 0.1, 'triangle', 0.12);
    },
    levelClear() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.11, 0.22, 'triangle', 0.16));
    },
    win() {
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.12, 0.26, 'triangle', 0.17));
    },
  };
}
