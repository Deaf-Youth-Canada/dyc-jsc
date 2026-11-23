"""Shrink oversized photos in the built site before it is published.

The repository keeps the original, full-size files. This runs only on the
copy in _site/ during the GitHub Actions build, so visitors download smaller
images without anyone having to resize photos by hand.

Usage: python scripts/optimize_images.py _site
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

MAX_PHOTO_WIDTH = 2000   # memories, banners, camp photos
MAX_CARD_WIDTH = 810     # board graphics (shown at most ~400px wide)
FAVICON_SIZE = 192
JPEG_QUALITY = 82


def save_if_smaller(path, image, **options):
    temp = path.with_name(path.name + '.tmp')
    image.save(temp, **options)
    if temp.stat().st_size < path.stat().st_size:
        temp.replace(path)
        return True
    temp.unlink()
    return False


def optimize_jpeg(path):
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert('RGB')
    if image.width > MAX_PHOTO_WIDTH:
        height = round(image.height * MAX_PHOTO_WIDTH / image.width)
        image = image.resize((MAX_PHOTO_WIDTH, height), Image.LANCZOS)
    return save_if_smaller(path, image, format='JPEG', quality=JPEG_QUALITY,
                           optimize=True, progressive=True)


def optimize_png(path, max_width):
    with Image.open(path) as source:
        image = source.copy()
    has_transparency = image.mode in ('RGBA', 'LA') and image.getchannel('A').getextrema()[0] < 255
    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.LANCZOS)
    if has_transparency:
        image = image.convert('RGBA').quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    else:
        image = image.convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                                              dither=Image.Dither.FLOYDSTEINBERG)
    return save_if_smaller(path, image, format='PNG', optimize=True)


def main(site):
    root = Path(site)
    before = after = 0
    targets = []
    for path in sorted((root / 'assets').rglob('*')):
        if path.parent.name == 'bylaws':
            continue  # scanned pages are already sized for reading
        suffix = path.suffix.lower()
        if suffix in ('.jpg', '.jpeg'):
            targets.append((path, optimize_jpeg))
        elif suffix == '.png' and path.parent.name == 'board':
            targets.append((path, lambda p: optimize_png(p, MAX_CARD_WIDTH)))
    favicon = root / 'favicon.png'
    if favicon.exists():
        targets.append((favicon, lambda p: optimize_png(p, FAVICON_SIZE)))
    for path, optimize in targets:
        size = path.stat().st_size
        before += size
        optimize(path)
        after += path.stat().st_size
    print(f'Optimized {len(targets)} images: {before // 1024} KB -> {after // 1024} KB')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '_site')
