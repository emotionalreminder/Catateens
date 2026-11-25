# Arma alixpartners/index.html desde app.html: incrusta imágenes (webp livianas), base de perfumes e invitados.
# Uso: cd alixpartners/fuente && python3 -I armar.py
import os, io, json, base64, re
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(AQUI, '..', '..')
PB = os.path.join(R, 'perfume-bar', 'fuente', 'imgs'); CC = os.path.join(R, 'caro-cuomo', 'fuente', 'imgs'); PROPIAS = os.path.join(AQUI, 'imgs')
# clave en la app -> archivo. Si en fuente/imgs hay un archivo con el nombre de la clave (ej. especias.png), se usa ese.
FUENTES = {'p_bergamota':PB, 'p_citrico':PB, 'p_grosellas':PB, 'p_pera':PB, 'p_bruma':PB, 'p_jazmin':PB, 'p_peonia':PB, 'p_rosas':PB, 'p_higo':PB, 'p_vainilla':PB,
  'caro_woody':CC, 'caro_musky':CC, 'x_gourmand_caro':CC, 'caro_tabaco':CC, 'caro_gourmand':CC, 'e_vainilla_praline':PB,
  'especias':(PB,'p_oriental'), 'salvia':(CC,'p_lavanda')}   # provisorias hasta tener las fotos propias
def cargar(k, v):
    for ext in ('webp','png','jpg','jpeg'):
        p = os.path.join(PROPIAS, f'{k}.{ext}')
        if os.path.exists(p): return Image.open(p), 'propia'
    d, n = v if isinstance(v, tuple) else (v, k)
    return Image.open(os.path.join(d, n + '.webp')), 'provisoria' if isinstance(v, tuple) else 'ok'
IM = {}
for k, v in FUENTES.items():
    im, est = cargar(k, v); im = im.convert('RGBA'); im.thumbnail((640, 640))
    b = io.BytesIO(); im.save(b, 'WEBP', quality=78); IM[k] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
    if est != 'ok': print(k, est)
fra = open(os.path.join(R, 'caro-cuomo', 'fuente', 'fra_full.json')).read().strip()
inv = open(os.path.join(AQUI, 'invitados.json')).read().strip()
html = open(os.path.join(AQUI, 'app.html')).read().replace('__IMGS__', json.dumps(IM)).replace('__FRA__', fra).replace('__INVITADOS__', inv)
out = os.path.join(AQUI, '..', 'index.html'); open(out, 'w').write(html)
print('ok', round(len(html)/1024), 'KB')
