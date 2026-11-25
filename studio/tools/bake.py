"""Lights the room and bakes the light to textures. Run with Blender's Python module (bpy 5.3):

    python bake.py build  WORK                      lay out light-map UVs, save WORK/room.blend, write room.glb + room.json
    python bake.py bake   WORK ATLAS PASS RES SPP   one bake job (ATLAS: S, F or P; PASS: sky, lmb or sgn)
    python bake.py pano   WORK RES SPP              the reflection panorama
    python bake.py pack   WORK                      encode everything into app/room/

Every job runs on the CPU and is sized to finish in well under ten minutes. Light is baked without
surface colour (the browser multiplies it back), in separate layers so the page can mix them live:
  sky: the window at dusk, in colour.
  lmb: R = desk lamp, G = monitor glow, B = shelf strips.
  sgn: R = the lit sign, G = the light over the name.
Direct and bounced light are baked apart; the bounced part is smoothed, because it is the noisy one
and it has no sharp edges to lose.
"""
import sys, os, json, math, time
import numpy as np
import bpy
from mathutils import Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT = os.path.normpath(os.path.join(HERE, "..", "app", "room"))
ATLASES = ("S", "F", "P")
MARGIN = {"S": 0.0035, "F": 0.003, "P": 0.003}

SKY, WARM = (0.36, 0.5, 1.0), (1.0, 0.5, 0.27)
LAMP, STRIP, MON, SIGN, NAME = (1.0, 0.7, 0.4), (1.0, 0.74, 0.46), (0.8, 0.86, 1.0), (1.0, 0.98, 0.95), (1.0, 0.8, 0.58)
PASSES = {
    "sky": {"sky": (260, SKY), "sky_warm": (60, WARM)},
    "lmb": {"lamp": (30, (1, 0, 0)), "monitor": (12, (0, 1, 0)), "strip": (5, (0, 0, 1))},
    "sgn": {"sign": (6, (1, 0, 0)), "name": (10, (0, 1, 0))},
}
TRUE = {"sky": (260, SKY), "sky_warm": (60, WARM), "lamp": (30, LAMP), "monitor": (12, MON), "strip": (5, STRIP), "sign": (6, SIGN), "name": (10, NAME)}


def log(*a):
    print("[bake]", *a, flush=True)


def to3(v):
    """Blender (x, y, z up) to three.js (x, y up, z toward the viewer)."""
    return [round(v[0], 5), round(v[2], 5), round(-v[1], 5)]


def cycles_setup(spp):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    c = sc.cycles
    c.device = "CPU"
    c.samples = spp
    c.use_adaptive_sampling = False
    c.use_denoising = False
    c.max_bounces, c.diffuse_bounces, c.glossy_bounces, c.transmission_bounces = 5, 4, 0, 0
    c.caustics_reflective = c.caustics_refractive = False
    c.sample_clamp_indirect = 6.0
    sc.render.threads_mode = "AUTO"
    return sc


# ---------------------------------------------------------------- build

def add_light(name, kind, loc, rot=None, quat=None, size=None, **kw):
    li = bpy.data.lights.new(name, kind)
    if size:
        li.shape = "RECTANGLE"
        li.size, li.size_y = size
    for k, v in kw.items():
        setattr(li, k, v)
    ob = bpy.data.objects.new("LIGHT." + name, li)
    ob.location = loc
    if quat is not None:
        ob.rotation_mode = "QUATERNION"; ob.rotation_quaternion = quat
    else:
        ob.rotation_euler = Euler([math.radians(a) for a in rot], "XYZ")
    bpy.context.scene.collection.objects.link(ob)
    return ob


def add_lights(R, META):
    w = R.WIN
    cx, cz = (w["x0"] + w["x1"]) / 2, (w["z0"] + w["z1"]) / 2
    ww, wh = w["x1"] - w["x0"] - 0.06, w["z1"] - w["z0"] - 0.06
    add_light("sky", "AREA", (cx, R.YB + w["depth"] + 0.03, cz), (-90, 0, 0), size=(ww, wh))
    add_light("sky_warm", "AREA", (cx, R.YB + w["depth"] + 0.03, w["z0"] + wh * 0.3), (-104, 0, 0), size=(ww, wh * 0.5))
    lamp = META["lights"]["lamp"]
    axis = Vector(lamp["axis"])
    add_light("lamp", "SPOT", lamp["at"], quat=(-axis).to_track_quat("Z", "Y"), spot_size=math.radians(128), spot_blend=0.35, shadow_soft_size=0.02)
    for i, at in enumerate(META["lights"]["strips"]["at"]):
        add_light(f"strip.{i}", "AREA", at, (16, 0, 0), size=(META["lights"]["strips"]["w"], 0.012))
    s = R.SCREEN
    n = Vector(META["anchors"]["screen"]["normal"])
    add_light("monitor", "AREA", Vector((s["cx"], s["y"], s["cz"])) + n * 0.012, (-90 + s["tilt"], 0, 0), size=(s["w"], s["h"]))
    sg = META["lights"]["sign"]
    add_light("sign", "AREA", Vector(sg["at"]) + Vector((0, -0.004, 0)), (-90, 0, 0), size=(sg["w"], sg["h"]))
    nm = META["lights"]["name"]
    add_light("name", "AREA", Vector(nm["at"]) + Vector((0, 0, -0.004)), (24, 0, 0), size=(nm["w"], 0.02))


