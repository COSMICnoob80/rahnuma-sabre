#!/usr/bin/env python3
"""Rahnuma SABRE brand icon generator.

Deterministic Pillow renderer for the complete Expo icon set:

    assets/icon.png          1024x1024  pre-rounded full-bleed app icon
    assets/adaptive-icon.png 1024x1024  transparent adaptive foreground
    assets/splash-icon.png   1024x1024  same mark as the adaptive foreground
    assets/favicon.png         48x48    simplified small-size mark

Every image comes from the single design spec below. No gradients, no
anti-aliasing plugins, no fonts: flat fills drawn at 4x and downsampled with
LANCZOS. Running this script twice must produce byte-identical PNGs.

Design: a compass (رہنما — the Guide) rendered as a ring, eight ticks and a
bold geometric ڕ monogram (reh + small v below). Deliberately NOT a wallet,
coin, or upward chart arrow: Rahnuma is a money mirror, not a signal app.
"""

from __future__ import annotations

import hashlib
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

SS = 4  # supersampling factor for clean edges


# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
# Canonical sRGB hex values. Sources are named per token.
BG = "#05090d"        # src/theme/colors.ts -> colors.background
MIST = "#e7ecf0"      # src/theme/colors.ts -> colors.textPrimary
MUTED = "#838d98"     # src/theme/colors.ts -> colors.textSecondary


def oklch_to_hex(lightness: float, chroma: float, hue: float) -> str:
    """Convert an OKLCH color to an sRGB hex string."""
    a = chroma * math.cos(math.radians(hue))
    b = chroma * math.sin(math.radians(hue))
    l_ = lightness + 0.3963377774 * a + 0.2158037573 * b
    m_ = lightness - 0.1055613458 * a - 0.0638541728 * b
    s_ = lightness - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_**3, m_**3, s_**3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def encode(x: float) -> float:
        x = min(1.0, max(0.0, x))
        return 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055

    return "#%02x%02x%02x" % tuple(round(encode(v) * 255) for v in (r, g, bl))


# design/outlook-briefing.html -> :root { --accent: oklch(0.80 0.160 162) }
ACCENT = oklch_to_hex(0.80, 0.160, 162)
assert ACCENT == "#3add9e", ACCENT  # mirrors the artifact accent exactly


# ---------------------------------------------------------------------------
# Drawing helpers (geometry is expressed in 1024-point space)
# ---------------------------------------------------------------------------
def _rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha


def _line(d: ImageDraw.ImageDraw, p0, p1, width: int, fill) -> None:
    """Straight stroke with round caps."""
    d.line([p0, p1], fill=fill, width=width)
    r = width / 2
    for x, y in (p0, p1):
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def _cubic(p0, p1, p2, p3, steps: int = 96):
    """Sample a cubic Bezier onto a polyline."""
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        pts.append(
            (
                u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
            )
        )
    return pts


def _stroke(d: ImageDraw.ImageDraw, pts, width: int, fill) -> None:
    """Polyline stroke with round joins/caps."""
    for a, b in zip(pts, pts[1:]):
        d.line([a, b], fill=fill, width=width)
    r = width / 2
    for x, y in pts:
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def _ring(d: ImageDraw.ImageDraw, cx, cy, radius, width, fill) -> None:
    d.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        outline=fill,
        width=width,
    )


