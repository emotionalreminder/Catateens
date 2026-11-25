/* =====================================================================
   Emotional Reminder · Script de la planilla (todas las apps)
   - doPost: recibe cada registro de las apps (celular, tablet, entregas) y lo escribe
             en la pestaña del evento. Sirve para Niñas, Betsson, Cafayate, Caro Cuomo,
             AlixPartners y los eventos que vengan.
   - doGet:  el panel del perfumista (link + #admin) lee la pestaña con la clave del panel.
             Los números de WhatsApp nunca se devuelven al panel.
   Formato que mandan las apps: {clave, hoja, id, columnas:[[encabezado, valor], ...]}
   ===================================================================== */

const CLAVE = 'ER-ninas-2026';          // la misma que usan las apps para guardar
const HOJA = 'Niñas';                   // pestaña por defecto si una app no manda "hoja"
const PLANILLA_ID = 'PEGAR-ACA-EL-ID';  // ⚠ reemplazar por el ID de tu planilla (copialo de tu script viejo, línea 3)
const CLAVE_PANEL = '2730';             // clave para entrar al panel del perfumista

/* ---------- guardar (apps → planilla) ---------- */
function doPost(e){
  const lock = LockService.getScriptLock();
  try{
    const raw = (e && e.parameter && e.parameter.payload) ? e.parameter.payload : (e && e.postData && e.postData.contents) || '';
    const d = JSON.parse(raw);
    if(d.clave !== CLAVE) return salida({ok:false, error:'clave'});
    const cols = (d.columnas || []).filter(c => c && c.length >= 2);
    if(!cols.length) return salida({ok:false, error:'sin columnas'});

    lock.waitLock(30000);
    const ss = SpreadsheetApp.openById(PLANILLA_ID);
    const nombreHoja = d.hoja || HOJA;
    const sh = ss.getSheetByName(nombreHoja) || ss.insertSheet(nombreHoja);

    /* encabezados: se agregan al final los que falten */
    let head = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
    if(head.every(h => !h)) head = [];
    const faltan = cols.map(c => String(c[0])).filter((h, i, a) => head.indexOf(h) < 0 && a.indexOf(h) === i);
    if(faltan.length){
      sh.getRange(1, head.length + 1, 1, faltan.length).setValues([faltan]).setFontWeight('bold');
      head = head.concat(faltan);
      sh.setFrozenRows(1);
    }

    /* fila: la del mismo ID (se actualiza, no se duplica) o una nueva */
    const id = String(d.id || (cols.find(c => c[0] === 'ID') || [])[1] || '');
    const colId = head.indexOf('ID') + 1;
    let fila = 0;
    if(id && colId && sh.getLastRow() > 1){
      const ids = sh.getRange(2, colId, sh.getLastRow() - 1, 1).getValues();
      for(let i = 0; i < ids.length; i++){ if(String(ids[i][0]) === id){ fila = i + 2; break; } }
    }
    if(!fila) fila = sh.getLastRow() + 1;

    /* se escriben solo las columnas que manda la app; el resto de la fila queda como estaba */
    const actual = fila <= sh.getLastRow() ? sh.getRange(fila, 1, 1, head.length).getValues()[0] : new Array(head.length).fill('');
    cols.forEach(c => { const k = head.indexOf(String(c[0])); if(k >= 0) actual[k] = c[1] == null ? '' : c[1]; });
    /* el WhatsApp va como texto, para que no se convierta en número ni pierda el + */
    const wcol = head.indexOf('WhatsApp');
    if(wcol >= 0) sh.getRange(fila, wcol + 1).setNumberFormat('@');
    sh.getRange(fila, 1, 1, head.length).setValues([actual]);
    return salida({ok:true, fila:fila});
  }catch(err){
    return salida({ok:false, error:String(err)});
  }finally{
    try{ lock.releaseLock(); }catch(e){}
  }
}

/* ---------- leer (planilla → panel del perfumista) ---------- */
function doGet(e){
  const p = (e && e.parameter) || {};
  if(p.accion !== 'leer') return salida({ok:true, mensaje:'Perfume Bar · planilla lista'});
  if(p.clave !== CLAVE_PANEL) return salida({ok:false, error:'clave'});
  const hoja = SpreadsheetApp.openById(PLANILLA_ID).getSheetByName(p.hoja || '');
  if(!hoja || hoja.getLastRow() < 1) return salida({ok:true, enc:[], filas:[]});
  const v = hoja.getDataRange().getDisplayValues();
  const enc = v.shift().map(String);
  const sirve = enc.map(h => !/whatsapp/i.test(h));
  return salida({ok:true, enc: enc.filter((_, i) => sirve[i]), filas: v.map(r => r.filter((_, i) => sirve[i]))});
}

function salida(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
