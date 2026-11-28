// Loads the room that tools/build_room.py made and tools/bake.py lit, and dresses it for drawing.
// Nothing here computes light: every surface shows its colour multiplied by baked light, with the
// layers (window, lamp, monitor, shelf strips, sign, name light) mixed by a handful of uniforms so the
// page can flicker the monitor on, switch the lamp, and tint the glow to match the screen.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const here = (p) => new URL(p, import.meta.url).href;

// What each material is in the browser. Colours come from the model; these add texture and shine.
//   map: wood texture, tile: metres per repeat, swap: grain runs along X
//   detail: the map is a grey grain (tools/make_textures.py) multiplied into the model's own colour
//   f0: reflectance facing you, rough: blur of the reflection, metal: reflection takes the colour
//   Cloth has a low f0 and a high rough: nothing facing you, a soft sheen where it turns away.
const LOOK = {
  floor: { map: "floor", rmap: "floor-rough", tile: 2.1, f0: 0.045, rough: 0.34, gloss: 1.0, box: true, tint: [1.0, 0.96, 0.92], sat: 0.85 },
  walnut: { map: "walnut", tile: 1.2, swap: true, f0: 0.04, rough: 0.32, gloss: 0.5, tint: [1.2, 1.12, 1.03], sat: 0.42 },
  oak: { map: "oak", tile: 0.8, swap: true, f0: 0.04, rough: 0.38, gloss: 0.4, tint: [0.92, 0.9, 0.86] },
  wall: { map: "paint", tile: 1.2, detail: true },
  ceiling: { map: "paint", tile: 1.5, detail: true },
  chrome: { metal: 1, f0: 0.9, rough: 0.06, gloss: 1 },
  letters: { metal: 0.5, f0: 0.8, rough: 0.2, gloss: 0.9, boost: 1.7 },      // the name on the wall: satin metal that takes the picture light
  aluminium: { metal: 1, f0: 0.75, rough: 0.34, gloss: 0.9 },
  brass: { metal: 1, f0: 0.85, rough: 0.2, gloss: 1 },
  steel: { f0: 0.05, rough: 0.3, gloss: 0.6 },
  plastic: { f0: 0.05, rough: 0.22, gloss: 0.8 },
  cream: { f0: 0.05, rough: 0.14, gloss: 0.8 },
  white: { f0: 0.05, rough: 0.2, gloss: 0.6 },
  yellow: { f0: 0.05, rough: 0.2, gloss: 0.7 },
  stone: { f0: 0.04, rough: 0.45, gloss: 0.3 },
  concrete: { grain: 0.08 },
  leaf: { f0: 0.04, rough: 0.5, gloss: 0.2, twoSided: true, mul: [0.9, 0.74, 0.9] },
  stem: { twoSided: true },
  navy: { f0: 0.04, rough: 0.5, gloss: 0.2 },
  graphite: { f0: 0.04, rough: 0.4, gloss: 0.35 },
  coffee: { f0: 0.05, rough: 0.05, gloss: 1 },
  rug: { rug: true, map: "rug", tile: 0.6, detail: true, f0: 0.02, rough: 0.9, gloss: 0.16 },
  fabric: { f0: 0.022, rough: 0.85, gloss: 0.2 },
  felt: { f0: 0.02, rough: 0.9, gloss: 0.1 },
  red: { lens: 0 }, amber: { lens: 1 }, green: { lens: 2 },
};

