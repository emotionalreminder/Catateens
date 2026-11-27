// Dos piezas por kit:
//  1) Etiqueta de botella (tipo vino) 20 x 12 cm: adelante la foto grande con nombre y apodo, atrás un resumen.  4 por A3 apaisado.
//  2) Cartel A5 (14,8 x 21 cm) para poner delante de cada nota, con toda la información.  4 por A3.
// Uso: node etiquetas/armar_formatos.js  (con el servidor local en :8765)
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const G = require('./armar_grandes.js'); const AQUI = __dirname;
const BW = 2362, BH = 1417;   // 20 x 12 cm a 300 dpi
const esc = G.esc;
const CSS_B = `body{margin:0;font-family:Montserrat,sans-serif}
 .bo{width:${BW}px;height:${BH}px;background:var(--c);color:#FBF5EA;position:relative;overflow:hidden;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr}
 .bo:before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 25% 40%, rgba(255,255,255,.18), rgba(0,0,0,.22) 70%);pointer-events:none}
 .bo:after{content:'';position:absolute;inset:34px;border:3px solid rgba(251,245,234,.7);pointer-events:none}
 .frente{display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;padding:60px}
 .med{width:760px;height:760px;border-radius:50%;background:radial-gradient(circle, #FBF5EA 58%, rgba(251,245,234,0) 71%);display:flex;align-items:center;justify-content:center}
 .med img{width:82%;height:82%;object-fit:contain}
 .fnom{font-size:150px;font-weight:300;line-height:1;text-align:center;margin-top:10px}
 .fapo{font-size:68px;font-style:italic;font-weight:300;margin-top:16px;opacity:.95}
 .dorso{position:relative;border-left:2px solid rgba(251,245,234,.45);margin:90px 0;display:flex;flex-direction:column;justify-content:center;padding:0 120px}
 .dfam{font-size:46px;letter-spacing:10px;text-transform:uppercase;font-weight:600}
 .det{font-size:40px;letter-spacing:6px;text-transform:uppercase;opacity:.85;margin-top:10px}
 .ddesc{font-size:46px;letter-spacing:6px;font-weight:600;margin-top:44px;line-height:1.4}
 .drow{display:flex;align-items:center;gap:50px;margin-top:50px}
 .dpasos div{font-size:42px;letter-spacing:4px;text-transform:uppercase;line-height:64px;opacity:.5}.dpasos div.on{opacity:1;font-weight:700}
 .dots{display:flex;gap:12px;margin-top:14px}.dots i{width:30px;height:30px;border-radius:50%;border:3px solid #FBF5EA;display:block}.dots i.on{background:#FBF5EA}
 .fl{font-size:32px;letter-spacing:5px;text-transform:uppercase;opacity:.85}
 .dac{margin-top:46px;font-size:36px;line-height:1.45}.dac b{font-size:28px;letter-spacing:4px;text-transform:uppercase;opacity:.8;display:inline-block;width:220px}
 .dlogo{position:absolute;right:120px;bottom:10px;height:120px}`;