def set_lights(conf):
    for ob in bpy.data.objects:
        if ob.type != "LIGHT":
            continue
        key = ob.name[6:].split(".")[0]
        e, col = conf.get(key, (0, (1, 1, 1)))
        if key == "strip":
            pass
        ob.data.energy = e
        ob.data.color = col
        ob.hide_render = e == 0


def atlas_objects(atlas, baked=True):
    out = []
    for ob in bpy.data.objects:
        if ob.type != "MESH" or not ob.name.startswith(atlas + "."):
            continue
        if baked and (ob.get("no_bake") or ob.get("bake_only")):
            continue
        out.append(ob)
    return out


def select(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objs:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def get_uv(ob, name="lm"):
    a = np.zeros(len(ob.data.loops) * 2, np.float32)
    ob.data.uv_layers[name].data.foreach_get("uv", a)
    return a.reshape(-1, 2)


def set_uv(ob, uv, name="lm"):
    ob.data.uv_layers[name].data.foreach_set("uv", uv.astype(np.float32).ravel())


def layout(atlas):
    objs = atlas_objects(atlas)
    for ob in objs:
        ob.data.uv_layers.active = ob.data.uv_layers["lm"]
    select(objs)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=0.0, scale_to_bounds=False)
    bpy.ops.uv.average_islands_scale()
    bpy.ops.object.mode_set(mode="OBJECT")
    for ob in objs:                                      # more texels where the eye lands, fewer where it does not
        k = float(ob.get("lm_scale", 1.0))
        if abs(k - 1) > 1e-3:
            uv = get_uv(ob)
            c = uv.mean(0)
            set_uv(ob, c + (uv - c) * k)
    select(objs)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(rotate=True, margin_method="FRACTION", margin=MARGIN[atlas], shape_method="AABB")
    bpy.ops.object.mode_set(mode="OBJECT")
    # report: how many texels per metre at 2048
    area3 = areauv = 0.0
    for ob in objs:
        me = ob.data
        uv = get_uv(ob)
        for p in me.polygons:
            area3 += p.area
            pts = uv[list(p.loop_indices)]
            x, y = pts[:, 0], pts[:, 1]
            areauv += 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))
        lo, hi = uv.min(0), uv.max(0)
        assert lo.min() > -1e-4 and hi.max() < 1 + 1e-4, (ob.name, lo, hi)
    log(f"atlas {atlas}: {len(objs)} objects, {area3:.1f} m2, uv cover {areauv:.2f}, {math.sqrt(areauv / area3) * 2048:.0f} texels/m at 2048")


