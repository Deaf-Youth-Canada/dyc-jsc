"""Keep the Memories gallery in sync with the shared Google Drive folder.

Board members add or remove photos in the public Drive folder
"DYC / JSC Memories". No code changes are needed:

  python scripts/sync_memories.py list
      Reads the folder and writes memories.json (the list of photo IDs).
      The GitHub Action commits it when the folder changes, which republishes the site.

  python scripts/sync_memories.py download _site
      During the build, downloads each photo (cached between runs), shrinks it,
      saves it to _site/assets/drive-memories/<id>.jpg and writes _site/memories.json
      with the photos that are ready. The Memories page adds them after the archive photos.

The folder must stay shared as "Anyone with the link can view". If GOOGLE_API_KEY is
set (as a repository secret), the official Drive API is used to list the folder;
otherwise the folder's public embedded view is read.
"""
import io
import json
import os
import re
import shutil
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

FOLDER_ID = os.environ.get('MEMORIES_FOLDER_ID', '1pWCAo0ToohYILA4RQEAhZRW5YjfdMDpT')
LIST_FILE = Path('memories.json')
CACHE_DIR = Path(os.environ.get('MEMORIES_CACHE', '.memories-cache'))
IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp')
MAX_WIDTH = 1600
JPEG_QUALITY = 82
USER_AGENT = 'Mozilla/5.0 (compatible; dycjsc-site-builder/1.0; +https://dycjsc.ca)'


def fetch(url, timeout=60):
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def list_with_api(key):
    photos, token = [], None
    while True:
        params = {
            'q': f"'{FOLDER_ID}' in parents and trashed = false and mimeType contains 'image/'",
            'fields': 'nextPageToken, files(id, name)',
            'orderBy': 'name',
            'pageSize': '1000',
            'key': key,
        }
        if token:
            params['pageToken'] = token
        data = json.loads(fetch('https://www.googleapis.com/drive/v3/files?' + urllib.parse.urlencode(params)))
        photos += [{'id': f['id'], 'name': f['name']} for f in data.get('files', [])]
        token = data.get('nextPageToken')
        if not token:
            return photos


def list_with_embedded_view():
    page = fetch(f'https://drive.google.com/embeddedfolderview?id={FOLDER_ID}').decode('utf-8', 'replace')
    pattern = re.compile(r'<div class="flip-entry" id="entry-([^"]+)".*?<div class="flip-entry-title">([^<]*)</div>', re.S)
    photos = []
    for file_id, name in pattern.findall(page):
        name = name.strip()
        if name.lower().endswith(IMAGE_EXTENSIONS):
            photos.append({'id': file_id, 'name': name})
    photos.sort(key=lambda p: p['name'].lower())
    return photos


def command_list():
    key = os.environ.get('GOOGLE_API_KEY', '').strip()
    photos = list_with_api(key) if key else list_with_embedded_view()
    previous = json.loads(LIST_FILE.read_text()) if LIST_FILE.exists() else {'photos': []}
    if not photos and previous.get('photos'):
        # An empty answer usually means Google did not respond as expected. Keep the last list.
        raise SystemExit('No photos found in the Drive folder; keeping the previous memories.json.')
    data = {'folder': FOLDER_ID, 'photos': [{'id': p['id']} for p in photos]}
    if data != previous:
        LIST_FILE.write_text(json.dumps(data) + '\n')
        print(f'memories.json updated: {len(photos)} photos')
    else:
        print(f'memories.json unchanged: {len(photos)} photos')


def download_photo(file_id):
    target = CACHE_DIR / f'{file_id}.jpg'
    if target.exists() and target.stat().st_size > 0:
        return target
    urls = (
        f'https://drive.usercontent.google.com/download?id={file_id}&export=download',
        f'https://drive.google.com/thumbnail?id={file_id}&sz=w{MAX_WIDTH}',
    )
    for url in urls:
        try:
            with Image.open(io.BytesIO(fetch(url))) as source:
                image = ImageOps.exif_transpose(source).convert('RGB')
        except Exception as error:  # not an image (for example a Google warning page) or a network error
            print(f'  {file_id}: {url.split("?")[0]} failed ({error.__class__.__name__})')
            continue
        if image.width > MAX_WIDTH:
            image = image.resize((MAX_WIDTH, round(image.height * MAX_WIDTH / image.width)), Image.LANCZOS)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        image.save(target, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)
        return target
    return None


def command_download(site):
    site = Path(site)
    output_dir = site / 'assets' / 'drive-memories'
    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        photos = json.loads(LIST_FILE.read_text()).get('photos', []) if LIST_FILE.exists() else []
    except ValueError:
        photos = []
    ready = []
    for photo in photos:
        file_id = photo.get('id', '')
        if not re.fullmatch(r'[A-Za-z0-9_-]+', file_id):
            continue
        cached = download_photo(file_id)
        if cached:
            shutil.copyfile(cached, output_dir / cached.name)
            with Image.open(cached) as image:
                ready.append({'src': f'assets/drive-memories/{cached.name}', 'width': image.width, 'height': image.height})
    (site / 'memories.json').write_text(json.dumps({'photos': ready}) + '\n')
    print(f'Memories: {len(ready)} of {len(photos)} Drive photos ready')


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'list':
        command_list()
    elif len(sys.argv) >= 3 and sys.argv[1] == 'download':
        command_download(sys.argv[2])
    else:
        raise SystemExit(__doc__)
