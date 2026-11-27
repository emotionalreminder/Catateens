/* =====================================================================
   Emotional Reminder · Paraguay · script de la planilla de catas
   Proyecto de Apps Script NUEVO (no es el de las apps de eventos).

   Instalación (una sola vez):
   1. Entrá a script.google.com → "Nuevo proyecto". Ponele de nombre "Emotional Reminder · Paraguay".
   2. Borrá lo que trae, pegá TODO este código y guardá (Ctrl+S).
   3. Arriba, en el desplegable de funciones, elegí "instalar" y tocá "Ejecutar".
      Te pide permisos: aceptalos (es tu cuenta). Crea la planilla "Emotional Reminder · Paraguay"
      en tu Drive y en "Registro de ejecución" te muestra su link.
   4. Implementar → Nueva implementación → tipo "Aplicación web" →
      Ejecutar como: "Yo" · Quién tiene acceso: "Cualquier usuario" → Implementar.
   5. Copiá la URL que termina en /exec y pasásela a Claude para ponerla en la app.

   ACTUALIZAR ESTE SCRIPT (cuando Claude te pase una versión nueva):
   - Ctrl+A, pegá el código nuevo y guardá.
   - Ejecutá "instalar" de nuevo (reutiliza la misma planilla y deja programada la actualización de precios).
   - Implementar → Administrar implementaciones → lápiz → Versión: "Nueva versión" → Implementar (el link /exec no cambia).
   - Probá: abrí el link /exec agregándole  ?accion=probar  al final.

   PRECIOS AUTOMÁTICOS (cada 6 horas):
   - Dólar billete venta del Banco Nación (bna.com.ar). Si la página no responde, usa DolarApi (oficial).
   - Guaraníes por dólar (open.er-api.com).
   - Máquinas Jeane Mortenson: precio sin impuestos nacionales (precio ÷ 1,21) y m³ de cada una.
   Todo queda en la pestaña "Precios". Si escribís un valor en la columna "Manual", ese manda sobre el automático.

   La app manda: {clave, hoja, filas:[{id, columnas:[[encabezado, valor], ...]}, ...]}
   Cada fila con el mismo ID se actualiza (no se duplica). Las columnas que falten se crean solas.
   ===================================================================== */

const CLAVE = 'ER-py-2026';
const NOMBRE_PLANILLA = 'Emotional Reminder · Paraguay';
const PESTANAS = ['Clientes', 'Detalle por aroma', 'Precios'];

/* crea la planilla la primera vez y guarda su ID; las siguientes veces la reutiliza */
function planilla(){
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('PLANILLA_ID');
  if(id){ try{ return SpreadsheetApp.openById(id); }catch(e){} }
  const ss = SpreadsheetApp.create(NOMBRE_PLANILLA);
  PESTANAS.forEach((n, i) => { if(i === 0) ss.getSheets()[0].setName(n); else ss.insertSheet(n); });
  props.setProperty('PLANILLA_ID', ss.getId());
  return ss;
}
function instalar(){
  const ss = planilla();
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'actualizarPrecios').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('actualizarPrecios').timeBased().everyHours(6).create();
  const r = actualizarPrecios();
  Logger.log('Planilla lista: ' + ss.getUrl());
  Logger.log('Precios: ' + JSON.stringify(r));
}