def stage_build(work):
    import build_room as R
    t = time.time()
    objs, META = R.build_all()
    cycles_setup(16)
    add_lights(R, META)
    for a in ATLASES:
        layout(a)
    # the sway weights travel as the vertex colour
    for ob in objs:
        me = ob.data
        if "sway" in me.color_attributes:
            me.color_attributes.active_color = me.color_attributes["sway"]
            me.color_attributes.render_color_index = me.color_attributes.find("sway")
        for uvl in me.uv_layers:
            uvl.active_render = uvl.name == "uv0"
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(work, "room.blend"))
    # export
    exp = [ob for ob in objs if not ob.get("bake_only")]
    select(exp)
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "room.glb"), export_format="GLB", use_selection=True, export_apply=True,
                              export_yup=True, export_texcoords=True, export_normals=True, export_materials="EXPORT",
                              export_extras=True, export_vertex_color="ACTIVE", export_all_vertex_colors=False,
                              export_cameras=False, export_lights=False, export_animations=False)
    meta = {"room": {"min": to3((-R.W2, R.YF, 0)), "max": to3((R.W2, R.YB, R.H)), "w2": R.W2, "back": -R.YB, "front": -R.YF, "h": R.H},
            "pano": to3(R.PANO_AT), "items": {}, "labels": META["labels"], "anchors": {}, "lights": {}}
    for id_, it in META["items"].items():
        ob = bpy.data.objects["P.item." + id_]
        bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
        lo = Vector((min(b.x for b in bb), min(b.y for b in bb), min(b.z for b in bb)))
        hi = Vector((max(b.x for b in bb), max(b.y for b in bb), max(b.z for b in bb)))
        meta["items"][id_] = {"at": to3(it["at"]), "min": to3((lo.x, hi.y, lo.z)), "max": to3((hi.x, lo.y, hi.z))}
    A = META["anchors"]
    meta["anchors"]["screen"] = {"corners": [to3(c) for c in A["screen"]["corners"]], "normal": to3(A["screen"]["normal"])}
    w = A["window"]
    meta["anchors"]["window"] = {"min": to3((w["x0"], w["y"], w["z0"])), "max": to3((w["x1"], w["y"], w["z1"]))}
    meta["anchors"]["rug"] = A["rug"]
    meta["anchors"]["name"] = A["name"]
    meta["anchors"]["shelves"] = A["shelves"]
    meta["anchors"]["lamp"] = to3(A["lamp"]["at"])
    L = META["lights"]
    meta["lights"] = {"lamp": {"at": to3(L["lamp"]["at"]), "aim": to3(L["lamp"]["aim"])},
                      "strips": [to3(p) for p in L["strips"]["at"]], "sign": to3(L["sign"]["at"]), "name": to3(L["name"]["at"])}
    with open(os.path.join(OUT, "room.json"), "w") as f:
        json.dump(meta, f, indent=1)
    tris = sum(len(ob.data.polygons) for ob in exp)
    log(f"built {len(objs)} objects, {tris} faces, glb {os.path.getsize(os.path.join(OUT, 'room.glb')) / 1e6:.2f} MB in {time.time() - t:.1f}s")


# ---------------------------------------------------------------- bake

def blur_masked(img, mask, sigma):
    """Gaussian blur that only mixes texels inside the mask (so islands do not bleed into the gaps)."""
    if sigma <= 0:
        return img
    r = int(math.ceil(sigma * 3))
    ks = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2).astype(np.float32)
    w = mask.astype(np.float32)
    num = img * w[..., None]
    for axis in (0, 1):
        n2 = np.zeros_like(num); w2 = np.zeros_like(w)
        for k, off in zip(ks, range(-r, r + 1)):
            n2 += k * np.roll(num, off, axis)
            w2 += k * np.roll(w, off, axis)
        num, w = n2, w2
    out = num / np.maximum(w, 1e-6)[..., None]
    return np.where(mask[..., None], out, 0)


def dilate(img, mask, steps):
    img, mask = img.copy(), mask.copy()
    for _ in range(steps):
        acc = np.zeros_like(img); cnt = np.zeros(mask.shape, np.float32)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            m = np.roll(mask, (dy, dx), (0, 1))
            acc += np.roll(img, (dy, dx), (0, 1)) * m[..., None]
            cnt += m
        new = (~mask) & (cnt > 0)
        img[new] = acc[new] / cnt[new][:, None]
        mask |= new
    return img


