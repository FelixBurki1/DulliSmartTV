"""Erzeugt app/icon.png (512x512). Aufruf: python tools/make_icon.py"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SIZE = 512
TOP = (43, 16, 85)
BOTTOM = (243, 156, 90)


def main():
    gradient = Image.new("RGB", (SIZE, SIZE))
    draw = ImageDraw.Draw(gradient)
    for y in range(SIZE):
        t = y / (SIZE - 1)
        color = tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM))
        draw.line([(0, y), (SIZE, y)], fill=color)

    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=110, fill=255)
    icon = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    icon.paste(gradient, (0, 0), mask)

    try:
        font = ImageFont.truetype("arialbd.ttf", 300)
    except OSError:
        font = ImageFont.load_default()
    ImageDraw.Draw(icon).text((SIZE / 2, SIZE / 2), "D", font=font, fill="white", anchor="mm")

    out = Path(__file__).resolve().parent.parent / "app" / "icon.png"
    icon.save(out)
    print(f"geschrieben: {out}")


if __name__ == "__main__":
    main()
