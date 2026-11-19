/* Perfume Bar · guarda en Google Drive las imágenes que hacen las tablets.
   Cómo instalarlo (una sola vez):
   1. Entrá a script.google.com con la cuenta de Emotional Reminder → "Nuevo proyecto".
   2. Borrá lo que aparece, pegá todo este código y guardá.
   3. "Implementar" → "Nueva implementación" → tipo "Aplicación web".
      Ejecutar como: Yo · Quién tiene acceso: Cualquier persona → "Implementar" y autorizá los permisos.
   4. Copiá la URL que termina en /exec y cargala en el panel ⚙ de cada tablet (o pasásela a Claude).
   Las imágenes quedan en la carpeta "VJ Cafayate" de tu Drive (se crea sola). */
const CLAVE = 'ER-ninas-2026';

function doPost(e){
  const lock = LockService.getScriptLock();
  try{
    lock.waitLock(20000);
    const raw = (e.postData && e.postData.contents) || (e.parameter && e.parameter.payload);
    const d = JSON.parse(raw);
    if(d.clave !== CLAVE) return salida({ok:false, error:'clave'});
    const carpeta = obtenerCarpeta(d.carpeta || 'VJ Cafayate');
    /* si la imagen ya está (la tablet la reenvió), no la duplica */
    if(!carpeta.getFilesByName(d.nombre).hasNext()){
      const blob = Utilities.newBlob(Utilities.base64Decode(d.data), d.mime || 'image/jpeg', d.nombre);
      carpeta.createFile(blob);
    }
    return salida({ok:true});
  }catch(err){
    return salida({ok:false, error:String(err)});
  }finally{
    lock.releaseLock();
  }
}
function doGet(){ return salida({ok:true, mensaje:'Perfume Bar · Drive listo'}); }
function obtenerCarpeta(nombre){
  const it = DriveApp.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : DriveApp.createFolder(nombre);
}
function salida(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
