// Etiquetas chicas (37 x 13 mm + 1 mm de sangrado) para los frasquitos de la cata, misma grilla que el archivo original
// (hoja 325 x 475 mm, 7 columnas x 21 filas = 147). Una fila por nota y las 4 filas finales repiten en orden.
// Uso: node etiquetas/nicho/armar_nicho.js  (con el servidor local en :8765)
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const NOTAS = [
 ['S1','Bergamota','Cítrica','Salida','#8E7F24'], ['S2','Grass','Verde','Salida','#3F5A2E'], ['S3','Grosellas','Frutal','Salida','#5E2440'],
 ['S4','Pera','Frutal','Salida','#7C7E2C'], ['S5','Bruma de mar','Ozónica','Salida','#2F5F6B'], ['S6','Especias','Especiada','Salida','#86331C'],
 ['C1','Jazmín','Floral','Corazón','#9C7650'], ['C2','Peonía','Floral','Corazón','#A45E72'], ['C3','Rosa y Especias','Floral especiada','Corazón','#93324E'],
 ['C4','Flor de Higo','Verde frutal','Corazón','#56603E'], ['C5','Aromático','Aromática','Corazón','#4F5D80'],
 ['F1','Base Woody','Amaderada','Fondo','#6B4A2E'], ['F2','Base Musky','Almizclada','Fondo','#766D63'], ['F3','Base Gourmand','Gourmand floral','Fondo','#8A5A3C'],
 ['F4','Tabaco y Pimienta','Especiada','Fondo','#6A3A20'], ['F5','Base Chipre Floral','Chipre floral','Fondo','#844650'], ['F6','Vainilla y Praliné','Gourmand','Fondo','#9C7444']];
const X0 = 56.65, PX = 116.125, Y0 = 62.58, PY = 45.32, W = 110.46, H = 42.48;   // en puntos, igual al archivo original
const celdas = []; NOTAS.forEach(n=>{ for(let c = 0; c < 7; c++) celdas.push(n); });
let i = 0; while(celdas.length < 147) celdas.push(NOTAS[i++ % NOTAS.length]);
const esc = s => String(s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet"><style>
 @page{size:325mm 475mm;margin:0} body{margin:0;width:325mm;height:475mm;position:relative;font-family:Montserrat,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .e{position:absolute;width:${W}pt;height:${H}pt;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#FBF5EA;text-align:center;box-sizing:border-box}
 .e:after{content:'';position:absolute;inset:4.2pt;border:.4pt solid rgba(251,245,234,.55)}
 .n{font-weight:700;font-size:9pt;line-height:1;letter-spacing:.1pt}
 .s{font-weight:600;font-size:3.6pt;letter-spacing:.7pt;text-transform:uppercase;margin-top:2.6pt;opacity:.92}
</style></head><body>${celdas.map((n,k)=>{ const x = X0 + (k%7)*PX, y = Y0 + Math.floor(k/7)*PY;
  return `<div class="e" style="left:${x}pt;top:${y}pt;background:${n[4]}"><div class="n" style="${n[1].length>15?'font-size:8pt':''}">${esc(n[1])}</div><div class="s">${n[0]} · ${esc(n[2])} · ${n[3]}</div></div>`; }).join('')}</body></html>`;
(async()=>{
  fs.writeFileSync(path.join(__dirname,'nicho.html'), html);
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto('http://localhost:8765/etiquetas/nicho/nicho.html'); await p.waitForTimeout(1500);
  await p.pdf({path:path.join(__dirname,'Etiquetas_notas_domingo_37x13mm.pdf'), width:'325mm', height:'475mm', printBackground:true, pageRanges:'1'});
  await b.close(); console.log('ok', celdas.length);
})();