function doPost(e){
  const lock = LockService.getScriptLock();
  try{
    const raw = (e && e.parameter && e.parameter.payload) ? e.parameter.payload : (e && e.postData && e.postData.contents) || '';
    const d = JSON.parse(raw);
    if(d.clave !== CLAVE) return salida({ok:false, error:'clave'});
    const filas = d.filas || (d.columnas ? [{id:d.id, columnas:d.columnas}] : []);
    if(!filas.length) return salida({ok:true, filas:0});
    lock.waitLock(30000);
    const ss = planilla();
    const sh = ss.getSheetByName(d.hoja || 'Clientes') || ss.insertSheet(d.hoja || 'Clientes');

    /* encabezados: se agregan al final los que falten */
    let head = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
    if(head.every(h => !h)) head = [];
    const faltan = [];
    filas.forEach(f => f.columnas.forEach(c => { const h = String(c[0]); if(head.indexOf(h) < 0 && faltan.indexOf(h) < 0) faltan.push(h); }));
    if(faltan.length){
      sh.getRange(1, head.length + 1, 1, faltan.length).setValues([faltan]).setFontWeight('bold');
      head = head.concat(faltan);
      sh.setFrozenRows(1);
    }

    /* IDs que ya están, para actualizar en lugar de duplicar */
    const colId = head.indexOf('ID') + 1, porId = {};
    if(colId && sh.getLastRow() > 1){
      sh.getRange(2, colId, sh.getLastRow() - 1, 1).getValues().forEach((r, i) => { porId[String(r[0])] = i + 2; });
    }
    let proxima = sh.getLastRow() + 1;
    filas.forEach(f => {
      const id = String(f.id || '');
      const fila = (id && porId[id]) || proxima++;
      if(id) porId[id] = fila;
      const actual = fila <= sh.getLastRow() ? sh.getRange(fila, 1, 1, head.length).getValues()[0] : new Array(head.length).fill('');
      f.columnas.forEach(c => { const k = head.indexOf(String(c[0])); if(k >= 0) actual[k] = c[1] == null ? '' : c[1]; });
      const w = head.indexOf('WhatsApp'); if(w >= 0) sh.getRange(fila, w + 1).setNumberFormat('@');
      sh.getRange(fila, 1, 1, head.length).setValues([actual]);
    });
    return salida({ok:true, filas:filas.length});
  }catch(err){
    return salida({ok:false, error:String(err)});
  }finally{
    try{ lock.releaseLock(); }catch(e){}
  }
}
/* ======================= PRECIOS AUTOMÁTICOS ======================= */
const MAQUINAS_CONOCIDAS = {windsor:3000, edimburgo:200, cardiff:100, balmoral:50};   /* m³ por si la web no los informa */
const num = t => parseFloat(String(t).replace(/\./g, '').replace(',', '.'));
function bajar(url){ const r = UrlFetchApp.fetch(url, {muteHttpExceptions:true, followRedirects:true, headers:{'User-Agent':'Mozilla/5.0'}}); return r.getResponseCode() < 400 ? r.getContentText() : ''; }

