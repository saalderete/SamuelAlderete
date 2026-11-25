// The screen on the studio's desk: a small desktop drawn in the page's own HTML. It boots with the
// site's greetings, opens onto a desktop with a dock, and its windows drag, resize and stack.
//
//   const os = createOS({ root, host });
//   await os.boot();            // or os.freeze(t) for a still frame
//   os.setActive(true);         // while the visitor is inside the screen
//
// Everything is laid out from the root's own size (it is drawn small through a 3D transform while
// the visitor stands in the room), and nothing here touches the network.

import { audio } from "../audio.js";
import * as content from "../content.js";
import { h, store, clamp, two, isTyping } from "./dom.js";
import { iconEl, icon } from "./icons.js";
import { WALLPAPERS, tintOf } from "./wallpapers.js";
import inventory from "./apps/inventory.js";
import notes from "./apps/notes.js";
import terminal from "./apps/terminal.js";
import resume from "./apps/resume.js";
import contact from "./apps/contact.js";
import videos from "./apps/videos.js";
import paint from "./apps/paint.js";
import drums from "./apps/drums.js";
import game from "./apps/game.js";
import settings from "./apps/settings.js";

const APPS = [inventory, notes, terminal, resume, contact, videos, paint, drums, game, settings];
const DOCK_GAP_BEFORE = new Set(["videos", "settings"]);
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

// The boot, in seconds from boot(): black, the greetings one after another, "Open / Abierto",
// the shutter lifting, the two windows arriving.
const G = content.greetings;
const T_FIRST = 0.25, T_EACH = 0.15;
const T_OPEN = T_FIRST + G.length * T_EACH;   // 2.05
const T_LIFT = T_OPEN + 0.6;                  // 2.65
const T_DESK = T_LIFT + 0.45;                 // 3.10: the desktop is up
const T_DONE = T_DESK + 0.32;                 // 3.42: the windows have settled
const CALM_HOLD = 0.9, CALM_DONE = 1.25;      // reduced motion: one sign, one fade

