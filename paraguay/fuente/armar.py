# Arma paraguay/index.html desde app.html. Uso: cd paraguay/fuente && python3 -I armar.py [URL_DEL_SCRIPT]
import os, io, sys, json, base64
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(AQUI, '..', '..')
kit = json.load(open(os.path.join(AQUI, 'kit.json')))
img = json.load(open(os.path.join(AQUI, 'kit_imgs.json')))
IM = {}
for k, uri in img.items():
    im = Image.open(io.BytesIO(base64.b64decode(uri.split(',', 1)[1]))).convert('RGBA'); im.thumbnail((420, 420))
    b = io.BytesIO(); im.save(b, 'WEBP', quality=76); IM[k] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
url = sys.argv[1] if len(sys.argv) > 1 else open(os.path.join(AQUI, 'script_url.txt')).read().strip() if os.path.exists(os.path.join(AQUI, 'script_url.txt')) else ''
html = (open(os.path.join(AQUI, 'app.html')).read().replace('__IMGS__', json.dumps(IM)).replace('__KIT__', json.dumps(kit, ensure_ascii=False))
  .replace('__PERFUMES__', open(os.path.join(AQUI, 'perfumes.json')).read()).replace('__FRA__', open(os.path.join(R, 'caro-cuomo', 'fuente', 'fra_full.json')).read().strip())
  .replace('__SCRIPT_URL__', url))
open(os.path.join(AQUI, '..', 'index.html'), 'w').write(html)
print('ok', round(len(html)/1024), 'KB', '· script:', url or '(sin configurar)')
