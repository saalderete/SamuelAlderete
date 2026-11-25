// The desktop's wallpapers, each drawn in code on a canvas. The interface has no hue, but a picture
// may: the room outside reads the wallpaper's average colour and lights the desk with it.

import { rng } from "./dom.js";

function line(c, x1, y1, x2, y2) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }

function chrome(c, w, h) {
  const hz = h * 0.6;
  let g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, "#07080a"); g.addColorStop(0.42, "#1d2228"); g.addColorStop(0.8, "#8792a0");
  g.addColorStop(0.96, "#e8edf2"); g.addColorStop(1, "#ffffff");
  c.fillStyle = g; c.fillRect(0, 0, w, hz + 1);
  g = c.createLinearGradient(0, hz, 0, h);
  g.addColorStop(0, "#020203"); g.addColorStop(0.22, "#121519"); g.addColorStop(1, "#474e58");
  c.fillStyle = g; c.fillRect(0, hz, w, h - hz);
  // the brushing: thin level streaks, lighter and darker
  const r = rng(7), step = Math.max(1, Math.round(h / 720));
  for (let y = 0; y < h; y += step) {
    const a = r() * 0.045;
    c.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    c.fillRect(0, y, w, step);
  }
  // a glint where the horizon catches the light
  c.save();
  c.translate(w * 0.64, hz); c.scale(1, 0.09);
  const rg = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.42);
  rg.addColorStop(0, "rgba(255,255,255,0.7)"); rg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = rg; c.fillRect(-w, -w, w * 2, w * 2);
  c.restore();
}

function aisle(c, w, h) {
  const u = Math.max(w, h) / 1600;
  c.fillStyle = "#080808"; c.fillRect(0, 0, w, h);
  const vx = w * 0.5, vy = h * 0.44;
  const glow = c.createRadialGradient(vx, vy, 0, vx, vy, w * 0.5);
  glow.addColorStop(0, "rgba(203,213,225,0.2)"); glow.addColorStop(0.5, "rgba(203,213,225,0.05)"); glow.addColorStop(1, "rgba(203,213,225,0)");
  c.fillStyle = glow; c.fillRect(0, 0, w, h);
  c.lineWidth = Math.max(1, u);
  // the floor: boards running to the far end, and the joints across them
  c.strokeStyle = "rgba(203,213,225,0.2)";
  for (let i = -9; i <= 9; i++) line(c, vx, vy, vx + i * w * 0.17, h);
  for (let n = 0; n <= 11; n++) {
    const y = vy + (h - vy) / (1 + n * 0.55);
    const half = (y - vy) / (h - vy) * w * 0.17 * 9;
    line(c, vx - half, y, vx + half, y);
  }
  // shelves on both walls
  c.strokeStyle = "rgba(203,213,225,0.32)";
  const levels = [-0.06, 0.2, 0.46, 0.72];
  for (const side of [0, w]) {
    for (const lv of levels) line(c, vx, vy, side, h * lv);
    for (let n = 0; n <= 8; n++) {
      const k = 1 / (1 + n * 0.6);
      const x = vx + (side - vx) * k;
      const top = vy + (h * levels[0] - vy) * k, bottom = vy + (h - vy) * k;
      line(c, x, top, x, bottom);
    }
  }
}

function ridge(c, w, h, seed, base, amp, color) {
  const r = rng(seed);
  const p = [r() * 6.3, r() * 6.3, r() * 6.3, r() * 6.3];
  c.fillStyle = color;
  c.beginPath(); c.moveTo(0, h);
  for (let i = 0; i <= 160; i++) {
    const x = i / 160;
    const n = 0.5 + 0.28 * Math.sin(x * 5.1 + p[0]) + 0.16 * Math.sin(x * 12.7 + p[1]) + 0.07 * Math.sin(x * 31 + p[2]) + 0.035 * Math.sin(x * 77 + p[3]);
    c.lineTo(x * w, base - amp * n);
  }
  c.lineTo(w, h); c.closePath(); c.fill();
}

