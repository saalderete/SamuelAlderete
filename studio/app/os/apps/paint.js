// Paint: a sheet of frost-white paper, a brush, an eraser, a line, a rectangle. Every stroke is kept
// as a small record, so undo replays the sheet without the last one.

import { h } from "../dom.js";
import { iconEl } from "../icons.js";

const W = 1280, H = 800, PAPER = "#f8fafc";
const INKS = [["#080808", "Black"], ["#4b5563", "Graphite"], ["#cbd5e1", "Silver"], ["#d9683f", "Dusk orange"], ["#f2a65a", "Sand"], ["#3f6fb5", "Sky blue"], ["#3d8b6e", "Cactus green"], ["#b23a48", "Brick red"]];
const SIZES = [[3, "Fine"], [8, "Medium"], [18, "Wide"], [36, "Broad"]];
const TOOLS = [["brush", "Brush", "B"], ["eraser", "Eraser", "E"], ["line", "Line", "L"], ["rect", "Rectangle", "R"]];

export default {
  id: "paint", name: ["Paint", "Pintar"], icon: "paint",
  size: { w: 860, h: 600, minW: 360, minH: 320 },

  mount({ body, audio }) {
    const cv = h("canvas", { class: "os-paint__cv", width: W, height: H, role: "img", "aria-label": "Drawing sheet" });
    const c = cv.getContext("2d");
    const ops = [];
    let tool = "brush", ink = INKS[0][0], size = SIZES[1][0], op = null, snap = null;

    function stroke(o) {
      c.lineCap = "round"; c.lineJoin = "round";
      c.lineWidth = o.size; c.strokeStyle = c.fillStyle = o.tool === "eraser" ? PAPER : o.ink;
    }
    function drawOp(o) {
      if (o.tool === "clear") { c.fillStyle = PAPER; c.fillRect(0, 0, W, H); return; }
      stroke(o);
      const p = o.pts;
      if (o.tool === "line") { c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.lineTo(p[1][0], p[1][1]); c.stroke(); return; }
      if (o.tool === "rect") { c.lineJoin = "miter"; c.strokeRect(Math.min(p[0][0], p[1][0]), Math.min(p[0][1], p[1][1]), Math.abs(p[1][0] - p[0][0]), Math.abs(p[1][1] - p[0][1])); return; }
      if (p.length === 1) { c.beginPath(); c.arc(p[0][0], p[0][1], o.size / 2, 0, Math.PI * 2); c.fill(); return; }
      c.beginPath(); c.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length - 1; i++) c.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
      c.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
      c.stroke();
    }
    function redraw() { c.fillStyle = PAPER; c.fillRect(0, 0, W, H); ops.forEach(drawOp); }
    redraw();

    const at = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };

    cv.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      const p = at(e);
      op = { tool, ink, size, pts: tool === "line" || tool === "rect" ? [p, p] : [p] };
      snap = document.createElement("canvas"); snap.width = W; snap.height = H;
      snap.getContext("2d").drawImage(cv, 0, 0);
      drawOp(op);
    });
    cv.addEventListener("pointermove", (e) => {
      if (!op) return;
      const p = at(e);
      if (op.tool === "line" || op.tool === "rect") {
        op.pts[1] = e.shiftKey && op.tool === "line" ? (Math.abs(p[0] - op.pts[0][0]) > Math.abs(p[1] - op.pts[0][1]) ? [p[0], op.pts[0][1]] : [op.pts[0][0], p[1]]) : p;
      } else {
        const last = op.pts[op.pts.length - 1];
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) return;
        op.pts.push(p);
      }
      c.drawImage(snap, 0, 0);
      drawOp(op);
    });
    const end = () => {
      if (!op) return;
      ops.push(op); op = null; snap = null;
      sync();
    };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);

    function undo() { if (!ops.length) return; ops.pop(); redraw(); sync(); audio.blip("tick"); }
    function clear() { if (!ops.length || ops[ops.length - 1].tool === "clear") return; ops.push({ tool: "clear" }); redraw(); sync(); audio.blip("close"); }
    function save() {
      cv.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = h("a", { href: url, download: "studio-drawing.png" });
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }, "image/png");
      audio.blip("good");
    }

    // ---- tools
    const toolBtns = TOOLS.map(([id, label, key]) => h("button", { class: "os-tool", type: "button", "data-tool": id, title: `${label} (${key})`, "aria-label": `${label} (${key})`, onclick: () => { tool = id; sync(); audio.blip("click"); } }, iconEl(id, 18), h("span", { text: label })));
    const sizeBtns = SIZES.map(([px, label]) => h("button", { class: "os-tool os-tool--size", type: "button", title: `${label} stroke`, "aria-label": `${label} stroke`, onclick: () => { size = px; sync(); audio.blip("click"); } }, h("i", { style: { width: Math.max(3, px * 0.55) + "px", height: Math.max(3, px * 0.55) + "px" } })));
    const inkBtns = INKS.map(([hex, label]) => h("button", { class: "os-ink", type: "button", title: label, "aria-label": label, style: { background: hex }, onclick: () => { ink = hex; if (tool === "eraser") tool = "brush"; sync(); audio.blip("click"); } }));
    const undoBtn = h("button", { class: "os-tool", type: "button", onclick: undo }, iconEl("undo", 18), h("span", { text: "Undo" }));
    const clearBtn = h("button", { class: "os-tool", type: "button", onclick: clear }, iconEl("trash", 18), h("span", { text: "Clear" }));
    const saveBtn = h("button", { class: "os-tool", type: "button", onclick: save }, iconEl("download", 18), h("span", { text: "Save PNG" }));

    function sync() {
      toolBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === tool)));
      sizeBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(SIZES[i][0] === size)));
      inkBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(INKS[i][0] === ink && tool !== "eraser")));
      undoBtn.disabled = !ops.length;
      clearBtn.disabled = !ops.length || ops[ops.length - 1].tool === "clear";
      cv.dataset.tool = tool;
    }
    sync();

    body.append(h("div", { class: "os-paint" },
      h("div", { class: "os-paint__bar", role: "toolbar", "aria-label": "Drawing tools" },
        h("div", { class: "os-paint__group" }, toolBtns),
        h("div", { class: "os-paint__group" }, sizeBtns),
        h("div", { class: "os-paint__group os-paint__inks" }, inkBtns),
        h("div", { class: "os-paint__group os-paint__end" }, undoBtn, clearBtn, saveBtn)),
      h("div", { class: "os-paint__stage" }, cv)));

    return {
      key(e, typing) {
        if (typing) return;
        const k = e.key.toLowerCase();
        if ((e.metaKey || e.ctrlKey) && k === "z") { e.preventDefault(); undo(); return; }
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const t = TOOLS.find((x) => x[2].toLowerCase() === k);
        if (t) { tool = t[0]; sync(); }
      },
      // for tests and the curious
      get strokes() { return ops.length; },
    };
  },
};
