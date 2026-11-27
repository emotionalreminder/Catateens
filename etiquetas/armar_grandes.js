// Etiquetas grandes (9 x 13,5 cm a 300 dpi) con fondo pleno de color, para botellas de 1 litro del Perfume Bar.
// Genera los dos kits: "domingo" (17 notas, paleta AlixPartners) y "kit27" (las 27 notas). 9 etiquetas por hoja A3, sin marcas de corte.
// Uso: node etiquetas/armar_grandes.js  (con el servidor local en :8765 sirviendo el repo)
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const AQUI = __dirname, R = path.join(AQUI, '..');
const KIT = JSON.parse(fs.readFileSync(path.join(R,'paraguay/fuente/kit.json'),'utf8'));
const KIMG = JSON.parse(fs.readFileSync(path.join(R,'paraguay/fuente/kit_imgs.json'),'utf8'));
const PAL = JSON.parse(fs.readFileSync(path.join(AQUI,'paleta.json'),'utf8'));
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(R,'paraguay/fuente/logos/logo_completo_claro.png')).toString('base64');
const W = 1063, H = 1594;   // 9 x 13,5 cm a 300 dpi
const ETN = {cima:'Nota de salida', corazon:'Nota de corazón', fondo:'Nota de fondo'}, ETAPA = {sal:'cima', cor:'corazon', fon:'fondo'};
const esc = s => String(s==null?'':s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const piramide = et => `<svg viewBox="0 0 120 120" width="150" height="150">${[['cima',0,40],['corazon',40,80],['fondo',80,120]].map(([k,y0,y1])=>{ const x0 = y0/2, x1 = y1/2;
  return `<path d="M${60-x0},${y0} L${60+x0},${y0} L${60+x1},${y1} L${60-x1},${y1} Z" fill="${k===et?'#FBF5EA':'rgba(251,245,234,.22)'}" stroke="var(--c)" stroke-width="3"/>`; }).join('')}</svg>`;
function etiqueta(x){
  return `<div class="et" id="et-${x.k}" style="--c:${x.col}">
    <div class="banda"><span>${esc(x.fam)}</span><span>${esc(ETN[x.et])}</span></div>
    <div class="marco">
      <div class="medalla ${x.pir?'chica':''}"><img src="${x.img}" alt=""></div>
      <div class="nom" style="${x.nom.length > 13 ? 'font-size:80px' : ''}">${esc(x.nom)}</div><div class="apo">${esc(x.ap)}</div><div class="desc">${esc(String(x.desc||'').toUpperCase())}</div>
      <div class="linea"></div>
      <div class="pir">${piramide(x.et)}<div class="pasos">${[['cima','Salida'],['corazon','Corazón'],['fondo','Fondo']].map(([k,t])=>`<div class="${k===x.et?'on':''}">${t}</div>`).join('')}</div>
        <div class="fza"><div class="fl">Intensidad</div><div class="dots">${Array.from({length:9},(_,i)=>`<i class="${i<x.fu?'on':''}"></i>`).join('')}</div><div class="fl">${x.fu} / 9</div></div></div>
      ${x.pir ? `<div class="acorde"><div class="at">Pirámide del acorde</div>${x.pir.map(([t,n])=>`<div><b>${esc(t)}</b><span>${esc(n)}</span></div>`).join('')}</div>` : ''}
      <div class="txt">${esc(x.aporta)}</div>
      <div class="pie"><img src="${LOGO}" alt="Emotional Reminder"></div></div></div>`;
}
const CSS = `body{margin:0;font-family:Montserrat,sans-serif}
  .et{width:${W}px;height:${H}px;background:var(--c);color:#FBF5EA;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;position:relative}
  .et:before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 22%, rgba(255,255,255,.16), rgba(0,0,0,.18) 75%);pointer-events:none}
  .banda{height:112px;background:rgba(0,0,0,.18);display:flex;justify-content:space-between;align-items:center;padding:0 60px;font-size:33px;letter-spacing:7px;text-transform:uppercase;font-weight:500;position:relative}
  .marco{flex:1;margin:30px;border:2px solid rgba(251,245,234,.75);display:flex;flex-direction:column;align-items:center;padding:24px 52px 18px;position:relative}
  .marco:after{content:'';position:absolute;inset:9px;border:1px solid rgba(251,245,234,.4);pointer-events:none}
  .medalla{width:540px;height:540px;border-radius:50%;background:radial-gradient(circle, #FBF5EA 58%, rgba(251,245,234,.0) 72%);display:flex;align-items:center;justify-content:center;margin-top:4px}
  .medalla img{width:82%;height:82%;object-fit:contain}
  .medalla.chica{width:360px;height:360px}
  .nom{font-size:100px;font-weight:300;line-height:1.02;text-align:center;margin-top:6px}
  .apo{font-size:46px;font-style:italic;font-weight:300;opacity:.92;margin-top:8px}
  .desc{font-size:33px;letter-spacing:5px;font-weight:600;margin-top:14px;text-align:center;line-height:1.35}
  .linea{width:140px;height:3px;background:#FBF5EA;opacity:.8;margin:20px 0 16px}
  .pir{display:grid;grid-template-columns:150px auto 1fr;gap:24px;align-items:center;width:100%}
  .pasos div{font-size:33px;letter-spacing:3px;text-transform:uppercase;line-height:50px;opacity:.5}.pasos div.on{opacity:1;font-weight:700}
  .fza{text-align:right}.fl{font-size:26px;letter-spacing:3px;text-transform:uppercase;opacity:.85}
  .dots{display:flex;gap:8px;justify-content:flex-end;margin:10px 0}.dots i{width:22px;height:22px;border-radius:50%;border:2.5px solid #FBF5EA;display:block}.dots i.on{background:#FBF5EA}
  .acorde{width:100%;margin-top:18px;border-top:1.5px solid rgba(251,245,234,.45);padding-top:14px}
  .acorde .at{font-size:26px;letter-spacing:4px;text-transform:uppercase;font-weight:700;margin-bottom:6px}
  .acorde div:not(.at){display:grid;grid-template-columns:170px 1fr;gap:12px;font-size:31px;line-height:1.3;margin-top:4px}.acorde b{font-size:24px;letter-spacing:3px;text-transform:uppercase;opacity:.8;padding-top:5px}
  .txt{font-size:36px;line-height:1.42;text-align:center;margin-top:18px;font-weight:400}
  .pie{margin-top:auto;padding-top:10px}.pie img{height:96px}`;

async function kitDomingo(page){
  await page.goto('http://localhost:8765/alixpartners/'); await page.waitForTimeout(800);
  const A = await page.evaluate(()=>({C, IMGS})), X = Object.fromEntries(A.C.map(c=>[c.id, c]));
  const g = KIT.B.find(b=>b.notas.some(n=>n.id==='grass')).notas.find(n=>n.id==='grass');
  X.grass = {id:'grass', n:'Grass', et:'sal', ap:g.p, fu:g.f, perfil:KIT.T.grass.desc, aporta:KIT.T.grass.aporta};
  const fotos = {grass:KIMG.grass, amaderada:KIMG.sandalo, vainilla:KIMG.vainilla};
  const L = [['bergamota',null,'Cítrica','#8E7F24'],['grass','Grass','Verde','#3F5A2E'],['grosellas',null,'Frutal','#5E2440'],['pera',null,'Frutal','#7C7E2C'],
    ['bruma',null,'Ozónica','#2F5F6B'],['especias',null,'Especiada','#86331C'],['jazmin',null,'Floral','#9C7650'],['peonia',null,'Floral','#A45E72'],
    ['rosa',null,'Floral','#93324E'],['higo',null,'Verde frutal','#56603E'],['salvia','Aromático','Aromática','#4F5D80'],['amaderada','Base Woody','Amaderada','#6B4A2E'],
    ['musky',null,'Almizclada','#766D63'],['tonka','Base Gourmand','Gourmand floral','#8A5A3C'],['tabaco',null,'Especiada','#6A3A20'],['chipre',null,'Chipre floral','#844650'],['vainilla',null,'Gourmand','#9C7444']];
  return L.map(([id,nom,fam,col])=>{ const c = X[id]; return {k:id, nom:nom||c.n, fam, col, et:ETAPA[c.et], ap:c.ap, fu:c.fu, desc:c.perfil, aporta:c.aporta,
    pir:c.pir ? c.pir.split(' · ').map(s=>s.split(': ')) : null, img:fotos[id] || A.IMGS[c.img]}; });
}
function kit27(){
  const out = []; const oscuro = h => { const n = parseInt(h.slice(1),16), f = .82; return '#' + [16,8,0].map(s=>Math.round(((n>>s)&255)*f).toString(16).padStart(2,'0')).join(''); };
  KIT.B.forEach(g=>g.notas.forEach(n=>{ const t = KIT.T[n.id]||{}, F = PAL.familias[KIT.F[n.id]]||{n:g.fam};
    out.push({k:n.id, nom:n.n, fam:F.n, col:oscuro(PAL.notas[n.id]||'#7A6E62'), et:g.et, ap:PAL.apodo_cambia[n.id]||n.p, fu:n.f, desc:t.desc, aporta:t.aporta, pir:null, img:KIMG[n.id]}); }));
  return out;
}
(async()=>{
  const b = await chromium.launch(), p = await b.newPage({viewport:{width:W,height:H}});
  await p.route('**/script.google.com/**', r=>r.fulfill({status:200, contentType:'application/json', body:'{"ok":true}'}));
  for(const [nombre, items] of [['domingo', await kitDomingo(p)], ['kit27', kit27()]]){
    const OUT = path.join(AQUI, 'grandes', nombre); fs.rmSync(OUT, {recursive:true, force:true}); fs.mkdirSync(path.join(OUT,'png'), {recursive:true});
    fs.writeFileSync(path.join(OUT,'etiquetas.html'), `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>${items.map(etiqueta).join('')}</body></html>`);
    await p.goto(`http://localhost:8765/etiquetas/grandes/${nombre}/etiquetas.html`); await p.waitForTimeout(1500);
    const files = [];
    for(const [i,x] of items.entries()){ const f = String(i+1).padStart(2,'0') + '_' + x.k + '.png'; await p.locator('#et-'+x.k).screenshot({path:path.join(OUT,'png',f)}); files.push(f); }
    const A3w = 3508, A3h = 4961, mx = (A3w-3*W)/2, my = (A3h-3*H)/2;
    for(let h = 0; h*9 < files.length; h++){
      const it = files.slice(h*9, h*9+9);
      fs.writeFileSync(path.join(OUT,'hoja.html'), `<!doctype html><html><body style="margin:0;width:${A3w}px;height:${A3h}px;background:#fff;position:relative">${it.map((f,i)=>`<img src="png/${f}" style="position:absolute;width:${W}px;height:${H}px;left:${mx+(i%3)*W}px;top:${my+Math.floor(i/3)*H}px">`).join('')}</body></html>`);
      const q = await b.newPage({viewport:{width:A3w,height:A3h}}); await q.goto(`http://localhost:8765/etiquetas/grandes/${nombre}/hoja.html`); await q.waitForTimeout(600);
      await q.screenshot({path:path.join(OUT, `A3_${nombre}_hoja${h+1}.png`)}); await q.close();
    }
    fs.unlinkSync(path.join(OUT,'hoja.html')); console.log(nombre, items.length);
  }
  await b.close();
})();
