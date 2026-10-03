#!/usr/bin/env python3
"""Convert the JetBrains Mono masters to the woff2 files the app loads.

Run from the repo root:

    python scripts/convert-fonts.py

Reads every ``*.ttf`` in ``public/fonts/JetBrains-Mono/``, writes
``public/fonts/JetBrainsMono-<Style>.woff2`` for the weights the design system
actually uses (400 / 600 / 700), and reports what it skipped. Masters are left
in place so the conversion is reproducible; delete the folder by hand once the
woff2 files are committed (they are, by a wide margin, the smaller artefact).

Requires ``fonttools`` and ``brotli``:  pip install fonttools brotli
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
except ImportError:  # pragma: no cover - dependency guard
    sys.exit("fonttools is required: pip install fonttools brotli")

ROOT = Path(__file__).resolve().parent.parent
MASTER_DIR = ROOT / "public" / "fonts" / "JetBrains-Mono"
OUT_DIR = ROOT / "public" / "fonts"

# Only the weights the UI uses: body mono, emphasized numerals, and headings.
KEEP_WEIGHTS = {400, 600, 700}

STYLE_NAMES = {400: "Regular", 600: "SemiBold", 700: "Bold"}


def main() -> int:
    if not MASTER_DIR.is_dir():
        print(f"note: {MASTER_DIR.relative_to(ROOT)} does not exist - nothing to do")
        return 0

    masters = sorted(MASTER_DIR.glob("*.ttf"))
    if not masters:
        print(f"note: no .ttf masters in {MASTER_DIR.relative_to(ROOT)}")
        return 0

    written = 0
    for master in masters:
        font = TTFont(master)
        weight = font["OS/2"].usWeightClass
        italic = bool(font["head"].macStyle & 0b10)

        if italic or weight not in KEEP_WEIGHTS:
            print(f"skip  {master.name} (weight {weight}{', italic' if italic else ''})")
            continue

        target = OUT_DIR / f"JetBrainsMono-{STYLE_NAMES[weight]}.woff2"
        font.flavor = "woff2"
        font.save(target)
        before = master.stat().st_size / 1024
        after = target.stat().st_size / 1024
        print(f"write {target.name}  {before:.0f} KB -> {after:.0f} KB")
        written += 1

    if written == 0:
        print("nothing written")
        return 1

    print(f"\n{written} woff2 file(s) in public/fonts/. Masters left in place for reproducibility.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
