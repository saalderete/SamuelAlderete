"""The studio, built in code. Blender (bpy) makes every wall, shelf and object here from boxes, lathes
and a few hand-made meshes; tools/bake.py lights it and bakes the light. Units are metres, Z is up,
the camera looks along +Y at the back wall.

Three groups share three light-map atlases: S (the shell: walls, floor, ceiling), F (furniture) and
P (props and the things on the shelves). An object named P.item.<id> is one of the clickable things;
<id> matches app/content.js. L.<id> objects are flat labels whose picture is drawn in the browser.
"""
import math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

W2, YB, YF, H = 2.7, 2.2, -2.4, 2.7           # half width, back wall, front wall, ceiling
WIN = dict(x0=-2.2, x1=-0.9, z0=0.95, z1=2.25, depth=0.22)
DESK = dict(cx=0.25, cy=1.72, w=1.8, d=0.8, top=0.74)
SHELF = dict(cx=2.01, w=1.22, y0=1.88, y1=2.195, tops=[0.10, 0.52, 0.94, 1.36, 1.78])
SCREEN = dict(cx=0.25, y=1.975, cz=1.13, w=0.80, h=0.45, tilt=-3.0)
PANO_AT = (0.1, 0.1, 1.15)

# name: (linear RGB albedo). What each one looks like in the browser is in app/room/materials.js.
MATS = {
    "wall": (0.058, 0.064, 0.074), "ceiling": (0.46, 0.46, 0.45), "floor": (0.33, 0.225, 0.14),
    "trim": (0.022, 0.023, 0.026), "steel": (0.02, 0.021, 0.024), "walnut": (0.17, 0.092, 0.05),
    "oak": (0.42, 0.31, 0.2), "felt": (0.03, 0.031, 0.034), "chrome": (0.55, 0.57, 0.6),
    "plastic": (0.016, 0.017, 0.02), "paper": (0.78, 0.78, 0.75), "white": (0.8, 0.8, 0.78),
    "terracotta": (0.42, 0.19, 0.11), "concrete": (0.3, 0.3, 0.29), "leaf": (0.03, 0.085, 0.036),
    "stem": (0.022, 0.034, 0.016), "soil": (0.03, 0.022, 0.016), "yellow": (0.85, 0.5, 0.02),
    "rubber": (0.012, 0.012, 0.013), "brass": (0.55, 0.38, 0.14), "navy": (0.012, 0.018, 0.06),
    "orange": (0.9, 0.28, 0.02), "rug": (0.17, 0.155, 0.14), "fabric": (0.046, 0.049, 0.056),
    "graphite": (0.07, 0.074, 0.08), "stone": (0.36, 0.36, 0.34), "cream": (0.62, 0.58, 0.5),
    "book1": (0.09, 0.13, 0.17), "book2": (0.3, 0.1, 0.07), "book3": (0.5, 0.46, 0.38),
    "book4": (0.06, 0.1, 0.08), "book5": (0.14, 0.14, 0.15), "red": (0.6, 0.03, 0.03),
    "amber": (0.75, 0.4, 0.02), "green": (0.03, 0.45, 0.1), "aluminium": (0.5, 0.51, 0.53),
    # drawn by the browser, dark and plain while baking:
    "screen": (0.01, 0.01, 0.012), "glass": (0.02, 0.02, 0.02), "bulb": (0.8, 0.8, 0.8),
    "strip": (0.8, 0.8, 0.8), "signface": (0.7, 0.7, 0.7), "label": (0.7, 0.7, 0.68),
    "lit": (0.6, 0.5, 0.3), "coffee": (0.02, 0.012, 0.008),
}

OBJECTS = []      # every finished object
META = {"items": {}, "labels": {}, "lights": {}, "anchors": {}}
_mats = {}


def D(*deg):
    return tuple(math.radians(d) for d in deg)


def mat(name):
    if name not in _mats:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        c = MATS[name]
        bsdf.inputs["Base Color"].default_value = (c[0], c[1], c[2], 1)
        bsdf.inputs["Roughness"].default_value = 1.0
        for key in ("Specular IOR Level", "Specular"):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = 0.0
        tex = m.node_tree.nodes.new("ShaderNodeTexImage")   # the bake target
        tex.name = "bake"
        m.node_tree.nodes.active = tex
        m["albedo"] = c
        _mats[name] = m
    return _mats[name]


# ---------------------------------------------------------------- primitives (each returns a bmesh)

def _place(bm, loc, rot):
    M = Matrix.Translation(loc) @ Euler(rot, "XYZ").to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    return bm


EDGE = 0.003       # nothing real has a razor edge: a box that is not a sheet gets at least this much chamfer


def _flat_faces(bm):
    """Mark a chamfered part so Obj.done() gives it area-weighted normals (see weighted_normals)."""
    lay = bm.faces.layers.int.get("wn") or bm.faces.layers.int.new("wn")
    for f in bm.faces:
        f.smooth = True
        f[lay] = 1


def box(size, loc, rot=(0, 0, 0), bevel=None):
    """A box. bevel=None chamfers its edges a little (sheets and slivers are left alone); a number
    rounds them by that much; 0 keeps them razor sharp."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    seg = 2
    if bevel is None:
        m = min(size)
        bevel, seg = (0.0 if m < 0.012 else min(EDGE, m * 0.2)), 1
    if bevel:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=seg, affect="EDGES", profile=0.5)
        _flat_faces(bm)
    return _place(bm, loc, rot)


def soft_box(size, loc, rot=(0, 0, 0), r=0.03, seg=4, cuts=0, shape=None):
    """A cushion or a moulded part: a box with generously rounded edges. With `cuts` it is divided
    first, so that `shape` (a function of each point, before the part is placed) can swell or bend it."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if cuts:
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=cuts, use_grid_fill=True)
        bm.normal_update()
    hard = [e for e in bm.edges if len(e.link_faces) == 2 and e.link_faces[0].normal.dot(e.link_faces[1].normal) < 0.5]
    bmesh.ops.bevel(bm, geom=hard, offset=r, segments=seg, affect="EDGES", profile=0.5)
    if shape:
        for v in bm.verts:
            v.co = shape(v.co.copy())
    for f in bm.faces:
        f.smooth = True
    bm.normal_update()
    return _place(bm, loc, rot)


def cyl(r, h, loc, rot=(0, 0, 0), r2=None, seg=24, caps=True):
    """A cylinder or cone along local Z, centred on loc."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    for f in bm.faces:
        if len(f.verts) == 4:
            f.smooth = True
        else:
            for e in f.edges:
                e.smooth = False
    return _place(bm, loc, rot)


def rod(p, q, r, seg=10):
    """A thin cylinder from p to q."""
    p, q = Vector(p), Vector(q)
    d = q - p
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=d.length)
    for f in bm.faces:
        if len(f.verts) == 4:
            f.smooth = True
    M = Matrix.Translation((p + q) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    return bm


def lathe(profile, loc=(0, 0, 0), rot=(0, 0, 0), seg=32):
    """Spin a list of (radius, z) points around Z. A radius of 0 closes the shape."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        if r <= 1e-6:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            if len(a) == 1 and len(b) == 1:
                continue
            if len(a) == 1:
                f = bm.faces.new((a[0], b[i], b[j]))
            elif len(b) == 1:
                f = bm.faces.new((a[i], a[j], b[0]))
            else:
                f = bm.faces.new((a[i], a[j], b[j], b[i]))
            f.smooth = True
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _place(bm, loc, rot)


