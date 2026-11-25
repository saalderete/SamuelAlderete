// The printed things in the room: shelf tags, the lit sign, the invoice on the clipboard, the calendar
// page, the résumé sheet, the card in the tray, the keyboard's keys. Each is a small canvas drawn here
// with the site's own typefaces and words, then handed to its surface in the model.

import * as THREE from "three";
import { person, items, alsoOnTheShelf, byId } from "../content.js";

const INK = "#0b0b0c", PAPER = "#ecebe6", RULE = "#b9b8b2", GREY = "#55585c";
const D = (px) => `${px}px Michroma`;
const T = (px, w = 500) => `${w} ${px}px Inter`;

function canvas(w, h, bg = PAPER) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.textBaseline = "alphabetic";
  return [c, g];
}

function fit(g, text, font, maxW, px) {
  let size = px;
  g.font = font(size);
  while (g.measureText(text).width > maxW && size > 6) { size -= 1; g.font = font(size); }
  return size;
}

function wrap(g, text, x, y, maxW, lh, maxLines = 99) {
  const words = text.split(" ");
  let line = "", n = 0;
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (g.measureText(t).width > maxW && line) {
      g.fillText(line, x, y); y += lh; n++; line = w;
      if (n >= maxLines) return y;
    } else line = t;
  }
  if (line) { g.fillText(line, x, y); y += lh; }
  return y;
}

function spaced(g, text, x, y, gap) {
  for (const ch of text) { g.fillText(ch, x, y); x += g.measureText(ch).width + gap; }
  return x;
}