function dusk(c, w, h) {
  const u = Math.max(w, h) / 1600, hz = h * 0.7;
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, "#0a0f2e"); g.addColorStop(0.36, "#1f2052"); g.addColorStop(0.62, "#5d3567");
  g.addColorStop(0.82, "#b9524d"); g.addColorStop(0.94, "#ee8f4b"); g.addColorStop(1, "#f6c17a");
  c.fillStyle = g; c.fillRect(0, 0, w, hz + 1);
  c.fillStyle = "#0a0812"; c.fillRect(0, hz, w, h - hz);
  const r = rng(11);
  for (let i = 0; i < 150; i++) {
    const s = Math.max(1, u * (0.7 + r() * 1.3));
    c.fillStyle = `rgba(248,250,252,${0.15 + r() * 0.65})`;
    c.fillRect(r() * w, r() * hz * 0.52, s, s);
  }
  const sun = c.createRadialGradient(w * 0.3, hz, 0, w * 0.3, hz, w * 0.42);
  sun.addColorStop(0, "rgba(255,220,160,0.55)"); sun.addColorStop(1, "rgba(255,220,160,0)");
  c.fillStyle = sun; c.fillRect(0, 0, w, hz);
  ridge(c, w, h, 3, hz + h * 0.01, h * 0.2, "#5a3a68");
  ridge(c, w, h, 5, hz + h * 0.05, h * 0.13, "#2e2142");
  // the city coming on in the valley
  for (let i = 0; i < 260; i++) {
    const s = Math.max(1, u * (1 + r() * 1.4));
    c.fillStyle = r() > 0.3 ? `rgba(255,198,122,${0.3 + r() * 0.7})` : `rgba(255,238,206,${0.3 + r() * 0.6})`;
    c.fillRect(r() * w, hz + h * (0.035 + r() * 0.1), s, s);
  }
  ridge(c, w, h, 9, hz + h * 0.2, h * 0.1, "#0d0a16");
}

function blueprint(c, w, h) {
  const u = Math.max(w, h) / 1600;
  const bg = c.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.75);
  bg.addColorStop(0, "#163a70"); bg.addColorStop(1, "#0a1f42");
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  const minor = 28 * u;
  c.lineWidth = Math.max(1, u * 0.8);
  for (let x = 0, i = 0; x <= w; x += minor, i++) { c.strokeStyle = i % 5 ? "rgba(214,230,255,0.07)" : "rgba(214,230,255,0.16)"; line(c, x, 0, x, h); }
  for (let y = 0, i = 0; y <= h; y += minor, i++) { c.strokeStyle = i % 5 ? "rgba(214,230,255,0.07)" : "rgba(214,230,255,0.16)"; line(c, 0, y, w, y); }
  // a floor plan: outer walls in a double line, partitions, door swings, dimension strings
  const bw = Math.min(w * 0.56, h * 1.25), bh = bw * 0.56, x0 = (w - bw) / 2, y0 = (h - bh) / 2 - h * 0.02, t = bw * 0.016;
  c.strokeStyle = "rgba(226,238,255,0.78)"; c.lineWidth = Math.max(1, u * 1.6);
  c.strokeRect(x0, y0, bw, bh); c.strokeRect(x0 + t, y0 + t, bw - 2 * t, bh - 2 * t);
  c.lineWidth = Math.max(1, u * 1.2);
  line(c, x0 + bw * 0.42, y0 + t, x0 + bw * 0.42, y0 + bh * 0.58);
  line(c, x0 + t, y0 + bh * 0.58, x0 + bw * 0.3, y0 + bh * 0.58);
  line(c, x0 + bw * 0.36, y0 + bh * 0.58, x0 + bw * 0.66, y0 + bh * 0.58);
  line(c, x0 + bw * 0.72, y0 + bh * 0.58, x0 + bw - t, y0 + bh * 0.58);
  line(c, x0 + bw * 0.7, y0 + bh * 0.58, x0 + bw * 0.7, y0 + bh - t);
  c.strokeStyle = "rgba(226,238,255,0.5)"; c.lineWidth = Math.max(1, u);
  const door = (cx, cy, rad, a0, a1) => { c.beginPath(); c.arc(cx, cy, rad, a0, a1); c.stroke(); line(c, cx, cy, cx + rad * Math.cos(a0), cy + rad * Math.sin(a0)); };
  door(x0 + bw * 0.3, y0 + bh * 0.58, bw * 0.06, Math.PI * 0.5, Math.PI * 0);
  door(x0 + bw * 0.72, y0 + bh * 0.58, bw * 0.06, Math.PI * 1.5, Math.PI * 2);
  const dim = (x1, y1, x2, y2) => {
    line(c, x1, y1, x2, y2);
    const k = 6 * u, nx = y2 === y1 ? 0 : 1, ny = y2 === y1 ? 1 : 0;
    for (const [x, y] of [[x1, y1], [x2, y2]]) line(c, x - nx * k - ny * k * 0.6, y - ny * k + nx * k * 0.6, x + nx * k + ny * k * 0.6, y + ny * k - nx * k * 0.6);
  };
  dim(x0, y0 - bw * 0.04, x0 + bw, y0 - bw * 0.04);
  dim(x0, y0 + bh + bw * 0.04, x0 + bw * 0.42, y0 + bh + bw * 0.04);
  dim(x0 + bw * 0.42, y0 + bh + bw * 0.04, x0 + bw, y0 + bh + bw * 0.04);
  dim(x0 - bw * 0.04, y0, x0 - bw * 0.04, y0 + bh);
  // north
  const nx = x0 + bw + bw * 0.09, ny = y0 + bw * 0.05, nr = bw * 0.028;
  c.beginPath(); c.arc(nx, ny, nr, 0, Math.PI * 2); c.stroke();
  c.fillStyle = "rgba(226,238,255,0.7)";
  c.beginPath(); c.moveTo(nx, ny - nr * 1.5); c.lineTo(nx + nr * 0.5, ny + nr * 0.5); c.lineTo(nx - nr * 0.5, ny + nr * 0.5); c.closePath(); c.fill();
}

