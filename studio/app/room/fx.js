// The live parts drawn over the baked room: the dusk outside the window, dust in the light, the glow
// around the lamp, and the finishing pass (bloom, tone, vignette, grain) that keeps the monitor's
// "hole" transparent so the real page behind the canvas shows through as the screen.

import * as THREE from "three";

// ------------------------------------------------------------------ the view from the window
// Drawn by view direction, not position, so it sits at infinity: when the camera moves, the window
// frame slides over a view that stays put. A city on the plain, two ranges, and the sky after sunset.
const SKY_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  uniform float uTime; uniform float uDusk;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float hash1(float p) { return fract(sin(p * 91.345) * 47453.5453); }
  float noise(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash1(i), hash1(i + 1.0), f); }
  float fbm(float x) { return noise(x) * 0.5 + noise(x * 2.03 + 7.0) * 0.25 + noise(x * 4.1 + 3.0) * 0.125 + noise(x * 8.3) * 0.0625; }
  // a five-pointed star's outline: distance to its edge, p in units of its radius
  float star(vec2 p) {
    float best = 9.0;
    for (int i = 0; i < 5; i++) {
      float a0 = 1.5708 + float(i) * 2.5133, a1 = 1.5708 + float(i + 1) * 2.5133;
      vec2 a = vec2(cos(a0), sin(a0)), b = vec2(cos(a1), sin(a1));
      vec2 pa = p - a, ba = b - a;
      best = min(best, length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)));
    }
    return best;
  }
  void main() {
    vec3 d = normalize(vWorld - cameraPosition);
    float az = atan(d.x, -d.z), el = asin(d.y);
    // sky: the last warm light low in the west, cooling to deep blue overhead
    float west = exp(-pow((az + 0.37) * 2.2, 2.0));
    vec3 low = mix(vec3(1.05, 0.40, 0.15), vec3(2.2, 0.92, 0.30), west);
    vec3 mid = mix(vec3(0.20, 0.13, 0.24), vec3(0.42, 0.19, 0.22), west);
    vec3 high = vec3(0.045, 0.085, 0.22);
    vec3 top = vec3(0.008, 0.015, 0.055);
    float e = max(el, 0.0);
    vec3 sky = mix(low, mid, smoothstep(0.0, 0.06, e));
    sky = mix(sky, high, smoothstep(0.03, 0.14, e));
    sky = mix(sky, top, smoothstep(0.14, 0.62, e));
    sky *= uDusk;
    // a band of thin cloud catching the light
    float cl = smoothstep(0.52, 0.8, fbm(az * 5.0 + el * 9.0 + 2.0)) * smoothstep(0.03, 0.09, el) * (1.0 - smoothstep(0.10, 0.2, el));
    sky += vec3(1.1, 0.4, 0.2) * cl * 0.3 * uDusk;
    // stars, coming out
    vec2 sg = vec2(az, el) * 210.0; vec2 si = floor(sg);
    float sr = hash(si);
    float st = smoothstep(0.985, 1.0, sr) * smoothstep(0.5, 0.0, length(fract(sg) - 0.5 - (vec2(hash(si + 3.0), hash(si + 7.0)) - 0.5) * 0.6));
    sky += vec3(0.8, 0.86, 1.0) * st * smoothstep(0.12, 0.35, el) * (0.55 + 0.45 * sin(uTime * (1.5 + sr * 3.0) + sr * 40.0));

    vec3 col = sky;
    // the far range across the valley, soft with haze
    float far = 0.022 + 0.026 * fbm(az * 4.6 + 11.0) + 0.012 * noise(az * 23.0);
    col = mix(col, vec3(0.085, 0.045, 0.085) * uDusk, smoothstep(far + 0.0025, far - 0.0025, el));
    // the near range, rising to the left, almost a silhouette
    float rise = smoothstep(-0.335, -0.64, az);
    float near = -0.01 + rise * 0.185 + 0.03 * fbm(az * 7.3 + 2.0) * (0.35 + rise) + 0.006 * noise(az * 61.0);
    float nearMask = smoothstep(near + 0.002, near - 0.002, el);
    vec3 rock = mix(vec3(0.004, 0.004, 0.009), vec3(0.03, 0.017, 0.028), smoothstep(near - 0.045, near, el)) * (0.8 + 0.4 * fbm(az * 43.0 + el * 120.0));
    col = mix(col, rock, nearMask);
    // red lights on the towers along its ridge
    for (int i = 0; i < 3; i++) {
      float ta = -0.452 - float(i) * 0.034;
      float rs = smoothstep(-0.335, -0.64, ta);
      float tn = -0.01 + rs * 0.185 + 0.03 * fbm(ta * 7.3 + 2.0) * (0.35 + rs) + 0.006 * noise(ta * 61.0);
      float dd = length(vec2(az - ta, el - tn - 0.007 - float(i) * 0.002));
      float blink = 0.25 + 0.75 * smoothstep(0.6, 1.0, sin(uTime * 1.9 + float(i) * 2.1));
      col += vec3(1.0, 0.08, 0.04) * smoothstep(0.0034, 0.0, dd) * 3.2 * blink;
    }
    // the star on the mountain, lit every night: a ring of bulbs in the shape of a star
    vec2 sp = (vec2(az, el) - vec2(-0.432, 0.019)) / 0.0044;
    float sd = star(sp);
    float bulbs = smoothstep(0.25, 0.75, abs(fract(atan(sp.y, sp.x) / 6.2831853 * 30.0) - 0.5) * 2.0);
    col += vec3(1.0, 0.84, 0.58) * smoothstep(0.2, 0.03, sd) * (0.12 + 0.88 * bulbs) * 1.05 * step(el, near + 0.01);

    // the city on the plain: rows of lights that crowd together toward the foot of the far range.
    // Rows are evenly spaced in log(angle below the horizon), which is evenly spaced on the ground,
    // and each row's cells are as wide as they are tall, so a lamp is always a round dot, never a streak.
    float dep = far - el;
    if (dep > 0.0) {
      const float RH = 0.085;
      float ld = log(dep + 0.0012);
      float row = floor(ld / RH);
      float depr = exp((row + 0.5) * RH);
      float cw = depr * RH * 1.55;
      vec2 id = vec2(floor(az / cw), row);
      vec2 f = vec2(fract(az / cw), fract(ld / RH)) - 0.5;
      float r = hash(id);
      float avenue = step(0.78, hash1(row * 1.73 + 2.0));
      float present = step(0.5 - avenue * 0.42, r);
      vec2 jit = (vec2(hash(id + 5.0), hash(id + 9.0)) - 0.5) * (0.55 - avenue * 0.4);
      float px = max(fwidth(ld) / RH, fwidth(az) / cw);
      float lamp = smoothstep(0.15 + px * 0.7, 0.15 - px * 0.7, length(f - jit));
      float tw = 0.72 + 0.28 * sin(uTime * (0.8 + r * 2.6) + r * 50.0);
      vec3 lc = mix(vec3(1.0, 0.6, 0.27), vec3(0.86, 0.9, 1.0), step(0.8, hash(id + 2.0)));
      lc = mix(lc, vec3(1.0, 0.2, 0.1), step(0.972, hash(id + 4.0)));
      float lod = smoothstep(0.3, 1.0, px);
      float air = 0.35 + 0.65 * smoothstep(0.0, 0.03, dep);                 // distance dims them
      vec3 lights = mix(lc * lamp * present * tw * 3.4, vec3(1.0, 0.62, 0.3) * (0.1 + avenue * 0.12), lod) * air;
      vec3 city = vec3(0.004, 0.004, 0.008) + lights;
      col = mix(col, city, (1.0 - nearMask) * smoothstep(0.0, 0.0015, dep));
    }
    // the glow a city puts into the air above it
    col += vec3(0.9, 0.42, 0.17) * exp(-abs(el - far) * 70.0) * 0.1 * (1.0 - nearMask);
    gl_FragColor = vec4(col, 1.0);
  }`;

export function makeSky(meta, VERT, U) {
  const w = meta.anchors.window;
  const z = Math.min(w.min[2], w.max[2]) - 1.2;
  const geo = new THREE.PlaneGeometry(9, 7);
  geo.setAttribute("uv1", geo.getAttribute("uv"));
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: SKY_FRAG, uniforms: { uTime: U.uTime, uGust: U.uGust, uDusk: { value: 1 } } });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set((w.min[0] + w.max[0]) / 2, (w.min[1] + w.max[1]) / 2 + 0.3, z);
  mesh.frustumCulled = false;
  return mesh;
}

// ------------------------------------------------------------------ dust in the light
export function makeDust(meta, U, count = 420) {
  const w = meta.anchors.window, lamp = meta.lights.lamp;
  const pos = new Float32Array(count * 3), seed = new Float32Array(count * 4);
  const wx0 = Math.min(w.min[0], w.max[0]), wx1 = Math.max(w.min[0], w.max[0]);
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  for (let i = 0; i < count; i++) {
    const nearLamp = i % 3 === 0;
    if (nearLamp) {
      pos[i * 3] = lamp.at[0] + (rnd() - 0.5) * 0.9; pos[i * 3 + 1] = lamp.aim[1] + rnd() * 0.55; pos[i * 3 + 2] = lamp.at[2] + (rnd() - 0.4) * 0.8;
    } else {
      pos[i * 3] = wx0 - 0.3 + rnd() * (wx1 - wx0 + 1.6); pos[i * 3 + 1] = 0.5 + rnd() * 1.9; pos[i * 3 + 2] = w.min[2] + 0.35 + rnd() * 2.6;
    }
    seed[i * 4] = rnd(); seed[i * 4 + 1] = rnd(); seed[i * 4 + 2] = rnd(); seed[i * 4 + 3] = nearLamp ? 1 : 0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    uniforms: { uTime: U.uTime, uGust: U.uGust, uLampAt: { value: new THREE.Vector3(...lamp.at) }, uLampAim: { value: new THREE.Vector3(...lamp.aim) }, uLampOn: { value: 1 },
      uWin: { value: new THREE.Vector4((wx0 + wx1) / 2, (w.min[1] + w.max[1]) / 2, w.min[2], (wx1 - wx0) / 2) }, uPx: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed; uniform float uTime, uGust, uPx, uLampOn; uniform vec3 uLampAt, uLampAim; uniform vec4 uWin;
      varying vec3 vCol;
      void main() {
        vec3 p = position;
        float t = uTime * (0.05 + aSeed.x * 0.06);
        p.x += sin(t * 1.3 + aSeed.y * 40.0) * 0.16 + sin(t * 3.1 + aSeed.z * 9.0) * 0.03 * (1.0 + uGust * 6.0);
        p.y += sin(t * 0.9 + aSeed.z * 30.0) * 0.14 + mod(uTime * 0.006 * (aSeed.x - 0.4), 0.3);
        p.z += cos(t * 1.1 + aSeed.x * 20.0) * 0.14;
        // how much light reaches this mote: inside the lamp's cone, or near the window
        vec3 ax = normalize(uLampAim - uLampAt); vec3 lp = p - uLampAt;
        float along = dot(lp, ax); float off = length(lp - ax * along);
        float cone = smoothstep(0.55, 0.15, off / max(along, 0.02)) * smoothstep(0.0, 0.08, along) * smoothstep(0.75, 0.2, along) * uLampOn;
        float wd = uWin.z - p.z;   // negative: inside the room
        float win = smoothstep(2.8, 0.2, -wd) * smoothstep(uWin.w + 0.9, uWin.w * 0.3, abs(p.x - uWin.x)) * smoothstep(0.4, 1.0, p.y) ;
        vCol = vec3(1.0, 0.72, 0.42) * cone * 1.25 + vec3(0.42, 0.56, 1.0) * win * 0.34;
        vCol *= 0.55 + 0.45 * sin(uTime * (0.6 + aSeed.y) + aSeed.z * 20.0);
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPx * (1.4 + aSeed.x * 2.4) * (2.2 / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      precision highp float; varying vec3 vCol;
      void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d); gl_FragColor = vec4(vCol * a * 0.5, 0.0); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 8;
  return pts;
}

// ------------------------------------------------------------------ the lamp's light in the air
// A faint cone under the shade: brightest near the bulb and along the middle, gone at its edges.
export function makeCone(meta, U) {
  const at = new THREE.Vector3(...meta.lights.lamp.at), aim = new THREE.Vector3(...meta.lights.lamp.aim);
  const axis = aim.clone().sub(at); const len = axis.length() * 0.96; axis.normalize();
  const geo = new THREE.CylinderGeometry(0.02, 0.34, len, 28, 1, true);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    uniforms: { uOn: { value: 1 }, uTime: U.uTime },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `precision highp float; varying vec2 vUv; varying vec3 vN; varying vec3 vW; uniform float uOn, uTime;
      void main() {
        float facing = abs(dot(normalize(vN), normalize(cameraPosition - vW)));
        float a = pow(facing, 2.2) * pow(vUv.y, 1.6) * smoothstep(0.0, 0.12, vUv.y) * (0.92 + 0.08 * sin(uTime * 0.7 + vUv.x * 20.0));
        gl_FragColor = vec4(vec3(1.0, 0.66, 0.36) * a * 0.075 * uOn, 0.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(at).addScaledVector(axis, len / 2);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), axis);
  mesh.renderOrder = 7;
  return mesh;
}

