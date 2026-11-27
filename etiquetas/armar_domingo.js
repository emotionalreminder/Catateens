// Etiquetas del evento del domingo (17 notas, paleta de AlixPartners con cambios). Usa los datos y fotos de la app de AlixPartners.
// Uso: node etiquetas/armar_domingo.js  (con el servidor local en :8765)
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const AQUI = __dirname, OUT = path.join(AQUI, 'domingo'); fs.mkdirSync(path.join(OUT,'png'), {recursive:true});
const KIT = JSON.parse(fs.readFileSync(path.join(AQUI,'../paraguay/fuente/kit.json'),'utf8'));
const KIMG = JSON.parse(fs.readFileSync(path.join(AQUI,'../paraguay/fuente/kit_imgs.json'),'utf8'));
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(AQUI,'../paraguay/fuente/logos/logo_completo.png')).toString('base64');
/* orden, nombre visible y color de cada nota (familia + tono) */
const LISTA = [
  ['bergamota', null, 'Cítrica', '#A99A3A'], ['grass', 'Grass', 'Verde', '#4E6B3A'], ['grosellas', null, 'Frutal', '#5E2440'],
  ['pera', null, 'Frutal', '#9A9A3E'], ['bruma', null, 'Ozónica', '#3F6E78'], ['especias', null, 'Especiada', '#8A3A22'],
  ['jazmin', null, 'Floral', '#B8946E'], ['peonia', null, 'Floral', '#C07A8C'], ['rosa', null, 'Floral', '#A33F5A'],
  ['higo', null, 'Verde frutal', '#6C7550'], ['salvia', 'Aromático', 'Aromática', '#5F6E8E'],
  ['amaderada', 'Base Woody', 'Amaderada', '#7B5A3A'], ['musky', null, 'Almizclada', '#8C8378'], ['tonka', 'Base Gourmand', 'Gourmand floral', '#9C6A4A'],
  ['tabaco', null, 'Especiada', '#7A4527'], ['chipre', null, 'Chipre floral', '#94545A'], ['vainilla', null, 'Gourmand', '#B8915A']];
