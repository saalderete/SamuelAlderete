// The directory follows you down the aisles: the aisle you're in lights up (its
// sign's number and hairline, and its row in the directory), and each sign's
// number flickers on once, the first time you reach it.
(() => {
  const aisles = [...document.querySelectorAll(".aisle[id]")];
  const links = new Map(
    [...document.querySelectorAll(".aisles a[data-aisle]")].map((a) => [a.dataset.aisle, a]),
  );
  if (!aisles.length) return;

  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const seen = new Set();
  let current = null;
  let queued = false;

  function pick() {
    queued = false;
    const line = innerHeight * 0.32;
    let here = aisles[0];
    for (const a of aisles) {
      if (a.getBoundingClientRect().top <= line) here = a;
    }
    // At the very bottom, the last aisle is where you are even if it is short.
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) here = aisles[aisles.length - 1];
    if (here === current) return;

    if (current) {
      current.classList.remove("is-here");
      links.get(current.id)?.removeAttribute("aria-current");
    }
    current = here;
    current.classList.add("is-here");
    links.get(current.id)?.setAttribute("aria-current", "true");

    if (!seen.has(here.id)) {
      seen.add(here.id);
      if (!still.matches && scrollY > 0) {
        here.classList.add("lit");
        here.addEventListener("animationend", () => here.classList.remove("lit"), { once: true });
      }
    }
  }

  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(pick);
    }
  };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  pick();
})();

