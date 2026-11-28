// The studio. One page: a baked room drawn with three.js, and a real little operating system (os/)
// sitting where the monitor's glass is. In the room the OS is squeezed onto the monitor by a CSS
// transform and seen through a transparent hole in the canvas; when you sit down, the camera flies in
// until that hole fills the window, the transform comes off, and the OS is simply the page.
//
// Address bar:  ?t=<seconds> freezes time (nothing animates; the picture is the one at that moment)
//               ?view=room|desk|shelf|window|name|screen   &card=<id>   &app=<program>   &q=1 (full quality)

import * as THREE from "three";
import { loadRoom } from "./room/room.js";
import { makeSky, makeDust, makeCone, Post } from "./room/fx.js";
import { drawLabels } from "./room/labels.js";
import { audio } from "./audio.js";
import { byId, alsoOnTheShelf, items as ITEMS } from "./content.js";

const Q = new URLSearchParams(location.search);
const FROZEN = Q.has("t") ? Math.max(0, parseFloat(Q.get("t")) || 0) : null;
const VIEW = Q.get("view") || "room";
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s) => document.querySelector(s);
const canvas = $("#gl"), screenEl = $("#screen"), tube = $("#tube"), strike = $("#strike"), veil = $("#veil"), cardEl = $("#card"), soundBtn = $("#sound"), reach = $("#reach");

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (cur, target, k, dt) => cur + (target - cur) * (1 - Math.exp(-k * dt));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------------------------------------------------------------------------------------- timings
const T_FADE = 1.2;          // the room comes up from black
const T_MON = 1.5;           // the monitor's tube strikes
const T_BOOT = T_MON + 0.44; // the picture starts on the second flash

// How bright each baked layer is drawn, and its colour. The bake decides shape; this decides mood.
const TONE = {
  sky: [0.7, 0.72, 0.76], lamp: [1.0, 0.66, 0.36], mon: [0.74, 0.84, 1.0], strip: [1.0, 0.71, 0.42], sign: [1.0, 0.97, 0.93], name: [1.0, 0.8, 0.58],
  gain: { lamp: 0.66, mon: 1.3, strip: 1.0, sign: 1.1, name: 0.95 },
  exposure: 1.55,
};

// The monitor's tube: a flash, darkness, two stutters, then it warms up and holds with a faint mains shimmer.
function tubeLevel(t) {
  const u = t - T_MON;
  if (u < 0) return 0;
  if (REDUCED) return smooth(0, 0.9, u);                 // no flashing for visitors who ask for less motion
  if (u < 0.045) return 0.85;
  if (u < 0.2) return 0.0;
  if (u < 0.25) return 0.55;
  if (u < 0.43) return 0.03;
  if (u < 0.5) return 1.0;
  if (u < 0.6) return 0.22;
  if (u < 1.15) return 0.5 + 0.5 * smooth(0.6, 1.15, u);
  return 1.0 - 0.012 * (0.5 + 0.5 * Math.sin(t * 37.0));
}
// The sign over the shelves flickers on the way the site's sign does, and now and then it catches again.
function signLevel(t) {
  if (REDUCED) return smooth(0.3, 1.0, t);
  if (t < 0.4) return 0;
  if (t < 0.46) return 1;
  if (t < 0.62) return 0.05;
  if (t < 0.68) return 0.9;
  if (t < 0.9) return 0.12;
  if (t < 1.0) return 1;
  if (t < 1.14) return 0.35;
  const c = t % 23.7;
  if (c > 23.3 && c < 23.38) return 0.3;
  if (c > 23.5 && c < 23.55) return 0.55;
  return 1;
}

// ---------------------------------------------------------------------------------------- start
start().catch((err) => {
  console.error(err);
  $("#veil-note").innerHTML = 'This room needs WebGL 2. Everything in it is on the <a href="../" style="color:inherit">plain site</a>.';
});

