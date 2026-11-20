"""Draw the drover app icon, a robot agent head (packaging/drover.ico + web favicon). Run: uv run --with pillow python packaging/make_icon.py"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
ACCENT = (150, 178, 215)  # UI accent #96b2d7
INK = (19, 21, 24)  # canvas #131518
DONE = (76, 196, 140)  # done dot #4cc48c
EAR = tuple(round(a * 0.6 + b * 0.4) for a, b in zip(ACCENT, INK))  # accent at 60% over the canvas
S = 1024  # draw big, downsample for crisp small sizes
U = S / 64  # the design is laid out on a 64-unit grid


def _dot(d: ImageDraw.ImageDraw, cx: float, cy: float, r: float, fill) -> None:
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)


def draw() -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([2 * U, 2 * U, 62 * U, 62 * U], radius=15 * U, fill=INK)

    # antenna with the green status light
    d.line([(32 * U, 22 * U), (32 * U, 14 * U)], fill=ACCENT, width=round(3.5 * U))
    _dot(d, 32 * U, 22 * U, 1.75 * U, ACCENT)
    _dot(d, 32 * U, 11.5 * U, 4 * U, DONE)

    # ears, head
    d.rounded_rectangle([8 * U, 32 * U, 13 * U, 43 * U], radius=2.5 * U, fill=EAR)
    d.rounded_rectangle([51 * U, 32 * U, 56 * U, 43 * U], radius=2.5 * U, fill=EAR)
    d.rounded_rectangle([14 * U, 22 * U, 50 * U, 53 * U], radius=10 * U, fill=ACCENT)

    # eyes
    _dot(d, 24.5 * U, 36 * U, 3.8 * U, INK)
    _dot(d, 39.5 * U, 36 * U, 3.8 * U, INK)

    # smile: quadratic curve (25,44.5) -> (39,44.5), control (32,49), drawn as round-capped dots
    for i in range(41):
        t = i / 40
        x = (1 - t) ** 2 * 25 + 2 * (1 - t) * t * 32 + t**2 * 39
        y = (1 - t) ** 2 * 44.5 + 2 * (1 - t) * t * 49 + t**2 * 44.5
        _dot(d, x * U, y * U, 1.5 * U, INK)
    return img


def main() -> None:
    img = draw()
    sizes = [16, 20, 24, 32, 40, 48, 64, 128, 256]
    img.save(ROOT / "drover.ico", sizes=[(s, s) for s in sizes])
    img.resize((256, 256), Image.LANCZOS).save(ROOT / "drover-256.png")
    web = ROOT.parent / "src" / "drover" / "web"
    img.resize((64, 64), Image.LANCZOS).save(web / "favicon.png")
    img.save(web / "app-icon.ico", sizes=[(s, s) for s in sizes])  # pywebview on Windows needs .ico
    print("wrote drover.ico, drover-256.png, web/favicon.png, web/app-icon.ico")


if __name__ == "__main__":
    main()
