// Drum pad: eight voices made from oscillators and noise, and a sixteen-step sequencer. With sound
// off everything still moves; it just makes no noise.

import { h } from "../dom.js";
import { iconEl } from "../icons.js";

const VOICES = [
  { id: "kick", name: "Kick", key: "q" }, { id: "snare", name: "Snare", key: "w" }, { id: "hat", name: "Closed hat", key: "e" }, { id: "open", name: "Open hat", key: "r" },
  { id: "clap", name: "Clap", key: "a" }, { id: "tom", name: "Tom", key: "s" }, { id: "rim", name: "Rim", key: "d" }, { id: "bell", name: "Cowbell", key: "f" },
];
const START = { kick: [0, 3, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [6], clap: [12], tom: [], rim: [7, 15], bell: [] };

export default {
  id: "drums", name: ["Drum pad", "Batería"], dock: "Drums", icon: "drums",
  size: { w: 760, h: 548, minW: 360, minH: 420 },

  mount({ body, audio, frozen, os }) {
    let noiseBuf = null, noiseCtx = null;
    const noise = () => {
      const ctx = audio.ctx;
      if (noiseCtx !== ctx) {
        noiseCtx = ctx;
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      return src;
    };
    const env = (t, peak, dur, attack = 0.001) => {
      const g = audio.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      g.connect(audio.out);
      return g;
    };
    const osc = (type, f0, f1, t, dur, peak) => {
      const o = audio.ctx.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      o.connect(env(t, peak, dur)); o.start(t); o.stop(t + dur + 0.02);
    };
    const hiss = (t, dur, peak, type, freq, q = 0.7) => {
      const src = noise(), f = audio.ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      src.connect(f).connect(env(t, peak, dur)); src.start(t); src.stop(t + dur + 0.02);
    };
    /** Play one voice at context time t. Does nothing while sound is off. */
    function hit(id, t) {
      if (!audio.enabled) return;
      t = t ?? audio.ctx.currentTime;
      switch (id) {
        case "kick": osc("sine", 150, 42, t, 0.32, 0.9); hiss(t, 0.012, 0.25, "lowpass", 1800); break;
        case "snare": osc("triangle", 190, 140, t, 0.11, 0.35); hiss(t, 0.17, 0.42, "highpass", 1500); break;
        case "hat": hiss(t, 0.045, 0.22, "highpass", 7200); break;
        case "open": hiss(t, 0.32, 0.2, "highpass", 6800); break;
        case "clap": [0, 0.012, 0.025].forEach((d) => hiss(t + d, 0.02, 0.32, "bandpass", 1300, 1.2)); hiss(t + 0.03, 0.18, 0.3, "bandpass", 1300, 0.9); break;
        case "tom": osc("sine", 190, 88, t, 0.3, 0.6); break;
        case "rim": osc("square", 820, 0, t, 0.03, 0.14); hiss(t, 0.02, 0.2, "bandpass", 2600, 2); break;
        case "bell": {
          const f = audio.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 800; f.Q.value = 1.2;
          const g = env(t, 0.22, 0.34); f.connect(g);
          for (const hz of [540, 800]) { const o = audio.ctx.createOscillator(); o.type = "square"; o.frequency.value = hz; o.connect(f); o.start(t); o.stop(t + 0.36); }
          break;
        }
        default: break;
      }
    }

    // ---- pattern
    const grid = Object.fromEntries(VOICES.map((v) => [v.id, Array.from({ length: 16 }, (_, i) => START[v.id].includes(i))]));
    let playing = false, step = 0, nextAt = 0, pump = 0, bpm = 96, shown = -1;
    const flashes = new Set();
    const now = () => (audio.enabled ? audio.ctx.currentTime : performance.now() / 1000);

    const pads = VOICES.map((v) => {
      const b = h("button", { class: "os-pad", type: "button", "data-voice": v.id, "aria-label": `${v.name}, key ${v.key.toUpperCase()}` },
        h("span", { class: "os-pad__name", text: v.name }), h("kbd", { class: "os-pad__key", text: v.key.toUpperCase() }));
      b.addEventListener("pointerdown", (e) => { if (e.button === 0) strike(v.id); });
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!e.repeat) strike(v.id); } });
      return b;
    });
    const padOf = Object.fromEntries(VOICES.map((v, i) => [v.id, pads[i]]));
    function flash(id) {
      const el = padOf[id];
      if (frozen || os.calm) return;
      el.animate([{ background: "#f8fafc", color: "#080808" }, { background: "rgba(248,250,252,0)", color: "#f8fafc" }], { duration: 170, easing: "ease-out" });
    }
    function strike(id) { hit(id); flash(id); }

    const cells = {};
    const rows = VOICES.map((v) => {
      cells[v.id] = grid[v.id].map((on, i) => {
        const b = h("button", { class: "os-step", type: "button", "aria-pressed": String(on), "aria-label": `${v.name}, step ${i + 1}` });
        b.addEventListener("click", () => { grid[v.id][i] = !grid[v.id][i]; b.setAttribute("aria-pressed", String(grid[v.id][i])); if (grid[v.id][i]) hit(v.id); });
        return b;
      });
      return h("div", { class: "os-seq__row" }, h("span", { class: "os-seq__name", text: v.name }), h("div", { class: "os-seq__steps" }, cells[v.id]));
    });
    function showStep(s) {
      if (shown >= 0) for (const v of VOICES) cells[v.id][shown].classList.remove("is-now");
      shown = s;
      if (s >= 0) for (const v of VOICES) cells[v.id][s].classList.add("is-now");
    }

    function schedule() {
      while (nextAt < now() + 0.1) {
        const s = step, t = nextAt;
        for (const v of VOICES) if (grid[v.id][s]) hit(v.id, audio.enabled ? t : undefined);
        const id = setTimeout(() => { flashes.delete(id); if (!playing) return; showStep(s); for (const v of VOICES) if (grid[v.id][s]) flash(v.id); }, Math.max(0, (t - now()) * 1000));
        flashes.add(id);
        nextAt += 60 / bpm / 4;
        step = (step + 1) % 16;
      }
    }
    function play() {
      if (playing || frozen) return;
      playing = true; step = 0; nextAt = now() + 0.06;
      pump = setInterval(schedule, 25); schedule(); drawTransport();
    }
    function stop() {
      if (!playing) return;
      playing = false; clearInterval(pump); flashes.forEach(clearTimeout); flashes.clear();
      showStep(-1); drawTransport();
    }

    const playBtn = h("button", { class: "os-btn os-btn--solid os-drums__play", type: "button", onclick: () => (playing ? stop() : play()) });
    function drawTransport() { playBtn.replaceChildren(iconEl(playing ? "stop" : "play", 16), h("span", { text: playing ? "Stop" : "Play" })); }
    drawTransport();
    const bpmOut = h("output", { class: "os-drums__bpm", text: bpm + " BPM" });
    const tempo = h("input", { class: "os-range", type: "range", min: "70", max: "160", value: String(bpm), "aria-label": "Tempo" });
    tempo.addEventListener("input", () => { bpm = +tempo.value; bpmOut.textContent = bpm + " BPM"; });
    const clearBtn = h("button", { class: "os-btn", type: "button", onclick: () => { for (const v of VOICES) grid[v.id].forEach((_, i) => { grid[v.id][i] = false; cells[v.id][i].setAttribute("aria-pressed", "false"); }); } }, "Clear");

    const banner = h("div", { class: "os-drums__off" }, h("span", { text: "Sound is off, so the pads are silent." }),
      h("button", { class: "os-btn os-btn--solid", type: "button", onclick: () => audio.enable().then(() => strike("kick")) }, iconEl("sound", 16), h("span", { text: "Enable sound" })));
    const drawBanner = () => { banner.hidden = audio.enabled; if (playing) nextAt = now() + 0.05; };
    const off = audio.on(drawBanner);
    drawBanner();

    body.append(h("div", { class: "os-drums" },
      banner,
      h("div", { class: "os-drums__top" }, playBtn, h("label", { class: "os-drums__tempo" }, h("span", { text: "Tempo" }), tempo, bpmOut), clearBtn),
      h("div", { class: "os-drums__pads" }, pads),
      h("div", { class: "os-seq", role: "group", "aria-label": "Sixteen steps" }, rows)));

    return {
      key(e, typing, onControl) {
        if (typing || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
        const v = VOICES.find((x) => x.key === e.key.toLowerCase());
        if (v) { e.preventDefault(); strike(v.id); return; }
        if (e.key === " " && !onControl) { e.preventDefault(); playing ? stop() : play(); }
      },
      active(v) { if (!v) stop(); },
      destroy() { stop(); off(); },
      // for tests
      get playing() { return playing; },
    };
  },
};
