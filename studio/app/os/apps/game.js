// Stock the aisle: boxes slide across, a click drops one on the stack, whatever hangs over the edge
// is cut off and falls. A clean drop keeps the full width. Miss the stack and the shift is over.

import { h, store, clamp, two } from "../dom.js";

// The field, in its own units. The first box is a little too wide to miss the stack outright, so the
// first drops can only cost width; once the stack has narrowed, a careless drop ends the shift.
const FW = 520, FH = 640;
const BH = 36, BASE_W = 180, FLOOR = 60, PERFECT = 6;

export default {
  id: "game", name: ["Stock the aisle", "Surte el pasillo"], dock: "Game", icon: "game",
  size: { w: 520, h: 640, minW: 320, minH: 420 },

  mount({ body, audio, frozen, os, win }) {
    const cv = h("canvas", { class: "os-game__cv", "aria-label": "Stock the aisle. Press Space or click to drop a box." , role: "img" });
    const c = cv.getContext("2d");
    const title = h("h3", { class: "os-game__title" });
    const text = h("p", { class: "os-game__text" });
    const btn = h("button", { class: "os-btn os-btn--solid", type: "button", onclick: () => act() });
    const panel = h("div", { class: "os-game__panel" }, title, text, btn);
    const scoreEl = h("div", { class: "os-game__score", "aria-live": "polite" });
    const bestEl = h("div", { class: "os-game__best" });
    const el = h("div", { class: "os-game" }, cv, scoreEl, bestEl, panel);
    body.append(el);

    let state = "start";            // start | play | pause | over
    let stack = [], mover = null, debris = [], pops = [], score = 0, streak = 0, cam = 0, flash = 0;
    let best = store.get("game.best", 0);
    let raf = 0, last = 0, live = false, isFocused = true, isShown = true;
    let vw = 0, vh = 0, scale = 1, ox = 0, oy = 0;

    function reset() {
      stack = [{ x: FW / 2, w: BASE_W }];
      debris = []; pops = []; score = 0; streak = 0; cam = 0; flash = 0;
      spawn();
    }
    function spawn() {
      const top = stack[stack.length - 1];
      const fromLeft = stack.length % 2 === 1;
      mover = { w: top.w, x: fromLeft ? top.w / 2 : FW - top.w / 2, dir: fromLeft ? 1 : -1, speed: Math.min(560, 190 + score * 9) };
    }
    function drop() {
      const top = stack[stack.length - 1];
      const dx = mover.x - top.x;
      if (Math.abs(dx) <= PERFECT) {
        streak++;
        const w = streak >= 3 ? Math.min(BASE_W, top.w + 14) : top.w;
        stack.push({ x: top.x, w });
        flash = 1;
        pops.push({ x: top.x, y: stack.length, t: 0, text: streak >= 3 ? "Clean, and wider" : "Clean" });
        audio.blip("good");
      } else {
        const left = Math.max(mover.x - mover.w / 2, top.x - top.w / 2), right = Math.min(mover.x + mover.w / 2, top.x + top.w / 2);
        const y = stack.length;
        if (right - left <= 2) {
          debris.push({ x: mover.x, y, w: mover.w, vx: mover.dir * 40, vy: 0, a: 0, va: mover.dir * 1.4 });
          mover = null;
          return over();
        }
        streak = 0;
        const cutW = mover.w - (right - left);
        const cutX = dx > 0 ? right + cutW / 2 : left - cutW / 2;
        debris.push({ x: cutX, y, w: cutW, vx: Math.sign(dx) * 50, vy: 0, a: 0, va: Math.sign(dx) * 2.2 });
        stack.push({ x: (left + right) / 2, w: right - left });
        audio.noise({ dur: 0.07, freq: 320, q: 0.6, type: "lowpass", gain: 0.3 });
        audio.tone({ freq: 96, to: 60, dur: 0.09, gain: 0.18 });
      }
      score = stack.length - 1;
      spawn();
      hud();
    }
    function over() {
      state = "over";
      if (score > best) { best = score; store.set("game.best", best); }
      audio.blip("error");
      hud(); show();
    }

    function act() {
      if (state === "start" || state === "over") { reset(); state = "play"; audio.blip("open"); show(); hud(); loop(); }
      else if (state === "pause") { state = "play"; show(); loop(); }
      else if (state === "play") drop();
    }
    function pause() { if (state === "play") { state = "pause"; show(); draw(); } }

    function hud() {
      scoreEl.textContent = String(score);
      bestEl.textContent = best ? `Best ${best}` : "";
    }
    function show() {
      panel.hidden = state === "play";
      if (state === "start") {
        title.replaceChildren(...two("Stock the aisle", "Surte el pasillo"));
        text.textContent = "Boxes slide across. Click, tap or press Space to drop one on the stack. What hangs over the edge is cut off.";
        btn.textContent = "Start";
      } else if (state === "pause") {
        title.replaceChildren(...two("Paused", "En pausa"));
        text.textContent = "The shift waits for you.";
        btn.textContent = "Go on";
      } else if (state === "over") {
        title.replaceChildren(...two("Missed the stack", "Fuera de la pila"));
        text.textContent = (score === 0 ? "Nothing stocked this time." : score === 1 ? "1 box stocked." : `${score} boxes stocked.`) + (score > 0 && score === best ? " That is your best shift." : "");
        btn.textContent = "Stock again";
      }
    }

    // ---- drawing
    function size() {
      const r = Math.min(window.devicePixelRatio || 1, 2);
      vw = el.clientWidth; vh = el.clientHeight;
      if (!vw || !vh) return;
      cv.width = Math.round(vw * r); cv.height = Math.round(vh * r);
      c.setTransform(r, 0, 0, r, 0, 0);
      scale = Math.min(vw / FW, vh / FH);
      ox = (vw - FW * scale) / 2; oy = vh - FH * scale;
      draw();
    }
    function box(x, y, w, tone) {
      const top = FH - FLOOR - (y + 1) * BH + cam;
      const l = x - w / 2;
      c.fillStyle = tone; c.fillRect(l, top, w, BH);
      c.strokeStyle = "#080808"; c.lineWidth = 1.5; c.strokeRect(l + 0.75, top + 0.75, Math.max(0, w - 1.5), BH - 1.5);
      c.fillStyle = "rgba(8,8,8,0.28)";                       // the tape
      c.fillRect(l + 1.5, top + BH / 2 - 2.5, Math.max(0, w - 3), 5);
      if (w > 46) { c.fillStyle = "#080808"; for (let i = 0; i < 4; i++) c.fillRect(l + 8 + i * 4, top + 6, i % 2 ? 1 : 2, 8); }   // a label
    }
    function draw() {
      if (!vw) return;
      c.clearRect(0, 0, vw, vh);
      c.fillStyle = "#080808"; c.fillRect(0, 0, vw, vh);
      // the aisle behind: lines running to the far end
      const vx = vw / 2, vy = vh * 0.34;
      c.strokeStyle = "rgba(203,213,225,0.1)"; c.lineWidth = 1;
      for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(vx, vy); c.lineTo(vx + i * vw * 0.22, vh); c.stroke(); }
      for (let n = 0; n < 7; n++) { const y = vy + (vh - vy) / (1 + n * 0.7); c.beginPath(); c.moveTo(0, y); c.lineTo(vw, y); c.stroke(); }

      c.save();
      c.translate(ox, oy); c.scale(scale, scale);
      // the bay's posts: the box turns back at these
      c.fillStyle = "rgba(203,213,225,0.16)";
      c.fillRect(-3, -4000, 2, 4000 + FH); c.fillRect(FW + 1, -4000, 2, 4000 + FH);
      // the shelf the stack stands on
      const floorY = FH - FLOOR + cam;
      c.fillStyle = "#cbd5e1"; c.fillRect(-2000, floorY, 4000 + FW, 4);
      c.fillStyle = "#1f2328"; c.fillRect(-2000, floorY + 4, 4000 + FW, 400);
      stack.forEach((b, i) => box(b.x, i, b.w, i === stack.length - 1 && flash > 0 ? "#ffffff" : i % 2 ? "#cbd5e1" : "#e6ebf1"));
      if (mover) box(mover.x, stack.length, mover.w, "#f8fafc");
      for (const d of debris) {
        const top = FH - FLOOR - (d.y + 1) * BH + cam;
        c.save(); c.translate(d.x, top + BH / 2); c.rotate(d.a);
        c.fillStyle = "#8d98a6"; c.fillRect(-d.w / 2, -BH / 2, d.w, BH);
        c.strokeStyle = "#080808"; c.lineWidth = 1.5; c.strokeRect(-d.w / 2 + 0.75, -BH / 2 + 0.75, Math.max(0, d.w - 1.5), BH - 1.5);
        c.restore();
      }
      c.textAlign = "center"; c.font = '400 12px Michroma, sans-serif';
      for (const p of pops) {
        c.fillStyle = `rgba(248,250,252,${Math.max(0, 1 - p.t / 0.8)})`;
        c.fillText(p.text, p.x, FH - FLOOR - (p.y + 1) * BH + cam - 12 - p.t * 26);
      }
      c.restore();
    }
    function update(dt) {
      for (const p of pops) p.t += dt;
      pops = pops.filter((p) => p.t < 0.8);
      if (mover) {
        mover.x += mover.dir * mover.speed * dt;
        const lo = mover.w / 2, hi = FW - mover.w / 2;
        if (mover.x > hi) { mover.x = hi - (mover.x - hi); mover.dir = -1; }
        if (mover.x < lo) { mover.x = lo + (lo - mover.x); mover.dir = 1; }
        mover.x = clamp(mover.x, lo, hi);
      }
      for (const d of debris) { d.vy += 1500 * dt; d.y -= (d.vy * dt) / BH; d.x += d.vx * dt; d.a += d.va * dt; }
      debris = debris.filter((d) => d.y > -6);
      const want = Math.max(0, (stack.length - 7) * BH);
      cam += (want - cam) * Math.min(1, dt * 7);
      flash = Math.max(0, flash - dt * 5);
    }
    function loop() {
      cancelAnimationFrame(raf);
      if (frozen) return draw();
      last = performance.now();
      const frame = (now) => {
        const dt = Math.min(0.033, (now - last) / 1000); last = now;
        if (state === "play" || debris.length) update(dt);
        draw();
        if (state === "play" || debris.length) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    cv.addEventListener("pointerdown", (e) => { if (e.button === 0) { e.preventDefault(); act(); } });
    const gate = () => { const ok = os.active && isFocused && isShown; if (!ok && live) pause(); live = ok; };

    // the start screen: a shelf someone stocked earlier, so the rules are clear before the first drop
    stack = [[260, 180], [260, 180], [270, 160], [270, 160], [262, 144], [262, 144], [250, 120]].map(([x, w]) => ({ x, w }));
    mover = { x: 130, w: 120, dir: 1, speed: 0 };
    hud(); show();
    live = os.active;
    const ro = new ResizeObserver(size);
    ro.observe(el);

    return {
      key(e, typing, onControl) {
        if (typing || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
        if ((e.key === " " || e.key === "Enter") && !onControl) { e.preventDefault(); act(); }
        else if (e.key.toLowerCase() === "p") pause();
      },
      focus() { (panel.hidden ? win.barEl : btn).focus({ preventScroll: true }); },
      active() { gate(); },
      focused(v) { isFocused = v; gate(); },
      shown(v) { isShown = v; gate(); },
      destroy() { cancelAnimationFrame(raf); ro.disconnect(); },
      // for tests
      get state() { return state; },
      get score() { return score; },
      get peek() { return { mover: mover && { ...mover }, top: { ...stack[stack.length - 1] }, streak }; },
    };
  },
};