async function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.autoClear = false;
  if (!renderer.capabilities.isWebGL2) throw new Error("WebGL 2 is not available");

  const bar = $("#veil-bar");
  const room = await loadRoom((p) => { bar.style.transform = `scaleX(${p.toFixed(3)})`; });
  await drawLabels(room.labels, renderer);
  const { scene, meta, U, glows, labels } = room;

  // ---- the OS on the monitor
  let createOS;
  try { ({ createOS } = await import("./os/os.js")); } catch (e) { console.warn("The screen's programs did not load:", e); }
  const host = { exit: () => leaveScreen(), frozen: FROZEN == null ? null : FROZEN - T_BOOT, reducedMotion: REDUCED, site: "../", assets: "../assets/" };
  const os = createOS ? createOS({ root: $("#os"), host }) : { boot: async () => {}, freeze() {}, open() {}, setActive() {}, tint: [0.1, 0.11, 0.13], on() {} };
  let osReady = false, monTint = V(0.16, 0.18, 0.22);
  const setTint = (c) => { if (c) monTint.set(Math.pow(c[0], 2.2), Math.pow(c[1], 2.2), Math.pow(c[2], 2.2)); };
  os.on("tint", setTint); os.on("ready", () => { osReady = true; setTint(os.tint); });

  // ---- scene dressing
  const world = new THREE.Scene();
  world.add(scene);
  const sky = makeSky(meta, room.VERT, U); world.add(sky);
  const cone = makeCone(meta, U); world.add(cone);
  const dust = makeDust(meta, U); world.add(dust);

  // the monitor: its glass is black and reflective; the picture is a hole that shows the page behind
  const S = meta.anchors.screen.corners.map((c) => V(...c));           // TL, TR, BR, BL
  const sC = S[0].clone().add(S[1]).add(S[2]).add(S[3]).multiplyScalar(0.25);
  const sRight = S[1].clone().sub(S[0]), sUp = S[0].clone().sub(S[3]);
  const sW = sRight.length(), sH = sUp.length();
  sRight.normalize(); sUp.normalize();
  const sN = sRight.clone().cross(sUp).normalize();
  const sQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(sRight, sUp, sN));
  const glassFrag = room.glass[0].material.fragmentShader;
  // Where the page does not reach (a phone's page is tall, the glass is wide) the glass shows the
  // desktop's wallpaper, so the monitor is lit from edge to edge and the page reads as a window on it.
  // The wallpaper is drawn by the OS's own code onto a canvas here, then stored as the light that,
  // after the room's exposure and film curve, comes out the colour the page itself would show.
  const glassCv = document.createElement("canvas"); glassCv.width = 512; glassCv.height = 288;
  const glassTex = new THREE.CanvasTexture(glassCv);
  glassTex.colorSpace = THREE.NoColorSpace; glassTex.generateMipmaps = true; glassTex.minFilter = THREE.LinearMipmapLinearFilter;
  const UNTONE = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    const y = Math.min(0.93, Math.pow(i / 255, 2.2));                  // what the film curve has to give back (whites held under the glow)
    const a = 2.51 - 2.43 * y, b = 0.03 - 0.59 * y, c = -0.14 * y;
    const x = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a) / TONE.exposure;   // the light that does it
    UNTONE[i] = Math.round(Math.sqrt(Math.min(1, x / 2)) * 255);       // kept as a square root: fine steps in the dark
  }
  function paintGlass() {
    const wp = (os.wallpapers || []).find((w) => w.id === os.wallpaper);
    if (!wp) return;
    const g = glassCv.getContext("2d", { willReadFrequently: true });
    wp.draw(g, glassCv.width, glassCv.height);
    const im = g.getImageData(0, 0, glassCv.width, glassCv.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) { d[i] = UNTONE[d[i]]; d[i + 1] = UNTONE[d[i + 1]]; d[i + 2] = UNTONE[d[i + 2]]; }
    g.putImageData(im, 0, 0);
    glassTex.needsUpdate = true;
  }
  paintGlass(); os.on("tint", paintGlass); os.on("ready", paintGlass);
  const backMat = new THREE.ShaderMaterial({
    vertexShader: room.VERT,
    uniforms: { ...U, uAlpha: { value: 1 }, tWall: { value: glassTex }, uWall: { value: 0 }, uGlassAt: { value: sC },
      uGlassX: { value: sRight.clone().divideScalar(sW) }, uGlassY: { value: sUp.clone().divideScalar(sH) } },
    fragmentShader: glassFrag
      .replace("uniform float uAlpha;", "uniform float uAlpha; uniform sampler2D tWall; uniform float uWall; uniform vec3 uGlassAt, uGlassX, uGlassY;")
      .replace("gl_FragColor = vec4(r * f, uAlpha);", `vec2 suv = vec2(dot(vWorld - uGlassAt, uGlassX), dot(vWorld - uGlassAt, uGlassY)) + 0.5;
        vec3 wall = texture2D(tWall, suv).rgb; wall = wall * wall * 2.0;
        gl_FragColor = vec4(r * f + wall * uWall, uAlpha);`),
  });
  room.screenMesh.material = backMat;
  let glassShows = 0;                                                  // 1 when a good part of the glass is not covered by the page
  const holeMat = new THREE.ShaderMaterial({
    vertexShader: room.VERT, blending: THREE.NoBlending, uniforms: { ...U, uAlpha: { value: 0 } },
    fragmentShader: glassFrag.replace("gl_FragColor = vec4(r * f, uAlpha);", "gl_FragColor = vec4(r * f * 0.55, 0.0);"),
  });
  const holeGeo = new THREE.PlaneGeometry(1, 1); holeGeo.setAttribute("uv1", holeGeo.getAttribute("uv"));
  const hole = new THREE.Mesh(holeGeo, holeMat);
  hole.quaternion.copy(sQuat); hole.position.copy(sC).addScaledVector(sN, 0.0012); hole.renderOrder = 2;
  world.add(hole);
  const virt = { w: sW, h: sH };                                       // the part of the glass the page covers
  const vCorner = (sx, sy) => sC.clone().addScaledVector(sRight, sx * virt.w / 2).addScaledVector(sUp, sy * virt.h / 2);

  // ---- the things you can pick up with your eyes
  const things = {};
  for (const [id, it] of Object.entries(meta.items)) {
    const group = new THREE.Group();
    group.position.set(...it.at);
    scene.add(group);
    for (const o of room.byItem[id] || []) group.attach(o);
    const lo = V(...it.min).min(V(...it.max)), hi = V(...it.min).max(V(...it.max));
    const onDesk = id === "resume" || id === "contact";
    const box = new THREE.Box3(lo.clone().addScalar(-0.012), hi.clone().addScalar(0.012));
    if (!onDesk) box.min.y -= 0.045;                                     // the shelf tag below it counts too
    things[id] = { id, group, box, home: group.position.clone(), centre: lo.clone().add(hi).multiplyScalar(0.5), size: hi.clone().sub(lo), hot: 0, onDesk, tag: labels["tag." + id] };
  }
  const lampAt = V(...meta.anchors.lamp);
  const state = { mode: "room", hover: null, card: null, lampOn: true, lampLevel: 1, inside: false, quality: 1 };

  // ---- camera
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 40);
  const VIEWS = {
    room: { pos: V(0.08, 1.3, 2.28), look: V(0.14, 1.06, -2.2) },
    desk: { pos: V(-0.2, 1.3, 0.25), look: V(0.2, 0.98, -2.0) },
    shelf: { pos: V(1.45, 1.22, 0.55), look: V(2.0, 1.02, -2.1) },
    window: { pos: V(-1.0, 1.4, 0.7), look: V(-1.6, 1.52, -2.4) },
    name: { pos: V(0.25, 1.55, 0.2), look: V(0.25, 1.72, -2.2) },
  };
  const baseView = VIEWS[VIEW] || VIEWS.room;
  const rig = { px: 0, py: 0, tx: 0, ty: 0, yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, dolly: 0, tdolly: 0, lastInput: -99 };
  const pose = { pos: V(), quat: new THREE.Quaternion() };              // where the camera is now
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), UP = V(0, 1, 0);
  let flight = null;                                                    // { from, to(), t0, dur }

  function fov() {
    const a = innerWidth / innerHeight;
    // wide windows get a 35 degree lens; tall ones open up, but only so far: a phone frames the desk and you look around
    return a >= 1.5 ? 35 : clamp(2 * Math.atan(Math.tan((35 * Math.PI) / 360) * (1.5 / a)) * 180 / Math.PI, 35, 58);
  }
  function lookPose(pos, look, out) {
    out.pos.copy(pos);
    tmpM.lookAt(pos, look, UP);
    out.quat.setFromRotationMatrix(tmpM);
    return out;
  }
  const roomOut = { pos: V(), quat: new THREE.Quaternion() }, a3 = V(), b3 = V();
  function roomPose(t) {
    const drift = REDUCED || FROZEN != null ? 0 : 1;
    a3.copy(baseView.pos);
    a3.x += rig.px * 0.26 - Math.sin(rig.yaw) * 0.9 + Math.sin(t * 0.21) * 0.03 * drift;
    a3.y += rig.py * 0.09 + Math.sin(t * 0.17 + 1.0) * 0.012 * drift;
    b3.copy(baseView.look);
    b3.x += rig.px * 0.1 + Math.tan(rig.yaw) * 4.5;
    b3.y += rig.py * 0.04 + Math.tan(rig.pitch) * 4.5;
    const fwd = b3.clone().sub(a3).normalize();
    a3.addScaledVector(fwd, rig.dolly);
    a3.z += Math.sin(t * 0.13) * 0.025 * drift;
    return lookPose(a3, b3, roomOut);
  }
  const focusOut = { pos: V(), quat: new THREE.Quaternion() };
  function focusPose(th) {
    const narrow = innerWidth < 700;
    const d = clamp(Math.max(th.size.x, th.size.y) * 2.6, 0.62, 1.0) * (narrow ? 1.25 : 1);
    // on a phone the card is a sheet over the lower part of the window, so the thing sits in the upper quarter
    const drop = narrow ? 0.29 * 2 * d * Math.tan((camera.fov * Math.PI) / 360) : 0;
    if (th.onDesk) return lookPose(th.centre.clone().add(V(narrow ? 0 : -0.1, 0.5 + drop * 0.3, 0.52)), th.centre.clone().add(V(narrow ? 0 : -0.14, -drop * 0.5, -0.03 + drop * 0.45)), focusOut);
    const side = narrow ? 0 : -0.2 * d;
    return lookPose(th.centre.clone().add(V(side * 0.4 - rig.px * 0.04, 0.06 + rig.py * 0.03, d)), th.centre.clone().add(V(side, -drop, 0)), focusOut);
  }
  const screenOut = { pos: V(), quat: new THREE.Quaternion() };
  function screenPose() {
    const d = (virt.h / 2) / Math.tan((camera.fov * Math.PI) / 360);
    screenOut.pos.copy(sC).addScaledVector(sN, d);
    screenOut.quat.copy(sQuat);
    return screenOut;
  }
  const target = (t) => (state.mode === "screen" ? screenPose() : state.mode === "focus" && state.card ? focusPose(things[state.card]) : roomPose(t));
  function fly(dur) {
    flight = { from: { pos: pose.pos.clone(), quat: pose.quat.clone() }, t0: now(), dur: REDUCED ? 0.01 : dur };
  }

  // ---- size and quality
  const post = new Post(renderer);
  let scale = Q.get("q") === "1" || FROZEN != null ? 1 : 1, lastW = 0, lastH = 0, lastScale = 0;
  function resize(force) {
    const w = innerWidth, h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2) * scale;
    if (!force && w === lastW && h === lastH && scale === lastScale) return;
    lastW = w; lastH = h; lastScale = scale;
    renderer.setPixelRatio(1);
    renderer.setSize(Math.round(w * dpr), Math.round(h * dpr), false);
    post.resize(Math.round(w * dpr), Math.round(h * dpr), dpr >= 1.75 ? 2 : 4);
    camera.aspect = w / h; camera.fov = fov(); camera.updateProjectionMatrix();
    dust.material.uniforms.uPx.value = (h * dpr) / 900;
    // the page keeps the window's shape, so it covers the largest window-shaped part of the 16:9 glass
    const a = w / h;
    if (a >= sW / sH) { virt.w = sW; virt.h = sW / a; } else { virt.h = sH; virt.w = sH * a; }
    hole.scale.set(virt.w, virt.h, 1);
    glassShows = (virt.w * virt.h) / (sW * sH) < 0.75 ? 1 : 0;
  }
  addEventListener("resize", () => resize());
  resize(true);

  // ---- the page on the glass: map the window-sized element onto the four projected corners
  const pv = V();
  function project(p) { pv.copy(p).project(camera); return [(pv.x * 0.5 + 0.5) * innerWidth, (1 - (pv.y * 0.5 + 0.5)) * innerHeight, pv.z]; }
  function placeScreen() {
    if (state.inside) return;
    const c = [vCorner(-1, 1), vCorner(1, 1), vCorner(1, -1), vCorner(-1, -1)].map(project);
    if (c.some((p) => p[2] > 1 || p[2] < -1)) { screenEl.style.visibility = "hidden"; return; }
    const [x0, y0] = c[0], [x1, y1] = c[1], [x2, y2] = c[2], [x3, y3] = c[3];
    const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
    const det = dx1 * dy2 - dx2 * dy1;
    const g = (sx * dy2 - dx2 * sy) / det, h = (dx1 * sy - sx * dy1) / det;
    const w = innerWidth, hh = innerHeight;
    const m = [(x1 - x0 + g * x1) / w, (y1 - y0 + g * y1) / w, 0, g / w, (x3 - x0 + h * x3) / hh, (y3 - y0 + h * y3) / hh, 0, h / hh, 0, 0, 1, 0, x0, y0, 0, 1];
    screenEl.style.visibility = "visible";
    screenEl.style.transform = `matrix3d(${m.map((v) => +v.toFixed(7)).join(",")})`;
  }

  // ---- sitting down at the computer, and getting up
  function enterScreen(app, arg) {
    if (state.mode === "screen") { if (app) os.open(app, arg); return; }
    closeCard(true);
    state.mode = "screen"; fly(2.1);
    audio.noise({ dur: 1.5, freq: 500, q: 0.6, type: "lowpass", gain: 0.05 });
    flight.done = () => {
      state.inside = true;
      document.body.classList.add("inside");
      screenEl.style.transform = "none"; screenEl.removeAttribute("aria-hidden"); screenEl.inert = false;
      os.setActive(true);
      if (app) os.open(app, arg);
    };
  }
  function leaveScreen() {
    if (state.mode !== "screen") return;
    os.setActive(false);
    state.inside = false; state.mode = "room";
    document.body.classList.remove("inside");
    screenEl.setAttribute("aria-hidden", "true"); screenEl.inert = true;
    pose.pos.copy(screenPose().pos); pose.quat.copy(screenOut.quat);
    fly(1.7);
    audio.noise({ dur: 1.1, freq: 380, q: 0.6, type: "lowpass", gain: 0.04 });
    canvas.focus({ preventScroll: true });
  }

  // ---- cards
  const X_ICON = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function cardData(id) {
    if (byId[id]) return byId[id];
    const s = alsoOnTheShelf.find((x) => x.id === id);
    return s && { id, es: "También en el estante", name: s.name, sub: s.sub, text: s.text, facts: [], stack: [], links: s.href ? [{ label: "Open it", href: s.href }] : [], kindLabel: "Also on the shelf" };
  }
  const KIND = { project: "Project", experience: "Experience", education: "Education", desk: "On the desk" };
  let lastFocus = null;
  function openCard(id, fromKeyboard) {
    const d = cardData(id); if (!d) return;
    if (state.card === id) return closeCard();
    state.card = id; state.mode = "focus"; fly(1.15);
    const ext = (h) => (/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : "");
    cardEl.innerHTML = `
      <div class="top"><span class="chip">${esc(d.kindLabel || KIND[d.kind])} / ${esc(d.es)}</span><button class="x" type="button" aria-label="Close">${X_ICON}</button></div>
      <h2>${esc(d.name)}</h2><p class="sub">${esc(d.sub)}</p>
      <p class="text">${esc(d.text)}</p>
      ${d.facts.length ? `<dl>${d.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""}
      ${d.stack.length ? `<ul class="stack">${d.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
      ${d.note ? `<p class="note">${esc(d.note)}</p>` : ""}
      <div class="links">${d.links.map((l) => `<a href="${esc(l.href)}"${ext(l.href)}>${esc(l.label)}</a>`).join("")}<button type="button" data-os>See it on the computer</button></div>`;
    cardEl.hidden = false;
    cardEl.setAttribute("role", "dialog"); cardEl.setAttribute("aria-label", d.name);
    cardEl.querySelector(".x").onclick = () => closeCard();
    cardEl.querySelector("[data-os]").onclick = () => enterScreen(byId[id] ? "inventory" : "inventory", id);
    requestAnimationFrame(() => cardEl.classList.add("open"));
    audio.blip("open");
    lastFocus = fromKeyboard ? document.activeElement : null;
    if (fromKeyboard) cardEl.querySelector(".x").focus();
  }
  function closeCard(quiet) {
    if (!state.card) return;
    state.card = null;
    if (state.mode === "focus") { state.mode = "room"; fly(1.2); }
    cardEl.classList.remove("open");
    setTimeout(() => { if (!state.card) cardEl.hidden = true; }, 240);
    if (!quiet) audio.blip("close");
    if (lastFocus) { lastFocus.focus(); lastFocus = null; }
  }
  function placeCard() {
    if (!state.card || innerWidth < 700) return;
    const th = things[state.card];
    const [x, y] = project(th.centre);
    const r = cardEl.getBoundingClientRect(), w = r.width || 380, h = r.height || 300;
    const half = (th.size.x / 2 + 0.06) * (innerHeight / (2 * Math.tan((camera.fov * Math.PI) / 360) * Math.max(0.4, camera.position.distanceTo(th.centre))));
    let cx = x - half - w - 28;
    if (cx < 16) cx = Math.min(innerWidth - w - 16, x + half + 28);
    const cy = clamp(y - h / 2, 16, innerHeight - h - 16);
    cardEl.style.setProperty("--x", `${Math.round(cx)}px`); cardEl.style.setProperty("--y", `${Math.round(cy)}px`);
  }

  // ---- the lamp
  function toggleLamp() {
    state.lampOn = !state.lampOn; state.lampStruck = now();
    audio.blip("switch");
  }

  // ---- pointer, wheel, keys
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = V();
  const screenPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(sN, sC);
  function pick(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = null, bd = 1e9;
    for (const th of Object.values(things)) {
      if (ray.ray.intersectBox(th.box, hit)) { const d = hit.distanceTo(camera.position); if (d < bd) { bd = d; best = { kind: "item", id: th.id }; } }
    }
    if (ray.ray.intersectPlane(screenPlane, hit)) {
      const rel = hit.clone().sub(sC), d = hit.distanceTo(camera.position);
      if (Math.abs(rel.dot(sRight)) < sW / 2 + 0.012 && Math.abs(rel.dot(sUp)) < sH / 2 + 0.012 && d < bd) { bd = d; best = { kind: "screen" }; }
    }
    const sp = new THREE.Sphere(lampAt, 0.11);
    if (ray.ray.intersectSphere(sp, hit)) { const d = hit.distanceTo(camera.position); if (d < bd) { bd = d; best = { kind: "lamp" }; } }
    return best;
  }
  const hitKey = (h) => (h ? (h.kind === "item" ? h.id : h.kind) : null);
  let down = null, lastMove = { x: innerWidth / 2, y: innerHeight / 2, t: 0 }, gust = 0;
  function setHover(h) {
    const key = hitKey(h);
    if (key === state.hover) return;
    state.hover = key; state.hoverKind = h ? h.kind : null;
    canvas.classList.toggle("hot", !!h);
    if (h) audio.blip("tick");
  }
  canvas.addEventListener("pointermove", (e) => {
    const t = performance.now();
    const v = Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y) / Math.max(8, t - lastMove.t);
    gust = Math.min(1, gust + v * 0.05);
    lastMove = { x: e.clientX, y: e.clientY, t };
    rig.tx = (e.clientX / innerWidth) * 2 - 1; rig.ty = -((e.clientY / innerHeight) * 2 - 1);
    rig.lastInput = now();
    if (down) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.drag && Math.hypot(dx, dy) > 7) { down.drag = true; canvas.classList.add("drag"); setHover(null); }
      if (down.drag && state.mode === "room") {
        const reach = innerWidth < innerHeight ? 0.62 : 0.42;
        rig.tyaw = clamp(down.yaw - dx * (innerWidth < 700 ? 0.004 : 0.0019), -reach, reach); rig.tpitch = clamp(down.pitch + dy * 0.0012, -0.1, 0.12);
      }
    } else if (state.mode !== "screen" && e.pointerType !== "touch") setHover(pick(e.clientX, e.clientY));
  });
  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, yaw: rig.tyaw, pitch: rig.tpitch, drag: false }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointerup", (e) => {
    const d = down; down = null; canvas.classList.remove("drag");
    if (!d || d.drag || state.mode === "screen") return;
    const h = pick(e.clientX, e.clientY);
    if (!h) return closeCard();
    if (h.kind === "item") openCard(h.id);
    else if (h.kind === "screen") enterScreen();
    else if (h.kind === "lamp") toggleLamp();
  });
  canvas.addEventListener("pointercancel", () => { down = null; canvas.classList.remove("drag"); });
  canvas.addEventListener("pointerleave", () => { rig.tx = 0; rig.ty = 0; setHover(null); });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (state.mode === "room") { rig.tdolly = clamp(rig.tdolly - e.deltaY * 0.0016, 0, 1.7); rig.lastInput = now(); }
  }, { passive: false });
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || state.inside) return;
    if (state.card) closeCard(); else if (state.mode === "room") { rig.tyaw = rig.tpitch = rig.tdolly = 0; }
  });
  cardEl.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); closeCard(); } });

  // ---- reach without a pointer
  const mk = (tag, text, fn) => { const b = document.createElement(tag); b.textContent = text; if (tag === "button") { b.type = "button"; b.onclick = fn; } reach.append(b); return b; };
  mk("button", "Sit at the computer", () => enterScreen());
  for (const it of ITEMS) { const b = mk("button", `${it.name}: ${it.object.toLowerCase()}`, () => openCard(it.id, true)); b.onfocus = () => { state.hover = it.id; }; b.onblur = () => { if (state.hover === it.id) state.hover = null; }; }
  for (const s of alsoOnTheShelf) mk("button", `${s.name}: a bin on the bottom shelf`, () => openCard(s.id, true));
  mk("button", "Desk lamp: switch it", toggleLamp);
  const plain = mk("a", "Plain site"); plain.href = "../";

  // ---- sound
  let hum = null;
  function roomTone(on) {
    if (on && !hum && audio.ctx) {
      const g = audio.ctx.createGain(); g.gain.value = 0;
      const o1 = audio.ctx.createOscillator(), o2 = audio.ctx.createOscillator();
      o1.frequency.value = 55; o2.frequency.value = 110.4; o2.type = "triangle";
      const n = audio.ctx.createBufferSource(), buf = audio.ctx.createBuffer(1, audio.ctx.sampleRate * 2, audio.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      n.buffer = buf; n.loop = true;
      const f = audio.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420;
      const g1 = audio.ctx.createGain(); g1.gain.value = 0.35; const g2 = audio.ctx.createGain(); g2.gain.value = 0.12;
      o1.connect(g1).connect(g); o2.connect(g2).connect(g); n.connect(f).connect(g); g.connect(audio.out);
      o1.start(); o2.start(); n.start();
      g.gain.setTargetAtTime(0.045, audio.ctx.currentTime, 1.2);
      hum = g;
    } else if (hum) hum.gain.setTargetAtTime(on ? 0.045 : 0, audio.ctx.currentTime, 0.3);
  }
  audio.on((on) => { soundBtn.setAttribute("aria-pressed", String(on)); soundBtn.textContent = on ? "Sound on" : "Enable sound"; roomTone(on); });
  soundBtn.onclick = () => audio.toggle();

  // ---- the loop
  const t0 = performance.now();
  function now() { return FROZEN != null ? FROZEN : (performance.now() - t0) / 1000; }
  let last = now(), booted = false, struck = false, ema = 16, frames = 0, good = 0;
  roomPose(0); pose.pos.copy(roomOut.pos); pose.quat.copy(roomOut.quat);
  screenEl.inert = true;                                                // from the room, the screen is a picture, not a place to tab into

  if (VIEW === "screen") {                                              // start already sitting at the computer
    state.mode = "screen"; state.inside = true; document.body.classList.add("inside");
    screenEl.style.transform = "none"; screenEl.removeAttribute("aria-hidden"); screenEl.inert = false;
    if (FROZEN != null) os.freeze(Math.max(FROZEN - T_BOOT, 99)); else os.boot({ instant: true });
    booted = true; os.setActive(true);
    if (Q.get("app")) os.open(Q.get("app"), Q.get("item") || undefined);
  } else if (FROZEN != null) { os.freeze(FROZEN - T_BOOT); booted = true; }
  if (Q.get("card") && things[Q.get("card")]) { openCard(Q.get("card")); flight = null; }

  veil.classList.add("gone");
  setTimeout(() => veil.remove(), 1200);
  canvas.tabIndex = -1;

  function frame() {
    requestAnimationFrame(frame);
    const t = now(), dt = FROZEN != null ? 1 : Math.min(0.1, Math.max(0.001, t - last));
    last = t;
    if (state.inside && !flight) return;                               // sitting at the computer: nothing to draw

    // rig
    const idle = t - rig.lastInput > 3.5 && !down;
    if (idle && state.mode === "room") { rig.tyaw *= Math.exp(-dt * 0.5); rig.tpitch *= Math.exp(-dt * 0.5); }
    const k = FROZEN != null ? 1e6 : 1;
    rig.px = damp(rig.px, rig.tx, 2.6 * k, dt); rig.py = damp(rig.py, rig.ty, 2.6 * k, dt);
    rig.yaw = damp(rig.yaw, rig.tyaw, 5 * k, dt); rig.pitch = damp(rig.pitch, rig.tpitch, 5 * k, dt); rig.dolly = damp(rig.dolly, rig.tdolly, 4 * k, dt);

    const want = target(t);
    if (flight && FROZEN == null) {
      const u = clamp((t - flight.t0) / flight.dur, 0, 1), e = easeInOut(u);
      pose.pos.lerpVectors(flight.from.pos, want.pos, e);
      pose.quat.slerpQuaternions(flight.from.quat, want.quat, e);
      if (u >= 1) { const done = flight.done; flight = null; if (done) done(); }
    } else { flight = null; pose.pos.copy(want.pos); pose.quat.copy(want.quat); }
    camera.position.copy(pose.pos); camera.quaternion.copy(pose.quat);
    camera.updateMatrixWorld();

    // light
    const mon = tubeLevel(t), sign = signLevel(t);
    if (!struck && t >= T_MON) { struck = true; audio.noise({ dur: 0.09, freq: 2400, q: 0.7, gain: 0.07 }); audio.tone({ freq: 70, to: 140, dur: 0.5, gain: 0.05, at: 0.42 }); }
    if (!booted && t >= T_BOOT) { booted = true; os.boot(); }
    tube.style.opacity = (1 - mon).toFixed(3);
    const su = t - T_MON, flash = su >= 0 && su < 1.25 ? mon * (1 - smooth(0.5, 1.25, su)) : 0;   // light before the picture
    strike.style.opacity = (flash * 0.62).toFixed(3);
    const lampT = state.lampOn ? 1 : 0;
    const since = t - (state.lampStruck ?? -9);
    state.lampLevel = state.lampOn && since < 0.16 && since > 0.05 ? 0.25 : damp(state.lampLevel, lampT, 26, dt);
    const picture = osReady || FROZEN != null && FROZEN > T_BOOT + 3.2 ? 1 : 0.32;      // the boot screen is mostly black
    state.pic = damp(state.pic ?? 0.32, picture, 2.2 * k, dt);
    const G = TONE.gain, set3 = (u, c, s) => u.value.set(c[0] * s, c[1] * s, c[2] * s);
    set3(U.uSky, TONE.sky, 1);
    set3(U.uLamp, TONE.lamp, G.lamp * state.lampLevel);
    const mt = [0.35 * TONE.mon[0] + 0.65 * Math.min(1.6, monTint.x * 5 + 0.25), 0.35 * TONE.mon[1] + 0.65 * Math.min(1.6, monTint.y * 5 + 0.25), 0.35 * TONE.mon[2] + 0.65 * Math.min(1.6, monTint.z * 5 + 0.25)];
    const monGlow = mon * Math.max(state.pic, flash * 0.9);
    backMat.uniforms.uWall.value = glassShows * mon * clamp((state.pic - 0.32) / 0.68, 0, 1);   // the wallpaper comes up with the desktop
    set3(U.uMon, mt, G.mon * monGlow);
    set3(U.uStrip, TONE.strip, G.strip);
    set3(U.uSign, TONE.sign, G.sign * sign);
    set3(U.uName, TONE.name, G.name * smooth(0.5, 1.8, t));
    glows.bulb.uniforms.uOn.value = 4 * state.lampLevel;
    glows.strip.uniforms.uOn.value = 1.9;
    glows.namestrip.uniforms.uOn.value = 1.7 * smooth(0.5, 1.8, t);
    glows.sign.uniforms.uOn.value = 0.95 * sign;
    glows.lit.uniforms.uOn.value = 1.5;
    // the signal light: green, and every so often red for a moment, then it recovers
    const cyc = (t + 6) % 19;
    const red = cyc > 13.5 && cyc < 16.2, amber = cyc >= 16.2 && cyc < 16.9;
    glows["lens.red"].uniforms.uOn.value = red ? 2.6 * (0.6 + 0.4 * Math.sign(Math.sin(t * 9))) : 0;
    glows["lens.amber"].uniforms.uOn.value = amber ? 2.2 : 0;
    glows["lens.green"].uniforms.uOn.value = red || amber ? 0 : 2.0;
    dust.material.uniforms.uLampOn.value = state.lampLevel;
    cone.material.uniforms.uOn.value = state.lampLevel;
    post.uni.uScreenGlow.value.set(mt[0], mt[1], mt[2]).multiplyScalar(1.0 * monGlow);
    post.uni.uExposure.value = TONE.exposure;
    post.uni.uFade.value = smooth(0.0, T_FADE, t);
    post.uni.uTime.value = FROZEN != null ? 0 : t;
    post.uni.uGrain.value = 1;
    U.uTime.value = REDUCED ? 0 : t;
    gust = damp(gust, 0, 1.6, dt);
    U.uGust.value = REDUCED ? 0 : gust;

    // the things: the one under the pointer lifts a little and its tag lights
    for (const th of Object.values(things)) {
      const want = th.id === state.hover || th.id === state.card ? 1 : 0;
      th.hot = damp(th.hot, want, 12 * k, dt);
      th.group.position.y = th.home.y + th.hot * (th.onDesk ? 0.004 : 0.012);
      const s = 1 + th.hot * 0.035; th.group.scale.setScalar(s);
      if (th.tag) th.tag.uniforms.uHot.value = th.hot;
    }

    placeScreen();
    post.render(world, camera);
    placeCard();

    // quality: if frames run slow, draw fewer pixels; if they run fast again, come back up
    if (FROZEN == null && Q.get("q") !== "1") {
      ema = ema * 0.92 + dt * 1000 * 0.08;
      if (++frames % 40 === 0 && t > 3) {
        if (ema > 21 && scale > 0.5) { scale = Math.max(0.5, scale - 0.125); good = 0; resize(); }
        else if (ema < 13.5 && scale < 1 && ++good >= 4) { scale = Math.min(1, scale + 0.125); good = 0; resize(); }
      }
    }
    window.__studio = { t, mode: state.mode, scale, ms: ema, hover: state.hover, card: state.card, calls: post.calls, tris: post.tris };
  }
  requestAnimationFrame(frame);
}
