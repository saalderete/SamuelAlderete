"""Surface detail for the room, made in code: the wall's paint and the rug's pile.

    python make_textures.py            # writes ../app/room/tex/paint.webp and rug.webp

Each is a small grey picture that repeats without a seam and averages one half. The browser lays it
over a surface twice, once at its own size for the fine grain and once much larger and blurred for
the slow unevenness, and multiplies the two into the surface's colour (see `detail` in
app/room/room.js), so no repeat shows. Nothing here is a photograph: the noise is shaped in
frequency space, which is also what makes the edges meet.
Needs numpy and pillow.
"""
import os
import numpy as np
from PIL import Image

OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "room", "tex"))


def noise(n, seed, beta=0.0, lo=0.0, hi=None, stretch=(1.0, 1.0)):
    """Noise that tiles. beta: how much the large shapes outweigh the small (0 is plain grain);
    lo..hi: the band of detail kept, in repeats across the picture; stretch: >1 draws it out along x or y."""
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((n, n)))
    fy = np.fft.fftfreq(n)[:, None] * n * stretch[1]
    fx = np.fft.fftfreq(n)[None, :] * n * stretch[0]
    r = np.hypot(fx, fy)
    r[0, 0] = 1.0
    amp = r ** (-beta)
    if lo:
        amp = amp * (1.0 - np.exp(-(r / lo) ** 4))
    if hi:
        amp = amp * np.exp(-(r / hi) ** 4)
    amp[0, 0] = 0.0
    x = np.fft.ifft2(f * amp).real
    return (x - x.mean()) / x.std()


def save(name, a, quality=88):
    a = np.clip(a, 0.18, 0.82)
    px = (a * 255.0 + 0.5).astype(np.uint8)
    path = os.path.join(OUT, name)
    Image.fromarray(np.stack([px] * 3, -1), "RGB").save(path, "WEBP", quality=quality, method=6)
    print(f"{name}: {a.shape[1]}px, mean {a.mean():.3f}, from {a.min():.2f} to {a.max():.2f}, {os.path.getsize(path) / 1e3:.0f} kB")


def paint(n=512):
    """A rolled wall, 1.2 m across: slow unevenness where the coats overlap, patches a hand wide,
    and the roller's orange peel, a little taller than it is wide."""
    slow = noise(n, 11, beta=2.2, hi=5)
    patch = noise(n, 12, beta=1.0, lo=6, hi=30)
    peel = noise(n, 13, beta=0.2, lo=80, hi=190, stretch=(1.0, 0.78))
    lap = noise(n, 14, beta=1.6, hi=6, stretch=(4.0, 1.0))            # the roller's passes run up and down
    return 0.5 + 0.017 * slow + 0.01 * patch + 0.02 * peel + 0.007 * lap


def rug(n=512):
    """A flat-woven rug, 0.6 m across: the tufts, the rows they sit in, and the broad shading that
    pile takes where it has been brushed one way or the other."""
    tuft = noise(n, 21, beta=0.0, lo=90, hi=215)
    row = noise(n, 22, beta=0.3, lo=60, hi=130, stretch=(0.22, 1.0))  # short dashes along the weave
    lay = noise(n, 23, beta=2.4, hi=4)
    wear = noise(n, 24, beta=1.4, lo=5, hi=24)
    y = np.arange(n)[:, None] / n
    rows = np.cos(2 * np.pi * y * 96)                                 # 96 rows across the picture
    return 0.5 + 0.07 * tuft + 0.035 * row + 0.02 * rows + 0.05 * lay + 0.02 * wear


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    save("paint.webp", paint())
    save("rug.webp", rug())