// The work light: a soft lamp that follows a mouse or trackpad along the aisle floor, under the shelves.
// Touch screens and reduced motion never get it. It moves by transform only, once a frame at most.
(() => {
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  if (!fine.matches || still.matches) return;

  const lamp = document.createElement("div");
  lamp.className = "worklight";
  lamp.setAttribute("aria-hidden", "true");
  document.body.prepend(lamp);
  const half = lamp.offsetWidth / 2;

  let x = 0;
  let y = 0;
  let queued = false;
  const draw = () => {
    queued = false;
    lamp.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`;
    lamp.classList.add("on");
  };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX;
    y = e.clientY;
    if (!queued) {
      queued = true;
      requestAnimationFrame(draw);
    }
  }, { passive: true });
  // out of the window: the lamp dims, and comes back where the pointer re-enters
  document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) lamp.classList.remove("on"); });
  still.addEventListener("change", () => { if (still.matches) lamp.remove(); });
})();

// The floor ripples: the aisle floor is a still sheet that the work light rakes. A mouse or trackpad moving over
// it leaves a wake, and a click on the floor (anything that isn't a link or a control) drops a ring that spreads
// out. Each ripple lights on the side facing the pointer and shades on the far side, in the work light's own
// colours (styles.css: --ripple-lit, --ripple-shade). The water runs on the GPU at one cell per 4px, in fixed
// 120 Hz steps, and only while there are ripples: five seconds after the last one it stops and the canvas hides.
// Touch screens get the ring on a tap but no wake; reduced motion, or a browser without WebGL2, gets neither.
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const forced = matchMedia("(forced-colors: active)");
  const d = document.documentElement;
  const CONTROLS = "a, button, input, select, textarea, label, summary, video, audio, [role='button'], [tabindex]:not([tabindex='-1']), .shutter";
  const CELL = 4;           // CSS px per cell of water
  const STEP = 1000 / 120;  // ms per step of the water, whatever the screen's refresh rate
  const QUIET = 5000;       // ms after the last wake or ring before it all stops
  const MAX = 8;            // drops the water takes in one step

  const VERT = `#version 300 es
in vec2 a;
out vec2 uv;
void main() { uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;
  // One step of the water: r is the height, g the speed. Each cell eases toward its neighbours' average,
  // loses a little speed (the ripples die away) and a little height (the floor settles back to level).
  const SIM = `#version 300 es
precision highp float;
uniform sampler2D state;
uniform vec2 texel, view;
uniform vec4 drops[${MAX}];
uniform int count;
in vec2 uv;
out vec4 o;
void main() {
  vec4 s = texture(state, uv);
  float avg = 0.25 * (texture(state, uv - vec2(texel.x, 0.0)).r + texture(state, uv + vec2(texel.x, 0.0)).r
                    + texture(state, uv - vec2(0.0, texel.y)).r + texture(state, uv + vec2(0.0, texel.y)).r);
  s.g = (s.g + (avg - s.r) * 2.0) * 0.993;
  s.r = (s.r + s.g) * 0.999;
  vec2 p = vec2(uv.x, 1.0 - uv.y) * view;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= count) break;
    float k = max(0.0, 1.0 - distance(p, drops[i].xy) / drops[i].z);
    s.r += (0.5 - 0.5 * cos(k * 3.1415927)) * drops[i].w;
  }
  o = s;
}`;
  // The floor as you see it: the slope of the water, lit from the pointer. A slope that faces the light takes
  // --ripple-lit, one that faces away takes --ripple-shade, and level water is clear.
  const DRAW = `#version 300 es
precision highp float;
uniform sampler2D state;
uniform vec2 texel, view, light;
uniform vec4 lit, shade;
uniform float gain, fade;
in vec2 uv;
out vec4 o;
void main() {
  vec2 g = vec2(texture(state, uv + vec2(texel.x, 0.0)).r - texture(state, uv - vec2(texel.x, 0.0)).r,
                texture(state, uv - vec2(0.0, texel.y)).r - texture(state, uv + vec2(0.0, texel.y)).r);
  vec2 p = vec2(uv.x, 1.0 - uv.y) * view;
  vec2 to = light - p;
  float dist = length(to);
  float s = -dot(g, to / (dist + 48.0)) * gain * mix(0.55, 1.0, exp(-dist * dist / 360000.0)) * fade;
  float a = clamp(s, 0.0, 1.0), b = clamp(-s, 0.0, 1.0);
  o = lit * (a * (2.0 - a)) + shade * (b * (2.0 - b));
}`;

  let canvas = null, gl = null, sim = null, draw = null, tex = [], fbo = [], cur = 0;
  let simW = 0, simH = 0, viewW = 0, viewH = 0, lit = [0, 0, 0, 0], shade = [0, 0, 0, 0];
  let ready = false, failed = false, running = false, last = 0, acc = 0, lastInput = 0;
  let px = 0, py = 0, ox = 0, oy = 0, tracking = false, moved = false;
  let lightX = innerWidth / 2, lightY = innerHeight / 3;
  const drops = [];
  const batch = new Float32Array(MAX * 4);
  const opening = () => d.classList.contains("opening") && !d.classList.contains("opened");

  function program(fs) {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, fs]]) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      gl.attachShader(p, sh);
    }
    gl.bindAttribLocation(p, 0, "a");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
    const u = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
      const name = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, "");
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }

  // Sizes the canvas to the floor (one pixel per CSS pixel: ripples are soft) and the water to one cell per 4px.
  function size() {
    const r = canvas.getBoundingClientRect();
    viewW = Math.max(1, Math.round(r.width));
    viewH = Math.max(1, Math.round(r.height));
    canvas.width = viewW;
    canvas.height = viewH;
    simW = Math.ceil(viewW / CELL);
    simH = Math.ceil(viewH / CELL);
    for (const t of tex) {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, simW, simH, 0, gl.RGBA, gl.HALF_FLOAT, null);
    }
  }

  function setup() {
    gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!gl || !(gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float"))) return false;
    sim = program(SIM);
    draw = program(DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    tex = [0, 1].map(() => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    });
    size();
    fbo = tex.map((t) => {
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return f;
    });
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ok;
  }

  // The two colours, from the tokens, premultiplied for the canvas.
  function colours() {
    const probe = document.createElement("i");
    probe.hidden = true;
    document.body.append(probe);
    const read = (name) => {
      probe.style.color = `var(${name})`;
      const [r, g, b, a = 1] = (getComputedStyle(probe).color.match(/[\d.]+/g) || []).map(Number);
      const c = [(r / 255) * a, (g / 255) * a, (b / 255) * a, a];
      return c.every(Number.isFinite) ? c : [0, 0, 0, 0];
    };
    lit = read("--ripple-lit");
    shade = read("--ripple-shade");
    probe.remove();
  }

  // Makes the floor the first time it's needed (or when the page is idle, for a mouse). False if it can't.
  function ensure() {
    if (ready) return true;
    if (failed || canvas || forced.matches) return false;
    canvas = document.createElement("canvas");
    canvas.className = "ripples";
    canvas.setAttribute("aria-hidden", "true");
    const lamp = document.querySelector(".worklight");
    if (lamp) lamp.after(canvas);
    else document.body.prepend(canvas);
    try { ready = setup(); } catch { ready = false; }
    if (!ready) {
      failed = true;
      canvas.remove();
      return false;
    }
    colours();
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", colours);
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      ready = false;
      running = false;
      canvas.classList.remove("on");
    });
    canvas.addEventListener("webglcontextrestored", () => {
      try { ready = setup(); } catch { ready = false; }
      if (!ready) failed = true;
    });
    return true;
  }

  function step(n) {
    gl.useProgram(sim.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - cur]);
    gl.viewport(0, 0, simW, simH);
    gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
    gl.uniform1i(sim.u.state, 0);
    gl.uniform2f(sim.u.texel, 1 / simW, 1 / simH);
    gl.uniform2f(sim.u.view, viewW, viewH);
    if (n) {
      batch.fill(0);
      drops.splice(0, n).forEach((one, i) => batch.set(one, i * 4));
      gl.uniform4fv(sim.u.drops, batch);
    }
    gl.uniform1i(sim.u.count, n);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    cur = 1 - cur;
  }

  function paint(fade) {
    gl.useProgram(draw.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
    gl.uniform1i(draw.u.state, 0);
    gl.uniform2f(draw.u.texel, 1 / simW, 1 / simH);
    gl.uniform2f(draw.u.view, viewW, viewH);
    gl.uniform2f(draw.u.light, lightX, lightY);
    gl.uniform4fv(draw.u.lit, lit);
    gl.uniform4fv(draw.u.shade, shade);
    gl.uniform1f(draw.u.gain, 4);
    gl.uniform1f(draw.u.fade, fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const drop = (x, y, radius, strength) => { if (drops.length < MAX * 3) drops.push([x, y, radius, strength]); };

  // The wake: drops along the path the pointer took since the last frame, stronger for a quicker stroke.
  function wake() {
    const dx = px - ox, dy = py - oy, dist = Math.hypot(dx, dy);
    if (dist < 2) return;
    if (dist < 320) {
      const n = Math.min(MAX, Math.ceil(dist / 14));
      const w = 0.06 + 0.14 * Math.min(1, dist / 40);
      for (let i = 1; i <= n; i++) drop(ox + (dx * i) / n, oy + (dy * i) / n, 20, w);
    }
    ox = px;
    oy = py;
  }

  function frame(now) {
    if (!running || !ready) return;
    acc = Math.min(acc + now - (last || now - STEP), STEP * 4);
    last = now;
    if (moved) {
      moved = false;
      wake();
    }
    for (let first = true; acc >= STEP; first = false) {
      step(first ? Math.min(drops.length, MAX) : 0);
      acc -= STEP;
    }
    const quiet = now - lastInput;
    paint(Math.min(1, Math.max(0, (QUIET - quiet) / 800)));
    if (quiet > QUIET) stop();
    else requestAnimationFrame(frame);
  }

  function kick() {
    lastInput = performance.now();
    if (running) return;
    running = true;
    last = 0;
    acc = 0;
    canvas.classList.add("on");
    requestAnimationFrame(frame);
  }

  // Level the water and clear the floor, so the next ripple starts on a still one.
  function stop() {
    running = false;
    drops.length = 0;
    if (!ready) return;
    canvas.classList.remove("on");
    gl.clearColor(0, 0, 0, 0);
    for (const f of [...fbo, null]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || still.matches || opening()) return;
    px = e.clientX;
    py = e.clientY;
    lightX = px;
    lightY = py;
    if (!tracking) {
      tracking = true;
      ox = px;
      oy = py;
      return;
    }
    if (!ensure()) return;
    moved = true;
    kick();
  }, { passive: true });
  // out of the window: the next wake starts where the pointer comes back in, with no streak across
  document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) tracking = false; });

  addEventListener("click", (e) => {
    if (e.detail === 0 || e.button !== 0 || still.matches || opening()) return;
    if (e.target instanceof Element && e.target.closest(CONTROLS)) return;
    if (String(getSelection()).trim()) return; // the click ended a text selection
    if (!ensure()) return;
    lightX = e.clientX;
    lightY = e.clientY;
    drop(e.clientX, e.clientY, 30, 0.9);
    kick();
  });

  addEventListener("resize", () => {
    if (!ready) return;
    const r = canvas.getBoundingClientRect();
    // a phone's toolbar sliding in or out keeps the water; anything else starts a fresh floor
    if (Math.round(r.width) === viewW && Math.abs(r.height - viewH) < 120) return;
    stop();
    size();
  });
  still.addEventListener("change", () => { if (still.matches) stop(); });

  if (!still.matches && fine.matches) {
    const idle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 2500 }) : (f) => setTimeout(f, 1200);
    idle(ensure);
  }
})();

