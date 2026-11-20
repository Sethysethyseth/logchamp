"""Build a LogChamp prototype from captured app CSS + markup (the prototype kit).
Usage: python3 build.py <kit_dir>   -> <kit_dir>/customize.html
Inputs in kit_dir: app.css, modules.json, arena-images.json (from capture.cjs),
phone.src.html (the screen, runs in its own 412px frame), customize.src.html (the page around it)."""
import sys, json, base64, re, os
kit = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.environ.get('LOGCHAMP_ASSETS', os.path.join(HERE, '..', '..', '..', 'client', 'src', 'assets'))
css = open(os.path.join(kit, 'cap', 'app.css')).read()
def inline(m):
    f = os.path.join(ASSETS, m.group(1))
    if not os.path.exists(f): return 'none'
    mime = 'image/png' if f.endswith('.png') else 'image/jpeg'
    return 'url("data:%s;base64,%s")' % (mime, base64.b64encode(open(f, 'rb').read()).decode())
css = re.sub(r'url\("/src/assets/([^"]+)"\)', inline, css)
mods = json.dumps(json.load(open(os.path.join(kit, 'modules.json')))).replace('</', '<\\/')
imgs = json.dumps(json.load(open(os.path.join(kit, 'arena-images.json'))))
child = open(os.path.join(kit, 'phone.src.html')).read().replace('/*APP_CSS*/', css).replace('/*MODULES_JSON*/null', mods).replace('/*IMG_JSON*/null', imgs)
page = open(os.path.join(kit, 'customize.src.html')).read().replace('/*CHILD_JSON*/null', json.dumps(child).replace('</', '<\\/'))
out = os.path.join(kit, 'customize.html')
open(out, 'w').write(page)
print(out, len(page) // 1024, 'KB')