function botella(x){
  const pir = G.piramide(x.et).replace('width="150" height="150"','width="200" height="200"');
  return `<div class="bo" id="bo-${x.k}" style="--c:${x.col}">
   <div class="frente"><div class="med"><img src="${x.img}" alt=""></div><div class="fnom" style="${x.nom.length>13?'font-size:118px':''}">${esc(x.nom)}</div><div class="fapo">${esc(x.ap)}</div></div>
   <div class="dorso"><div class="dfam">${esc(x.fam)}</div><div class="det">${esc(G.ETN[x.et])}</div>
     <div class="ddesc">${esc(String(x.desc||'').toUpperCase())}</div>
     <div class="drow">${pir}<div class="dpasos">${[['cima','Salida'],['corazon','Corazón'],['fondo','Fondo']].map(([k,t])=>`<div class="${k===x.et?'on':''}">${t}</div>`).join('')}</div>
       <div><div class="fl">Intensidad ${x.fu} / 9</div><div class="dots">${Array.from({length:9},(_,i)=>`<i class="${i<x.fu?'on':''}"></i>`).join('')}</div></div></div>
     ${x.pir ? `<div class="dac">${x.pir.map(([t,n])=>`<div><b>${esc(t)}</b>${esc(n)}</div>`).join('')}</div>` : ''}
     <img class="dlogo" src="${G.LOGO}" alt=""></div></div>`;
}
/* cartel A5: la misma etiqueta completa, en proporción A5, renderizada en alta (14,8 x 21 cm a 300 dpi = 1748 x 2480) */
const AW = 1063, AH = 1508, ESC_A5 = 1748/1063;
const CSS_A5 = G.CSS.replace(/height:1594px/, `height:${AH}px`).replace('.medalla{width:540px;height:540px;','.medalla{width:500px;height:500px;').replace('.medalla.chica{width:360px;height:360px}','.medalla.chica{width:330px;height:330px}');
(async()=>{
  const b = await chromium.launch(), p = await b.newPage({viewport:{width:1200,height:1200}});
  await p.route('**/script.google.com/**', r=>r.fulfill({status:200, contentType:'application/json', body:'{"ok":true}'}));
  const kits = [['domingo', await G.kitDomingo(p)], ['kit27', G.kit27()]];
  const head = css => `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap" rel="stylesheet"><style>${css}</style></head>`;
  for(const [nombre, items] of kits){
    const OUT = path.join(AQUI, 'formatos', nombre); fs.rmSync(OUT, {recursive:true, force:true});
    ['botella','cartel_A5'].forEach(d=>fs.mkdirSync(path.join(OUT, d), {recursive:true}));
    /* botellas */
    fs.writeFileSync(path.join(OUT,'botellas.html'), head(CSS_B) + `<body>${items.map(botella).join('')}</body></html>`);
    const pb = await b.newPage({viewport:{width:BW,height:BH}}); await pb.goto(`http://localhost:8765/etiquetas/formatos/${nombre}/botellas.html`); await pb.waitForTimeout(1500);
    const fb = []; for(const [i,x] of items.entries()){ const f = String(i+1).padStart(2,'0')+'_'+x.k+'.png'; await pb.locator('#bo-'+x.k).screenshot({path:path.join(OUT,'botella',f)}); fb.push(f); } await pb.close();
    /* carteles A5 */
    fs.writeFileSync(path.join(OUT,'carteles.html'), head(CSS_A5) + `<body>${items.map(G.etiqueta).join('')}</body></html>`);
    const pa = await b.newPage({viewport:{width:AW,height:AH}, deviceScaleFactor:ESC_A5}); await pa.goto(`http://localhost:8765/etiquetas/formatos/${nombre}/carteles.html`); await pa.waitForTimeout(1500);
    const fa = []; for(const [i,x] of items.entries()){ const f = String(i+1).padStart(2,'0')+'_'+x.k+'.png'; await pa.locator('#et-'+x.k).screenshot({path:path.join(OUT,'cartel_A5',f)}); fa.push(f); } await pa.close();
    /* hojas A3: botellas 4 por hoja apaisada (2 x 2), carteles A5 4 por hoja vertical (2 x 2) */
    const hojas = async (dir, files, sw, sh, w, h, pref) => { const mx = (sw-2*w)/2, my = (sh-2*h)/2;
      for(let k = 0; k*4 < files.length; k++){ const it = files.slice(k*4, k*4+4);
        fs.writeFileSync(path.join(OUT,'hoja.html'), `<!doctype html><html><body style="margin:0;width:${sw}px;height:${sh}px;background:#fff;position:relative">${it.map((f,i)=>`<img src="${dir}/${f}" style="position:absolute;width:${w}px;height:${h}px;left:${mx+(i%2)*w}px;top:${my+Math.floor(i/2)*h}px">`).join('')}</body></html>`);
        const q = await b.newPage({viewport:{width:sw,height:sh}}); await q.goto(`http://localhost:8765/etiquetas/formatos/${nombre}/hoja.html`); await q.waitForTimeout(700);
        await q.screenshot({path:path.join(OUT, `${pref}_hoja${k+1}.png`)}); await q.close(); } };
    await hojas('botella', fb, 4961, 3508, BW, BH, `A3_${nombre}_botellas`);
    await hojas('cartel_A5', fa, 3508, 4961, 1748, 2480, `A3_${nombre}_carteles_A5`);
    fs.unlinkSync(path.join(OUT,'hoja.html')); console.log(nombre, items.length);
  }
  await b.close();
})();