const draw = {
  sign() {
    const [c, g] = canvas(1032, 204, "#ffffff");
    g.fillStyle = INK;
    g.font = D(74);
    const a = "OPEN", b = "ABIERTO";
    const wa = g.measureText(a).width + 3 * 10, wb = g.measureText(b).width + 6 * 10;
    const total = wa + 96 + wb;
    let x = (1032 - total) / 2;
    spaced(g, a, x, 128, 10);
    g.fillRect(x + wa + 44, 58, 5, 88);
    spaced(g, b, x + wa + 96, 128, 10);
    return c;
  },
  tag(id) {
    const it = byId[id];
    const [c, g] = canvas(520, 104);
    g.fillStyle = INK; g.fillRect(0, 0, 10, 104);
    fit(g, it.tag.toUpperCase(), D, 330, 30);
    g.fillText(it.tag.toUpperCase(), 30, 64);
    g.fillStyle = GREY; g.font = T(20, 600); g.textAlign = "right";
    g.fillText(it.es.toUpperCase(), 500, 62);
    return c;
  },
  bin(id) {
    const it = alsoOnTheShelf.find((s) => s.id === id);
    const [c, g] = canvas(400, 160);
    g.fillStyle = INK;
    const name = id === "gpi-portal" ? "GPI portal" : it.name;
    fit(g, name, D, 340, 40); g.textAlign = "center";
    g.fillText(name, 200, 78);
    g.fillStyle = GREY; g.font = T(24, 500); g.fillText(it.sub, 200, 124);
    return c;
  },
  invoice() {
    const [c, g] = canvas(450, 600);
    g.fillStyle = INK; g.font = D(30); g.fillText("KasaPro", 34, 70);
    g.font = T(18, 600); g.fillStyle = GREY; g.fillText("Invoice / Factura", 36, 102);
    g.fillStyle = RULE; g.fillRect(34, 122, 382, 2);
    const rows = ["Estimate", "Job", "E-signature", "Invoice", "Card payment"];
    rows.forEach((r, i) => {
      const y = 176 + i * 62;
      g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(38, y - 22, 26, 26);
      g.beginPath(); g.moveTo(43, y - 9); g.lineTo(50, y - 1); g.lineTo(62, y - 19); g.stroke();
      g.fillStyle = INK; g.font = T(24, 500); g.fillText(r, 84, y);
      g.fillStyle = RULE; g.fillRect(84, y + 14, 332, 1.5);
    });
    g.save(); g.translate(318, 530); g.rotate(-0.16);
    g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(-78, -34, 156, 62);
    g.fillStyle = INK; g.font = D(30); g.textAlign = "center"; g.fillText("PAID", 0, 10);
    g.restore();
    return c;
  },
  reader() {
    const [c, g] = canvas(200, 144, "#0d1114");
    g.fillStyle = "#cbd5e1"; g.font = T(30, 600); g.textAlign = "center"; g.fillText("Approved", 100, 84);
    return c;
  },
  calendar(_id, now) {
    const [c, g] = canvas(488, 528);
    g.fillStyle = INK; g.fillRect(0, 0, 488, 112);
    g.fillStyle = "#f8fafc"; g.font = D(38); g.textAlign = "center";
    g.fillText(new Intl.DateTimeFormat("en", { month: "long" }).format(now).toUpperCase(), 244, 74);
    g.fillStyle = INK; g.font = "800 250px Inter";
    g.fillText(String(now.getDate()), 244, 372);
    g.font = T(40, 600); g.fillStyle = GREY;
    const en = new Intl.DateTimeFormat("en", { weekday: "long" }).format(now), es = new Intl.DateTimeFormat("es", { weekday: "long" }).format(now);
    g.fillText(`${en} / ${es}`, 244, 470);
    return c;
  },
  resume() {
    const [c, g] = canvas(630, 891, "#f1f0eb");
    let y = 82;
    g.fillStyle = INK; g.font = D(34); g.fillText(person.name, 54, y); y += 30;
    g.font = T(15, 500); g.fillStyle = GREY; g.fillText(`${person.email}  |  El Paso, TX  |  github.com/saalderete  |  nerrixdigital.com`, 54, y); y += 34;
    const head = (t) => { g.fillStyle = INK; g.font = T(17, 700); g.fillText(t, 54, y); g.fillStyle = INK; g.fillRect(54, y + 7, 522, 1.5); y += 30; };
    const row = (l, r) => { g.fillStyle = INK; g.font = T(15, 600); g.fillText(l, 54, y); g.font = T(13, 500); g.fillStyle = GREY; g.textAlign = "right"; g.fillText(r, 576, y); g.textAlign = "left"; y += 20; };
    const body = (t, lines = 3) => { g.fillStyle = "#2a2c2f"; g.font = T(12.5, 400); y = wrap(g, t, 54, y, 522, 17, lines) + 8; };
    head("Education");
    row(byId.utep.name, byId.utep.sub); body("Bachelor of Science in Computer Science", 1);
    y += 6; head("Experience");
    for (const id of ["studio", "bwfusion", "foreman"]) { const it = byId[id]; row(it.name, it.sub.split(" · ")[0]); body(it.text, 3); }
    y += 6; head("Projects");
    for (const it of items.filter((i) => i.kind === "project")) { row(it.name, it.stack.slice(0, 3).join(", ")); body(it.text, 2); }
    return c;
  },
  card() {
    const [c, g] = canvas(534, 306, "#f4f3ee");
    g.fillStyle = INK; g.font = D(34); g.fillText(person.name, 40, 96);
    g.font = T(21, 500); g.fillStyle = GREY; g.fillText(person.role, 42, 134);
    g.fillStyle = INK; g.fillRect(42, 172, 60, 3);
    g.font = T(21, 500); g.fillText(person.email, 42, 222);
    g.fillStyle = GREY; g.fillText("El Paso, Texas", 42, 256);
    return c;
  },
  keys() {
    const [c, g] = canvas(930, 300, "#9c9fa3");
    const rows = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.6], [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.1], [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.8], [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.3], [1.3, 1.3, 1.3, 5.6, 1.3, 1.3, 1, 1, 1]];
    const pad = 12, gap = 6, rh = (300 - pad * 2 - gap * 4) / 5;
    rows.forEach((r, j) => {
      const units = r.reduce((a, b) => a + b, 0);
      const u = (930 - pad * 2 - gap * (r.length - 1)) / units;
      let x = pad;
      for (const k of r) {
        g.fillStyle = "#17191c"; g.beginPath(); g.roundRect(x, pad + j * (rh + gap), k * u, rh, 7); g.fill();
        g.fillStyle = "#24272b"; g.beginPath(); g.roundRect(x + 3, pad + j * (rh + gap) + 2, k * u - 6, rh - 8, 5); g.fill();
        x += k * u + gap;
      }
    });
    return c;
  },
};

export async function drawLabels(labels, renderer) {
  await Promise.all([document.fonts.load(D(30)), document.fonts.load(T(20, 500)), document.fonts.load(T(20, 800))]);
  const now = new Date();
  const max = renderer.capabilities.getMaxAnisotropy();
  for (const [name, mat] of Object.entries(labels)) {
    const [kind, ...rest] = name.split(".");
    if (!draw[kind]) continue;
    const tex = new THREE.CanvasTexture(draw[kind](rest.join("."), now));
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, max);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    mat.uniforms.tMap.value = tex;
  }
}