const VERT = /* glsl */ `
  attribute vec2 uv1;
  #ifdef SWAY
  attribute vec4 aSway;
  uniform float uTime; uniform float uGust;
  #endif
  varying vec2 vUv; varying vec2 vUv1; varying vec3 vWorld; varying vec3 vNormal;
  void main() {
    vUv = uv; vUv1 = uv1;
    vec4 w = modelMatrix * vec4(position, 1.0);
    #ifdef SWAY
      float ph = aSway.g * 6.2831;
      float a = aSway.r * (0.011 + uGust * 0.03);
      w.x += sin(uTime * 0.83 + ph) * a + sin(uTime * 2.3 + ph * 1.7 + w.y * 3.0) * a * 0.22 * aSway.b;
      w.z += cos(uTime * 0.61 + ph * 1.3) * a * 0.7;
      w.y += sin(uTime * 1.1 + ph * 2.1) * a * 0.35 * aSway.b;
    #endif
    vWorld = w.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

// Shared by every lit surface.
const LIGHT_GLSL = /* glsl */ `
  uniform sampler2D tSky, tLmb, tSgn;
  uniform vec3 kSky, kLmb, kSgn;
  uniform vec3 uSky, uLamp, uMon, uStrip, uSign, uName;
  vec3 bakedLight(vec2 uv) {
    vec3 a = texture2D(tSky, uv).rgb, b = texture2D(tLmb, uv).rgb, c = texture2D(tSgn, uv).rgb;
    a = a * a * a * kSky; b = b * b * b * kLmb; c = c * c * c * kSgn;      // stored with a cube-root curve
    return a * uSky + uLamp * b.r + uMon * b.g + uStrip * b.b + uSign * c.r + uName * c.g;
  }`;

// A note on every shader here and in fx.js: a graphics card gives "not a number" for pow() of a
// negative value, for 0/0 and for a few other things, and one such pixel written into this room's
// picture is spread by the glow pass into a black block (a phone showed exactly that, from the lamp's
// cone). So nothing below takes pow() of a value that can dip under zero, divides by a value that can
// be zero, or leans on smoothstep() with its edges the wrong way round, which the language leaves
// undefined. fx.js also checks the finished picture for such pixels before the glow is made from it.
const ENV_GLSL = /* glsl */ `
  uniform sampler2D tPano; uniform float kPano; uniform vec3 uPanoAt, uBoxMin, uBoxMax; uniform float uEnv;
  vec3 pano(vec3 d, float lod) {
    vec2 uv = vec2(0.5 + atan(d.x, -d.z + 1e-7) / 6.2831853, 0.5 - asin(clamp(d.y, -1.0, 1.0)) / 3.14159265);
    return pow(max(textureLod(tPano, uv, lod).rgb, 0.0), vec3(2.2)) * kPano * uEnv;
  }
  vec3 boxed(vec3 p, vec3 r) {
    // a ray that runs exactly along a wall would divide by zero
    vec3 rs = vec3(abs(r.x) < 1e-5 ? 1e-5 : r.x, abs(r.y) < 1e-5 ? 1e-5 : r.y, abs(r.z) < 1e-5 ? 1e-5 : r.z);
    vec3 m = max((uBoxMax - p) / rs, (uBoxMin - p) / rs);
    return p + r * min(min(m.x, m.y), m.z) - uPanoAt;
  }`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv; varying vec2 vUv1; varying vec3 vWorld; varying vec3 vNormal;
  uniform vec3 uColor; uniform vec3 uTint; uniform float uHot;
  ${LIGHT_GLSL}
  ${ENV_GLSL}
  #if defined(MAP) || defined(LABEL)
  uniform sampler2D tMap;
  #endif
  #ifdef MAP
  uniform float uTile, uSat;
  #endif
  #ifdef LABEL
  uniform float uLift, uPaper;
  #endif
  #ifdef RMAP
  uniform sampler2D tRough;
  #endif
  #ifdef GLOSS
  uniform float uF0, uRough, uGloss, uMetal;
  #endif
  #ifdef RUG
  uniform vec4 uRug;
  #endif
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  void main() {
    vec3 albedo = uColor;
    float rgh = 1.0;
    #ifdef MAP
      vec2 tuv = vUv / uTile;
      #ifdef SWAP
        tuv = tuv.yx;
      #endif
      #ifdef DETAIL
        // one small grey picture laid twice: at its own size for the grain, and much larger and
        // blurred for the slow unevenness, so the eye finds no repeat
        albedo = uColor * (texture2D(tMap, tuv).r * texture2D(tMap, tuv * 0.29 + vec2(0.37, 0.61), 2.5).r * 4.0);
      #else
        albedo = texture2D(tMap, tuv).rgb * uTint;
        albedo = mix(vec3(dot(albedo, vec3(0.2126, 0.7152, 0.0722))), albedo, uSat);
      #endif
      #ifdef RMAP
        rgh = texture2D(tRough, tuv).r;
      #endif
    #endif
    #ifdef LABEL
      albedo = texture2D(tMap, vUv).rgb * uPaper * (1.0 + uHot * 0.9);
    #endif
    #ifdef GRAIN
      albedo *= 1.0 + (vnoise(vUv * 38.0) - 0.5) * GRAIN + (vnoise(vUv * 3.1) - 0.5) * GRAIN * 1.6;
    #endif
    #ifdef RUG
      // a flat-woven rug: bands of desert colour across its width, a border, the weave as fine noise
      vec2 r = (vWorld.xz - uRug.xy) / uRug.zw + 0.5;
      vec3 wool = vec3(0.17, 0.155, 0.14), sand = vec3(0.42, 0.33, 0.23), ink = vec3(0.03, 0.031, 0.036);
      float e = min(r.x, 1.0 - r.x);
      float bands = step(0.03, e) * step(e, 0.042) + step(0.055, e) * step(e, 0.06);
      vec3 c = mix(wool, sand, bands);
      float edge = step(r.y, 0.02) + step(0.98, r.y) + step(e, 0.008);
      c = mix(c, ink, clamp(edge, 0.0, 1.0));
      #ifdef MAP
        vec2 ruv = vWorld.xz / uTile;        // the pile: its tufts, and the broad shading where it lies one way or the other
        albedo = c * (texture2D(tMap, ruv).r * texture2D(tMap, ruv * 0.23 + vec2(0.41, 0.17), 2.5).r * 4.0);
      #else
        float weave = 0.82 + 0.36 * vnoise(vWorld.xz * vec2(480.0, 150.0)) * vnoise(vWorld.xz * 57.0 + 4.0) + 0.1 * (vnoise(vWorld.xz * 6.0) - 0.5);
        albedo = c * weave;
      #endif
    #endif
    vec3 light = bakedLight(vUv1);
    #ifdef LABEL
      light += uLift * (1.0 + uHot);        // shelf tags glow a little, like the electronic ones
    #endif
    vec3 col = albedo * light;
    #ifdef GLOSS
      vec3 n = normalize(vNormal);
      #ifdef TWOSIDED
        if (!gl_FrontFacing) n = -n;
      #endif
      vec3 v = normalize(cameraPosition - vWorld);
      float nv = clamp(dot(n, v), 0.0, 1.0);
      vec3 rdir = reflect(-v, n);
      #ifdef BOX
        rdir = normalize(boxed(vWorld, rdir));
      #endif
      // A chamfer or a rounded edge a pixel wide turns through a right angle inside that pixel.
      // Mirrored sharply it shows as a row of sparks; a camera would see one soft line. So the faster
      // the surface turns under a pixel, the blurrier its reflection.
      float turn = clamp(length(fwidth(n)) * 1.6, 0.0, 1.0);
      float rr = clamp(uRough * (0.55 + 0.9 * rgh) + turn, 0.0, 1.0);
      vec3 env = pano(rdir, rr * 7.0 + smoothstep(0.1, 0.3, rr));      // polished things mirror the room sharply; the rest keep their blur
      float fres = uF0 + (1.0 - uF0) * pow(1.0 - nv, 5.0) * (1.0 - rr * 0.6);
      vec3 spec = env * fres * uGloss * mix(vec3(1.0), albedo * 1.6, uMetal);
      col = col * (1.0 - uMetal * 0.75) + spec;
    #endif
    gl_FragColor = vec4(clamp(col, 0.0, 64.0), 1.0);
  }`;