def stage_bake(work, atlas, pname, res, spp):
    t0 = time.time()
    bpy.ops.wm.open_mainfile(filepath=os.path.join(work, "room.blend"))
    sc = cycles_setup(spp)
    objs = atlas_objects(atlas)
    img = bpy.data.images.new("bake", res, res, alpha=True, float_buffer=True)
    for m in bpy.data.materials:
        if m.node_tree and "bake" in m.node_tree.nodes:
            node = m.node_tree.nodes["bake"]
            node.image = img
            m.node_tree.nodes.active = node
            if pname != "sky":                             # layers that get their colour later are baked on grey
                c = m["albedo"]
                g = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
                m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (g, g, g, 1)
    for ob in bpy.data.objects:
        if ob.type == "MESH" and ob.get("no_bake"):
            ob.hide_render = True                          # glass and the lit faces do not block or bounce light
    for ob in objs:
        ob.data.uv_layers.active = ob.data.uv_layers["lm"]
    set_lights(PASSES[pname])
    select(objs)
    bk = sc.render.bake
    bk.margin = 0
    bk.use_clear = True
    bk.use_pass_color = False
    parts = {}
    mask = None
    for which, n in (("direct", spp), ("indirect", max(16, int(spp * 1.5)))):
        sc.cycles.samples = n
        bk.use_pass_direct = which == "direct"
        bk.use_pass_indirect = which == "indirect"
        t = time.time()
        bpy.ops.object.bake(type="DIFFUSE")
        a = np.empty(res * res * 4, np.float32)
        img.pixels.foreach_get(a)
        a = a.reshape(res, res, 4)
        parts[which] = np.nan_to_num(a[..., :3].copy(), nan=0.0, posinf=0.0, neginf=0.0)
        mask = a[..., 3] > 0.5 if mask is None else (mask | (a[..., 3] > 0.5))
        log(f"{atlas}/{pname} {which}: {n} spp at {res} in {time.time() - t:.1f}s")
    k = res / 2048
    light = blur_masked(parts["direct"], mask, 0.75 * k) + blur_masked(parts["indirect"], mask, 3.2 * k)
    light = dilate(light, mask, max(4, int(10 * k)))
    np.save(os.path.join(work, f"{atlas}_{pname}.npy"), light[::-1].astype(np.float16))    # top row first
    log(f"{atlas}/{pname}: cover {mask.mean():.2f}, mean {light[mask].mean(0).round(4)}, p99.9 {np.percentile(light[mask], 99.9, axis=0).round(3)}, total {time.time() - t0:.1f}s")


# ---------------------------------------------------------------- reflection panorama

def emission(mat_name, color, strength):
    m = bpy.data.materials.get(mat_name)
    if not m:
        return
    nt = m.node_tree
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color, 1)
    em.inputs["Strength"].default_value = strength
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    nt.links.new(em.outputs[0], out.inputs["Surface"])


