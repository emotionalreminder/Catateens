import json,sys,time,re,importlib.util,io,base64,os
from PIL import Image
spec=importlib.util.spec_from_file_location('b2','build_celular.py')
src=open('app-celular.html').read()
c1=src[src.index('/*@@COMUN1*/'):src.index('/*@@FIN1*/')]
c2=src[src.index('/*@@COMUN2*/'):src.index('/*@@FIN2*/')]
# las mismas fotos que la app del celular
m=re.search(r"m=(\{.*?\})\nLOGOS", open('build_celular.py').read(), re.S)
exec_env={}; exec("m="+m.group(1), exec_env); M=exec_env['m']
def enc(path):
    im=Image.open(path).convert('RGBA'); bb=im.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
    if bb: im=im.crop(bb)
    im.thumbnail((460,460),Image.LANCZOS); b=io.BytesIO(); im.save(b,'WEBP',quality=80,method=4)
    return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
d={k:enc(f'imgs/{v}.webp') for k,v in M.items()}
for k in ['logo_boda','logo_boda_claro']: d[k]='data:image/webp;base64,'+base64.b64encode(open(f'imgs/{k}.webp','rb').read()).decode()
t=open('app-tablet.html').read().replace('__COMUN1__',c1).replace('__COMUN2__',c2).replace('__IMGS__',json.dumps(d)).replace('__QR__',re.sub(r'<\?xml[^>]*>','',open('qr.svg').read()).strip())
out=sys.argv[1]; os.makedirs(out,exist_ok=True)
ver=time.strftime('%Y%m%d%H%M%S')
open(f'{out}/index.html','w').write(t)
open(f'{out}/manifest.json','w').write(json.dumps({"name":"Perfume Bar · Tablet","short_name":"Perfume Bar","start_url":"./","scope":"./","display":"standalone","orientation":"landscape","background_color":"#F7F0E6","theme_color":"#2E2420","icons":[{"src":"icono.png","sizes":"512x512","type":"image/png"}]},ensure_ascii=False,indent=1))
open(f'{out}/sw.js','w').write(f"""/* Guarda la app en la tablet para que abra sin internet. Versión {ver} */
const CACHE = 'perfume-bar-tablet-{ver}';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icono.png'];
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.hostname.includes('script.google')) return;
  /* la app: primero internet (para tener la última versión), si no hay, la guardada */
  if(u.origin === location.origin){{
    e.respondWith(fetch(e.request).then(r => {{ const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; }})
      .catch(() => caches.match(e.request, {{ignoreSearch:true}}).then(r => r || caches.match('./index.html'))));
    return;
  }}
  /* tipografías: la guardada si existe */
  if(u.hostname.includes('fonts.g')){{
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {{ const c = res.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return res; }})));
  }}
}});
""")
# ícono
ic=Image.new('RGBA',(512,512),(247,240,230,255)); lg=Image.open('imgs/logo_boda.webp').convert('RGBA'); lg.thumbnail((300,300))
ic.alpha_composite(lg,((512-lg.width)//2,(512-lg.height)//2)); ic.convert('RGB').save(f'{out}/icono.png')
print('ok', len(t)//1024, 'KB')
