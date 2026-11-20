"""Crop arena headers for the phone: python3 arena-images.py <kit_dir>
Uses the block-lens swipe frames (412 css px wide) and cap/appearance.png."""
import sys, io, base64, json, os
from PIL import Image
kit = sys.argv[1]
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'mocks', 'block-lens', 'frames', 'new') + os.sep
def uri(im):
    b = io.BytesIO(); im.convert('RGB').save(b, 'JPEG', quality=80); return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
imgs = {k: uri(Image.open(F + f).crop((0, 0, 412, 262))) for k, f in [('home', '00.jpg'), ('analytics', '04.jpg'), ('history', '08.jpg'), ('library', '12.jpg')]}
ap = Image.open(kit + '/cap/appearance.png'); s = ap.size[0] / 412
imgs['profile'] = uri(ap.crop((0, 0, ap.size[0], int(52 * s))).resize((412, 52)))
json.dump(imgs, open(kit + '/arena-images.json', 'w'))
