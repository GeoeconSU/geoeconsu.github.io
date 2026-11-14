#!/usr/bin/env python3
"""Cut every team photo to the same 4:5 portrait, centred on the face, so nobody's head is cropped.

  python tools/build_portraits.py            # all images in team/
  python tools/build_portraits.py nir.jpeg   # just one

Writes team/portraits/<name>.webp (480x600). The originals are left alone.
Needs: pip install opencv-python-headless pillow numpy
"""
import os, sys
import cv2, numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(ROOT, "team"), os.path.join(ROOT, "team", "portraits")
W, H = 480, 600
# where the face was found by hand for photos the detector misses: (centre x, centre y, face height) as fractions
MANUAL = {}

cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def face_box(rgb):
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    scale = 900 / max(gray.shape)
    small = cv2.resize(gray, None, fx=scale, fy=scale) if scale < 1 else gray
    s = scale if scale < 1 else 1
    for neighbours in (8, 5, 3):
        faces = cascade.detectMultiScale(small, scaleFactor=1.08, minNeighbors=neighbours, minSize=(int(small.shape[1] * .08),) * 2)
        if len(faces):
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            return x / s, y / s, w / s, h / s
    return None


def build(name):
    im = Image.open(os.path.join(SRC, name))
    rgba = im.convert("RGBA")
    rgb = np.asarray(Image.alpha_composite(Image.new("RGBA", rgba.size, (31, 40, 59, 255)), rgba).convert("RGB"))
    ih, iw = rgb.shape[:2]
    if name in MANUAL:
        cx, cy, fh = MANUAL[name]; cx, cy, fh = cx * iw, cy * ih, fh * ih; how = "manual"
    else:
        fb = face_box(rgb)
        if fb: x, y, w, h = fb; cx, cy, fh = x + w / 2, y + h / 2, h; how = "face"
        else: cx, cy, fh = iw / 2, ih * .38, ih * .3; how = "GUESS"
    # frame: the face takes about 42% of the height, with its centre 42% of the way down
    ch = fh / .42; cw = ch * W / H
    if cw > iw: cw = iw; ch = cw * H / W
    if ch > ih: ch = ih; cw = ch * W / H
    left = min(max(cx - cw / 2, 0), iw - cw); top = min(max(cy - ch * .42, 0), ih - ch)
    crop = rgba.crop((round(left), round(top), round(left + cw), round(top + ch))).resize((W, H), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, os.path.splitext(name)[0] + ".webp")
    crop.save(out, "WEBP", quality=84, method=6)
    print(f"{name:18s} {how:6s} {iw}x{ih} -> {os.path.relpath(out, ROOT)} {os.path.getsize(out)//1024} KB")


if __name__ == "__main__":
    names = sys.argv[1:] or sorted(f for f in os.listdir(SRC) if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")))
    for n in names:
        build(n)
