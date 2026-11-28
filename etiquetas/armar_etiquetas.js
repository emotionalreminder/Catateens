// Genera etiquetas PNG (6 x 9 cm a 300 dpi) para las botellas del Perfume Bar, una por aroma, y una hoja A4 para imprimir.
// Uso: node armar_etiquetas.js  (necesita el servidor local en :8765 sirviendo el repo)
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const AQUI = __dirname, KIT = JSON.parse(fs.readFileSync(path.join(AQUI,'../paraguay/fuente/kit.json'),'utf8'));
const PAL = JSON.parse(fs.readFileSync(path.join(AQUI,'paleta.json'),'utf8'));
const IMG = JSON.parse(fs.readFileSync(path.join(AQUI,'../paraguay/fuente/kit_imgs.json'),'utf8'));
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(AQUI,'../paraguay/fuente/logos/logo_completo.png')).toString('base64');
const ETN = {cima:'Nota de salida', corazon:'Nota de corazón', fondo:'Nota de fondo'};
const W = 709, H = 1063;   // 6 x 9 cm a 300 dpi
const esc = s => String(s==null?'':s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function piramide(et, col){
  const bands = [['cima',0,40],['corazon',40,80],['fondo',80,120]], W2 = 120;
  return `<svg viewBox="0 0 120 120" width="120" height="120">${bands.map(([k,y0,y1])=>{ const x0 = 60*y0/120, x1 = 60*y1/120;
    return `<path d="M${60-x0},${y0} L${60+x0},${y0} L${60+x1},${y1} L${60-x1},${y1} Z" fill="${k===et?col:'#E9E0D2'}" stroke="#F7F2EA" stroke-width="3"/>`; }).join('')}</svg>`;
}
function etiqueta(n, g){
  const t = KIT.T[n.id] || {}, fam = KIT.F[n.id], F = PAL.familias[fam] || {n:g.fam, base:'#7A6E62'}, col = PAL.notas[n.id] || F.base;
  const apodo = PAL.apodo_cambia[n.id] || n.p;
  const pasos = [['cima','Salida'],['corazon','Corazón'],['fondo','Fondo']];
  return `<div class="et" id="et-${n.id}" style="--c:${col}">
    <div class="banda"><span>${esc(F.n)}</span><span>${esc(ETN[g.et])}</span></div>
    <div class="marco">
      <img class="foto" src="${IMG[n.id]}" alt="">
      <div class="nom">${esc(n.n)}</div>
      <div class="apo">${esc(apodo)}</div>
      <div class="desc">${esc(t.desc||'')}</div>
      <div class="linea"></div>
      <div class="pir">${piramide(g.et, col)}<div class="pasos">${pasos.map(([k,tx])=>`<div class="${k===g.et?'on':''}">${tx}</div>`).join('')}</div>
        <div class="fza"><div class="fl">Intensidad</div><div class="dots">${Array.from({length:9},(_,i)=>`<i class="${i<n.f?'on':''}"></i>`).join('')}</div><div class="fl">${n.f}/9</div></div></div>
      <div class="txt">${esc(t.aporta||'')}</div>
      <div class="pie"><img src="${LOGO}" alt=""></div>
    </div></div>`;
}
(async()=>{
  const lista = []; KIT.B.forEach(g=>g.notas.forEach(n=>lista.push([n,g])));
  const css = `body{margin:0;background:#fff;font-family:Montserrat,sans-serif}
  .et{width:${W}px;height:${H}px;background:#F7F2EA;position:relative;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column}
  .banda{height:84px;background:var(--c);color:#FBF7F0;display:flex;justify-content:space-between;align-items:center;padding:0 40px;font-size:19px;letter-spacing:5px;text-transform:uppercase;font-weight:500}
  .marco{flex:1;margin:22px;border:1.5px solid #C2A77A;display:flex;flex-direction:column;align-items:center;padding:14px 34px 10px;position:relative}
  .marco:after{content:'';position:absolute;inset:6px;border:.8px solid rgba(194,167,122,.55);pointer-events:none}
  .foto{width:400px;height:330px;object-fit:contain;margin-top:10px}
  .nom{font-size:62px;font-weight:300;letter-spacing:1px;color:#231C18;margin-top:4px;line-height:1.05;text-align:center}
  .apo{font-size:26px;font-style:italic;font-weight:300;color:var(--c);margin-top:6px}
  .desc{font-size:16px;letter-spacing:3.5px;font-weight:600;color:#231C18;margin-top:12px;text-align:center;line-height:1.5}
  .linea{width:90px;height:2px;background:var(--c);margin:16px 0 14px}
  .pir{display:grid;grid-template-columns:120px auto 1fr;gap:16px;align-items:center;width:100%}
  .pasos div{font-size:17px;color:#A99C8E;letter-spacing:2px;text-transform:uppercase;line-height:40px}
  .pasos div.on{color:var(--c);font-weight:700}
  .fza{text-align:right}.fl{font-size:13px;letter-spacing:2.5px;text-transform:uppercase;color:#7A6E62}
  .dots{display:flex;gap:5px;justify-content:flex-end;margin:6px 0}.dots i{width:13px;height:13px;border-radius:50%;border:1.5px solid var(--c);display:block}.dots i.on{background:var(--c)}
  .txt{font-size:21px;line-height:1.55;color:#3A302A;text-align:center;margin-top:14px;font-weight:400}
  .pie{margin-top:auto;padding-top:8px}.pie img{height:62px;opacity:.9}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap" rel="stylesheet"><style>${css}</style></head><body>${lista.map(([n,g])=>etiqueta(n,g)).join('')}</body></html>`;
  fs.writeFileSync(path.join(AQUI,'etiquetas.html'), html);
  const b = await chromium.launch(), p = await b.newPage({viewport:{width:W,height:H}});
  await p.goto('http://localhost:8765/etiquetas/etiquetas.html'); await p.waitForTimeout(1500);
  fs.mkdirSync(path.join(AQUI,'png'),{recursive:true});
  for(const [n] of lista){ await p.locator('#et-'+n.id).screenshot({path:path.join(AQUI,'png',n.id+'.png')}); }
  /* hojas A4 para imprimir (3 x 3 etiquetas de 6 x 9 cm, con marcas de corte) y la paleta de colores */
  const A4w = 2480, A4h = 3508, mx = (A4w - 3*W)/2, my = (A4h - 3*H)/2;
  for(let h = 0; h*9 < lista.length; h++){
    const items = lista.slice(h*9, h*9+9);
    const pg = `<!doctype html><html><head><style>body{margin:0;width:${A4w}px;height:${A4h}px;background:#fff;position:relative}img{position:absolute;width:${W}px;height:${H}px}
      .c{position:absolute;background:#999}</style></head><body>${items.map(([n],i)=>`<img src="png/${n.id}.png" style="left:${mx+(i%3)*W}px;top:${my+Math.floor(i/3)*H}px">`).join('')}
      ${[0,1,2,3].map(i=>`<div class="c" style="left:${mx+i*W-1}px;top:${my-60}px;width:2px;height:40px"></div><div class="c" style="left:${mx+i*W-1}px;top:${my+3*H+20}px;width:2px;height:40px"></div><div class="c" style="top:${my+i*H-1}px;left:${mx-60}px;height:2px;width:40px"></div><div class="c" style="top:${my+i*H-1}px;left:${mx+3*W+20}px;height:2px;width:40px"></div>`).join('')}</body></html>`;
    fs.writeFileSync(path.join(AQUI,'hoja.html'), pg);
    const q = await b.newPage({viewport:{width:A4w,height:A4h}}); await q.goto('http://localhost:8765/etiquetas/hoja.html'); await q.waitForTimeout(500);
    await q.screenshot({path:path.join(AQUI,'imprimir_A4_hoja'+(h+1)+'.png')}); await q.close();
  }
  const fams = {}; lista.forEach(([n,g])=>{ const f = KIT.F[n.id]; (fams[f] = fams[f] || []).push(n); });
  const pal = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet"><style>body{margin:0;background:#F7F2EA;font-family:Montserrat,sans-serif;color:#231C18;width:1400px}
    .w{padding:60px}h1{font-weight:300;font-size:48px;margin:0}.eb{font-size:16px;letter-spacing:5px;text-transform:uppercase;color:#A4553A;font-weight:600}
    .f{margin-top:34px}.f h2{font-size:18px;letter-spacing:4px;text-transform:uppercase;margin:0 0 12px;display:flex;align-items:center;gap:14px}.f h2 i{width:34px;height:34px;border-radius:50%;display:inline-block}
    .ns{display:flex;flex-wrap:wrap;gap:14px}.n{width:240px;border-radius:14px;overflow:hidden;background:#fff;border:1px solid #E6DCCB}.n div:first-child{height:70px}.n div:last-child{padding:10px 14px;font-size:17px}.n small{display:block;color:#7A6E62;font-size:13px;letter-spacing:1px}</style></head><body><div class="w">
    <div class="eb">Emotional Reminder · Perfume Bar</div><h1>Paleta aromática · 27 notas</h1>
    ${Object.entries(fams).map(([f,ns])=>{ const F = PAL.familias[f]; return `<div class="f"><h2><i style="background:${F.base}"></i>${F.n} <span style="color:#7A6E62;font-weight:400;letter-spacing:1px">${F.base}</span></h2><div class="ns">${ns.map(n=>`<div class="n"><div style="background:${PAL.notas[n.id]}"></div><div>${n.n}<small>${PAL.notas[n.id]}</small></div></div>`).join('')}</div></div>`; }).join('')}</div></body></html>`;
  fs.writeFileSync(path.join(AQUI,'paleta.html'), pal);
  const r = await b.newPage({viewport:{width:1400,height:1000}}); await r.goto('http://localhost:8765/etiquetas/paleta.html'); await r.waitForTimeout(1200);
  await r.screenshot({path:path.join(AQUI,'paleta_colores.png'), fullPage:true});
  await b.close(); console.log('ok', lista.length);
})();
