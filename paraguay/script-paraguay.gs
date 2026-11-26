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

   La app manda: {clave, hoja, filas:[{id, columnas:[[encabezado, valor], ...]}, ...]}
   Cada fila con el mismo ID se actualiza (no se duplica). Las columnas que falten se crean solas.
   ===================================================================== */

const CLAVE = 'ER-py-2026';
const NOMBRE_PLANILLA = 'Emotional Reminder · Paraguay';
const PESTANAS = ['Clientes', 'Detalle por aroma'];

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
function instalar(){ const ss = planilla(); Logger.log('Planilla lista: ' + ss.getUrl()); }

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
function doGet(){ return salida({ok:true, mensaje:'Emotional Reminder · Paraguay · planilla lista'}); }
function salida(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