def ball(r, loc, scale=(1, 1, 1), seg=20, rings=12, half=False, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    if half:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, 0), plane_no=(0, 0, -1), clear_outer=True)
        bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary])
    for f in bm.faces:
        f.smooth = len(f.verts) <= 4
    bmesh.ops.scale(bm, vec=scale, verts=bm.verts)
    return _place(bm, loc, rot)


def quad(w, h, loc, rot=(0, 0, 0)):
    """A flat rectangle in local XY facing +Z (so rot=(90,0,0) stands it up facing -Y)."""
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0))]
    bm.faces.new(vs)
    return _place(bm, loc, rot)


def prism(w, d, h, loc, rot=(0, 0, 0)):
    """A roof: a triangular prism, ridge along local X, base w by d, height h."""
    bm = bmesh.new()
    a = [bm.verts.new(p) for p in ((-w / 2, -d / 2, 0), (-w / 2, d / 2, 0), (-w / 2, 0, h))]
    b = [bm.verts.new(p) for p in ((w / 2, -d / 2, 0), (w / 2, d / 2, 0), (w / 2, 0, h))]
    bm.faces.new((a[0], a[1], a[2])); bm.faces.new((b[1], b[0], b[2]))
    bm.faces.new((a[0], a[2], b[2], b[0])); bm.faces.new((a[2], a[1], b[1], b[2])); bm.faces.new((a[1], a[0], b[0], b[1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _place(bm, loc, rot)


# ---------------------------------------------------------------- collecting parts into objects

class Obj:
    """Collects parts, each with a material, and becomes one mesh object."""

    def __init__(self, name, origin=None, **props):
        self.name, self.origin, self.props = name, origin, props
        self.bm = bmesh.new()
        self.slots = []
        self.col = None

    def add(self, part, material, sway=None):
        me = bpy.data.meshes.new("part")
        part.to_mesh(me); part.free()
        n0 = len(self.bm.faces)
        v0 = len(self.bm.verts)
        self.bm.from_mesh(me)
        bpy.data.meshes.remove(me)
        if material not in self.slots:
            self.slots.append(material)
        idx = self.slots.index(material)
        self.bm.faces.ensure_lookup_table()
        for f in self.bm.faces[n0:]:
            f.material_index = idx
        if sway is not None:
            self._sway(v0, sway)
        return self

    def _sway(self, v0, fn):
        if self.col is None:
            self.col = self.bm.verts.layers.float_color.new("sway")
        self.bm.verts.ensure_lookup_table()
        for v in self.bm.verts[v0:]:
            v[self.col] = fn(v.co)

    def done(self):
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me); self.bm.free()
        for s in self.slots:
            me.materials.append(mat(s))
        ob = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(ob)
        if self.origin is not None:
            o = Vector(self.origin)
            me.transform(Matrix.Translation(-o))
            ob.location = o
        box_uv(ob)
        me.uv_layers.new(name="lm")
        weighted_normals(me)
        for k, v in self.props.items():
            ob[k] = v
        ob["oname"] = self.name
        OBJECTS.append(ob)
        return ob


def weighted_normals(me):
    """Rounded edges without puffy faces. Smooth shading shares one normal between the faces that meet
    at a point, and on a chamfered box that leans every flat face's corners outward by some 30 degrees,
    so a desk top reflects the room as if it were a pillow. Here each face pulls the shared normal by
    its area: the large faces stay flat and only the chamfer turns. Only parts box() chamfered are
    touched; lathes, balls and cushions keep ordinary smooth shading."""
    lay = me.attributes.get("wn")
    if lay is None:
        return
    flag = [d.value for d in lay.data]
    acc = [Vector() for _ in me.vertices]
    for p in me.polygons:
        if flag[p.index]:
            for vi in p.vertices:
                acc[vi] += p.normal * p.area
    out = []
    for p in me.polygons:
        for li in p.loop_indices:
            a = acc[me.loops[li].vertex_index]
            out.append(tuple(a.normalized()) if flag[p.index] and a.length > 1e-12 else (0.0, 0.0, 0.0))
    me.normals_split_custom_set(out)
    me.attributes.remove(me.attributes["wn"])


def box_uv(ob, unit=None):
    """uv0: world position projected along each face's main axis, in metres (or 0..1 for a label)."""
    me = ob.data
    uv = me.uv_layers.new(name="uv0")
    loc = ob.location
    for p in me.polygons:
        n = p.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co + loc
            if ax == 2:
                uv.data[li].uv = (co.x, co.y)
            elif ax == 0:
                uv.data[li].uv = (co.y, co.z)
            else:
                uv.data[li].uv = (co.x, co.z)


def label(name, w, h, loc, rot=(0, 0, 0), group="P", material="label", item=None, **props):
    """A flat rectangle whose picture the browser draws. uv0 runs 0..1, left to right, bottom to top."""
    bm = quad(w, h, (0, 0, 0))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    me.materials.append(mat(material))
    uv = me.uv_layers.new(name="uv0")
    for li, c in zip(me.polygons[0].loop_indices, ((0, 0), (1, 0), (1, 1), (0, 1))):
        uv.data[li].uv = c
    me.uv_layers.new(name="lm")
    ob = bpy.data.objects.new(f"{group}.L.{name}", me)
    ob.location = loc
    ob.rotation_euler = Euler(rot, "XYZ")
    bpy.context.scene.collection.objects.link(ob)
    ob["label"] = name
    ob["lm_scale"] = props.pop("lm_scale", 1.5)
    if item:
        ob["item"] = item
    for k, v in props.items():
        ob[k] = v
    META["labels"][name] = {"w": w, "h": h}
    OBJECTS.append(ob)
    return ob


def item(id_, at, parts_fn, **props):
    """One clickable thing: P.item.<id>, with its origin at `at` (the point it stands on)."""
    o = Obj(f"P.item.{id_}", origin=at, item=id_, lm_scale=props.pop("lm_scale", 1.6), **props)
    parts_fn(o, Vector(at))
    ob = o.done()
    META["items"][id_] = {"at": list(at)}
    return ob


# ---------------------------------------------------------------- the room

def build_shell():
    s = Obj("S.shell")
    x0, x1, z0, z1, dp = WIN["x0"], WIN["x1"], WIN["z0"], WIN["z1"], WIN["depth"]
    # back wall around the window, facing -Y
    def back(xa, xb, za, zb):
        s.add(quad(xb - xa, zb - za, ((xa + xb) / 2, YB, (za + zb) / 2), D(90, 0, 0)), "wall")
    back(-W2, x0, 0, H); back(x1, W2, 0, H); back(x0, x1, 0, z0); back(x0, x1, z1, H)
    # the window's reveal
    s.add(quad(dp, z1 - z0, (x0, YB + dp / 2, (z0 + z1) / 2), D(90, 0, 90)), "wall")
    s.add(quad(dp, z1 - z0, (x1, YB + dp / 2, (z0 + z1) / 2), D(90, 0, -90)), "wall")
    s.add(quad(x1 - x0, dp, ((x0 + x1) / 2, YB + dp / 2, z1), D(180, 0, 0)), "wall")
    s.add(quad(x1 - x0, dp, ((x0 + x1) / 2, YB + dp / 2, z0), D(0, 0, 0)), "stone")
    # side walls
    s.add(quad(YB - YF, H, (-W2, (YB + YF) / 2, H / 2), D(90, 0, 90)), "wall")      # left wall, facing +X into the room
    s.add(quad(YB - YF, H, (W2, (YB + YF) / 2, H / 2), D(90, 0, -90)), "wall")      # right wall, facing -X
    s.done()
    f = Obj("S.floor", lm_scale=1.15)
    f.add(quad(2 * W2, YB - YF, (0, (YB + YF) / 2, 0)), "floor")
    f.done()
    c = Obj("S.ceiling", lm_scale=0.45)
    c.add(quad(2 * W2, YB - YF, (0, (YB + YF) / 2, H), D(180, 0, 0)), "ceiling")
    c.done()
    # the wall behind the camera: it bounces light while baking and is never drawn
    b = Obj("X.front", bake_only=True)
    b.add(quad(2 * W2, H, (0, YF, H / 2), D(-90, 0, 0)), "wall")
    b.done()
    t = Obj("S.trim", lm_scale=0.7)
    t.add(box((2 * W2, 0.014, 0.09), (0, YB - 0.007, 0.045)), "trim")
    t.add(box((0.014, YB - YF, 0.09), (-W2 + 0.007, (YB + YF) / 2, 0.045)), "trim")
    t.add(box((0.014, YB - YF, 0.09), (W2 - 0.007, (YB + YF) / 2, 0.045)), "trim")
    t.done()


def build_window():
    x0, x1, z0, z1 = WIN["x0"], WIN["x1"], WIN["z0"], WIN["z1"]
    w, h, y = x1 - x0, z1 - z0, YB + 0.12
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    f = Obj("F.window")
    b = 0.042
    f.add(box((w, 0.055, b), (cx, y, z0 + b / 2)), "steel"); f.add(box((w, 0.055, b), (cx, y, z1 - b / 2)), "steel")
    f.add(box((b, 0.055, h), (x0 + b / 2, y, cz)), "steel"); f.add(box((b, 0.055, h), (x1 - b / 2, y, cz)), "steel")
    for i in (1, 2):
        f.add(box((0.026, 0.045, h - 2 * b), (x0 + w * i / 3, y, cz)), "steel")
    f.add(box((w - 2 * b, 0.045, 0.026), (cx, y, z0 + h * 0.64)), "steel")
    f.add(box((w + 0.1, 0.19, 0.028), (cx, YB + 0.045, z0 - 0.014)), "stone")
    f.done()
    g = Obj("F.glass.window", no_bake=True)
    g.add(quad(w - 2 * b, h - 2 * b, (cx, y + 0.005, cz), D(90, 0, 0)), "glass")
    g.done()
    META["anchors"]["window"] = {"x0": x0, "x1": x1, "z0": z0, "z1": z1, "y": YB + WIN["depth"]}


def build_bench():
    x0, x1 = WIN["x0"] - 0.02, WIN["x1"] + 0.02
    cx, w, d = (x0 + x1) / 2, x1 - x0, 0.38
    cy = YB - d / 2 - 0.004
    f = Obj("F.bench")
    f.add(box((w - 0.06, d - 0.05, 0.05), (cx, cy + 0.01, 0.025)), "steel")
    f.add(box((w, d, 0.38), (cx, cy, 0.05 + 0.19)), "graphite")
    f.add(box((w + 0.02, d + 0.015, 0.03), (cx, cy - 0.004, 0.445), bevel=0.004), "oak")
    for i in (1, 2):                                   # door gaps
        f.add(box((0.004, 0.004, 0.36), (x0 + w * i / 3, cy - d / 2 - 0.001, 0.24)), "steel")
    f.done()
    p = Obj("P.bench")
    top = 0.46
    # a stack of books
    for i, (bw, bd, bh, m, r) in enumerate([(0.26, 0.19, 0.035, "book1", 4), (0.24, 0.18, 0.028, "book3", -6), (0.2, 0.15, 0.03, "book2", 9)]):
        z = top + sum(b[2] for b in [(0, 0, 0.035), (0, 0, 0.028), (0, 0, 0.03)][:i]) + bh / 2
        p.add(box((bw, bd, bh), (x0 + 0.3, cy - 0.01, z), D(0, 0, r)), m)
        p.add(box((bw - 0.012, bd - 0.008, bh - 0.008), (x0 + 0.3 + 0.004, cy - 0.013, z), D(0, 0, r)), "paper")
    # a vase with dry stems
    vx = x1 - 0.32
    p.add(lathe([(0, 0), (0.055, 0), (0.085, 0.05), (0.09, 0.12), (0.06, 0.22), (0.032, 0.27), (0.04, 0.3), (0.03, 0.3), (0.022, 0.26), (0, 0.02)], (vx, cy, top)), "cream")
    random.seed(7)
    for i in range(7):
        a, t = random.uniform(0, 6.28), random.uniform(0.08, 0.3)
        tip = (vx + math.cos(a) * t * 0.5, cy + math.sin(a) * t * 0.22 - 0.02, top + 0.3 + random.uniform(0.25, 0.5))
        p.add(rod((vx, cy, top + 0.26), tip, 0.0022, seg=5), "oak")
        p.add(ball(0.012, tip, scale=(1, 1, 1.9), seg=8, rings=5), "cream")
    # a small speaker
    p.add(box((0.2, 0.12, 0.12), (cx + 0.02, cy + 0.02, top + 0.06), bevel=0.012), "felt")
    p.add(cyl(0.04, 0.004, (cx + 0.02, cy - 0.041, top + 0.06), D(90, 0, 0), seg=24), "graphite")
    p.done()


def build_plant():
    px, py = -2.36, 1.72
    f = Obj("F.pot")
    f.add(lathe([(0, 0), (0.15, 0), (0.2, 0.06), (0.215, 0.36), (0.2, 0.36), (0.19, 0.33), (0, 0.33)], (px, py, 0)), "concrete")
    f.add(cyl(0.19, 0.01, (px, py, 0.325), seg=28), "soil")
    f.done()
    o = Obj("P.plant", sway=True, lm_scale=1.7)
    random.seed(11)
    stems = [(-25, 1.55, 0.45), (20, 1.75, 0.3), (65, 1.3, 0.55), (-70, 1.2, 0.5), (110, 1.0, 0.6), (-115, 1.45, 0.35),
             (40, 1.05, 0.7), (-5, 1.25, 0.6), (150, 1.6, 0.25), (85, 1.5, 0.4), (-45, 0.85, 0.75), (-150, 1.15, 0.5)]
    base = Vector((px, py, 0.33))
    for k, (ang, length, lean) in enumerate(stems):
        a = math.radians(ang - 60)                       # most of the leaves reach into the room
        out = Vector((math.cos(a), math.sin(a), 0))
        phase = random.random()
        pts = []
        for i in range(8):
            t = i / 7
            pts.append(base + out * (0.02 + lean * length * t * t * 0.75) + Vector((0, 0, length * (t - 0.22 * lean * t * t))))
        for i in range(7):
            t0 = i / 7
            o.add(rod(pts[i], pts[i + 1], 0.007 - 0.003 * t0, seg=5), "stem",
                  sway=lambda co, b=base, L=length, ph=phase: (min(1, max(0, (co.z - b.z) / L)) ** 2 * 0.6, ph, 0, 1))
        tip, d = pts[-1], (pts[-1] - pts[-2]).normalized()
        blade = (d * 0.55 + out * 0.6 + Vector((0, 0, -0.22))).normalized()
        side = blade.cross(Vector((0, 0, 1))).normalized()
        up = side.cross(blade).normalized()
        ll, lw = random.uniform(0.34, 0.5), random.uniform(0.15, 0.2)
        bm = bmesh.new()
        NU, NV = 7, 4
        grid = []
        for i in range(NU + 1):
            u = i / NU
            wid = lw * math.sin(math.pi * (u * 0.92 + 0.04)) ** 0.7
            row = []
            for j in range(NV + 1):
                v = j / NV - 0.5
                p = tip + blade * (ll * u) + side * (wid * v * 2 * 0.5) + up * (abs(v) * wid * 0.45 - ll * 0.38 * u * u)
                row.append(bm.verts.new(p))
            grid.append(row)
        for i in range(NU):
            for j in range(NV):
                fc = bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
                fc.smooth = True
        o.add(bm, "leaf", sway=lambda co, b=base, L=length, ph=phase, t=tip, bl=blade, l2=ll:
              (0.6 + 0.4 * min(1, max(0, (co - t).dot(bl) / l2)), ph, min(1, max(0, (co - t).dot(bl) / l2)), 1))
    o.done()


def build_desk():
    cx, cy, w, d, top = DESK["cx"], DESK["cy"], DESK["w"], DESK["d"], DESK["top"]
    f = Obj("F.desk", lm_scale=1.25)
    f.add(box((w, d, 0.035), (cx, cy, top - 0.0175), bevel=0.004), "walnut")
    for sx in (-1, 1):
        lx = cx + sx * (w / 2 - 0.1)
        for sy in (-1, 1):
            f.add(box((0.04, 0.04, top - 0.035), (lx, cy + sy * (d / 2 - 0.08), (top - 0.035) / 2)), "steel")
        f.add(box((0.04, d - 0.12, 0.04), (lx, cy, top - 0.055)), "steel")
        f.add(box((0.04, d - 0.12, 0.03), (lx, cy, 0.015)), "steel")
    f.add(box((w - 0.24, 0.03, 0.05), (cx, cy + d / 2 - 0.08, 0.42)), "steel")
    # drawers
    px = cx + 0.52
    f.add(box((0.4, 0.56, 0.56), (px, cy + 0.04, 0.05 + 0.28)), "graphite")
    for i in range(3):
        z = 0.05 + 0.56 * (i + 0.5) / 3
        f.add(box((0.39, 0.006, 0.56 / 3 - 0.012), (px, cy + 0.04 - 0.283, z)), "felt")
        f.add(box((0.12, 0.012, 0.01), (px, cy + 0.04 - 0.292, z + 0.05)), "chrome")
    f.add(box((0.84, 0.4, 0.004), (cx + 0.08, cy - 0.15, top + 0.002)), "felt")       # desk mat
    f.done()

    # the monitor
    s = SCREEN
    tilt = Euler(D(s["tilt"], 0, 0), "XYZ").to_matrix().to_4x4()
    C = Vector((s["cx"], s["y"], s["cz"]))
    def mon(part, loc):                                   # place a part in the monitor's tilted frame
        M = Matrix.Translation(C) @ tilt @ Matrix.Translation(loc)
        bmesh.ops.transform(part, matrix=M, verts=part.verts)
        return part
    m = Obj("F.monitor", lm_scale=1.2)
    m.add(mon(box((s["w"] + 0.022, 0.028, s["h"] + 0.022), (0, 0, 0), bevel=0.003), (0, 0.016, 0)), "plastic")
    m.add(mon(box((0.3, 0.03, 0.2), (0, 0, 0), bevel=0.004), (0, 0.04, -0.02)), "plastic")
    m.add(box((0.06, 0.035, 0.34), (s["cx"], s["y"] + 0.085, top + 0.17), D(-8, 0, 0)), "aluminium")
    m.add(box((0.26, 0.2, 0.012), (s["cx"], s["y"] + 0.03, top + 0.006), bevel=0.003), "aluminium")
    m.done()
    sc = Obj("F.screen", no_bake=True)
    sc.add(mon(quad(s["w"], s["h"], (0, 0, 0), D(90, 0, 0)), (0, 0.0005, 0)), "screen")
    scr = sc.done()
    corners = [Matrix.Translation(C) @ tilt @ Vector((sx * s["w"] / 2, 0.0005, sz * s["h"] / 2)) for sx, sz in ((-1, 1), (1, 1), (1, -1), (-1, -1))]
    META["anchors"]["screen"] = {"corners": [list(c) for c in corners], "normal": list((tilt @ Vector((0, -1, 0, 0))).xyz)}

    p = Obj("P.desk", lm_scale=1.3)
    # keyboard, mouse
    kb = Vector((cx + 0.03, cy - 0.2, top + 0.004))
    p.add(box((0.33, 0.118, 0.016), kb + Vector((0, 0, 0.011)), D(3.5, 0, 0), bevel=0.003), "aluminium")
    p.add(ball(0.5, (cx + 0.34, cy - 0.2, top + 0.004), scale=(0.062, 0.105, 0.07), half=True, seg=16, rings=10), "plastic")
    # tumbler with coffee
    mx, my = cx - 0.36, cy + 0.13
    p.add(lathe([(0, 0), (0.034, 0), (0.04, 0.004), (0.043, 0.098), (0.039, 0.098), (0.036, 0.012), (0, 0.012)], (mx, my, top)), "cream")
    p.add(cyl(0.038, 0.002, (mx, my, top + 0.086), seg=20), "coffee")
    # notebook and pen
    p.add(rod((cx - 0.5, cy - 0.3, top + 0.0062), (cx - 0.455, cy - 0.17, top + 0.0062), 0.0042, seg=8), "chrome")
    # laptop, closed
    p.add(box((0.31, 0.215, 0.015), (cx + 0.63, cy + 0.02, top + 0.0075), D(0, 0, -7), bevel=0.004), "aluminium")
    p.done()
    label("keys", 0.31, 0.1, kb + Vector((0, 0, 0.0195)), D(3.5, 0, 0))

    # desk lamp
    lz = top
    b0 = Vector((cx - 0.74, cy + 0.2, lz))
    p1, p2 = b0 + Vector((0, 0.1, 0.38)), b0 + Vector((0.14, -0.2, 0.52))
    head = b0 + Vector((0.16, -0.27, 0.47))
    aim = Vector((cx - 0.56, cy - 0.2, lz))
    axis = (aim - head).normalized()
    L = Obj("F.lamp", lm_scale=1.2)
    L.add(cyl(0.08, 0.022, b0 + Vector((0, 0, 0.011)), seg=28), "steel")
    L.add(rod(b0 + Vector((0, 0, 0.02)), p1, 0.008), "steel"); L.add(rod(p1, p2, 0.008), "steel"); L.add(rod(p2, head - axis * 0.05, 0.007), "steel")
    L.add(ball(0.014, p1, seg=10, rings=6), "steel"); L.add(ball(0.014, p2, seg=10, rings=6), "steel")
    q = axis.to_track_quat("Z", "Y").to_euler()
    shade = lathe([(0.028, -0.06), (0.034, -0.05), (0.088, 0.075), (0.083, 0.075), (0.03, -0.045), (0, -0.045)], head, q)
    n = len(shade.faces)
    L.add(shade, "steel")
    L.done()
    inner = Obj("F.lampshade", lm_scale=1.0)
    inner.add(lathe([(0.0825, 0.0745), (0.0295, -0.044), (0, -0.044)], head, q), "white")
    inner.done()
    bulb = Obj("F.bulb", no_bake=True)
    bulb.add(ball(0.022, head + axis * 0.012, seg=12, rings=8), "bulb")
    bulb.done()
    META["lights"]["lamp"] = {"at": list(head + axis * 0.02), "aim": list(aim), "axis": list(axis)}
    META["anchors"]["lamp"] = {"at": list(head)}


def build_chair():
    """An upholstered task chair: a cushion with a rolled front edge, a back that wraps a little, a
    gas lift in its sleeve and a five-star base of brushed aluminium on twin casters. Built facing -Y,
    its back at +Y. The shells behind the cushions are matte: mirror-bright plastic or chrome on
    edges this thin shows as a row of sparks, not as a highlight."""
    o = Obj("F.chair", lm_scale=1.0)
    c = Vector((0.66, 0.9, 0))
    rz = math.radians(104)                      # swivelled aside, the way you leave it when you get up
    R = Matrix.Translation(c) @ Matrix.Rotation(rz, 4, "Z")
    def put(part):
        bmesh.ops.transform(part, matrix=R, verts=part.verts)
        return part
    # base: five arms that taper and slope down to the casters
    for i in range(5):
        a = 2 * math.pi * i / 5 + 0.3
        L = 0.27
        def arm(p, L=L):
            t = p.x / L + 0.5                                   # 0 at the hub, 1 at the tip
            return Vector((p.x, p.y * (1 - 0.42 * t), p.z * (1 - 0.3 * t) - 0.03 * t))
        o.add(put(soft_box((L, 0.05, 0.034), (math.cos(a) * 0.165, math.sin(a) * 0.165, 0.098), (0, 0, a), r=0.009, seg=2, cuts=2, shape=arm)), "aluminium")
        tip = Vector((math.cos(a) * 0.3, math.sin(a) * 0.3, 0))
        side = Vector((-math.sin(a), math.cos(a), 0))
        o.add(put(cyl(0.008, 0.03, tip + Vector((0, 0, 0.058)), seg=10)), "aluminium")
        o.add(put(soft_box((0.05, 0.034, 0.026), tip + Vector((0, 0, 0.042)), (0, 0, a), r=0.009, seg=2)), "plastic")
        for sgn in (-1, 1):
            o.add(put(cyl(0.027, 0.014, tip + side * (0.013 * sgn) + Vector((0, 0, 0.027)), D(90, 0, math.degrees(a)), seg=18)), "rubber")
    o.add(put(cyl(0.05, 0.05, (0, 0, 0.1), r2=0.038, seg=20)), "aluminium")
    # gas lift: the chrome piston in its black sleeve
    o.add(put(cyl(0.031, 0.15, (0, 0, 0.195), seg=18)), "plastic")
    o.add(put(cyl(0.021, 0.14, (0, 0, 0.29), seg=16)), "chrome")
    # the mechanism under the seat, its lever, and the bracket that carries the back
    o.add(put(box((0.19, 0.24, 0.04), (0, 0, 0.372), bevel=0.008)), "graphite")
    o.add(put(rod((0.09, -0.03, 0.365), (0.235, -0.05, 0.358), 0.006, seg=8)), "steel")
    o.add(put(soft_box((0.05, 0.022, 0.014), (0.25, -0.052, 0.357), r=0.005, seg=2)), "plastic")
    o.add(put(box((0.06, 0.18, 0.016), (0, 0.165, 0.36), bevel=0.004)), "steel")
    # seat: a moulded pan and the cushion on it
    o.add(put(soft_box((0.47, 0.45, 0.028), (0, -0.01, 0.402), r=0.012, seg=3)), "graphite")
    def seat(p):
        u, v = p.x / 0.245, p.y / 0.235
        dome = max(0.0, 1 - u * u) * max(0.0, 1 - v * v)
        z = p.z + (0.013 * dome if p.z > 0 else 0.0)
        front = max(0.0, (-p.y - 0.11) / 0.125)                  # the front edge rolls over, easy on the legs
        return Vector((p.x, p.y, z - 0.022 * front * front))
    o.add(put(soft_box((0.49, 0.47, 0.075), (0, -0.01, 0.453), r=0.03, seg=4, cuts=5, shape=seat)), "fabric")
    # back: a bar up from the bracket, a shell, and the cushion that wraps a little round you
    tilt = D(-9, 0, 0)                                           # it reclines: the top sits further back
    o.add(put(box((0.06, 0.016, 0.3), (0, 0.262, 0.49), tilt, bevel=0.004)), "steel")
    def wrap(p, k=0.5):
        return Vector((p.x, p.y - k * p.x * p.x, p.z))
    def back(p):
        q = wrap(p)
        u, w = p.x / 0.23, p.z / 0.18
        if p.y < 0:                                              # the face you lean on swells at the small of the back
            q.y -= 0.014 * max(0.0, 1 - u * u) * max(0.0, 1 - (w + 0.25) ** 2)
        return q
    o.add(put(soft_box((0.44, 0.018, 0.33), (0, 0.268, 0.705), tilt, r=0.008, seg=2, cuts=5, shape=wrap)), "graphite")
    o.add(put(soft_box((0.46, 0.065, 0.36), (0, 0.232, 0.71), tilt, r=0.03, seg=4, cuts=6, shape=back)), "fabric")
    o.done()


def build_rug():
    o = Obj("F.rug", lm_scale=0.8)
    o.add(box((2.9, 1.9, 0.012), (0.2, 0.42, 0.006), bevel=0.005), "rug")
    o.done()
    META["anchors"]["rug"] = {"cx": 0.2, "cy": 0.42, "w": 2.9, "d": 1.9}


def build_wall_things():
    cx = DESK["cx"]
    # the name, in the site's display face, as metal letters
    import os
    font = bpy.data.fonts.load(os.environ["STUDIO_FONT"])
    def letters(body, size, z, name, depth=0.012):
        cu = bpy.data.curves.new(name, "FONT")
        cu.body, cu.font, cu.size, cu.extrude, cu.align_x = body, font, size, depth / 2, "CENTER"
        cu.resolution_u = 4
        cu.space_character = 1.08
        tmp = bpy.data.objects.new(name, cu)
        bpy.context.scene.collection.objects.link(tmp)
        bpy.context.view_layer.update()
        me = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        bpy.data.objects.remove(tmp)
        bm = bmesh.new(); bm.from_mesh(me); bpy.data.meshes.remove(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0002)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal.z < -0.5], context="FACES")
        M = Matrix.Translation((cx, YB - depth / 2 - 0.006, z)) @ Euler(D(90, 0, 0), "XYZ").to_matrix().to_4x4()
        bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
        o = Obj(name, lm_scale=1.4)
        o.add(bm, "chrome")
        ob = o.done()
        return ob
    a = letters("SAMUEL ALDERETE", 0.175, 1.79, "F.name")
    b = letters("SOFTWARE ENGINEER", 0.072, 1.645, "F.role", depth=0.009)
    META["anchors"]["name"] = {"w": a.dimensions.x, "z0": 1.79, "role_w": b.dimensions.x}
    # the picture light over it
    f = Obj("F.namelight")
    f.add(box((1.25, 0.03, 0.026), (cx, YB - 0.115, 2.06)), "steel")
    for sx in (-1, 1):
        f.add(box((0.014, 0.1, 0.014), (cx + sx * 0.45, YB - 0.055, 2.066)), "steel")
        f.add(box((0.05, 0.008, 0.05), (cx + sx * 0.45, YB - 0.004, 2.066)), "steel")
    f.done()
    s = Obj("F.namestrip", no_bake=True)
    s.add(box((1.2, 0.016, 0.003), (cx, YB - 0.115, 2.0455)), "strip")
    s.done()
    META["lights"]["name"] = {"at": [cx, YB - 0.115, 2.04], "w": 1.2}

    # the lit sign over the shelves
    sx, sz = SHELF["cx"], 2.25
    g = Obj("F.signbox")
    g.add(box((0.9, 0.07, 0.21), (sx, YB - 0.035, sz), bevel=0.004), "steel")
    g.done()
    label("sign", 0.86, 0.17, (sx, YB - 0.0715, sz), D(90, 0, 0), group="F", material="signface", no_bake=True)
    META["lights"]["sign"] = {"at": [sx, YB - 0.075, sz], "w": 0.86, "h": 0.17}


