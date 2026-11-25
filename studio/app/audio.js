// Sound for the studio. Nothing plays until the visitor chooses "Enable sound"; every sound is made
// here in code with WebAudio, there are no audio files. The room and the screen's programs share this
// one context and one master gain.

const listeners = new Set();
const KEY = "studio.sound";

export const audio = {
  enabled: false,
  ctx: null,   // AudioContext, after the first enable()
  out: null,   // master GainNode: connect to this, never to ctx.destination

  /** Call from a click or key press. Resolves true when sound is running. */
  async enable() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.18;
      this.out = this.ctx.createGain();
      this.out.gain.value = 0;
      this.out.connect(comp).connect(this.ctx.destination);
    }
    try { await this.ctx.resume(); } catch { return false; }
    this.enabled = true;
    this.out.gain.cancelScheduledValues(this.ctx.currentTime);
    this.out.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.08);
    try { sessionStorage.setItem(KEY, "1"); } catch { /* private window */ }
    listeners.forEach((fn) => fn(true));
    return true;
  },

  disable() {
    if (!this.ctx) return;
    this.enabled = false;
    this.out.gain.cancelScheduledValues(this.ctx.currentTime);
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    try { sessionStorage.removeItem(KEY); } catch { /* private window */ }
    listeners.forEach((fn) => fn(false));
  },

  toggle() { return this.enabled ? (this.disable(), Promise.resolve(false)) : this.enable(); },

  /** Subscribe to on/off. Returns an unsubscribe function. */
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  /** A short tone with a fast decay. Safe to call when sound is off: it does nothing. */
  tone({ freq = 440, to = null, dur = 0.08, type = "sine", gain = 0.12, at = 0, attack = 0.002 } = {}) {
    if (!this.enabled) return;
    const t = this.ctx.currentTime + at;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t); o.stop(t + dur + 0.02);
  },

  /** A burst of filtered noise: clicks, switches, static. */
  noise({ dur = 0.05, freq = 2000, q = 1, type = "bandpass", gain = 0.1, at = 0 } = {}) {
    if (!this.enabled) return;
    const t = this.ctx.currentTime + at;
    const n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.out);
    src.start(t);
  },

  /** The interface's small sounds, by name. */
  blip(kind = "click") {
    if (!this.enabled) return;
    switch (kind) {
      case "click": this.noise({ dur: 0.018, freq: 3200, q: 0.8, gain: 0.07 }); break;
      case "open": this.tone({ freq: 520, to: 780, dur: 0.09, type: "triangle", gain: 0.06 }); break;
      case "close": this.tone({ freq: 620, to: 360, dur: 0.08, type: "triangle", gain: 0.05 }); break;
      case "error": this.tone({ freq: 170, dur: 0.14, type: "square", gain: 0.04 }); break;
      case "tick": this.noise({ dur: 0.008, freq: 5200, q: 2, gain: 0.05 }); break;
      case "switch": this.noise({ dur: 0.03, freq: 1400, q: 1.4, gain: 0.16 }); this.tone({ freq: 90, dur: 0.05, gain: 0.08 }); break;
      case "good": this.tone({ freq: 660, dur: 0.07, type: "triangle", gain: 0.06 }); this.tone({ freq: 990, dur: 0.12, type: "triangle", gain: 0.05, at: 0.06 }); break;
      default: break;
    }
  },
};
