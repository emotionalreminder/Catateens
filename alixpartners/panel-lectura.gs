/* Emotional Reminder · Panel del perfumista · lectura de la planilla
   Agrega al script de la planilla (el mismo que ya recibe los perfumes) una función de LECTURA,
   para que el panel de la app (link + #admin) muestre los datos en tiempo real.

   Cómo instalarlo SIN cambiar el link que usan las apps:
   1. Abrí el proyecto de Apps Script de la planilla (el que ya usás: Extensiones → Apps Script).
   2. Buscá si ya existe una función que se llame doGet.
      - Si existe, borrala (solo esa función) y pegá este bloque en su lugar.
      - Si no existe, pegá este bloque al final del archivo.
   3. La clave del panel es 2730 (la misma de siempre).
   4. Si el script NO está pegado a la planilla (lo abriste desde script.google.com y no desde la planilla),
      completá PANEL_ID_PLANILLA con el ID de la planilla (lo que está entre /d/ y /edit en su link).
   5. Guardá. Implementar → Administrar implementaciones → lápiz → Versión: "Nueva versión" → Implementar.
      El link /exec queda igual.

   Seguridad: la clave se verifica acá, en el script, y no está escrita en la app.
   Los números de WhatsApp nunca se devuelven al panel. */
const CLAVE_PANEL = '2730';
const PANEL_ID_PLANILLA = '';   // vacío = la planilla a la que está pegado este script

function doGet(e){
  const p = (e && e.parameter) || {};
  if(p.accion !== 'leer') return salidaPanel({ok:true, mensaje:'Perfume Bar · planilla lista'});
  if(p.clave !== CLAVE_PANEL) return salidaPanel({ok:false, error:'clave'});
  const ss = PANEL_ID_PLANILLA ? SpreadsheetApp.openById(PANEL_ID_PLANILLA) : SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(p.hoja || '');
  if(!hoja || hoja.getLastRow() < 1) return salidaPanel({ok:true, enc:[], filas:[]});
  const v = hoja.getDataRange().getDisplayValues();
  const enc = v.shift().map(String);
  const sirve = enc.map(h => !/whatsapp/i.test(h));
  return salidaPanel({ok:true, enc: enc.filter((_, i) => sirve[i]), filas: v.map(r => r.filter((_, i) => sirve[i]))});
}
function salidaPanel(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