function frost(c, w, h) {
  const u = Math.max(w, h) / 1600;
  c.fillStyle = "#edf1f5"; c.fillRect(0, 0, w, h);
  const lamp = c.createRadialGradient(w * 0.62, h * 0.3, 0, w * 0.62, h * 0.3, w * 0.55);
  lamp.addColorStop(0, "rgba(255,255,255,0.95)"); lamp.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = lamp; c.fillRect(0, 0, w, h);
  // shelf edges with their tag holders
  const r = rng(21);
  for (let i = 1; i <= 4; i++) {
    const y = Math.round(h * (0.08 + i * 0.19));
    c.fillStyle = "#cbd5e1"; c.fillRect(0, y, w, Math.max(1, Math.round(u)));
    c.fillStyle = "rgba(8,8,8,0.05)"; c.fillRect(0, y + Math.max(1, Math.round(u)), w, Math.round(10 * u));
    for (let x = w * 0.04; x < w * 0.96; x += w * (0.07 + r() * 0.09)) {
      const tw = w * (0.03 + r() * 0.03);
      c.fillStyle = "#ffffff"; c.fillRect(x, y + 3 * u, tw, 13 * u);
      c.fillStyle = "#4b5563"; c.fillRect(x + 4 * u, y + 8 * u, tw * 0.55, Math.max(1, 2 * u));
    }
  }
}

function black(c, w, h) {
  const u = Math.max(w, h) / 1600;
  c.fillStyle = "#080808"; c.fillRect(0, 0, w, h);
  const y = Math.round(h * 0.62);
  c.fillStyle = "rgba(203,213,225,0.28)"; c.fillRect(0, y, w, Math.max(1, Math.round(u)));
  c.fillStyle = "rgba(203,213,225,0.5)";
  for (let i = 0; i <= 24; i++) c.fillRect(Math.round(w * i / 24), y - (i % 4 ? 4 : 9) * u, Math.max(1, Math.round(u)), (i % 4 ? 4 : 9) * u);
}

export const WALLPAPERS = [
  { id: "chrome", name: ["Chrome", "Cromo"], draw: chrome },
  { id: "aisle", name: ["Aisle", "Pasillo"], draw: aisle },
  { id: "dusk", name: ["Dusk", "Atardecer"], draw: dusk },
  { id: "blueprint", name: ["Blueprint", "Plano"], draw: blueprint },
  { id: "frost", name: ["Frost", "Escarcha"], draw: frost },
  { id: "black", name: ["Black", "Negro"], draw: black },
];

/** The wallpaper's average colour, [r, g, b] in 0..1 sRGB. */
export function tintOf(wp) {
  const cv = document.createElement("canvas");
  cv.width = 96; cv.height = 54;
  const c = cv.getContext("2d", { willReadFrequently: true });
  wp.draw(c, 96, 54);
  const d = c.getImageData(0, 0, 96, 54).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4 * 255;
  return [r / n, g / n, b / n];
}