def build_shelves():
    S = SHELF
    cx, w, y0, y1, tops = S["cx"], S["w"], S["y0"], S["y1"], S["tops"]
    d, cy = y1 - y0, (y0 + y1) / 2
    f = Obj("F.shelves", lm_scale=1.2)
    for z in tops:
        f.add(box((w, d, 0.03), (cx, cy, z - 0.015), bevel=0.003), "walnut")
    for sx in (-1, 1):
        x = cx + sx * (w / 2 + 0.0125)
        for y in (y0 + 0.014, y1 - 0.014):
            f.add(box((0.025, 0.025, tops[-1] + 0.02), (x, y, (tops[-1] + 0.02) / 2)), "steel")
        for z in tops:
            f.add(box((0.025, d - 0.03, 0.022), (x, cy, z - 0.041)), "steel")
    f.done()
    st = Obj("F.strips", no_bake=True)
    strips = []
    for z in tops[1:]:
        zz = z - 0.03 - 0.004
        st.add(box((w - 0.06, 0.012, 0.006), (cx, y0 + 0.03, zz)), "strip")
        strips.append([cx, y0 + 0.03, zz - 0.006])
    st.done()
    META["lights"]["strips"] = {"at": strips, "w": w - 0.06}
    META["anchors"]["shelves"] = {"cx": cx, "w": w, "y0": y0, "y1": y1, "tops": tops}

    # top shelf: books and a box
    p = Obj("P.shelftop", lm_scale=0.9)
    random.seed(3)
    x = cx - w / 2 + 0.06
    for i in range(11):
        bw, bh, bd = random.uniform(0.022, 0.045), random.uniform(0.17, 0.25), random.uniform(0.13, 0.17)
        m = random.choice(["book1", "book2", "book3", "book4", "book5", "book5", "book1"])
        lean = -9 if i == 10 else 0
        p.add(box((bw, bd, bh), (x + bw / 2 + (0.02 if lean else 0), cy + 0.03, tops[4] + bh / 2), D(0, lean, 0)), m)
        x += bw + 0.003
    p.add(box((0.3, 0.22, 0.16), (cx + 0.38, cy, tops[4] + 0.08), bevel=0.004), "graphite")
    p.add(box((0.31, 0.23, 0.03), (cx + 0.38, cy, tops[4] + 0.165), bevel=0.004), "felt")
    p.done()
    return cy, tops