// The shutter (index.html): the <head> decides whether it shows (html.opening), on the first visit of a session
// and on every refresh. It fades once the page has loaded and the greetings have played to the store's sign
// (2.7 s at least, so the store's sign holds about a second, and 3.8 s at most); a key, a click, a scroll or a touch fades it straight away. Then the sign of
// the aisle you're in flickers on, as if the lights came on (after a refresh, that can be any aisle).
(() => {
  const d = document.documentElement;
  const shutter = document.querySelector(".shutter");
  if (!shutter || !d.classList.contains("opening")) return;

  const wait = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
  const loaded = new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true })));
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const skip = new Promise((r) => {
    for (const type of ["keydown", "pointerdown", "wheel", "touchstart"]) addEventListener(type, r, { once: true, passive: true });
  });

  let lifted = false;
  const lift = () => {
    if (lifted) return;
    lifted = true;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      d.classList.remove("opening", "opened");
      const here = document.querySelector(".aisle.is-here") || document.querySelector(".aisle");
      if (here) {
        here.classList.remove("lit");
        void here.offsetWidth; // restart the flicker if the scroll-spy just played it under the shutter
        here.classList.add("lit");
        here.addEventListener("animationend", () => here.classList.remove("lit"), { once: true });
      }
    };
    d.classList.add("opened");
    shutter.addEventListener("transitionend", (e) => { if (e.target === shutter) finish(); });
    setTimeout(finish, 1100);
  };
  Promise.race([Promise.all([loaded, fonts, wait(2700 - performance.now())]), wait(3800 - performance.now()), skip]).then(lift);
})();