# ---------------------------------------------------------------------------
# Mark: compass ring + ticks + geometric ڕ
# ---------------------------------------------------------------------------
def draw_mark(img: Image.Image, k: float, small: bool = False) -> None:
    """Draw the compass monogram centred on the canvas.

    k scales 1024-space coordinates to the supersampled canvas.
    small=True uses heavier weights and drops fine detail for 48px.
    """
    d = ImageDraw.Draw(img)
    cx = cy = 512 * k

    def p(x: float, y: float):
        return (x * k, y * k)

    def s(v: float) -> float:
        return max(1, round(v * k))

    accent, mist, muted = _rgba(ACCENT), _rgba(MIST), _rgba(MUTED)

    ring_w = 30 if small else 24
    tick_w = 46 if small else 32
    tick_len = 54 if small else 34
    diag_w = 22 if small else 15
    diag_len = 34 if small else 22
    mono_w = 116 if small else 86
    hook_w = 42 if small else 32

    # Compass ring.
    _ring(d, cx, cy, 300 * k, s(ring_w), mist)

    # Cardinal ticks (emerald) sit just outside the ring.
    for angle in (270, 0, 90, 180):  # N, E, S, W
        a = math.radians(angle)
        p0 = (512 + 322 * math.cos(a), 512 + 322 * math.sin(a))
        p1 = (512 + (322 + tick_len) * math.cos(a), 512 + (322 + tick_len) * math.sin(a))
        _line(d, p(*p0), p(*p1), s(tick_w), accent)

    # Diagonal ticks (muted) — the "subtle geometric detail".
    if not small:
        for angle in (45, 135, 225, 315):
            a = math.radians(angle)
            p0 = (512 + 322 * math.cos(a), 512 + 322 * math.sin(a))
            p1 = (512 + (322 + diag_len) * math.cos(a), 512 + (322 + diag_len) * math.sin(a))
            _line(d, p(*p0), p(*p1), s(diag_w), muted)

    # Geometric ڕ (reh with small v below), emerald.
    # One continuous calligraphic stroke: descends from the upper right and
    # flattens into a horizontal baseline foot sweeping left.
    reh = _cubic((686, 336), (672, 400), (560, 648), (372, 648))
    _stroke(d, [p(*pt) for pt in reh], s(mono_w), accent)

    # Small v below -> the letter ڕ.
    _line(d, p(394, 716), p(430, 752), s(hook_w), accent)
    _line(d, p(430, 752), p(466, 716), s(hook_w), accent)


# ---------------------------------------------------------------------------
# Frame: pre-rounded background
# ---------------------------------------------------------------------------
def _rounded_frame(img: Image.Image, k: float, margin: int, radius: int) -> None:
    d = ImageDraw.Draw(img)
    m = margin * k
    size = img.width
    d.rounded_rectangle(
        [m, m, size - m, size - m],
        radius=radius * k,
        fill=_rgba(BG),
    )


# ---------------------------------------------------------------------------
# Renderers
# ---------------------------------------------------------------------------
def render_icon() -> Image.Image:
    size = 1024
    img = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    k = SS
    _rounded_frame(img, k, margin=24, radius=232)
    draw_mark(img, k, small=False)
    return img.resize((size, size), Image.LANCZOS)


def render_foreground() -> Image.Image:
    size = 1024
    mark = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    draw_mark(mark, SS)
    # Mark extent is ~373px radius; scale the whole mark about the canvas
    # centre so it fits the 66% safe zone (676px) without drifting off-centre.
    safe = 660 / (2 * 373)
    scaled = mark.resize(
        (round(size * SS * safe), round(size * SS * safe)), Image.LANCZOS
    )
    canvas = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    offset = ((canvas.width - scaled.width) // 2, (canvas.height - scaled.height) // 2)
    canvas.alpha_composite(scaled, offset)
    return canvas.resize((size, size), Image.LANCZOS)


def render_favicon() -> Image.Image:
    size = 1024
    img = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    k = SS
    _rounded_frame(img, k, margin=12, radius=224)
    draw_mark(img, k, small=True)
    return img.resize((48, 48), Image.LANCZOS)


# ---------------------------------------------------------------------------
# Contrast
# ---------------------------------------------------------------------------
def _relative_luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    channels = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]

    def linear(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (linear(c) for c in channels)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = _relative_luminance(a), _relative_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    outputs = {
        "icon.png": render_icon(),
        "adaptive-icon.png": render_foreground(),
        "splash-icon.png": render_foreground(),
        "favicon.png": render_favicon(),
    }

    ASSETS.mkdir(exist_ok=True)
    for name, image in outputs.items():
        path = ASSETS / name
        # No timestamp or metadata chunks: deterministic bytes.
        image.save(path, format="PNG", optimize=False)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        print(f"{name:20s} {image.width}x{image.height}  {path.stat().st_size:>7d} B  {digest}")

    print()
    print(f"background  {BG}  (colors.background)")
    print(f"accent      {ACCENT}  (outlook-briefing oklch(0.80 0.160 162))")
    print(f"mist        {MIST}  (colors.textPrimary)")
    print(f"muted       {MUTED}  (colors.textSecondary)")
    print()
    checks = {"accent": ACCENT, "mist": MIST, "muted": MUTED}
    ratios = {}
    for name, color in checks.items():
        ratio = contrast(color, BG)
        ratios[name] = ratio
        print(f"contrast {name:7s} vs bg: {ratio:5.2f}:1")
    print(f"contrast min     vs bg: {min(ratios.values()):5.2f}:1")


if __name__ == "__main__":
    main()
