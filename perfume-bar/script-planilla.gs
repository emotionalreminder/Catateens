/* Emotional Reminder · Perfume Bar · registro en la planilla "App cata teens"
   Recibe cada perfume desde las apps (celular y tablet) y lo escribe en la pestaña del evento
   (por ejemplo "Cafayate" o "Caro Cuomo"). Sirve para todas las apps que mandan
   {clave, hoja, id, columnas:[[encabezado, valor], ...]}, incluidas las anteriores (Betsson, etc.).

   Qué hace:
   - Crea la pestaña si no existe.
   - Crea solas las columnas que falten (por ejemplo "Peonía · voto" y "Peonía · ml"), al final de la fila 1.
   - Si el ID ya está, actualiza esa fila (no duplica); si no, agrega una fila nueva.

   Cómo instalarlo SIN cambiar el link que usan las apps:
   1. Abrí la planilla "App cata teens" → menú Extensiones → Apps Script.
      (Si el script no está ahí, abrí el proyecto donde lo tengas en script.google.com.)
   2. Guardá una copia del código viejo (seleccionar todo, copiar y pegar en un documento) por las dudas.
   3. Borrá todo, pegá este código y guardá.
   4. Implementar → Administrar implementaciones → lápiz (editar) → Versión: "Nueva versión" → Implementar.
      Así el link /exec sigue siendo el mismo.
   Si este proyecto NO está pegado a la planilla, completá ID_PLANILLA abajo con el ID que aparece en el
   link de la planilla (lo que está entre /d/ y /edit). */
const CLAVE = 'ER-ninas-2026';
const ID_PLANILLA = '';   // vacío = la planilla a la que está pegado este script

function doPost(e){
  const lock = LockService.getScriptLock();
  try{
    lock.waitLock(25000);
    const raw = (e && e.postData && e.postData.contents) || (e && e.parameter && e.parameter.payload) || '';
    let d;
    try{ d = JSON.parse(raw); }catch(err){ d = JSON.parse(e.parameter.payload); }
    if(d.clave !== CLAVE) return salida({ok:false, error:'clave'});
    const ss = ID_PLANILLA ? SpreadsheetApp.openById(ID_PLANILLA) : SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName(d.hoja || 'Sin evento') || ss.insertSheet(d.hoja || 'Sin evento');
    const cols = (d.columnas || []).filter(c => c && c.length >= 2);
    if(!cols.length) return salida({ok:false, error:'sin columnas'});

    /* encabezados: se agregan los que falten */
    let ultimaCol = Math.max(hoja.getLastColumn(), 1);
    let enc = hoja.getRange(1, 1, 1, ultimaCol).getValues()[0].map(String);
    if(enc.every(x => !x)) enc = [];
    const faltan = cols.map(c => String(c[0])).filter(h => enc.indexOf(h) < 0);
    if(faltan.length){
      hoja.getRange(1, enc.length + 1, 1, faltan.length).setValues([faltan]).setFontWeight('bold');
      enc = enc.concat(faltan);
      hoja.setFrozenRows(1);
    }

    /* fila: la del mismo ID, o una nueva */
    const colId = enc.indexOf('ID') + 1;
    const id = String(d.id || (cols.find(c => c[0] === 'ID') || [])[1] || '');
    let fila = 0;
    if(colId && id && hoja.getLastRow() > 1){
      const ids = hoja.getRange(2, colId, hoja.getLastRow() - 1, 1).getValues();
      for(let i = 0; i < ids.length; i++){ if(String(ids[i][0]) === id){ fila = i + 2; break; } }
    }
    if(!fila) fila = hoja.getLastRow() + 1;

    /* se escriben solo las columnas que manda la app; el resto de la fila queda como estaba */
    const actual = fila <= hoja.getLastRow() ? hoja.getRange(fila, 1, 1, enc.length).getValues()[0] : new Array(enc.length).fill('');
    cols.forEach(c => { const k = enc.indexOf(String(c[0])); if(k >= 0) actual[k] = c[1] == null ? '' : c[1]; });
    hoja.getRange(fila, 1, 1, enc.length).setValues([actual]);
    return salida({ok:true, fila:fila});
  }catch(err){
    return salida({ok:false, error:String(err)});
  }finally{
    try{ lock.releaseLock(); }catch(e){}
  }
}
function doGet(){ return salida({ok:true, mensaje:'Perfume Bar · planilla lista'}); }
function salida(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