export function createOS({ root, host }) {
  const frozen = host.frozen != null;
  const subs = { tint: new Set(), ready: new Set() };
  const emit = (name, value) => subs[name]?.forEach((fn) => { try { fn(value); } catch (err) { console.error(err); } });

  root.classList.add("os");
  root.classList.toggle("os--frozen", frozen);
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "The screen on the desk");
  root.setAttribute("inert", "");

  // ---- stylesheet (scoped under .os); the root stays hidden until it has arrived
  let loaded = Promise.resolve();
  if (!document.querySelector("link[data-os-css]")) {
    const link = h("link", { rel: "stylesheet", href: new URL("./os.css", import.meta.url).href, "data-os-css": "" });
    root.style.visibility = "hidden";
    loaded = new Promise((done) => {
      link.addEventListener("load", done, { once: true });
      link.addEventListener("error", done, { once: true });
    }).then(() => { root.style.visibility = ""; });
    document.head.append(link);
  }

  // ---- state
  let styled = false;
  loaded.then(() => { styled = true; });
  let active = false;
  let calm = !!host.reducedMotion || store.get("calm", false);
  let phone = false;
  let zTop = 10;
  let focused = null;
  let menuOpen = false;
  let booted = false, defaultsMade = false, bootRaf = 0, clockTimer = 0, destroyed = false;
  const wins = new Map();   // program id -> window
  const tiles = new Map();  // program id -> dock tile
  const appById = Object.fromEntries(APPS.map((a) => [a.id, a]));
  root.classList.toggle("os--calm", calm);

  // ---- the fixed parts
  const wall = h("canvas", { class: "os-wall", "aria-hidden": "true" });
  const nameBtn = h("button", { class: "os-bar__name", type: "button", "aria-haspopup": "menu", "aria-expanded": "false" },
    h("span", { text: content.person.name }), iconEl("caret", 14));
  const appName = h("span", { class: "os-bar__app" });
  const soundBtn = h("button", { class: "os-bar__btn os-bar__sound", type: "button" });
  const clockEl = h("time", { class: "os-bar__clock" });
  const exitBtn = h("button", { class: "os-bar__btn os-bar__exit", type: "button", onclick: () => exit() },
    iconEl("back", 16), h("span", { text: "Back to the room" }));
  const bar = h("header", { class: "os-bar" }, nameBtn, appName, h("div", { class: "os-bar__right" }, soundBtn, clockEl, exitBtn));
  const sign = h("div", { class: "os-sign", "aria-hidden": "true" }, h("i", {}), h("span", {}, "Open", h("span", { class: "os-es", text: " / Abierto" })));
  const desk = h("main", { class: "os-desk" }, sign);
  const dockRow = h("div", { class: "os-dock__row" });
  const dock = h("nav", { class: "os-dock", "aria-label": "Programs" }, dockRow);
  const menu = h("div", { class: "os-menu", role: "menu", hidden: true });
  const screen = h("div", { class: "os-screen" }, wall, bar, desk, dock, menu);
  const bootWord = h("div", { class: "os-boot__word" });
  const bootEl = h("div", { class: "os-boot", "aria-hidden": "true" }, bootWord,
    h("div", { class: "os-boot__foot" }, h("span", { text: content.person.name }), h("span", { text: content.person.role })));
  root.append(screen, bootEl);

  const href = (url) => (url.startsWith("../") ? host.site + url.slice(3) : url);

  // ---- wallpaper
  let wp = WALLPAPERS.find((w) => w.id === store.get("wallpaper", "chrome")) || WALLPAPERS[0];
  let tint = tintOf(wp);
  function paintWall() {
    const w = root.clientWidth, hh = root.clientHeight;
    if (!w || !hh) return;
    const r = Math.min(window.devicePixelRatio || 1, 2);
    wall.width = Math.round(w * r); wall.height = Math.round(hh * r);
    wp.draw(wall.getContext("2d"), wall.width, wall.height);
  }
  function setWallpaper(id) {
    const next = WALLPAPERS.find((w) => w.id === id);
    if (!next) return false;
    wp = next; store.set("wallpaper", id);
    paintWall();
    tint = tintOf(wp);
    emit("tint", tint.slice());
    return true;
  }

  // ---- sound control
  function drawSound() {
    soundBtn.replaceChildren(iconEl(audio.enabled ? "sound" : "mute", 16), h("span", { text: audio.enabled ? "Sound on" : "Enable sound" }));
    soundBtn.setAttribute("aria-pressed", audio.enabled ? "true" : "false");
  }
  soundBtn.addEventListener("click", async () => { await audio.toggle(); audio.blip("click"); });
  const offAudio = audio.on(drawSound);
  drawSound();

  // ---- clock
  function tick() {
    const d = new Date();
    clockEl.textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    clockEl.dateTime = d.toISOString();
    clockTimer = setTimeout(tick, 60050 - (d.getSeconds() * 1000 + d.getMilliseconds()));
  }
  if (frozen) clockEl.textContent = "7:42 PM"; else tick();

  // ---- the name's menu
  const menuItem = (label, fn) => h("button", { class: "os-menu__item", type: "button", role: "menuitem", onclick: () => { closeMenu(); fn(); } }, label);
  menu.append(
    menuItem("About this screen", () => open("settings")),
    menuItem("Everything on one list", () => open("inventory")),
    h("a", { class: "os-menu__item", role: "menuitem", href: host.site }, "The plain site"),
    h("span", { class: "os-menu__rule", role: "separator" }),
    menuItem("Back to the room", () => exit()),
  );
  function openMenu() {
    menuOpen = true; menu.hidden = false; nameBtn.setAttribute("aria-expanded", "true");
    if (active && !frozen) menu.querySelector(".os-menu__item").focus({ preventScroll: true });
  }
  function closeMenu(refocus) {
    if (!menuOpen) return;
    menuOpen = false; menu.hidden = true; nameBtn.setAttribute("aria-expanded", "false");
    if (refocus && active) nameBtn.focus({ preventScroll: true });
  }
  nameBtn.addEventListener("click", () => { audio.blip("click"); menuOpen ? closeMenu() : openMenu(); });
  menu.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const its = [...menu.querySelectorAll(".os-menu__item")], i = its.indexOf(document.activeElement);
    its[(i + (e.key === "ArrowDown" ? 1 : its.length - 1)) % its.length].focus();
  });

  // ---- dock
  for (const app of APPS) {
    if (DOCK_GAP_BEFORE.has(app.id)) dockRow.append(h("span", { class: "os-dock__gap", "aria-hidden": "true" }));
    const tile = h("button", { class: "os-dock__tile", type: "button", "data-app": app.id },
      iconEl(app.icon, 22), h("span", { class: "os-dock__label", text: app.dock || app.name[0] }));
    tile.addEventListener("click", () => {
      audio.blip("click");
      const w = wins.get(app.id);
      if (w && !w.min && focused === w) minimise(w); else open(app.id);
    });
    tiles.set(app.id, tile);
    dockRow.append(tile);
  }
  function syncDock() {
    for (const [id, tile] of tiles) {
      const w = wins.get(id);
      tile.classList.toggle("is-open", !!w);
      tile.classList.toggle("is-min", !!w && w.min);
      tile.classList.toggle("is-focus", !!w && focused === w);
      const state = !w ? "" : w.min ? ", minimised" : focused === w ? ", in front" : ", open";
      tile.setAttribute("aria-label", appById[id].name[0] + state);
      if (phone && focused === w && w) {      // keep the front program's tile in view, without scrolling anything else
        const l = tile.offsetLeft, r = l + tile.offsetWidth;
        if (l < dockRow.scrollLeft) dockRow.scrollLeft = l - 8;
        else if (r > dockRow.scrollLeft + dockRow.clientWidth) dockRow.scrollLeft = r - dockRow.clientWidth + 8;
      }
    }
    appName.textContent = focused ? focused.app.name[0] : "Desktop";
  }

  // ---- windows
  const deskSize = () => [desk.clientWidth, desk.clientHeight];
  function rectOf(w) {
    const [W, H] = deskSize();
    return w.max ? { x: 0, y: 0, w: W, h: H } : { x: w.x, y: w.y, w: w.w, h: w.h };
  }
  function placeWin(w) {
    const r = rectOf(w);
    w.el.style.transform = `translate3d(${Math.round(r.x)}px, ${Math.round(r.y)}px, 0)`;
    const sw = Math.round(r.w) + "px", sh = Math.round(r.h) + "px";
    const resized = w.el.style.width !== sw || w.el.style.height !== sh;
    w.el.style.width = sw; w.el.style.height = sh;
    w.el.classList.toggle("is-max", w.max);
    if (resized) w.inst.resize?.();
  }
  function clampWin(w) {
    const [W, H] = deskSize();
    w.w = clamp(w.w, Math.min(w.minW, W), W); w.h = clamp(w.h, Math.min(w.minH, H), H);
    w.x = clamp(w.x, 0, Math.max(0, W - w.w)); w.y = clamp(w.y, 0, Math.max(0, H - w.h));
  }
  function relayout() {
    for (const w of wins.values()) {
      if (phone) w.max = true;
      clampWin(w); placeWin(w); drawMax(w);
    }
  }
  function drawMax(w) {
    w.maxBtn.replaceChildren(iconEl(w.max ? "restore" : "max", 15));
    w.maxBtn.setAttribute("aria-label", w.max ? "Restore" : "Maximise");
    w.maxBtn.hidden = phone;
  }

  function createWin(app, rect, quiet) {
    const [W, H] = deskSize();
    const s = app.size, n = wins.size;
    const w = { app, id: app.id, min: false, max: phone, minW: s.minW || 320, minH: s.minH || 220, inst: {} };
    const r = rect || {};
    w.w = clamp(r.w ?? s.w, Math.min(w.minW, W), W);
    w.h = clamp(r.h ?? s.h, Math.min(w.minH, H), H);
    w.x = r.x ?? (W - w.w) / 2 + ((n % 5) - 2) * 30;
    w.y = r.y ?? (H - w.h) / 2 - 12 + ((n % 5) - 2) * 24;
    clampWin(w);

    const ctl = (name, label, fn) => h("button", { class: "os-win__btn", type: "button", "aria-label": label, onclick: fn }, iconEl(name, 15));
    w.maxBtn = ctl("max", "Maximise", () => toggleMax(w));
    w.barEl = h("header", { class: "os-win__bar", tabindex: "0", "aria-label": `${app.name[0]}. Arrow keys move this window, Shift with arrow keys resizes it.` },
      iconEl(app.icon, 15), h("h2", { class: "os-win__title" }, two(app.name[0], app.name[1])),
      h("div", { class: "os-win__ctl" }, ctl("min", "Minimise", () => minimise(w)), w.maxBtn, ctl("close", "Close", () => close(w))));
    const body = h("div", { class: "os-win__body" });
    w.el = h("section", { class: `os-win os-win--${app.id}`, role: "dialog", "aria-label": app.name[0] }, w.barEl, body);
    for (const dir of ["n", "e", "s", "w", "ne", "se", "sw", "nw"]) {
      const grip = h("div", { class: `os-win__rs os-win__rs--${dir}`, "aria-hidden": "true" });
      grip.addEventListener("pointerdown", (e) => startResize(e, w, dir, grip));
      w.el.append(grip);
    }
    desk.append(w.el);
    wins.set(app.id, w);
    placeWin(w); drawMax(w);
    w.inst = app.mount({ body, os: api, host, audio, content, store, href, frozen, win: w }) || {};

    w.el.addEventListener("pointerdown", () => focusWin(w), true);
    w.barEl.addEventListener("pointerdown", (e) => startDrag(e, w));
    w.barEl.addEventListener("dblclick", (e) => { if (!e.target.closest("button")) toggleMax(w); });
    w.barEl.addEventListener("keydown", (e) => keyMove(e, w));

    if (!quiet) {
      audio.blip("open");
      if (!calm && !frozen) {
        const t = w.el.style.transform;
        w.el.animate([{ opacity: 0, transform: `${t} scale(0.97)` }, { opacity: 1, transform: `${t} scale(1)` }], { duration: 180, easing: EASE_OUT });
      }
    }
    return w;
  }

  function startDrag(e, w) {
    if (e.button !== 0 || e.target.closest("button")) return;
    if (w.max || phone) return;
    const sx = e.clientX, sy = e.clientY, ox = w.x, oy = w.y, bar = w.barEl;
    bar.setPointerCapture(e.pointerId);
    w.el.classList.add("is-moving");
    const move = (ev) => { w.x = ox + ev.clientX - sx; w.y = oy + ev.clientY - sy; clampWin(w); placeWin(w); };
    const up = () => {
      w.el.classList.remove("is-moving");
      bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); bar.removeEventListener("pointercancel", up);
    };
    bar.addEventListener("pointermove", move); bar.addEventListener("pointerup", up); bar.addEventListener("pointercancel", up);
  }

  function startResize(e, w, dir, grip) {
    if (e.button !== 0 || w.max || phone) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, o = { x: w.x, y: w.y, w: w.w, h: w.h };
    const [W, H] = deskSize();
    grip.setPointerCapture(e.pointerId);
    w.el.classList.add("is-moving");
    const move = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let { x, y, w: ww, h: hh } = o;
      if (dir.includes("e")) ww = clamp(o.w + dx, w.minW, W - o.x);
      if (dir.includes("s")) hh = clamp(o.h + dy, w.minH, H - o.y);
      if (dir.includes("w")) { x = clamp(o.x + dx, 0, Math.max(0, o.x + o.w - w.minW)); ww = o.w + o.x - x; }
      if (dir.includes("n")) { y = clamp(o.y + dy, 0, Math.max(0, o.y + o.h - w.minH)); hh = o.h + o.y - y; }
      Object.assign(w, { x, y, w: ww, h: hh });
      placeWin(w);
    };
    const up = () => {
      w.el.classList.remove("is-moving");
      grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); grip.removeEventListener("pointercancel", up);
    };
    grip.addEventListener("pointermove", move); grip.addEventListener("pointerup", up); grip.addEventListener("pointercancel", up);
  }

  function keyMove(e, w) {
    if (e.target !== w.barEl || w.max || phone) return;
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault(); e.stopPropagation();
    if (e.shiftKey) { w.w += d[0] * 24; w.h += d[1] * 24; } else { w.x += d[0] * 24; w.y += d[1] * 24; }
    clampWin(w); placeWin(w);
  }

  function focusWin(w, moveFocus) {
    if (focused !== w) {
      const prev = focused;
      focused = w;
      if (prev) { prev.el.classList.remove("is-focus"); prev.inst.focused?.(false); }
      w.el.classList.add("is-focus");
      w.el.style.zIndex = String(++zTop);
      w.inst.focused?.(true);
      syncDock();
    }
    if (moveFocus && active && !frozen) (w.inst.focus ? w.inst.focus() : w.barEl.focus({ preventScroll: true }));
  }
  function focusTop() {
    let top = null;
    for (const w of wins.values()) if (!w.min && (!top || +w.el.style.zIndex > +top.el.style.zIndex)) top = w;
    if (top) focusWin(top, true); else syncDock();
  }
  function minimise(w) {
    w.min = true; w.el.hidden = true;
    w.inst.shown?.(false);
    if (focused === w) { focused = null; w.el.classList.remove("is-focus"); w.inst.focused?.(false); focusTop(); }
    syncDock(); audio.blip("close");
    if (active) tiles.get(w.id)?.focus({ preventScroll: true });
  }
  function close(w) {
    try { w.inst.destroy?.(); } catch (err) { console.error(err); }
    w.el.remove(); wins.delete(w.id);
    if (focused === w) { focused = null; focusTop(); }
    syncDock(); audio.blip("close");
    if (active && !focused) tiles.get(w.id)?.focus({ preventScroll: true });
  }
  function toggleMax(w) {
    if (phone) return;
    w.max = !w.max;
    clampWin(w); placeWin(w); drawMax(w);
  }

  function open(id, arg) {
    const app = appById[id];
    if (!app) return false;
    if (!styled) { loaded.then(() => open(id, arg)); return true; }
    let w = wins.get(id);
    if (!w) w = createWin(app);
    if (w.min) { w.min = false; w.el.hidden = false; placeWin(w); w.inst.shown?.(true); }
    focusWin(w, true);
    if (arg !== undefined) w.inst.arg?.(arg);
    return true;
  }

  // ---- boot
  function word(html) { if (bootWord._html !== html) { bootWord._html = html; bootWord.innerHTML = html; } }
  const OPEN_SIGN = `<span class="os-boot__open">Open</span><span class="os-boot__abierto"> / Abierto</span>`;
  const escape = (s) => s.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));

  function measure() {
    phone = root.clientWidth < 700;
    root.classList.toggle("os--phone", phone);
  }
  function makeDefaults() {
    if (defaultsMade) return;
    defaultsMade = true;
    measure();
    const [W, H] = deskSize();
    const m = Math.round(clamp(Math.min(W, H) * 0.045, 12, 44));
    const aw = Math.round(clamp(W * 0.45, 380, 800)), ah = Math.round(clamp(H - m * 2, 300, 760));
    const tw = Math.round(clamp(W * 0.4, 340, 720)), th = Math.round(clamp(H * 0.5, 240, 480));
    const term = createWin(appById.terminal, { x: W - tw - m * 1.5, y: m * 2, w: tw, h: th }, true);
    const about = createWin(appById.notes, { x: m * 1.5, y: m, w: aw, h: ah }, true);
    about.isDefault = term.isDefault = true;
    focusWin(phone ? about : term);
    if (phone) focusWin(about);
  }
  function fadeDefaults(a, b) {
    const set = (w, v) => {
      if (!w || !w.isDefault) return;
      w.el.style.opacity = v >= 1 ? "" : String(v);
    };
    set(wins.get("notes"), a); set(wins.get("terminal"), b);
  }
  function applyBoot(t) {
    if (calm && !frozen) return applyCalmBoot(t);
    if (t >= T_LIFT - 0.08) makeDefaults();
    if (t >= T_DONE) { bootEl.hidden = true; bootEl.style.transform = ""; fadeDefaults(1, 1); return; }
    bootEl.hidden = false;
    if (t < T_FIRST) word("");
    else if (t < T_OPEN) word(`<span class="os-boot__hello">${escape(G[Math.min(G.length - 1, Math.floor((t - T_FIRST) / T_EACH))])}</span>`);
    else word(OPEN_SIGN);
    const p = clamp((t - T_LIFT) / (T_DESK - T_LIFT), 0, 1);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    bootEl.style.transform = p > 0 ? `translate3d(0, ${(-e * 101).toFixed(3)}%, 0)` : "";
    fadeDefaults(clamp((t - (T_DESK - 0.12)) / 0.24, 0, 1), clamp((t - T_DESK) / 0.24, 0, 1));
  }
  function applyCalmBoot(t) {
    makeDefaults();
    if (t >= CALM_DONE) { bootEl.hidden = true; bootEl.style.opacity = ""; return; }
    bootEl.hidden = false; word(OPEN_SIGN);
    bootEl.style.opacity = String(1 - clamp((t - CALM_HOLD) / (CALM_DONE - CALM_HOLD), 0, 1));
  }
  function ready() { if (!booted) { booted = true; emit("ready"); } }

  function boot({ instant = false } = {}) {
    cancelAnimationFrame(bootRaf);
    return loaded.then(() => new Promise((done) => {
      if (destroyed) return done();
      if (instant || frozen) { applyBoot(Infinity); ready(); return done(); }
      const upAt = calm ? CALM_DONE : T_DESK, endAt = calm ? CALM_DONE : T_DONE;
      const t0 = performance.now();
      let told = false;
      const step = (now) => {
        const t = (now - t0) / 1000;
        applyBoot(t);
        if (t >= upAt && !told) { told = true; ready(); done(); }
        if (t < endAt) bootRaf = requestAnimationFrame(step);
      };
      bootRaf = requestAnimationFrame(step);
    }));
  }

  function freeze(t) {
    cancelAnimationFrame(bootRaf); clearTimeout(clockTimer);
    root.classList.add("os--frozen");
    clockEl.textContent = "7:42 PM";
    return loaded.then(() => {
      const was = calm; calm = false;       // a still frame always follows the full boot's clock
      applyBoot(t);
      calm = was;
      if (t >= T_DESK) ready();
    });
  }

  // ---- active / keyboard
  function setActive(v) {
    v = !!v;
    if (v === active) return;
    active = v;
    root.toggleAttribute("inert", !v);
    root.classList.toggle("os--active", v);
    if (!v) closeMenu();
    for (const w of wins.values()) w.inst.active?.(v);
    if (v && focused && !frozen) focused.inst.focus?.();
  }
  function exit() { closeMenu(); host.exit?.(); }

  function onKey(e) {
    if (!active) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (menuOpen) closeMenu(true); else exit();
      return;
    }
    if (menuOpen || !focused || focused.min) return;
    if (e.target instanceof Node && root.contains(e.target) && e.target.closest?.(".os-bar, .os-dock, .os-win__bar")) return;
    const onControl = e.target instanceof Element && !!e.target.closest("button, a, input, select, textarea, [role=switch]");
    focused.inst.key?.(e, isTyping(e.target), onControl);
  }
  function onDown(e) {
    if (menuOpen && !menu.contains(e.target) && !nameBtn.contains(e.target)) closeMenu();
  }
  document.addEventListener("keydown", onKey);
  document.addEventListener("pointerdown", onDown, true);

  // ---- size
  const ro = new ResizeObserver(() => {
    measure();
    paintWall(); relayout();
  });
  ro.observe(root);

  function setCalm(v) {
    calm = !!v; store.set("calm", calm);
    root.classList.toggle("os--calm", calm);
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(bootRaf); clearTimeout(clockTimer);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("pointerdown", onDown, true);
    ro.disconnect(); offAudio();
    for (const w of [...wins.values()]) { try { w.inst.destroy?.(); } catch { /* going away anyway */ } }
    wins.clear();
    root.replaceChildren();
    root.classList.remove("os", "os--frozen", "os--calm", "os--phone", "os--active");
  }

  const api = {
    boot, freeze, open, setActive, destroy,
    on(name, fn) { subs[name]?.add(fn); return () => subs[name]?.delete(fn); },
    get tint() { return tint.slice(); },
    // beyond the contract, for the programs and for anyone curious:
    loaded,
    exit,
    get active() { return active; },
    get calm() { return calm; },
    setCalm,
    get wallpaper() { return wp.id; },
    wallpapers: WALLPAPERS,
    setWallpaper,
    programs: APPS.map((a) => ({ id: a.id, name: a.name[0] })),
    /** The running program's own handle (null while it is closed). Tests use it. */
    program(id) { return wins.get(id)?.inst ?? null; },
    icon,
  };
  syncDock();
  return api;
}
