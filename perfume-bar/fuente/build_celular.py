import base64,json,sys,io
from PIL import Image
m={'musky':'x_musky','gourmand':'e_vainilla_praline','sandalo':'e_sandalo_iris','tabaco':'e_tabaco_pimienta',
 'peonia':'p_peonia','rosas':'p_rosas','jazmin':'p_jazmin','higo':'p_higo',
 'bergamota':'p_bergamota','grosella':'p_grosellas','pera':'p_pera','bruma':'p_bruma',
 'galaxolide':'e_galaxolide','isoe':'e_iso_e_super','hedione':'e_hedione',
 # relleno: notas que ya traen las bases
 'n_lima':'p_lima','n_azahar':'p_azahar','n_cedro':'p_cedro','n_ambar':'p_ambar','n_tabaco':'p_tabaco','n_oriental':'p_oriental',
 'n_vainilla':'p_vainilla','n_tonka':'p_tonka','n_ddl':'p_ddl','n_musk':'p_musk','n_violeta':'p_violeta','n_vetiver':'p_vetiver',
 'n_sandalo':'p_sandalo','n_cuero':'p_cuero','n_citrico':'p_citrico'}
LOGOS={'logo_boda','logo_boda_claro'}
def enc(path, recorte=True):
    im=Image.open(path).convert('RGBA')
    if recorte:
        bb=im.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
        if bb: im=im.crop(bb)
        im.thumbnail((460,460),Image.LANCZOS)
    b=io.BytesIO(); im.save(b,'WEBP',quality=80, method=4); return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
d={k:enc(f'imgs/{v}.webp') for k,v in m.items()}
for k in LOGOS: d[k]='data:image/webp;base64,'+base64.b64encode(open(f'imgs/{k}.webp','rb').read()).decode()
import time
t=open('app-celular.html').read().replace('__VERSION__',time.strftime('%Y%m%d%H%M%S')).replace('__IMGS__',json.dumps(d)).replace('__FRA__',open('fra_full.json').read())
open(sys.argv[1],'w').write(t)