// The progress line along the top edge (styles.css). Where the browser can drive it from the scroll position
// it does so on its own; otherwise this fills it, by transform only, once a frame at most.
(() => {
  const bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.prepend(bar);
  if (window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()")) return;
  let queued = false;
  const draw = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(draw);
    }
  };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  draw();
})();

// The project loops: each plays, muted, while its card is on screen and pauses when it leaves. Reduced motion
// or Save-Data keeps the still. Every loop gets a pause/play button (they run longer than five seconds), and a
// pause someone chooses sticks until they press play.
(() => {
  const vids = [...document.querySelectorAll(".product video")];
  if (!vids.length) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const ICON = {
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>',
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z" fill="currentColor"/></svg>',
  };
  for (const v of vids) {
    const li = v.closest("li");
    const name = li.querySelector("h3").firstChild.textContent.trim();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vid-toggle";
    const show = () => {
      const on = !v.paused;
      btn.innerHTML = on ? ICON.pause : ICON.play;
      btn.setAttribute("aria-label", `${on ? "Pause" : "Play"} the ${name} preview`);
    };
    btn.addEventListener("click", () => {
      if (v.paused) {
        delete v.dataset.held;
        v.play().catch(() => {});
      } else {
        v.dataset.held = "1";
        v.pause();
      }
    });
    v.addEventListener("play", show);
    v.addEventListener("pause", show);
    show();
    li.appendChild(btn);
  }
  const io = new IntersectionObserver((entries) => {
    for (const { target: v, isIntersecting, intersectionRatio } of entries) {
      if (isIntersecting && intersectionRatio >= 0.4) {
        if (!still.matches && !saveData && !v.dataset.held) v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    }
  }, { threshold: [0, 0.4] });
  vids.forEach((v) => io.observe(v));
  still.addEventListener("change", () => { if (still.matches) vids.forEach((v) => v.pause()); });
})();