# ---------------------------------------------------------------- the things on the shelves

def shelf_tag(id_, x, z, y0):
    label(f"tag.{id_}", 0.13, 0.026, (x, y0 - 0.0012, z - 0.015), D(90, 0, 0), item=id_, lm_scale=2.0)


def build_items(cy, tops):
    S = SHELF
    xs3 = [S["cx"] - 0.39, S["cx"], S["cx"] + 0.39]
    y0 = S["y0"]

    # --- KasaPro: a clipboard with an invoice, and a card reader
    def kasapro(o, at):
        o.add(box((0.12, 0.05, 0.02), at + Vector((-0.04, 0.05, 0.01))), "steel")
        o.add(box((0.17, 0.006, 0.235), at + Vector((-0.04, 0.012, 0.118)), D(-14, 0, 0), bevel=0.002), "walnut")
        o.add(box((0.07, 0.012, 0.022), at + Vector((-0.04, 0.036, 0.226)), D(-14, 0, 0), bevel=0.003), "chrome")
        o.add(box((0.068, 0.115, 0.02), at + Vector((0.09, -0.03, 0.012)), D(8, 0, -14), bevel=0.005), "plastic")
        o.add(box((0.054, 0.004, 0.034), at + Vector((0.096, 0.03, 0.03)), D(8, 0, -14)), "white")
    item("kasapro", (xs3[0], cy, tops[3]), kasapro)
    label("invoice", 0.15, 0.2, (xs3[0] - 0.04, cy + 0.0075, tops[3] + 0.113), D(90 - 14, 0, 0), item="kasapro", lm_scale=2.0)
    label("reader", 0.05, 0.036, Vector((xs3[0] + 0.083, cy - 0.052, tops[3] + 0.0195)), D(8, 0, -14), item="kasapro", lm_scale=2.0)
    shelf_tag("kasapro", xs3[0], tops[3], y0)

    # --- TestHarvest: a signal light
    def testharvest(o, at):
        o.add(cyl(0.05, 0.03, at + Vector((0, 0, 0.015)), seg=24), "steel")
        o.add(cyl(0.012, 0.08, at + Vector((0, 0, 0.07)), seg=12), "chrome")
        o.add(cyl(0.03, 0.012, at + Vector((0, 0, 0.277)), seg=20), "steel")
        o.add(lathe([(0.03, 0), (0.024, 0.02), (0, 0.022)], at + Vector((0, 0, 0.283)), seg=20), "steel")
    item("testharvest", (xs3[1], cy, tops[3]), testharvest)
    for k, (name, z) in enumerate((("green", 0.11), ("amber", 0.164), ("red", 0.218))):
        lens = Obj(f"P.lens.{name}", no_bake=True, item="testharvest", origin=(xs3[1], cy, tops[3]))
        lens.add(cyl(0.031, 0.05, (xs3[1], cy, tops[3] + z + 0.027), seg=24), name)
        lens.done()
    shelf_tag("testharvest", xs3[1], tops[3], y0)

    # --- Loan Approval ML: a balance scale with a small house
    def loan(o, at):
        o.add(cyl(0.065, 0.014, at + Vector((0, 0, 0.007)), seg=28), "brass")
        o.add(cyl(0.008, 0.25, at + Vector((0, 0, 0.139)), seg=12), "brass")
        o.add(ball(0.014, at + Vector((0, 0, 0.268)), seg=12, rings=8), "brass")
        o.add(box((0.25, 0.008, 0.01), at + Vector((0, 0, 0.25))), "brass")
        for sx in (-1, 1):
            px = at + Vector((sx * 0.115, 0, 0))
            o.add(rod(px + Vector((0, 0, 0.25)), px + Vector((0, 0, 0.12)), 0.0018, seg=6), "brass")
            for k in range(3):
                a = k * 2.094 + 0.5
                o.add(rod(px + Vector((0, 0, 0.14)), px + Vector((math.cos(a) * 0.045, math.sin(a) * 0.045, 0.075)), 0.0012, seg=5), "brass")
            o.add(lathe([(0, 0.07), (0.03, 0.068), (0.05, 0.078), (0.049, 0.08), (0.03, 0.071), (0, 0.073)], px, seg=24), "brass")
        h = at + Vector((-0.115, 0, 0.074))
        o.add(box((0.046, 0.04, 0.03), h + Vector((0, 0, 0.015))), "white")
        o.add(prism(0.052, 0.046, 0.022, h + Vector((0, 0, 0.03))), "terracotta")
        for k in range(4):
            o.add(cyl(0.017 - k * 0.0015, 0.007, at + Vector((0.115, 0, 0.0775 + k * 0.007)), seg=16), "chrome")
    item("loan", (xs3[2], cy, tops[3]), loan)
    shelf_tag("loan", xs3[2], tops[3], y0)

    # --- Nerrix Digital (the site): a row of small storefronts
    fronts = [(-0.105, 0.075, 0.13, "cream"), (-0.03, 0.065, 0.165, "graphite"), (0.04, 0.07, 0.115, "terracotta"), (0.11, 0.06, 0.145, "book1")]
    def nerrix(o, at):
        o.add(box((0.32, 0.11, 0.012), at + Vector((0, 0, 0.006)), bevel=0.002), "concrete")
        for (x, w, h, m) in fronts:
            o.add(box((w - 0.004, 0.07, h), at + Vector((x, 0.012, 0.012 + h / 2))), m)
            o.add(box((w + 0.006, 0.032, 0.006), at + Vector((x, -0.036, 0.012 + 0.062)), D(18, 0, 0)), "steel")
            o.add(box((0.018, 0.004, 0.036), at + Vector((x - w * 0.22, -0.0235, 0.03))), "steel")
    item("nerrix", (xs3[0], cy, tops[2]), nerrix)
    lit = Obj("P.lit.nerrix", no_bake=True, item="nerrix", origin=(xs3[0], cy, tops[2]))
    at = Vector((xs3[0], cy, tops[2]))
    for (x, w, h, m) in fronts:
        lit.add(quad(w * 0.42, 0.03, at + Vector((x + w * 0.14, -0.0236, 0.036)), D(90, 0, 0)), "lit")
        if h > 0.12:
            lit.add(quad(w * 0.5, 0.022, at + Vector((x, -0.0236, 0.012 + h - 0.03)), D(90, 0, 0)), "lit")
    lit.done()
    shelf_tag("nerrix", xs3[0], tops[2], y0)

    # --- Gracias Por Invitar: a tear-off calendar
    def gpi(o, at):
        o.add(box((0.15, 0.085, 0.012), at + Vector((0, 0, 0.006)), bevel=0.002), "walnut")
        o.add(box((0.13, 0.03, 0.15), at + Vector((0, 0.012, 0.086)), D(-12, 0, 0)), "paper")
        o.add(box((0.134, 0.008, 0.016), at + Vector((0, 0.029, 0.163)), D(-12, 0, 0)), "steel")
    item("gpi", (xs3[1], cy, tops[2]), gpi)
    label("calendar", 0.122, 0.132, (xs3[1], cy - 0.0045, tops[2] + 0.0852), D(90 - 12, 0, 0), item="gpi", lm_scale=2.0)
    shelf_tag("gpi", xs3[1], tops[2], y0)

    # --- KasaRentals: a toy skid steer
    def skid(o, at):
        R = Matrix.Translation(at) @ Matrix.Rotation(math.radians(28), 4, "Z")
        def put(part):
            bmesh.ops.transform(part, matrix=R, verts=part.verts)
            return part
        for sx in (-1, 1):
            for sy in (-1, 1):
                o.add(put(cyl(0.034, 0.03, (sx * 0.068, sy * 0.052, 0.034), D(0, 90, 0), seg=18)), "rubber")
                o.add(put(cyl(0.016, 0.032, (sx * 0.068, sy * 0.052, 0.034), D(0, 90, 0), seg=10)), "yellow")
        o.add(put(box((0.1, 0.19, 0.06), (0, 0.005, 0.064), bevel=0.006)), "yellow")
        o.add(put(box((0.092, 0.07, 0.05), (0, 0.062, 0.115), bevel=0.006)), "yellow")
        for sx in (-1, 1):                                   # cab cage
            o.add(put(box((0.008, 0.008, 0.085), (sx * 0.044, -0.05, 0.135))), "steel")
            o.add(put(box((0.008, 0.008, 0.07), (sx * 0.044, 0.03, 0.128))), "steel")
            o.add(put(box((0.008, 0.095, 0.008), (sx * 0.044, -0.008, 0.176), D(-8, 0, 0))), "steel")
            o.add(put(box((0.016, 0.2, 0.02), (sx * 0.062, -0.045, 0.118), D(-21, 0, 0))), "yellow")   # lift arms
        o.add(put(box((0.096, 0.1, 0.006), (0, -0.008, 0.181), D(-8, 0, 0))), "steel")
        o.add(put(box((0.07, 0.05, 0.02), (0, -0.01, 0.1))), "fabric")
        # bucket
        o.add(put(box((0.17, 0.006, 0.07), (0, -0.142, 0.062), D(18, 0, 0))), "steel")
        o.add(put(box((0.17, 0.075, 0.006), (0, -0.172, 0.03), D(-6, 0, 0))), "steel")
        for sx in (-1, 1):
            o.add(put(box((0.006, 0.07, 0.066), (sx * 0.084, -0.166, 0.058), D(6, 0, 0))), "steel")
    item("kasarentals", (xs3[2], cy - 0.005, tops[2]), skid)
    shelf_tag("kasarentals", xs3[2], tops[2], y0)

    xs4 = [S["cx"] - 0.43, S["cx"] - 0.13, S["cx"] + 0.14, S["cx"] + 0.42]
    # --- Foreman: a hard hat and a tape measure
    def foreman(o, at):
        c = at + Vector((-0.02, 0.01, 0.022))
        o.add(ball(1.0, c, scale=(0.105, 0.125, 0.105), half=True, seg=24, rings=14), "white")
        o.add(lathe([(0.1, 0), (0.128, -0.004), (0.13, -0.012), (0.1, -0.008)], c, seg=28), "white")
        peak = cyl(0.105, 0.007, (0, 0, 0), seg=28)
        bmesh.ops.scale(peak, vec=(1.0, 0.8, 1.0), verts=peak.verts)
        o.add(_place(peak, c + Vector((0, -0.085, -0.007)), D(7, 0, 0)), "white")
        o.add(box((0.018, 0.2, 0.012), c + Vector((0, 0, 0.1)), bevel=0.004), "white")
        t = at + Vector((0.115, -0.07, 0))
        o.add(box((0.062, 0.03, 0.062), t + Vector((0, 0, 0.031)), D(0, 0, -20), bevel=0.01), "yellow")
        o.add(box((0.008, 0.07, 0.016), t + Vector((0.034, -0.03, 0.01)), D(0, 0, -20)), "yellow")
        o.add(cyl(0.012, 0.032, t + Vector((0, 0, 0.031)), D(90, 0, -20), seg=12), "steel")
    item("foreman", (xs4[0] + 0.02, cy, tops[1]), foreman)
    shelf_tag("foreman", xs4[0] + 0.02, tops[1], y0)

    # --- BW Fusion: a seedling in a pot
    def bw(o, at):
        o.add(lathe([(0, 0), (0.036, 0), (0.05, 0.075), (0.054, 0.075), (0.054, 0.088), (0.046, 0.088), (0.044, 0.07), (0, 0.07)], at, seg=24), "terracotta")
        o.add(cyl(0.045, 0.004, at + Vector((0, 0, 0.072)), seg=20), "soil")
        base = at + Vector((0, 0, 0.074))
        top = base + Vector((0.006, -0.004, 0.13))
        sw = lambda co, b=base: (min(1, max(0, (co.z - b.z) / 0.16)) ** 1.5, 0.37, 0, 1)
        o.add(rod(base, base + Vector((0.002, -0.001, 0.07)), 0.003, seg=6), "stem", sway=sw)
        o.add(rod(base + Vector((0.002, -0.001, 0.07)), top, 0.0025, seg=6), "stem", sway=sw)
        for k, (ang, ln, zf, tl) in enumerate([(20, 0.075, 1.0, 30), (200, 0.07, 1.0, 26), (110, 0.05, 0.62, 40), (290, 0.046, 0.6, 44)]):
            a = math.radians(ang)
            out = Vector((math.cos(a), math.sin(a), 0))
            root = base + (top - base) * zf
            bm = bmesh.new()
            rows = []
            for i in range(6):
                u = i / 5
                wid = 0.028 * math.sin(math.pi * (u * 0.9 + 0.06)) * (ln / 0.07)
                side = out.cross(Vector((0, 0, 1)))
                ctr = root + out * (ln * u) + Vector((0, 0, ln * u * math.tan(math.radians(tl)) - ln * 0.6 * u * u))
                rows.append([bm.verts.new(ctr + side * wid + Vector((0, 0, 0.004))), bm.verts.new(ctr), bm.verts.new(ctr - side * wid + Vector((0, 0, 0.004)))])
            for i in range(5):
                for j in range(2):
                    fc = bm.faces.new((rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1])); fc.smooth = True
            o.add(bm, "leaf", sway=lambda co, b=base, r=root, ou=out, l=ln: (min(1, 0.55 + 0.45 * (co - r).dot(ou) / l), 0.37 + 0.13 * k, min(1, max(0, (co - r).dot(ou) / l)), 1))
    item("bwfusion", (xs4[1], cy, tops[1]), bw, sway=True)
    shelf_tag("bwfusion", xs4[1], tops[1], y0)

    # --- Nerrix Digital (the studio): four keys on a ring, one for each client site
    def studio(o, at):
        o.add(box((0.1, 0.07, 0.016), at + Vector((0, 0.01, 0.008)), bevel=0.003), "walnut")
        o.add(cyl(0.006, 0.19, at + Vector((0, 0.02, 0.105)), seg=10), "steel")
        o.add(rod(at + Vector((0, 0.02, 0.195)), at + Vector((0, -0.03, 0.195)), 0.005, seg=8), "steel")
        ring = at + Vector((0, -0.028, 0.163))
        tor = bmesh.new()
        N = 20
        for i in range(N):
            a0, a1 = 2 * math.pi * i / N, 2 * math.pi * (i + 1) / N
            seg = rod((math.cos(a0) * 0.03, 0, math.sin(a0) * 0.03), (math.cos(a1) * 0.03, 0, math.sin(a1) * 0.03), 0.0022, seg=5)
            me = bpy.data.meshes.new("t"); seg.to_mesh(me); seg.free(); tor.from_mesh(me); bpy.data.meshes.remove(me)
        bmesh.ops.translate(tor, verts=tor.verts, vec=ring)
        o.add(tor, "chrome")
        for k, (dx, rot, m) in enumerate([(-0.03, -16, "brass"), (-0.01, -5, "chrome"), (0.012, 7, "brass"), (0.032, 17, "chrome")]):
            top = ring + Vector((dx * 0.5, -0.004 + k * 0.0035, -0.03))
            R = Matrix.Translation(top) @ Matrix.Rotation(math.radians(rot), 4, "Y")
            for part in (cyl(0.014, 0.0028, (0, 0, -0.012), D(90, 0, 0), seg=14), box((0.008, 0.0026, 0.05), (0, 0, -0.048)), box((0.006, 0.0026, 0.01), (0.006, 0, -0.058)), box((0.005, 0.0026, 0.006), (0.0055, 0, -0.044))):
                bmesh.ops.transform(part, matrix=R, verts=part.verts)
                o.add(part, m)
    item("studio", (xs4[2], cy, tops[1]), studio)
    shelf_tag("studio", xs4[2], tops[1], y0)

    # --- UTEP: a graduation cap
    def utep(o, at):
        o.add(lathe([(0, 0), (0.07, 0), (0.078, 0.02), (0.074, 0.062), (0, 0.066)], at, seg=24), "navy")
        o.add(box((0.19, 0.19, 0.008), at + Vector((0, 0, 0.07)), D(4, -3, 32), bevel=0.002), "navy")
        o.add(cyl(0.011, 0.007, at + Vector((0, 0, 0.078)), seg=12), "navy")
        e = at + Vector((0.075, -0.082, 0.07))
        o.add(rod(at + Vector((0, 0, 0.081)), e, 0.0018, seg=5), "orange")
        o.add(rod(e, e + Vector((0.004, -0.004, -0.045)), 0.0018, seg=5), "orange")
        o.add(lathe([(0.004, 0), (0.008, -0.01), (0.009, -0.05), (0, -0.05)], e + Vector((0.004, -0.004, -0.045)), seg=10), "orange")
    item("utep", (xs4[3], cy, tops[1]), utep)
    shelf_tag("utep", xs4[3], tops[1], y0)

    # --- also on the shelf: three bins on the bottom board
    for id_, x in zip(("gpi-portal", "tv-home", "luv"), xs3):
        def bin_(o, at):
            o.add(box((0.33, 0.25, 0.25), at + Vector((0, 0, 0.125)), bevel=0.008), "felt")
            o.add(box((0.3, 0.22, 0.006), at + Vector((0, 0, 0.246))), "graphite")
            o.add(box((0.11, 0.006, 0.05), at + Vector((0, -0.127, 0.17))), "chrome")
        item(id_, (x, cy, tops[0]), bin_, lm_scale=1.0)
        label(f"bin.{id_}", 0.1, 0.04, (x, cy - 0.1305, tops[0] + 0.17), D(90, 0, 0), item=id_, lm_scale=2.0)


