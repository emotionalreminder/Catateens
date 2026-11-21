"""Arma las dos apps de Caro Cuomo:  python3 armar.py   (desde esta carpeta)
   celular -> ../index.html · tablet -> ../tablet/"""
import base64,json,io,os,re,time
from PIL import Image
AQUI=os.path.dirname(os.path.abspath(__file__)); CAFA=os.path.join(AQUI,'..','..','perfume-bar','fuente','imgs')
def ruta(n):
    for d in (os.path.join(AQUI,'imgs'),CAFA):
        p=os.path.join(d,n+'.webp')
        if os.path.exists(p): return p
    raise FileNotFoundError(n)
M={'musky':'x_musky','sandalo':'e_sandalo_iris','tabaco':'e_tabaco_pimienta','gourmand':'x_gourmand_caro',
 'peonia':'p_peonia','rosas':'p_rosas','higo':'p_higo','aromatico':'p_lavanda','jazmin':'p_jazmin',
 'bergamota':'p_bergamota','grosella':'p_grosellas','pera':'p_pera','bruma':'p_bruma',
 'galaxolide':'e_galaxolide','isoe':'e_iso_e_super','hedione':'e_hedione',
 'n_lima':'p_lima','n_azahar':'p_azahar','n_cedro':'p_cedro','n_ambar':'p_ambar','n_tabaco':'p_tabaco','n_oriental':'p_oriental',
 'n_vainilla':'p_vainilla','n_tonka':'p_tonka','n_ddl':'p_ddl','n_musk':'p_musk','n_violeta':'p_violeta','n_vetiver':'p_vetiver',
 'n_sandalo':'p_sandalo','n_cuero':'p_cuero','n_citrico':'p_citrico'}
def enc(p):
    im=Image.open(p).convert('RGBA'); bb=im.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
    if bb: im=im.crop(bb)
    im.thumbnail((460,460),Image.LANCZOS); b=io.BytesIO(); im.save(b,'WEBP',quality=80,method=4)
    return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
IM={k:enc(ruta(v)) for k,v in M.items()}
for k in ['logo_caro','logo_caro_claro']: IM[k]='data:image/webp;base64,'+base64.b64encode(open(ruta(k),'rb').read()).decode()
ver=time.strftime('%Y%m%d%H%M%S')
cel=open(os.path.join(AQUI,'app-celular.html')).read()
open(os.path.join(AQUI,'..','index.html'),'w').write(cel.replace('__VERSION__',ver).replace('__IMGS__',json.dumps(IM)).replace('__FRA__',open(os.path.join(AQUI,'fra_full.json')).read()))
c1=cel[cel.index('/*@@COMUN1*/'):cel.index('/*@@FIN1*/')]; c2=cel[cel.index('/*@@COMUN2*/'):cel.index('/*@@FIN2*/')]
qr=re.sub(r'<\?xml[^>]*>','',open(os.path.join(AQUI,'qr.svg')).read()).strip()
tab=open(os.path.join(AQUI,'app-tablet.html')).read().replace('__COMUN1__',c1).replace('__COMUN2__',c2).replace('__IMGS__',json.dumps(IM)).replace('__QR__',qr)
out=os.path.join(AQUI,'..','tablet'); os.makedirs(out,exist_ok=True)
open(os.path.join(out,'index.html'),'w').write(tab)
open(os.path.join(out,'manifest.json'),'w').write(json.dumps({"name":"Bar de Perfumes · Caro Cuomo","short_name":"Bar de Perfumes","start_url":"./","scope":"./","display":"standalone","orientation":"landscape","background_color":"#F7F0E6","theme_color":"#2E2420","icons":[{"src":"icono.png","sizes":"512x512","type":"image/png"}]},ensure_ascii=False,indent=1))
open(os.path.join(out,'sw.js'),'w').write(f"""/* Guarda la app en la tablet para que abra sin internet. Versión {ver} */
const PREFIJO = 'caro-tablet-', CACHE = PREFIJO + '{ver}';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icono.png'];
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIJO) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.hostname.includes('script.google')) return;
  if(u.origin === location.origin){{
    e.respondWith(fetch(e.request).then(r => {{ const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; }})
      .catch(() => caches.match(e.request, {{ignoreSearch:true}}).then(r => r || caches.match('./index.html'))));
    return;
  }}
  if(u.hostname.includes('fonts.g')){{
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {{ const c = res.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return res; }})));
  }}
}});
""")
ic=Image.new('RGBA',(512,512),(247,240,230,255)); lg=Image.open(ruta('logo_caro')).convert('RGBA'); lg.thumbnail((400,400))
ic.alpha_composite(lg,((512-lg.width)//2,(512-lg.height)//2)); ic.convert('RGB').save(os.path.join(out,'icono.png'))
print('ok', ver)