function dolarBNA(){
  try{
    const html = bajar('https://www.bna.com.ar/Personas');
    const m = html.match(/Dolar U\.S\.A\s*<\/td>\s*<td[^>]*>\s*([\d.,]+)\s*<\/td>\s*<td[^>]*>\s*([\d.,]+)/i);   /* la primera tabla es "Billetes" */
    if(m) return {compra:num(m[1]), venta:num(m[2]), fuente:'Banco Nación (billetes)'};
  }catch(e){}
  try{
    const j = JSON.parse(bajar('https://dolarapi.com/v1/dolares/oficial'));
    if(j && j.venta) return {compra:j.compra, venta:j.venta, fuente:'DolarApi (oficial)'};
  }catch(e){}
  return null;
}
function guaranies(){
  try{ const j = JSON.parse(bajar('https://open.er-api.com/v6/latest/USD')); if(j && j.rates && j.rates.PYG) return j.rates.PYG; }catch(e){}
  return null;
}
function maquinasJM(){
  const out = {};
  /* 1º: la API pública de la tienda (WooCommerce) */
  try{
    const l = JSON.parse(bajar('https://jeanemortenson.com/wp-json/wc/store/v1/products?per_page=100'));
    (l || []).forEach(p => {
      const nom = String(p.name || '').trim(), k = nom.toLowerCase();
      if(!(k in MAQUINAS_CONOCIDAS)) return;
      const pr = p.prices || {}, dec = Number(pr.currency_minor_unit || 0), con = Number(pr.price) / Math.pow(10, dec);
      const desc = String(p.short_description || '') + ' ' + String(p.description || ''), m3 = desc.match(/([\d.]+)\s*m(³|3)/i);
      out[k] = {nombre:nom, con:con, sin:Math.round(con / 1.21 * 100) / 100, m3: m3 ? num(m3[1]) : MAQUINAS_CONOCIDAS[k], url:p.permalink || ''};
    });
  }catch(e){}
  /* 2º: si falta alguna, se lee la página de la tienda */
  if(Object.keys(out).length < 4){
    try{
      const html = bajar('https://jeanemortenson.com/e-shop/').replace(/&nbsp;|&#8239;/g, ' ');
      Object.keys(MAQUINAS_CONOCIDAS).forEach(k => {
        if(out[k]) return;
        const i = html.toLowerCase().indexOf('>' + k); if(i < 0) return;
        const tramo = html.slice(i, i + 4000);
        const sin = tramo.match(/sin impuestos nacionales:?\s*(?:<[^>]+>\s*)*\$?\s*(?:<[^>]+>\s*)*([\d.]+,\d{2})/i);
        const con = tramo.match(/\$\s*(?:<[^>]+>\s*)*([\d.]+,\d{2})/);
        if(sin || con){ const vc = con ? num(con[1]) : null, vs = sin ? num(sin[1]) : Math.round(vc / 1.21 * 100) / 100;
          out[k] = {nombre:k.charAt(0).toUpperCase() + k.slice(1), con:vc, sin:vs, m3:MAQUINAS_CONOCIDAS[k], url:'https://jeanemortenson.com/e-shop/'}; }
      });
    }catch(e){}
  }
  return out;
}

/* guarda todo en la pestaña "Precios": Clave · Valor automático · Manual · Fecha · Fuente · Detalle */
function actualizarPrecios(){
  const ss = planilla(), sh = ss.getSheetByName('Precios') || ss.insertSheet('Precios');
  if(sh.getLastRow() < 1) sh.getRange(1, 1, 1, 6).setValues([['Clave','Valor automático','Manual','Actualizado','Fuente','Detalle']]).setFontWeight('bold');
  const ahora = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');
  const filas = {}; if(sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach((r, i) => filas[String(r[0])] = i + 2);
  const poner = (clave, valor, fuente, detalle) => {
    if(valor == null || isNaN(valor)) return;
    const f = filas[clave] || (filas[clave] = sh.getLastRow() + 1);
    sh.getRange(f, 1).setValue(clave); sh.getRange(f, 2).setValue(valor); sh.getRange(f, 4, 1, 3).setValues([[ahora, fuente, detalle || '']]);
  };
  const d = dolarBNA(); if(d){ poner('dolar_venta', d.venta, d.fuente, 'compra ' + d.compra); }
  const g = guaranies(); poner('guaranies_por_dolar', g, 'open.er-api.com', '');
  const mq = maquinasJM();
  Object.keys(mq).forEach(k => { const m = mq[k]; poner('maquina_' + k, m.sin, 'jeanemortenson.com', `${m.nombre} · ${m.m3} m³ · con impuestos $ ${m.con} · ${m.url}`); poner('maquina_' + k + '_m3', m.m3, 'jeanemortenson.com', ''); });
  return {dolar:d, guaranies:g, maquinas:mq};
}
/* lo que lee la app: valor manual si existe, si no el automático */
function precios(){
  const sh = planilla().getSheetByName('Precios'); const o = {};
  if(sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().forEach(r => {
    const v = r[2] !== '' && r[2] != null ? Number(r[2]) : Number(r[1]); if(!isNaN(v)) o[String(r[0])] = v; o['_fecha_' + r[0]] = String(r[3]); });
  return o;
}

function doGet(e){
  const p = (e && e.parameter) || {};
  if(p.accion === 'precios') return salida({ok:true, precios:precios()});
  if(p.accion === 'probar'){ const r = actualizarPrecios(); return salida({ok:true, leido:r, precios:precios()}); }
  return salida({ok:true, mensaje:'Emotional Reminder · Paraguay · planilla lista'});
}
function salida(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