def build_desk_items():
    cx, cy, top = DESK["cx"], DESK["cy"], DESK["top"]
    # the résumé: two sheets under the lamp
    at = (cx - 0.6, cy - 0.2, top)
    def resume(o, a):
        o.add(box((0.21, 0.297, 0.0008), a + Vector((0.006, 0.004, 0.0006)), D(0, 0, -1)), "paper")
    item("resume", at, resume, lm_scale=1.2)
    label("resume", 0.21, 0.297, (at[0], at[1], top + 0.0016), D(0, 0, -7), item="resume", lm_scale=2.2)
    # contact: a tray of cards
    ct = (cx + 0.56, cy - 0.27, top)
    def contact(o, a):
        o.add(box((0.105, 0.068, 0.006), a + Vector((0, 0, 0.003))), "walnut")
        o.add(box((0.105, 0.006, 0.022), a + Vector((0, 0.031, 0.011))), "walnut")
        o.add(box((0.089, 0.051, 0.012), a + Vector((0, -0.004, 0.012))), "paper")
    item("contact", ct, contact, lm_scale=1.4)
    label("card", 0.089, 0.051, (ct[0], ct[1] - 0.004, top + 0.0185), D(0, 0, 0), item="contact", lm_scale=2.4)


def build_all():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    OBJECTS.clear(); _mats.clear()
    for k in META:
        META[k] = {}
    build_shell(); build_window(); build_bench(); build_plant(); build_desk(); build_chair(); build_rug()
    build_wall_things()
    cy, tops = build_shelves()
    build_items(cy, tops)
    build_desk_items()
    return OBJECTS, META