def stage_pano(work, res, spp):
    import build_room as R
    t0 = time.time()
    bpy.ops.wm.open_mainfile(filepath=os.path.join(work, "room.blend"))
    sc = cycles_setup(spp)
    set_lights(TRUE)
    for ob in bpy.data.objects:
        if ob.type == "MESH" and ob.name.startswith("F.glass"):
            ob.hide_render = True
    emission("screen", (0.5, 0.56, 0.66), 2.2)
    emission("bulb", LAMP, 40); emission("strip", STRIP, 14); emission("signface", SIGN, 3.5); emission("lit", LAMP, 3)
    # the dusk outside, as a glowing card behind the window
    w = R.WIN
    import bmesh
    for name, z0, z1, col, e in (("skyA", w["z0"] - 0.6, w["z0"] + 0.55, (1.0, 0.5, 0.27), 3.0), ("skyB", w["z0"] + 0.55, w["z1"] + 0.8, (0.2, 0.3, 0.7), 2.4)):
        bm = R.quad(w["x1"] - w["x0"] + 2.4, z1 - z0, ((w["x0"] + w["x1"]) / 2, R.YB + 0.9, (z0 + z1) / 2), R.D(90, 0, 0))
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
        m = bpy.data.materials.new(name); m.use_nodes = True
        me.materials.append(m)
        emission(name, col, e)
    cam = bpy.data.cameras.new("pano")
    cam.type = "PANO"
    try:
        cam.panorama_type = "EQUIRECTANGULAR"
    except Exception:
        cam.cycles.panorama_type = "EQUIRECTANGULAR"
    cob = bpy.data.objects.new("pano", cam)
    cob.location = R.PANO_AT
    cob.rotation_euler = Euler((math.radians(90), 0, 0), "XYZ")
    sc.collection.objects.link(cob)
    sc.camera = cob
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = res, res // 2, 100
    sc.render.image_settings.file_format = "OPEN_EXR"
    sc.render.filepath = os.path.join(work, "pano.exr")
    sc.view_settings.view_transform = "Raw" if "Raw" in [e.identifier for e in sc.view_settings.bl_rna.properties["view_transform"].enum_items] else "Standard"
    bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(sc.render.filepath)
    a = np.empty(res * (res // 2) * 4, np.float32)
    im.pixels.foreach_get(a)
    a = a.reshape(res // 2, res, 4)[::-1, :, :3]
    a = a.reshape(res // 4, 2, res // 2, 2, 3).mean((1, 3))           # halve: four renders' worth of samples per pixel
    np.save(os.path.join(work, "pano.npy"), a.astype(np.float16))
    log(f"pano {res}x{res // 2} at {spp} spp in {time.time() - t0:.1f}s, mean {a.mean((0, 1)).round(3)}, max {a.max():.1f}")


# ---------------------------------------------------------------- pack

GAMMA = 3.0      # the browser undoes it with x*x*x; a steep curve keeps precision in the dim parts of the room


def encode(a, k, gamma=GAMMA):
    return (np.clip(a / k, 0, 1) ** (1 / gamma) * 255 + 0.5).astype(np.uint8)


def stage_pack(work):
    from PIL import Image
    info = {"gamma": GAMMA, "maps": {}}
    total = 0
    for atlas in ATLASES:
        for pname in PASSES:
            p = os.path.join(work, f"{atlas}_{pname}.npy")
            if not os.path.exists(p):
                log("missing", p); continue
            a = np.load(p).astype(np.float32)
            if pname == "sky":
                # the reveal right beside the window is far brighter than the room; let it clip
                k = [min(6.0, float(np.percentile(a, 99.9)) * 1.05)] * 3
            else:
                k = [max(1e-4, float(np.percentile(a[..., c], 99.95)) * 1.1) for c in range(3)]
            px = np.stack([encode(a[..., c], k[c]) for c in range(3)], -1)
            name = f"{atlas}_{pname}.webp"
            # the window layer is ordinary colour and compresses well; the others pack three unrelated
            # lights into R, G and B, which lossy colour compression would smear into each other
            opts = dict(quality=97, method=6) if pname == "sky" else dict(lossless=True, method=6)
            Image.fromarray(px, "RGB").save(os.path.join(OUT, name), "WEBP", **opts)
            size = os.path.getsize(os.path.join(OUT, name)); total += size
            info["maps"][f"{atlas}_{pname}"] = {"file": name, "scale": [round(v, 5) for v in k], "size": a.shape[0]}
            log(f"{name}: {a.shape[0]}px, scale {np.round(k, 3)}, {size / 1e3:.0f} kB")
    p = os.path.join(work, "pano.npy")
    if os.path.exists(p):
        a = np.load(p).astype(np.float32)
        k = 8.0
        Image.fromarray(encode(a, k, 2.2), "RGB").save(os.path.join(OUT, "pano.webp"), "WEBP", quality=92, method=6)
        info["pano"] = {"file": "pano.webp", "scale": k}
        total += os.path.getsize(os.path.join(OUT, "pano.webp"))
    with open(os.path.join(OUT, "light.json"), "w") as f:
        json.dump(info, f, indent=1)
    log(f"packed {total / 1e6:.2f} MB")


def stage_view(work, out, w, spp, cam_at, cam_to, fov):
    """A plain Cycles picture of the room from a point, to check the model before the browser exists."""
    import build_room as R
    bpy.ops.wm.open_mainfile(filepath=os.path.join(work, "room.blend"))
    sc = cycles_setup(spp)
    set_lights(TRUE)
    for ob in bpy.data.objects:
        if ob.type == "MESH" and (ob.name.startswith("F.glass") or ob.get("bake_only")):
            ob.hide_render = True
    emission("screen", (0.5, 0.56, 0.66), 2.2)
    emission("bulb", LAMP, 40); emission("strip", STRIP, 14); emission("signface", SIGN, 3.5); emission("lit", LAMP, 3)
    cam = bpy.data.cameras.new("view")
    cam.sensor_fit = "VERTICAL"
    cam.angle_y = math.radians(fov)
    cob = bpy.data.objects.new("view", cam)
    cob.location = cam_at
    cob.rotation_euler = (Vector(cam_to) - Vector(cam_at)).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(cob)
    sc.camera = cob
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, int(w * 9 / 16), 100
    sc.render.image_settings.file_format = "PNG"
    sc.view_settings.view_transform = "AgX" if "AgX" in [e.identifier for e in sc.view_settings.bl_rna.properties["view_transform"].enum_items] else "Standard"
    sc.view_settings.exposure = 1.6
    sc.render.filepath = out
    bpy.ops.render.render(write_still=True)
    log("view saved", out)


if __name__ == "__main__":
    a = sys.argv[1:]
    stage, work = a[0], a[1]
    os.makedirs(work, exist_ok=True)
    if stage == "build":
        stage_build(work)
    elif stage == "bake":
        stage_bake(work, a[2], a[3], int(a[4]), int(a[5]))
    elif stage == "pano":
        stage_pano(work, int(a[2]), int(a[3]))
    elif stage == "pack":
        stage_pack(work)
    elif stage == "view":
        f = [float(x) for x in a[5:12]]
        stage_view(work, a[2], int(a[3]), int(a[4]), f[0:3], f[3:6], f[6])