// Things that give off their own light: bulb, strips, the sign, the little shop windows, the signal lenses.
const GLOW_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  uniform vec3 uGlow; uniform float uOn;
  #ifdef LABEL
  uniform sampler2D tMap;
  #endif
  void main() {
    vec3 c = uGlow * uOn;
    #ifdef LABEL
      c *= texture2D(tMap, vUv).rgb;
    #endif
    #ifdef LENS
      vec3 v = normalize(cameraPosition - vWorld);
      float rim = pow(clamp(1.0 - abs(dot(normalize(vNormal), v)), 0.0, 1.0), 1.5);   // facing you exactly, rounding can take this a hair under zero
      c = uGlow * (0.05 + uOn * (0.9 + rim * 0.8));
    #endif
    gl_FragColor = vec4(clamp(c, 0.0, 64.0), 1.0);
  }`;

const GLASS_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vWorld; varying vec3 vNormal;
  ${ENV_GLSL}
  uniform float uAlpha;
  void main() {
    vec3 n = normalize(vNormal); vec3 v = normalize(cameraPosition - vWorld);
    if (dot(n, v) < 0.0) n = -n;
    float f = 0.05 + 0.95 * pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 5.0);
    vec3 r = clamp(pano(normalize(boxed(vWorld, reflect(-v, n))), 0.6), 0.0, 64.0);
    gl_FragColor = vec4(r * f, uAlpha);
  }`;

