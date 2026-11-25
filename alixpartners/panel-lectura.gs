/* ===== PANEL DEL PERFUMISTA: lectura de la planilla =====
   Pegar al FINAL del script (debajo de todo lo que ya hay), en el proyecto donde está doPost.
   Usa la constante PLANILLA_ID que ya está arriba en tu script.
   Si en tu script ya existe una función llamada doGet, borrala antes (solo esa función).
   Después: Implementar → Administrar implementaciones → lápiz → Versión: "Nueva versión" → Implementar.
   Los números de WhatsApp nunca se devuelven al panel. */
const CLAVE_PANEL = '2730';

function doGet(e){
  const p = (e && e.parameter) || {};
  if(p.accion !== 'leer') return salidaPanel({ok:true, mensaje:'Perfume Bar · planilla lista'});
  if(p.clave !== CLAVE_PANEL) return salidaPanel({ok:false, error:'clave'});
  const ss = SpreadsheetApp.openById(PLANILLA_ID);
  const hoja = ss.getSheetByName(p.hoja || '');
  if(!hoja || hoja.getLastRow() < 1) return salidaPanel({ok:true, enc:[], filas:[]});
  const v = hoja.getDataRange().getDisplayValues();
  const enc = v.shift().map(String);
  const sirve = enc.map(h => !/whatsapp/i.test(h));
  return salidaPanel({ok:true, enc: enc.filter((_, i) => sirve[i]), filas: v.map(r => r.filter((_, i) => sirve[i]))});
}
function salidaPanel(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
