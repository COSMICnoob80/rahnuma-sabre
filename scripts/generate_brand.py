#!/usr/bin/env python3
"""Rahnuma SABRE brand icon generator.

Deterministic Pillow renderer for the complete Expo icon set:

    assets/icon.png          1024x1024  pre-rounded full-bleed app icon
    assets/adaptive-icon.png 1024x1024  transparent adaptive foreground
    assets/splash-icon.png   1024x1024  same mark as the adaptive foreground
    assets/favicon.png         48x48    stroke-compensated small-size mark

The artwork is the founder-approved "true black hero" from
design/brand-logo.html (variant 01, row-true-black): a pure #000000 ground,
a Times-class serif capital R at 0.76x the canvas, and a faint ascending
ticker watermark (emerald, 9% line / 16% glow / 28% end dot, running
bottom-left -> top-right).

Geometry is authored in the board's 512-unit master-SVG space and scaled
x2 into the 1024-unit render space, so the numbers below are traceable to
design/brand-logo.html. Flat fills and one font; no gradients, no effects.
Running this script twice must produce byte-identical PNGs.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

SS = 4  # supersampling factor for clean edges
DESIGN = 1024  # render space (board master is 512, so every x2 below is intentional)


# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
BG = "#000000"        # founder-approved true-black hero ground
PAPER = "#e7ecf0"     # src/theme/colors.ts -> colors.textPrimary (the R itself)
ACCENT = "#3add9e"    # ticker watermark, the only accent

# Watermark opacities, straight from design/brand-logo.html spec-list.
LINE_OPACITY = 0.09
GLOW_OPACITY = 0.16
DOT_OPACITY = 0.28

# Board variant 01: "serif R 0.76x · ticker watermark 9% · 22% mask preview"
R_RATIO = 0.76
CORNER_RATIO = 0.22


# ---------------------------------------------------------------------------
# Typeface: the board's stack is 'Times New Roman', 'Liberation Serif',
# Georgia, serif. First resolvable candidate wins; there is no system
# default fallback so the bytes never depend on an unexpected face.
# ---------------------------------------------------------------------------
SERIF_CANDIDATES = (
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
)


def serif_path() -> str:
    for candidate in SERIF_CANDIDATES:
        if Path(candidate).exists():
            return candidate
    raise SystemExit("no serif face found in " + ", ".join(SERIF_CANDIDATES))


# Master-SVG geometry (design/brand-logo.html, panel 05) in 512-space.
TICKER_512 = ((41, 440), (133, 379), (205, 399), (297, 276), (379, 215), (451, 123))
TICKER_W_512 = 12
GLOW_R_512 = 28
DOT_R_512 = 12
R_BASELINE_512 = (256, 387)
R_SIZE_512 = round(R_RATIO * 512)  # 389, the board's caption font-size


# ---------------------------------------------------------------------------
# Drawing helpers (coordinates are 1024-design-space, multiplied by SS)
# ---------------------------------------------------------------------------
def _rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha


def _scale(v: float) -> float:
    """512-space master unit -> supersampled canvas pixels."""
    return v * (DESIGN / 512) * SS


def _with_alpha(img: Image.Image, opacity: float) -> Image.Image:
    """Scale a full-coverage layer down to the board's watermark opacity."""
    out = img.copy()
    out.putalpha(img.getchannel("A").point(lambda v: round(v * opacity)))
    return out


def _polyline(pts, width: int, fill, size: int) -> Image.Image:
    """Round-joined, round-capped polyline on its own transparent layer."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.line(pts, fill=fill, width=width, joint="curve")
    r = width / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)
    return layer


def _disc(centre, radius: float, fill, size: int) -> Image.Image:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = centre
    d.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=fill)
    return layer


# ---------------------------------------------------------------------------
# Mark: serif R over the ascending ticker watermark
# ---------------------------------------------------------------------------
def render_mark(stroke_px: float = 0.0) -> Image.Image:
    """Render the hero mark on transparency at full supersampled resolution.

    stroke_px is a final-resolution stroke compensation (board row 04); it is
    converted to canvas pixels so a 48px export keeps its stem weight.
    """
    size = DESIGN * SS
    mark = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    accent = _rgba(ACCENT)
    pts = [(_scale(x), _scale(y)) for x, y in TICKER_512]
    end = pts[-1]

    line = _polyline(pts, round(_scale(TICKER_W_512)), accent, size)
    mark.alpha_composite(_with_alpha(line, LINE_OPACITY))
    mark.alpha_composite(_with_alpha(_disc(end, _scale(GLOW_R_512), accent, size), GLOW_OPACITY))
    mark.alpha_composite(_with_alpha(_disc(end, _scale(DOT_R_512), accent, size), DOT_OPACITY))

    font = ImageFont.truetype(serif_path(), round(_scale(R_SIZE_512)))
    d = ImageDraw.Draw(mark)
    stroke = round(stroke_px * (DESIGN / 48) * SS) if stroke_px else 0
    d.text(
        (_scale(R_BASELINE_512[0]), _scale(R_BASELINE_512[1])),
        "R",
        font=font,
        fill=_rgba(PAPER),
        anchor="ms",
        stroke_width=stroke,
        stroke_fill=_rgba(PAPER),
    )
    return mark


# ---------------------------------------------------------------------------
# Frame: pre-rounded background
# ---------------------------------------------------------------------------
def _grounded(mark: Image.Image) -> Image.Image:
    """Composite the mark over the pre-rounded true-black ground."""
    size = DESIGN * SS
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle(
        [0, 0, size - 1, size - 1],
        radius=round(CORNER_RATIO * size),
        fill=_rgba(BG),
    )
    img.alpha_composite(mark)
    return img


# ---------------------------------------------------------------------------
# Renderers
# ---------------------------------------------------------------------------
def render_icon() -> Image.Image:
    return _grounded(render_mark()).resize((DESIGN, DESIGN), Image.LANCZOS)


def render_foreground() -> Image.Image:
    """Transparent adaptive foreground, mark fitted to the 66% safe zone."""
    size = DESIGN * SS
    mark = render_mark()

    cropped = mark.crop(mark.getbbox())
    factor = (0.66 * size) / max(cropped.width, cropped.height)
    scaled = cropped.resize(
        (round(cropped.width * factor), round(cropped.height * factor)), Image.LANCZOS
    )

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(
        scaled,
        ((size - scaled.width) // 2, (size - scaled.height) // 2),
    )
    return canvas.resize((DESIGN, DESIGN), Image.LANCZOS)


def render_favicon() -> Image.Image:
    """48px export, stroke-compensated per board row 04 (+0.3px paper stroke)."""
    return _grounded(render_mark(stroke_px=0.007 * 48)).resize((48, 48), Image.LANCZOS)


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
    print(f"serif       {serif_path()}  @ {round(R_RATIO * 100)}%")
    print(f"background  {BG}  (true-black hero ground)")
    print(f"paper       {PAPER}  (colors.textPrimary - the R)")
    print(f"accent      {ACCENT}  (ticker watermark, {int(LINE_OPACITY * 100)}%)")
    print()
    for name, color in (("paper", PAPER), ("accent", ACCENT)):
        print(f"contrast {name:7s} vs bg: {contrast(color, BG):5.2f}:1")


if __name__ == "__main__":
    main()
