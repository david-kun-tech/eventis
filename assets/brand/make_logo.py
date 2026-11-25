"""Eventis ribbon "e" mark (v2: cursive e).

One ribbon drawn like a handwritten e: a small hook on the left rises into the crossbar,
which becomes the bottom of a tilted elliptical loop. The stroke goes round the loop,
comes down the left side, crosses over the bar, and sweeps out to a flat tail.

Geometry: the loop is an exact rotated ellipse. The hook and the descender are cubic
Beziers that meet it tangentially, so the stroke has no kinks. Colour flows along the
ribbon; the descender casts a soft shadow where it crosses the bar.

Usage:
  python make_logo.py OUT_DIR [POPPINS_TTF] [ASSETS_DIR]
OUT_DIR gets previews; with ASSETS_DIR it also writes the app icons and brand files.
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
POPPINS = Path(sys.argv[2]) if len(sys.argv) > 2 else None
ASSETS = Path(sys.argv[3]) if len(sys.argv) > 3 else None

SIZE = 512
N = 1200        # samples along the ribbon
WIDTH = 44      # ribbon width in the 512 box

# Champagne at the hook, warming through amber and coral to rose and orchid at the tail.
STOPS = [
    (0.00, (248, 222, 140)),
    (0.22, (240, 182, 66)),
    (0.45, (236, 122, 60)),
    (0.66, (224, 72, 98)),
    (0.84, (196, 62, 150)),
    (1.00, (138, 70, 200)),
]
# Same journey for light backgrounds, with a deeper start so the hook holds up on ivory.
STOPS_LIGHT = [
    (0.00, (214, 150, 40)),
    (0.22, (226, 128, 36)),
    (0.45, (226, 92, 52)),
    (0.66, (212, 56, 92)),
    (0.84, (182, 46, 140)),
    (1.00, (120, 56, 190)),
]


def lerp(a, b, t):
    return a + (b - a) * t


def color_at(t, stops):
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(round(lerp(a, b, k)) for a, b in zip(c0, c1))
    return stops[-1][1]


# ---------- Geometry (y down, 512 box) ----------

# The loop: an ellipse tilted so its long axis rises to the right.
CX, CY = 296, 200
A, B = 138, 92
PHI = math.radians(-24)


def ellipse(t):
    """Point on the loop. t in radians, local frame; screen y points down."""
    x, y = A * math.cos(t), B * math.sin(t)
    c, s = math.cos(PHI), math.sin(PHI)
    return CX + x * c - y * s, CY + x * s + y * c


def ellipse_tangent(t, direction=-1):
    """Unit tangent; direction -1 follows decreasing t (bottom -> right -> top -> left)."""
    dx, dy = -A * math.sin(t), B * math.cos(t)
    c, s = math.cos(PHI), math.sin(PHI)
    tx, ty = (dx * c - dy * s) * direction, (dx * s + dy * c) * direction
    L = math.hypot(tx, ty)
    return tx / L, ty / L


# Where the stroke joins and leaves the loop (local ellipse angles).
T_JOIN = math.radians(118)    # lower left: the crossbar arrives here
T_EXIT = math.radians(-188)   # just past the far left: the descender leaves here


def bez(p0, p1, p2, p3, t):
    m = 1 - t
    return (
        m**3 * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t**3 * p3[0],
        m**3 * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t**3 * p3[1],
    )


def centerline():
    pts = []
    # 1. Entry hook: starts high on the left, dips, and rises into the crossbar.
    J = ellipse(T_JOIN)
    jt = ellipse_tangent(T_JOIN)
    start = (82, 192)
    hook = (start, (66, 276), (J[0] - jt[0] * 150, J[1] - jt[1] * 150), J)
    pts += [bez(*hook, k / 300) for k in range(301)]
    # 2. Around the loop: bottom -> right -> top -> left, ending past the far left.
    steps = 900
    for k in range(1, steps + 1):
        t = T_JOIN + (T_EXIT - T_JOIN) * k / steps
        pts.append(ellipse(t))
    # 3. Descender: leaves the loop on its tangent, crosses the bar, sweeps to a flat tail.
    X = ellipse(T_EXIT)
    xt = ellipse_tangent(T_EXIT)
    tail = (424, 400)
    # K is where the exit direction meets the tail's horizontal line. Using it as the
    # control of a quadratic curve (written as a cubic) turns smoothly from the loop's
    # tangent to horizontal, with no S-bend or elbow.
    k = (tail[1] - X[1]) / xt[1]
    K = (X[0] + xt[0] * k, tail[1])
    desc = (
        X,
        (X[0] + 2 / 3 * (K[0] - X[0]), X[1] + 2 / 3 * (K[1] - X[1])),
        (tail[0] + 2 / 3 * (K[0] - tail[0]), tail[1]),
        tail,
    )
    pts += [bez(*desc, k / 300) for k in range(1, 301)]
    return pts


dense = centerline()
cum = [0.0]
for a, b in zip(dense, dense[1:]):
    cum.append(cum[-1] + math.dist(a, b))
TOTAL = cum[-1]
LEN_HOOK = cum[300] / TOTAL
LEN_LOOP_END = cum[1200] / TOTAL   # 301 hook + 900 loop points


def point(u):
    target = u * TOTAL
    lo, hi = 0, len(cum) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if cum[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    i = max(1, lo)
    a, b = dense[i - 1], dense[i]
    k = (target - cum[i - 1]) / ((cum[i] - cum[i - 1]) or 1)
    return lerp(a[0], b[0], k), lerp(a[1], b[1], k)


ts = [i / N for i in range(N + 1)]
pts = [point(t) for t in ts]


def normal(i):
    a = pts[max(0, i - 1)]
    b = pts[min(N, i + 1)]
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1
    return -dy / L, dx / L


def build(stops):
    qs = []
    w = WIDTH / 2
    for i in range(N):
        t = (ts[i] + ts[i + 1]) / 2
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        n0, n1 = normal(i), normal(i + 1)
        poly = [
            (x0 + n0[0] * w, y0 + n0[1] * w),
            (x1 + n1[0] * w, y1 + n1[1] * w),
            (x1 - n1[0] * w, y1 - n1[1] * w),
            (x0 - n0[0] * w, y0 - n0[1] * w),
        ]
        qs.append((t, poly, color_at(t, stops)))
    return qs


QUADS = {"dark": build(STOPS), "light": build(STOPS_LIGHT)}
# The descender is drawn after the bar, so it crosses over it, and casts a soft shadow on
# the bar only where the two actually overlap.
HOOK_PTS = dense[:301]


def _over_bar(poly):
    cx = sum(x for x, _ in poly) / 4
    cy = sum(y for _, y in poly) / 4
    return min(math.dist((cx, cy), p) for p in HOOK_PTS[::4]) < WIDTH * 1.1


def shadow_polys(qs):
    return [p for t, p, _ in qs if t > LEN_LOOP_END and _over_bar(p)]


# ---------- Output ----------

NAVY = (27, 31, 51)
IVORY = (247, 245, 240)
hexc = lambda c: "#%02x%02x%02x" % c


def svg(bg=None, variant="dark"):
    qs = QUADS[variant]
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" width="{SIZE}" height="{SIZE}">', "<title>Eventis</title>"]
    if bg:
        out.append(f'<rect width="{SIZE}" height="{SIZE}" rx="112" fill="{bg}"/>')
    shadow_done = False
    for t, poly, c in qs:
        if not shadow_done and t >= LEN_LOOP_END:
            for p in shadow_polys(qs):
                pp = " ".join(f"{x:.1f},{y:.1f}" for x, y in p)
                out.append(f'<polygon points="{pp}" fill="#000" fill-opacity="0.14" transform="translate(3 6)"/>')
            shadow_done = True
        pp = " ".join(f"{x:.1f},{y:.1f}" for x, y in poly)
        out.append(f'<polygon points="{pp}" fill="{hexc(c)}" stroke="{hexc(c)}" stroke-width="0.8" stroke-linejoin="round"/>')
    out.append("</svg>")
    return "\n".join(out)


def png(path, size, bg=None, pad=0.0, radius=0.0, variant="dark", mono=None):
    qs = QUADS[variant]
    ss = 4
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    if bg:
        ImageDraw.Draw(img).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius), fill=bg)
    scale = S * (1 - 2 * pad) / SIZE
    off = S * pad
    tf = lambda p: [(off + x * scale, off + y * scale) for x, y in p]
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    if not mono:
        sd = ImageDraw.Draw(shadow)
        for p in shadow_polys(qs):
            sd.polygon([(x + 3 * scale, y + 6 * scale) for x, y in tf(p)], fill=(0, 0, 0, 36))
    d = ImageDraw.Draw(img)
    shadow_done = False
    for t, poly, c in qs:
        if not shadow_done and t >= LEN_LOOP_END:
            img.alpha_composite(shadow)
            d = ImageDraw.Draw(img)
            shadow_done = True
        cc = mono or c
        d.polygon(tf(poly), fill=cc + (255,), outline=cc + (255,))
    img.resize((size, size), Image.LANCZOS).save(path)


def lockup(path, dark):
    from PIL import ImageFont

    H = 240
    mark = Image.open(OUT / ("mark-dark.png" if dark else "mark-light.png")).resize((H, H), Image.LANCZOS)
    font = ImageFont.truetype(str(POPPINS), 150)
    text = "eventis"
    x0, y0, x1, y1 = ImageDraw.Draw(Image.new("RGBA", (1, 1))).textbbox((0, 0), text, font=font)
    W = H + 24 + (x1 - x0) + 60
    img = Image.new("RGBA", (W, H + 40), (NAVY if dark else IVORY) + (255,))
    img.alpha_composite(mark, (20, 20))
    ty = 20 + (H - (y1 - y0)) // 2 - y0 + 6
    ImageDraw.Draw(img).text((20 + H + 4, ty), text, font=font, fill=(255, 255, 255) if dark else (20, 22, 31))
    img.save(path)


(OUT / "eventis-mark.svg").write_text(svg(), encoding="utf-8")
(OUT / "eventis-mark-light.svg").write_text(svg(variant="light"), encoding="utf-8")
(OUT / "eventis-icon.svg").write_text(svg(bg="#1B1F33"), encoding="utf-8")
png(OUT / "preview-icon.png", 512, bg=NAVY + (255,), pad=0.12, radius=0.22)
for s_ in (48, 96):
    png(OUT / f"preview-{s_}.png", s_, bg=NAVY + (255,), pad=0.12, radius=0.22)
png(OUT / "mark-dark.png", 512, pad=0.04)
png(OUT / "mark-light.png", 512, pad=0.04, variant="light")
if POPPINS:
    lockup(OUT / "lockup-dark.png", True)
    lockup(OUT / "lockup-light.png", False)

if ASSETS:
    img = ASSETS / "images"
    brand = ASSETS / "brand"
    brand.mkdir(exist_ok=True)
    # iOS/web app icon: full-bleed navy, no transparency (iOS masks the corners itself).
    png(img / "icon.png", 1024, bg=NAVY + (255,), pad=0.12)
    # Android adaptive: foreground inside the 66% safe zone, solid background, mono for themed icons.
    png(img / "android-icon-foreground.png", 512, pad=0.18)
    Image.new("RGBA", (512, 512), NAVY + (255,)).save(img / "android-icon-background.png")
    png(img / "android-icon-monochrome.png", 432, pad=0.18, mono=(255, 255, 255))
    png(img / "favicon.png", 48, bg=NAVY + (255,), pad=0.08, radius=0.22)
    png(img / "splash-icon.png", 512)
    # In-app marks.
    png(img / "logo-mark.png", 256, pad=0.02)
    png(img / "logo-mark-light.png", 256, pad=0.02, variant="light")
    # Brand files.
    for name in ("eventis-mark.svg", "eventis-mark-light.svg", "eventis-icon.svg"):
        (brand / name).write_text((OUT / name).read_text(encoding="utf-8"), encoding="utf-8")
    for name in ("lockup-dark.png", "lockup-light.png"):
        if (OUT / name).exists():
            (brand / name).write_bytes((OUT / name).read_bytes())
    png(brand / "eventis-icon-1024.png", 1024, bg=NAVY + (255,), pad=0.12)
print("ok")