const ETAPA = {sal:'cima', cor:'corazon', fon:'fondo'}, ETN = {cima:'Nota de salida', corazon:'Nota de corazón', fondo:'Nota de fondo'};
const W = 709, H = 1063;
const esc = s => String(s==null?'':s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const piramide = (et, col) => `<svg viewBox="0 0 120 120" width="110" height="110">${[['cima',0,40],['corazon',40,80],['fondo',80,120]].map(([k,y0,y1])=>{ const x0 = y0/2, x1 = y1/2;
  return `<path d="M${60-x0},${y0} L${60+x0},${y0} L${60+x1},${y1} L${60-x1},${y1} Z" fill="${k===et?col:'#E9E0D2'}" stroke="#F7F2EA" stroke-width="3"/>`; }).join('')}</svg>`;
(async()=>{
  const b = await chromium.launch(), p = await b.newPage({viewport:{width:W,height:H}});
  await p.route('**/script.google.com/**', r=>r.fulfill({status:200, contentType:'application/json', body:'{"ok":true}'}));
  await p.goto('http://localhost:8765/alixpartners/'); await p.waitForTimeout(800);
  const A = await p.evaluate(()=>({C, IMGS}));
  const X = Object.fromEntries(A.C.map(c=>[c.id, c]));
  const g = KIT.B.find(x=>x.notas.some(n=>n.id==='grass')), gn = g.notas.find(n=>n.id==='grass'), gt = KIT.T.grass;
  X.grass = {id:'grass', n:'Grass', et:'sal', ap:gn.p, fu:gn.f, perfil:gt.desc, aporta:gt.aporta, comp:gt.comp, img:'__grass'}; A.IMGS.__grass = KIMG.grass;
  const et = ([id, nom, fam, col]) => { const c = X[id], e = ETAPA[c.et];
    const pir = c.pir ? c.pir.split(' · ').map(s=>s.split(': ')) : null;
    const desc = String(c.perfil||'').toUpperCase();
    return `<div class="et" id="et-${id}" style="--c:${col}">
      <div class="banda"><span>${esc(fam)}</span><span>${esc(ETN[e])}</span></div>
      <div class="marco">
        <img class="foto ${pir?'chica':''}" src="${A.IMGS[c.img]}" alt="">
        <div class="nom">${esc(nom || c.n)}</div><div class="apo">${esc(c.ap)}</div><div class="desc">${esc(desc)}</div>
        <div class="linea"></div>
        <div class="pir">${piramide(e, col)}<div class="pasos">${[['cima','Salida'],['corazon','Corazón'],['fondo','Fondo']].map(([k,t])=>`<div class="${k===e?'on':''}">${t}</div>`).join('')}</div>
          <div class="fza"><div class="fl">Intensidad</div><div class="dots">${Array.from({length:9},(_,i)=>`<i class="${i<c.fu?'on':''}"></i>`).join('')}</div><div class="fl">${c.fu}/9</div></div></div>
        ${pir ? `<div class="acorde"><div class="at">Pirámide del acorde</div>${pir.map(([t,n])=>`<div><b>${esc(t)}</b><span>${esc(n)}</span></div>`).join('')}</div>` : ''}
        <div class="txt">${esc(c.aporta)}</div>
        <div class="pie"><img src="${LOGO}" alt=""></div></div></div>`; };
  const css = `body{margin:0;font-family:Montserrat,sans-serif}
  .et{width:${W}px;height:${H}px;background:#F7F2EA;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column}
  .banda{height:84px;background:var(--c);color:#FBF7F0;display:flex;justify-content:space-between;align-items:center;padding:0 40px;font-size:19px;letter-spacing:5px;text-transform:uppercase;font-weight:500}
  .marco{flex:1;margin:22px;border:1.5px solid #C2A77A;display:flex;flex-direction:column;align-items:center;padding:12px 32px 10px;position:relative}
  .marco:after{content:'';position:absolute;inset:6px;border:.8px solid rgba(194,167,122,.55);pointer-events:none}
  .foto{width:400px;height:320px;object-fit:contain;margin-top:8px}.foto.chica{width:320px;height:230px}
  .nom{font-size:56px;font-weight:300;color:#231C18;margin-top:4px;line-height:1.05;text-align:center}
  .apo{font-size:25px;font-style:italic;font-weight:300;color:var(--c);margin-top:6px}
  .desc{font-size:15px;letter-spacing:3.5px;font-weight:600;color:#231C18;margin-top:10px;text-align:center;line-height:1.5}
  .linea{width:90px;height:2px;background:var(--c);margin:12px 0}
  .pir{display:grid;grid-template-columns:110px auto 1fr;gap:16px;align-items:center;width:100%}
  .pasos div{font-size:16px;color:#A99C8E;letter-spacing:2px;text-transform:uppercase;line-height:37px}.pasos div.on{color:var(--c);font-weight:700}
  .fza{text-align:right}.fl{font-size:13px;letter-spacing:2.5px;text-transform:uppercase;color:#7A6E62}
  .dots{display:flex;gap:5px;justify-content:flex-end;margin:6px 0}.dots i{width:13px;height:13px;border-radius:50%;border:1.5px solid var(--c);display:block}.dots i.on{background:var(--c)}
  .acorde{width:100%;margin-top:12px;border-top:1px solid #E6DCCB;padding-top:10px}.acorde .at{font-size:13px;letter-spacing:3px;text-transform:uppercase;color:var(--c);font-weight:700;margin-bottom:4px}
  .acorde div:not(.at){display:grid;grid-template-columns:96px 1fr;gap:8px;font-size:16px;line-height:1.4;color:#3A302A;margin-top:2px}.acorde b{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7A6E62;padding-top:3px}
  .txt{font-size:18px;line-height:1.5;color:#3A302A;text-align:center;margin-top:12px}
  .pie{margin-top:auto;padding-top:6px}.pie img{height:58px;opacity:.9}`;
  fs.writeFileSync(path.join(OUT,'etiquetas.html'), `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap" rel="stylesheet"><style>${css}</style></head><body>${LISTA.map(et).join('')}</body></html>`);
  await p.goto('http://localhost:8765/etiquetas/domingo/etiquetas.html'); await p.waitForTimeout(1500);
  for(const [id] of LISTA) await p.locator('#et-'+id).screenshot({path:path.join(OUT,'png', String(LISTA.findIndex(x=>x[0]===id)+1).padStart(2,'0')+'_'+id+'.png')});
  /* hojas A4 */
  const A4w = 2480, A4h = 3508, mx = (A4w-3*W)/2, my = (A4h-3*H)/2, files = fs.readdirSync(path.join(OUT,'png')).sort();
  for(let h = 0; h*9 < files.length; h++){
    const it = files.slice(h*9, h*9+9);
    fs.writeFileSync(path.join(OUT,'hoja.html'), `<!doctype html><html><body style="margin:0;width:${A4w}px;height:${A4h}px;background:#fff;position:relative">${it.map((f,i)=>`<img src="png/${f}" style="position:absolute;width:${W}px;height:${H}px;left:${mx+(i%3)*W}px;top:${my+Math.floor(i/3)*H}px">`).join('')}
      ${[0,1,2,3].map(i=>`<div style="position:absolute;background:#999;left:${mx+i*W-1}px;top:${my-60}px;width:2px;height:40px"></div><div style="position:absolute;background:#999;left:${mx+i*W-1}px;top:${my+3*H+20}px;width:2px;height:40px"></div><div style="position:absolute;background:#999;top:${my+i*H-1}px;left:${mx-60}px;height:2px;width:40px"></div><div style="position:absolute;background:#999;top:${my+i*H-1}px;left:${mx+3*W+20}px;height:2px;width:40px"></div>`).join('')}</body></html>`);
    const q = await b.newPage({viewport:{width:A4w,height:A4h}}); await q.goto('http://localhost:8765/etiquetas/domingo/hoja.html'); await q.waitForTimeout(500);
    await q.screenshot({path:path.join(OUT,'imprimir_A4_hoja'+(h+1)+'.png')}); await q.close();
  }
  fs.unlinkSync(path.join(OUT,'hoja.html')); await b.close(); console.log('ok', LISTA.length);
})();