function texture(loader, url, { srgb = false, repeat = false, mips = false } = {}) {
  const t = loader.load(url);
  t.flipY = false;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.generateMipmaps = mips;
  t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  if (mips) t.anisotropy = 8;
  return t;
}

export async function loadRoom(onProgress = () => {}) {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, done, total) => onProgress(done / total);
  const ready = new Promise((res, rej) => { manager.onLoad = res; manager.onError = (u) => rej(new Error("could not load " + u)); });
  const tl = new THREE.TextureLoader(manager);

  const [meta, light] = await Promise.all([fetch(here("room.json")).then((r) => r.json()), fetch(here("light.json")).then((r) => r.json())]);
  const maps = {};
  for (const [key, m] of Object.entries(light.maps)) maps[key] = { tex: texture(tl, here(m.file)), k: new THREE.Vector3(...m.scale) };
  const pano = texture(tl, here(light.pano.file), { mips: true });
  pano.wrapS = THREE.RepeatWrapping;
  const wood = {
    floor: texture(tl, here("tex/floor.webp"), { srgb: true, repeat: true, mips: true }),
    "floor-rough": texture(tl, here("tex/floor-rough.webp"), { repeat: true, mips: true }),
    walnut: texture(tl, here("tex/walnut.webp"), { srgb: true, repeat: true, mips: true }),
    oak: texture(tl, here("tex/oak.webp"), { srgb: true, repeat: true, mips: true }),
    paint: texture(tl, here("tex/paint.webp"), { repeat: true, mips: true }),
    rug: texture(tl, here("tex/rug.webp"), { repeat: true, mips: true }),
  };
  const gltf = await new GLTFLoader(manager).loadAsync(here("room.glb"));
  await ready;

  // one set of light uniforms, shared by every material
  const U = {
    uSky: { value: new THREE.Vector3(1, 1, 1) }, uLamp: { value: new THREE.Vector3() }, uMon: { value: new THREE.Vector3() },
    uStrip: { value: new THREE.Vector3() }, uSign: { value: new THREE.Vector3() }, uName: { value: new THREE.Vector3() },
    uTime: { value: 0 }, uGust: { value: 0 }, uEnv: { value: 1 },
    tPano: { value: pano }, kPano: { value: light.pano.scale },
    uPanoAt: { value: new THREE.Vector3(...meta.pano) },
    uBoxMin: { value: new THREE.Vector3(...meta.room.min).min(new THREE.Vector3(...meta.room.max)) },
    uBoxMax: { value: new THREE.Vector3(...meta.room.min).max(new THREE.Vector3(...meta.room.max)) },
  };
  const none = { tex: new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1), k: new THREE.Vector3() };
  none.tex.needsUpdate = true;
  const layer = (key) => maps[key] || none;                 // a layer that was not baked draws as no light
  const atlasU = (a) => ({
    tSky: { value: layer(a + "_sky").tex }, kSky: { value: layer(a + "_sky").k },
    tLmb: { value: layer(a + "_lmb").tex }, kLmb: { value: layer(a + "_lmb").k },
    tSgn: { value: layer(a + "_sgn").tex }, kSgn: { value: layer(a + "_sgn").k },
  });

  const cache = new Map();
  const glows = {};        // name -> material, for the page to switch
  const labels = {};       // label name -> material (the page gives each a canvas)
  const rug = meta.anchors.rug;

  function lit(atlas, name, color, sway, as) {
    const key = `${atlas}|${as || name}|${sway ? 1 : 0}`;
    if (cache.has(key)) return cache.get(key);
    const look = LOOK[as || name] || {};
    if (look.boost) color = color.clone().multiplyScalar(look.boost);
    if (look.mul) color = color.clone().multiply(new THREE.Color(...look.mul));
    const defines = {};
    const uniforms = { ...U, ...atlasU(atlas), uColor: { value: color.clone() }, uTint: { value: new THREE.Vector3(...(look.tint || [1, 1, 1])) }, uHot: { value: 0 } };
    if (look.map) { defines.MAP = 1; uniforms.tMap = { value: wood[look.map] }; uniforms.uTile = { value: look.tile }; uniforms.uSat = { value: look.sat ?? 1 }; if (look.swap) defines.SWAP = 1; if (look.detail) defines.DETAIL = 1; }
    if (look.rmap) { defines.RMAP = 1; uniforms.tRough = { value: wood[look.rmap] }; }
    if (look.f0) { defines.GLOSS = 1; uniforms.uF0 = { value: look.f0 }; uniforms.uRough = { value: look.rough }; uniforms.uGloss = { value: look.gloss }; uniforms.uMetal = { value: look.metal || 0 }; if (look.box) defines.BOX = 1; }
    if (look.grain) defines.GRAIN = look.grain.toFixed(3);
    if (look.rug) { defines.RUG = 1; uniforms.uRug = { value: new THREE.Vector4(rug.cx, -rug.cy, rug.w, rug.d) }; }
    if (look.twoSided) defines.TWOSIDED = 1;
    if (sway) defines.SWAY = 1;
    const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, defines, side: look.twoSided ? THREE.DoubleSide : THREE.FrontSide });
    m.name = name;
    cache.set(key, m);
    return m;
  }

  function glow(name, color, { label = false, lens = false } = {}) {
    const defines = {};
    if (label) defines.LABEL = 1;
    if (lens) defines.LENS = 1;
    const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: GLOW_FRAG, defines, uniforms: { uGlow: { value: new THREE.Vector3(...color) }, uOn: { value: 1 }, tMap: { value: null }, uTime: U.uTime, uGust: U.uGust } });
    glows[name] = m;
    return m;
  }

  const scene = gltf.scene;
  const meshes = [];
  scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const byItem = {};
  let screenMesh = null;
  const glass = [];
  for (const mesh of meshes) {
    // a mesh with several materials arrives as a group of parts; the object's own name and extras are on the parent
    // (the loader strips dots from names and keeps the original in userData.name)
    const owner = mesh.userData.name && /^[SFP]\./.test(mesh.userData.name) ? mesh : mesh.parent;
    const oname = owner.userData.name || owner.name;
    const extras = owner.userData;
    const atlas = oname[0];
    const mname = mesh.material.name;
    const color = mesh.material.color ? mesh.material.color.clone() : new THREE.Color(1, 1, 1);
    const g = mesh.geometry;
    const sway = !!extras.sway && !!g.getAttribute("color");
    if (sway) g.setAttribute("aSway", g.getAttribute("color"));
    mesh.userData.object = oname;
    if (extras.item) (byItem[extras.item] ||= []).push(owner);

    if (mname === "screen") { screenMesh = mesh; continue; }
    if (mname === "glass") { glass.push(mesh); continue; }
    if (mname === "bulb") { mesh.material = glow("bulb", [1.0, 0.62, 0.3]); continue; }
    if (mname === "strip") { mesh.material = glow(oname.includes("namestrip") ? "namestrip" : "strip", [1.0, 0.7, 0.42]); continue; }
    if (mname === "lit") { mesh.material = glow("lit", [1.0, 0.62, 0.28]); continue; }
    if (mname === "signface") { const m = glow("sign", [1, 0.98, 0.94], { label: true }); mesh.material = m; labels.sign = m; continue; }
    if (LOOK[mname] && LOOK[mname].lens !== undefined) { const c = color.clone(); mesh.material = glow("lens." + mname, [c.r, c.g, c.b], { lens: true }); continue; }
    if (extras.label) {
      const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, defines: { LABEL: 1 }, uniforms: { ...U, ...atlasU(atlas), uColor: { value: color }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uHot: { value: 0 }, uLift: { value: extras.label.startsWith("tag.") ? 0.2 : 0 }, uPaper: { value: { resume: 0.5, card: 0.75, keys: 1 }[extras.label] ?? 0.9 }, tMap: { value: null } } });
      mesh.material = m; labels[extras.label] = m;
      continue;
    }
    mesh.material = lit(atlas, mname, color, sway, /^F\.(name|role)$/.test(oname) ? "letters" : null);
  }
  for (const k of Object.keys(byItem)) byItem[k] = [...new Set(byItem[k])];

  const glassMat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: GLASS_FRAG, uniforms: { ...U, uAlpha: { value: 0.05 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  for (const g of glass) { g.material = glassMat; g.renderOrder = 5; }

  return { scene, meta, U, glows, labels, byItem, screenMesh, glass, ENV_GLSL, VERT };
}