// ------------------------------------------------------------------ the finishing pass
const TRI = new THREE.BufferGeometry();
TRI.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
const PASS_VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function pass(frag, uniforms) {
  const m = new THREE.ShaderMaterial({ vertexShader: PASS_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
  const mesh = new THREE.Mesh(TRI, m);
  mesh.frustumCulled = false;
  return mesh;
}

export class Post {
  constructor(renderer) {
    this.r = renderer;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    this.levels = 5;
    this.uni = { uExposure: { value: 1 }, uTime: { value: 0 }, uFade: { value: 1 }, uBloom: { value: 0.36 }, uScreenGlow: { value: new THREE.Vector3() }, uGrain: { value: 1 } };
    this.pre = pass(/* glsl */ `
      precision highp float; varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; uniform vec3 uScreenGlow;
      vec3 tap(vec2 o) { vec4 c = texture2D(tSrc, vUv + o * uTexel); vec3 v = c.rgb + (1.0 - c.a) * uScreenGlow; float l = max(v.r, max(v.g, v.b)); return v * smoothstep(0.95, 2.8, l); }
      void main() { gl_FragColor = vec4((tap(vec2(-1, -1)) + tap(vec2(1, -1)) + tap(vec2(-1, 1)) + tap(vec2(1, 1))) * 0.25, 1.0); }`,
      { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uScreenGlow: this.uni.uScreenGlow });
    this.down = pass(/* glsl */ `
      precision highp float; varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel;
      void main() { vec3 c = texture2D(tSrc, vUv).rgb * 4.0; c += texture2D(tSrc, vUv + uTexel * vec2(-1, -1)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1, -1)).rgb + texture2D(tSrc, vUv + uTexel * vec2(-1, 1)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1, 1)).rgb; gl_FragColor = vec4(c / 8.0, 1.0); }`,
      { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.up = pass(/* glsl */ `
      precision highp float; varying vec2 vUv; uniform sampler2D tSrc, tAdd; uniform vec2 uTexel;
      void main() { vec3 c = vec3(0.0);
        c += texture2D(tSrc, vUv + uTexel * vec2(-1, 0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1, 0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(0, -1)).rgb + texture2D(tSrc, vUv + uTexel * vec2(0, 1)).rgb;
        c = c * 2.0 + texture2D(tSrc, vUv + uTexel * vec2(-1, -1)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1, -1)).rgb + texture2D(tSrc, vUv + uTexel * vec2(-1, 1)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1, 1)).rgb;
        gl_FragColor = vec4(c / 12.0 + texture2D(tAdd, vUv).rgb, 1.0); }`,
      { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.final = pass(/* glsl */ `
      precision highp float; varying vec2 vUv; uniform sampler2D tScene, tBloom; uniform float uExposure, uTime, uFade, uBloom, uGrain; uniform vec2 uRes;
      float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      vec3 film(vec3 x) {                      // a filmic curve with a soft shoulder; keeps the lamps from clipping hard
        x = max(x, 0.0);
        vec3 a = x * (2.51 * x + 0.03), b = x * (2.43 * x + 0.59) + 0.14;
        return clamp(a / b, 0.0, 1.0);
      }
      void main() {
        vec4 s = texture2D(tScene, vUv);
        vec3 c = s.rgb + texture2D(tBloom, vUv).rgb * uBloom * mix(0.22, 1.0, s.a);
        c *= uExposure;
        vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y * 0.72;
        float vig = smoothstep(1.02, 0.25, length(q));
        c *= mix(0.42, 1.0, vig);
        c = film(c);
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, 1.07);                                         // a touch more colour
        c = mix(c, c * vec3(0.94, 0.98, 1.08), (1.0 - smoothstep(0.0, 0.35, l)) * 0.5);   // shadows lean cool
        c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
        float g = hash(gl_FragCoord.xy + fract(uTime * 7.0) * 173.0) - 0.5;
        c += g * (0.018 * uGrain + 1.0 / 255.0);
        c *= uFade;
        // the monitor's picture is the page behind the canvas: alpha 0 lets it through, colour adds light over it
        float a = mix(1.0, s.a, uFade);
        gl_FragColor = vec4(c * mix(1.0, 0.94, 1.0 - s.a), a);
      }`,
      { tScene: { value: null }, tBloom: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, ...this.uni });
    this.rt = null; this.chain = [];
  }

  resize(w, h, samples) {
    this.rt?.dispose(); this.chain.forEach((lv) => { lv.down.dispose(); lv.up.dispose(); });
    this.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples, depthBuffer: true, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter });
    this.chain = [];
    let cw = w, ch = h;
    for (let i = 0; i < this.levels; i++) {
      cw = Math.max(2, cw >> 1); ch = Math.max(2, ch >> 1);
      this.chain.push({ down: new THREE.WebGLRenderTarget(cw, ch, { type: THREE.HalfFloatType, depthBuffer: false }), up: new THREE.WebGLRenderTarget(cw, ch, { type: THREE.HalfFloatType, depthBuffer: false }), w: cw, h: ch });
    }
    this.final.material.uniforms.uRes.value.set(w, h);
    this.w = w; this.h = h;
  }

  _draw(mesh, target) {
    this.scene.children.length = 0; this.scene.add(mesh);
    this.r.setRenderTarget(target);
    this.r.render(this.scene, this.cam);
  }

  render(scene, camera) {
    const r = this.r;
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 1);
    r.clear();
    r.render(scene, camera);
    this.calls = r.info.render.calls; this.tris = r.info.render.triangles;
    let src = this.rt.texture, sw = this.w, sh = this.h;
    this.chain.forEach((lv, i) => {
      const m = i === 0 ? this.pre : this.down;
      m.material.uniforms.tSrc.value = src; m.material.uniforms.uTexel.value.set(1 / sw, 1 / sh);
      this._draw(m, lv.down);
      src = lv.down.texture; sw = lv.w; sh = lv.h;
    });
    let acc = this.chain[this.levels - 1].down.texture;
    for (let i = this.levels - 2; i >= 0; i--) {
      const lv = this.chain[i], below = this.chain[i + 1];
      const u = this.up.material.uniforms;
      u.tSrc.value = acc; u.tAdd.value = lv.down.texture; u.uTexel.value.set(1 / below.w, 1 / below.h);
      this._draw(this.up, lv.up);
      acc = lv.up.texture;
    }
    const f = this.final.material.uniforms;
    f.tScene.value = this.rt.texture; f.tBloom.value = acc;
    this._draw(this.final, null);
  }
}

