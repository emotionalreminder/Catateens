/* ======================= PANELES: Achu (clientes y agenda) y Emotional Reminder (administración) =======================
   Achu: ve sus clientes, lo que les gustó, la agenda y los presupuestos publicados SIN precios (salvo que el admin muestre el total).
   Emotional Reminder: con clave (la verifica el script). Ve todo, arma presupuestos tildando productos y los publica. */
const MAQ_IMG = __MAQUINAS__;
let REM = {achu:null, admin:null, cargando:false, error:''};
let UI = Object.assign({tab:'clientes', cli:'', atab:'agenda', pres:null, mes:''}, LS.get(CONFIG.LS+'_ui', {}));
const guardarUI = () => LS.set(CONFIG.LS+'_ui', {tab:UI.tab, cli:UI.cli, atab:UI.atab, mes:UI.mes});
const claveAdmin = () => { try{ return sessionStorage.getItem('er_py_admin') || ''; }catch(e){ return ''; } };
const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const fechaLarga = iso => { const d = new Date(iso + 'T12:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('es-AR', {weekday:'long', day:'numeric', month:'long'}); };
const fmtU = x => 'US$ ' + (Math.round(x*100)/100).toLocaleString('es-AR', {minimumFractionDigits:0, maximumFractionDigits:0});
const fmtG = x => '₲ ' + Math.round(x).toLocaleString('es-PY');

/* envío genérico a la planilla (usa la misma cola que la cata: si no hay señal, sale después) */
function enviarFilas(hoja, filas, admin){
  const body = {clave:CONFIG.CLAVE, hoja, filas}; if(admin) body.claveAdmin = claveAdmin();
  const cola = LS.get(CONFIG.LS+'_cola',[]); cola.push({tipo:'gen', id:'g-'+uid(), t:Date.now(), body}); LS.set(CONFIG.LS+'_cola', cola); vaciar();
}
const fila = (id, obj) => ({id, columnas:[['ID',id], ...Object.entries(obj)]});

async function cargar(quien){
  if(!CONFIG.SCRIPT_URL.startsWith('http')) return;
  REM.cargando = true; REM.error = '';
  try{
    const clave = quien==='admin' ? claveAdmin() : CONFIG.CLAVE;
    const j = await (await fetch(`${CONFIG.SCRIPT_URL}?accion=${quien}&clave=${encodeURIComponent(clave)}&t=${Date.now()}`)).json();
    if(!j.ok){ if(quien==='admin' && j.error==='clave'){ try{ sessionStorage.removeItem('er_py_admin'); }catch(e){} REM.error = 'Clave incorrecta.'; }
      else REM.error = j.error==='clave' ? 'Falta actualizar el script de la planilla.' : (j.error || 'Error'); }
    else { REM[quien] = j; if(quien==='achu') LS.set(CONFIG.LS+'_achu', j); }
  }catch(e){ REM.error = 'Sin conexión con la planilla.'; if(quien==='achu' && !REM.achu) REM.achu = LS.get(CONFIG.LS+'_achu', null); }
  REM.cargando = false; if(['achu','achu_cli','admin','admin_cli','admin_pres'].includes(P.paso)) pintar();
}

/* ---------- clientes (planilla + precargados) ---------- */
function clientesDe(d){
  const out = [], vistos = {};
  (d && d.clientes || []).forEach(c=>{ const k = c['Código'] || c['ID']; if(!k || vistos[k]) return; vistos[k] = 1;
    out.push({k, nombre:c['Cliente']||'', wa:c['WhatsApp']||'', ciudad:c['Ciudad']||'', tipo:c['Tipo']||'', m2:c['Metros cuadrados']||'', busca:c['Qué busca']||'',
      fecha:c['Fecha']||'', estado:c['Estado']||'', notas:c['Notas favoritas']||'', perfumes:c['Perfumes favoritos']||'', emociones:c['Emociones principales']||'',
      familias:c['Familias olfativas']||'', usa:c['Perfumes que usa']||'', obs:c['Observaciones de la vendedora']||'', fila:c}); });
  CLIENTES.forEach(c=>{ if(!out.some(x=>nz(x.nombre)===nz(c.nombre))) out.push({k:'pre:'+c.id, nombre:c.nombre, wa:c.wa||'', ciudad:c.ciudad, tipo:(TIPOS.find(t=>t[0]===c.tipo)||[])[2]||'',
    m2:c.m2||'', busca:c.busca, fecha:c.fecha, estado:'Precargado', notas:'', perfumes:'', emociones:'', familias:'', usa:c.usa, pre:c.id}); });
  return out;
}
const presDe = (d, cli) => (d && d.presupuestos || []).filter(p=>p['Clave cliente']===cli.k || nz(p['Cliente'])===nz(cli.nombre));
const visitasDe = (d, cli) => (d && d.agenda || []).filter(v=>v['Clave cliente']===cli.k || nz(v['Cliente'])===nz(cli.nombre));

/* ---------- agenda (compartida) ---------- */
function vAgenda(d, quien){
  const ag = (d && d.agenda || []).filter(v=>v['Estado']!=='Cancelada').sort((a,b)=>(a['Fecha']+a['Hora']).localeCompare(b['Fecha']+b['Hora']));
  const base = UI.mes || hoyISO().slice(0,7), [yy, mm] = base.split('-').map(Number), primero = new Date(yy, mm-1, 1), dias = new Date(yy, mm, 0).getDate();
  const off = (primero.getDay()+6)%7, cuenta = {}; ag.forEach(v=>{ cuenta[v['Fecha']] = (cuenta[v['Fecha']]||0) + 1; });
  const celdas = Array.from({length:off}, ()=>'<span></span>').concat(Array.from({length:dias}, (_,i)=>{ const iso = `${base}-${String(i+1).padStart(2,'0')}`;
    return `<button class="dia ${iso===hoyISO()?'hoy':''} ${cuenta[iso]?'con':''}" onclick="document.getElementById('v_fecha').value='${iso}';document.getElementById('v_fecha').scrollIntoView({block:'center'})">${i+1}${cuenta[iso]?`<i>${cuenta[iso]}</i>`:''}</button>`; }));
  const mesTxt = primero.toLocaleDateString('es-AR', {month:'long', year:'numeric'});
  const mover = n => { const d2 = new Date(yy, mm-1+n, 1); return d2.getFullYear() + '-' + String(d2.getMonth()+1).padStart(2,'0'); };
  const prox = ag.filter(v=>v['Fecha'] >= hoyISO()), porDia = {}; prox.forEach(v=>(porDia[v['Fecha']] = porDia[v['Fecha']] || []).push(v));
  const clis = clientesDe(d);
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><button class="mini" onclick="UI.mes='${mover(-1)}';guardarUI();pintar()">‹</button>
      <b style="text-transform:capitalize;font-weight:500">${mesTxt}</b><button class="mini" onclick="UI.mes='${mover(1)}';guardarUI();pintar()">›</button></div>
      <div class="cal">${['L','M','M','J','V','S','D'].map(x=>`<span class="cab">${x}</span>`).join('')}${celdas.join('')}</div></div>
    <h2>Próximas visitas</h2>
    ${Object.keys(porDia).length ? Object.entries(porDia).map(([f, l])=>`<div class="eb" style="margin-top:12px;text-transform:capitalize">${fechaLarga(f)}</div>${l.map(v=>`<div class="card vis">
      <b>${esc(v['Hora']||'')}</b><div><div style="font-weight:600">${esc(v['Cliente'])}</div><div class="sub" style="font-size:13px">${esc([v['Lugar'], v['Nota']].filter(Boolean).join(' · '))}</div>
      <div class="sub" style="font-size:12px">Cargó: ${esc(v['Cargado por']||'')}</div></div><button class="mini" onclick="cancelarVisita('${esc(v['ID'])}','${quien}')" aria-label="Cancelar">✕</button></div>`).join('')}`).join('') : '<p class="sub">No hay visitas agendadas.</p>'}
    <h2>Agendar visita</h2>
    <div class="card">
      <div class="fld"><label for="v_cli">Cliente</label><input id="v_cli" list="v_lista" placeholder="Nombre del cliente"><datalist id="v_lista">${clis.map(c=>`<option value="${esc(c.nombre)}">`).join('')}</datalist></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="fld"><label for="v_fecha">Fecha</label><input id="v_fecha" type="date" value="${hoyISO()}"></div>
      <div class="fld"><label for="v_hora">Hora</label><input id="v_hora" type="time" value="10:00"></div></div>
      <div class="fld"><label for="v_lugar">Lugar</label><input id="v_lugar" placeholder="Dirección o videollamada"></div>
      <div class="fld"><label for="v_nota">Nota</label><input id="v_nota" placeholder="Qué se va a hacer: cata, entrega, presupuesto…"></div>
      <button class="btn" onclick="agendar('${quien}')">Agendar</button></div>`;
}
function agendar(quien){
  const v = id => (document.getElementById(id)||{}).value || '', nom = v('v_cli').trim(); if(!nom || !v('v_fecha')){ aviso('Completá cliente y fecha'); return; }
  const d = REM[quien], cli = clientesDe(d).find(c=>nz(c.nombre)===nz(nom)), id = 'ag-' + uid();
  const o = {'Cliente':nom, 'Clave cliente':cli ? cli.k : '', 'Fecha':v('v_fecha'), 'Hora':v('v_hora'), 'Lugar':v('v_lugar'), 'Nota':v('v_nota'), 'Estado':'Pendiente',
    'Cargado por': quien==='admin' ? 'Emotional Reminder' : CONFIG.VENDEDORA, 'Creado':new Date().toLocaleString('es-PY')};
  enviarFilas('Agenda', [fila(id, o)], quien==='admin');
  if(d){ d.agenda = (d.agenda||[]).concat([Object.assign({ID:id}, o)]); }
  aviso('Visita agendada'); pintar();
}
function cancelarVisita(id, quien){
  if(!confirm('¿Cancelar esta visita?')) return; const d = REM[quien];
  enviarFilas('Agenda', [fila(id, {'Estado':'Cancelada'})], quien==='admin');
  if(d) d.agenda = (d.agenda||[]).map(v=>v['ID']===id ? Object.assign({}, v, {Estado:'Cancelada'}) : v); pintar();
}

/* ---------- panel de Achu ---------- */
function tabsArriba(){
  const en = P.paso.startsWith('achu') ? 'achu' : P.paso.startsWith('admin') ? 'admin' : 'cata';
  return `<div class="chips" style="margin:0 0 14px"><button aria-pressed="${en==='cata'}" onclick="ir(P.ultimo||'cliente')">Cata</button>
    <button aria-pressed="${en==='achu'}" onclick="if(!P.paso.startsWith('a')) P.ultimo=P.paso; ir('achu')">${esc(CONFIG.VENDEDORA)}</button>
    <button aria-pressed="${en==='admin'}" onclick="if(!P.paso.startsWith('a')) P.ultimo=P.paso; ir('admin')">Emotional Reminder</button></div>`;
}
function vAchu(){
  if(!REM.achu && !REM.cargando) cargar('achu');
  const d = REM.achu; fijo(UI.tab==='clientes' ? `<button class="btn dark" onclick="ir('achu_nuevo')">+ Cargar cliente</button>` : '');
  const clis = clientesDe(d).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
  return `<div class="eb">Panel de ${esc(CONFIG.VENDEDORA)}</div><h1>${UI.tab==='clientes' ? 'Clientes' : 'Agenda'}</h1>
    <div class="chips" style="margin:6px 0 12px"><button aria-pressed="${UI.tab==='clientes'}" onclick="UI.tab='clientes';guardarUI();pintar()">Clientes</button><button aria-pressed="${UI.tab==='agenda'}" onclick="UI.tab='agenda';guardarUI();pintar()">Agenda</button>
      <button onclick="cargar('achu')" aria-label="Actualizar">↻</button></div>
    ${REM.error ? `<div class="aviso">${esc(REM.error)}</div>` : ''}${REM.cargando && !d ? '<p class="sub">Cargando…</p>' : ''}
    ${UI.tab==='agenda' ? vAgenda(d, 'achu') : clis.map(c=>{ const pr = presDe(d, c).length;
      return `<button class="card" style="display:block;width:100%;text-align:left;margin-top:10px" onclick="UI.cli='${esc(c.k)}';guardarUI();ir('achu_cli')">
        <div class="eb">${esc([c.tipo, c.ciudad].filter(Boolean).join(' · '))}</div><div style="font-size:21px;font-weight:300;margin-top:3px">${esc(c.nombre)}</div>
        <div class="sub" style="font-size:13px">${esc(c.estado)}${pr ? ' · 📄 presupuesto listo' : ''}</div></button>`; }).join('')}`;
}
function vAchuNuevo(){
  fijo(`<button class="btn ghost" onclick="ir('achu')">Volver</button><button class="btn" onclick="guardarCliente()">Guardar cliente</button>`);
  return `<div class="eb">Panel de ${esc(CONFIG.VENDEDORA)}</div><h1>Cargar cliente</h1>
    <div class="fld"><label for="n_nom">Nombre y apellido</label><input id="n_nom"></div>
    <div class="fld"><label for="n_wa">WhatsApp</label><input id="n_wa" type="tel" placeholder="+595 9xx xxx xxx"></div>
    <div class="fld"><label for="n_ciudad">Ciudad</label><input id="n_ciudad" value="Asunción"></div>
    <div class="fld"><label for="n_tipo">Qué busca</label><select id="n_tipo">${TIPOS.map(t=>`<option value="${t[0]}">${t[2]}</option>`).join('')}</select></div>
    <div class="fld"><label for="n_busca">Nota</label><textarea id="n_busca" rows="3" placeholder="Qué le interesa, qué usa hoy, cómo la conociste…"></textarea></div>`;
}
function guardarCliente(){
  const v = id => (document.getElementById(id)||{}).value || ''; if(!v('n_nom').trim()){ aviso('Falta el nombre'); return; }
  const id = uid(), cod = codigo(), o = {'Código':cod, 'Fecha':new Date().toLocaleString('es-PY'), 'Última actualización':new Date().toLocaleString('es-PY'), 'Estado':'Cargado (sin cata)',
    'Vendedora':CONFIG.VENDEDORA, 'Cliente':v('n_nom').trim(), 'WhatsApp':v('n_wa').trim(), 'Ciudad':v('n_ciudad').trim(), 'Tipo':(TIPOS.find(t=>t[0]===v('n_tipo'))||[])[2]||'', 'Qué busca':v('n_busca').trim()};
  enviarFilas('Clientes', [fila(id, o)]);
  if(REM.achu) REM.achu.clientes = (REM.achu.clientes||[]).concat([Object.assign({ID:id}, o)]);
  UI.cli = cod; guardarUI(); aviso('Cliente cargado'); ir('achu_cli');
}
function bloqueGustos(c){
  return `${c.emociones ? `<h2>Lo que más le hizo sentir</h2><div class="card" style="font-weight:300;font-size:20px;text-align:center">${esc(c.emociones.split(', ').join(' · '))}</div>` : ''}
    ${c.notas ? `<h2>Notas que le encantaron</h2><p>${esc(c.notas)}</p>` : ''}${c.perfumes ? `<h2>Perfumes que le encantaron</h2><p>${esc(c.perfumes)}</p>` : ''}
    ${c.familias ? `<h2>Familias olfativas</h2><p>${esc(c.familias)}</p>` : ''}`;
}
function vAchuCli(){
  const d = REM.achu, c = clientesDe(d).find(x=>x.k===UI.cli); if(!c){ ir('achu'); return ''; }
  fijo(`<button class="btn ghost" onclick="ir('achu')">Volver</button><button class="btn" onclick="cataDe('${esc(c.k)}','achu')">${c.pre ? 'Cata sugerida' : 'Empezar cata'}</button>`);
  const pres = presDe(d, c), vis = visitasDe(d, c).filter(v=>v['Estado']!=='Cancelada');
  return `<div class="eb">${esc([c.tipo, c.ciudad].filter(Boolean).join(' · '))}</div><h1>${esc(c.nombre)}</h1>
    <div class="card"><dl class="tec">${[['WhatsApp',c.wa],['Espacio',c.m2 && c.m2+' m²'],['Hoy usa',c.usa],['Nota',c.busca],['Estado',c.estado]].filter(x=>x[1]).map(([a,b])=>`<dt>${a}</dt><dd>${esc(b)}</dd>`).join('')}</dl></div>
    ${bloqueGustos(c)}
    <h2>Presupuesto</h2>${pres.length ? pres.map(p=>`<div class="card"><div class="eb">${esc(p['Fecha'])}</div><div style="white-space:pre-line;margin-top:6px">${esc(p['Resumen'])}</div>
      ${p['Total'] ? `<div style="margin-top:10px;font-weight:600">Total: ${esc(p['Total'])}</div>` : `<p class="sub" style="font-size:13px;margin-top:8px">El precio te lo pasa Emotional Reminder.</p>`}</div>`).join('') : '<p class="sub">Todavía no hay presupuesto. Emotional Reminder lo prepara con la cata.</p>'}
    <h2>Visitas</h2>${vis.length ? vis.map(v=>`<div class="card vis"><b>${esc(v['Hora']||'')}</b><div style="text-transform:capitalize">${fechaLarga(v['Fecha'])}<div class="sub" style="font-size:13px;text-transform:none">${esc([v['Lugar'],v['Nota']].filter(Boolean).join(' · '))}</div></div></div>`).join('') : '<p class="sub">Sin visitas.</p>'}
    <button class="btn ghost" style="margin-top:14px" onclick="UI.tab='agenda';guardarUI();ir('achu');setTimeout(()=>{const i=document.getElementById('v_cli');if(i){i.value=${JSON.stringify(c.nombre).replace(/"/g,'&quot;')};i.scrollIntoView({block:'center'});}},50)">Agendar visita</button>`;
}
function cataDe(k, quien){
  const d = REM[quien], c = clientesDe(d).find(x=>x.k===k); if(!c) return;
  if(c.pre){ cataSugerida(c.pre); return; }
  if(P.nom.trim() && P.est && P.est !== 'Terminó' && !confirm('Hay una cata en curso. ¿Empezar la de ' + c.nombre + '?')) return;
  P = nuevo(); P.nom = c.nombre; P.wa = c.wa; P.ciudad = c.ciudad; P.busca = c.busca; P.tipo = (TIPOS.find(t=>t[2]===c.tipo)||[])[0] || ''; if(c.fila && c.fila['Código']) P.cod = c.fila['Código'];
  guardar(); ir('cliente');
}

/* ---------- panel Emotional Reminder (administración) ---------- */
function vAdmin(){
  if(!claveAdmin()){ fijo('');
    return `<div class="eb">Administración</div><h1>Emotional Reminder</h1><p class="sub">Panel del perfumista: costos, presupuestos, clientes y agenda.</p>
      <div class="fld"><label for="adm_k">Clave</label><input id="adm_k" type="password" autocomplete="off" onkeydown="if(event.key==='Enter') entrarAdmin()"></div>
      ${REM.error ? `<div class="aviso">${esc(REM.error)}</div>` : ''}<button class="btn" onclick="entrarAdmin()">Entrar</button>`; }
  if(!REM.admin && !REM.cargando) cargar('admin');
  const d = REM.admin; fijo('');
  const tabs = [['agenda','Agenda'],['clientes','Clientes'],['precios','Precios del día']];
  return `<div class="eb">Administración</div><h1>Emotional Reminder</h1>
    <div class="chips" style="margin:6px 0 12px">${tabs.map(([k,t])=>`<button aria-pressed="${UI.atab===k}" onclick="UI.atab='${k}';guardarUI();pintar()">${t}</button>`).join('')}
      <button onclick="cargar('admin')" aria-label="Actualizar">↻</button><button onclick="salirAdmin()">Salir</button></div>
    ${REM.error ? `<div class="aviso">${esc(REM.error)}</div>` : ''}${!d ? '<p class="sub">Cargando…</p>' : UI.atab==='agenda' ? vAgenda(d, 'admin') : UI.atab==='precios' ? vPrecios(d) :
      clientesDe(d).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).map(c=>{ const pr = presDe(d, c);
        return `<button class="card" style="display:block;width:100%;text-align:left;margin-top:10px" onclick="UI.cli='${esc(c.k)}';guardarUI();ir('admin_cli')">
          <div class="eb">${esc([c.tipo, c.ciudad, c.fecha].filter(Boolean).join(' · '))}</div><div style="font-size:21px;font-weight:300;margin-top:3px">${esc(c.nombre)}</div>
          <div class="sub" style="font-size:13px">${esc(c.estado)}${pr.length ? ' · presupuesto ' + esc(pr[pr.length-1]['Estado']).toLowerCase() : ''}</div></button>`; }).join('')}`;
}
function entrarAdmin(){ const k = (document.getElementById('adm_k')||{}).value || ''; if(!k) return; try{ sessionStorage.setItem('er_py_admin', k); }catch(e){} REM.admin = null; REM.error = ''; cargar('admin'); pintar(); }
function salirAdmin(){ try{ sessionStorage.removeItem('er_py_admin'); }catch(e){} REM.admin = null; ir('cliente'); }
function vPrecios(d){
  const c = d.costos || {}, p = d.precios || {}, dol = p.dolar_venta || 0;
  return `<div class="card"><dl class="tec"><dt>Dólar BNA venta</dt><dd>${dol ? '$ ' + dol : '—'} <span class="sub">${esc(p._fecha_dolar_venta ? new Date(p._fecha_dolar_venta).toLocaleString('es-AR') : '')}</span></dd>
    <dt>Guaraníes</dt><dd>${p.guaranies_por_dolar ? Math.round(p.guaranies_por_dolar) + ' por dólar' : '—'}</dd>
    ${['windsor','edimburgo','cardiff','balmoral'].map(m=>`<dt style="text-transform:capitalize">${m}</dt><dd>${p['maquina_'+m] ? '$ ' + Math.round(p['maquina_'+m]).toLocaleString('es-AR') + ' sin imp. = ' + fmtU(p['maquina_'+m]/dol) + ' · ' + p['maquina_'+m+'_m3'] + ' m³' : '—'}</dd>`).join('')}
    <dt>Factor</dt><dd>×${c.factor}</dd><dt>Comisión JM</dt><dd>${Math.round((c.comision_jm||0)*100)} %</dd><dt>Envío a PY</dt><dd>${fmtU(c.envio_py||0)}</dd>
    <dt>Máquina</dt><dd>${Math.round(c.maquina.aroma*100)} % aroma · ${Math.round(c.maquina.mmb*100)} % MMB · resto alcohol</dd><dt>Difusor</dt><dd>${Math.round(c.difusor.aroma*100)} % aroma · ${Math.round(c.difusor.mmb*100)} % MMB · resto alcohol</dd>
    <dt>Jabón</dt><dd>${Math.round(c.jabon.base*100)} % base · ${Math.round(c.jabon.aroma*100)} % aroma · resto agua</dd></dl>
    <p class="sub" style="font-size:12px;margin-top:8px">Los costos se cambian en el script de la planilla (objeto COSTOS). El dólar y las máquinas se actualizan solos cada 6 horas.</p></div>`;
}
function vAdminCli(){
  const d = REM.admin; if(!d){ ir('admin'); return ''; } const c = clientesDe(d).find(x=>x.k===UI.cli); if(!c){ ir('admin'); return ''; }
  const pres = presDe(d, c), ult = pres[pres.length-1];
  fijo(`<button class="btn ghost" onclick="ir('admin')">Volver</button><button class="btn" onclick="abrirPresupuesto('${esc(c.k)}')">${ult ? 'Editar presupuesto' : 'Armar presupuesto'}</button>`);
  const f = c.fila || {};
  return `<div class="eb">${esc([c.tipo, c.ciudad, c.fecha].filter(Boolean).join(' · '))}</div><h1>${esc(c.nombre)}</h1>
    <div class="card"><dl class="tec">${[['WhatsApp',c.wa],['Espacio',c.m2 && c.m2+' m²'],['Ambientes',f['Cantidad de ambientes']],['Hoy usa',c.usa],['Busca',c.busca],['Factura',f['Tipo de factura']],['RUC',f['RUC']],['Dir. fiscal',f['Dirección fiscal']],['Obs. de Achu',c.obs],['Estado',c.estado]].filter(x=>x[1]).map(([a,b])=>`<dt>${a}</dt><dd>${esc(b)}</dd>`).join('')}</dl></div>
    ${bloqueGustos(c)}
    ${ult ? `<h2>Presupuesto (${esc(ult['Estado'])})</h2><div class="card"><div style="white-space:pre-line">${esc(ult['Resumen'])}</div><div style="margin-top:8px;font-weight:600">${esc(ult['Total para el cliente']||'')}</div>
      <div class="sub" style="font-size:13px">Costo ${esc(ult['Costo US$']||'')} · Tu ganancia ${esc(ult['Ganancia ER US$']||'')} · Achu ${esc(ult['Achu US$']||'')}</div></div>` : ''}`;
}

/* ---------- armador de presupuestos ---------- */
const TIPOS_LINEA = [['maq','Máquina'],['rec','Recarga para máquina'],['dif','Difusor de varillas'],['jab','Jabón de manos'],['per','Perfume 100 ml'],['env','Envío a Paraguay'],['otro','Otro']];
const PRESETS = {
  susana: [{t:'maq', modelo:'windsor', cant:1, espacio:'Casa · 115 m²'}, {t:'maq', modelo:'edimburgo', cant:1, espacio:'Quincho · 60 m²'}, {t:'maq', modelo:'edimburgo', cant:1, espacio:'Oficina del esposo'},
    {t:'rec', espacio:'Casa', esencia:'Acorde Marino M (Bruma de mar)', litros:10}, {t:'rec', espacio:'Quincho', esencia:'Rose Prick (Tom Ford)', litros:10}, {t:'rec', espacio:'Oficina del esposo', esencia:'Oud Wood (Tom Ford)', litros:10},
    {t:'dif', espacio:'Habitación del hijo', esencia:'Erba Pura M4 (Xerjoff)', litros:5, varillas:1}, {t:'jab', esencia:'Acorde Marino M (Bruma de mar)', litros:5},
    {t:'per', esencia:'Arabians Tonka (Montale)', cant:1, extra:'cofre de cedro'}, {t:'env', usd:300}]
};
function abrirPresupuesto(k){
  const d = REM.admin, c = clientesDe(d).find(x=>x.k===k), ult = presDe(d, c).slice(-1)[0];
  let datos = null; try{ datos = ult && JSON.parse(ult['Datos'] || 'null'); }catch(e){}
  const pre = c.pre || (CLIENTES.find(x=>nz(x.nombre)===nz(c.nombre))||{}).id;
  UI.pres = datos || {id:'pr-'+uid(), cli:k, nombre:c.nombre, factor:(d.costos||{}).factor||2.5, achuPct:0.10, achuModo:'sale', mostrarTotal:false, lineas:JSON.parse(JSON.stringify(PRESETS[pre] || [{t:'maq', modelo:'edimburgo', cant:1, espacio:''}, {t:'env', usd:(d.costos||{}).envio_py||300}]))};
  ir('admin_pres');
}
function ctx(){ const d = REM.admin, c = d.costos, p = d.precios || {}, dol = p.dolar_venta || 1625;
  return {c, dol, pyg:p.guaranies_por_dolar || 0, alc:c.alcohol_ars_l/dol, maq:m=>({ars:p['maquina_'+m]||0, m3:p['maquina_'+m+'_m3']||0}), ess:n=>{ const e = c.esencias.find(x=>x[0]===n); return e ? e[1] : 0; }}; }
const NOM_MAQ = {windsor:'Windsor (grande)', edimburgo:'Edimburgo (mediana)', cardiff:'Cardiff (chica)', balmoral:'Balmoral (autos)'};
function calcLinea(l, X, factor){
  const u = l.usd != null && l.t!=='env' && l.t!=='otro' && l.usdManual ? Number(l.usd) : X.ess(l.esencia);
  const liq = (f) => f.aroma*u + f.mmb*X.c.mmb_kg + (1-f.aroma-f.mmb)*X.alc;
  if(l.t==='maq'){ const m = X.maq(l.modelo), v = (m.ars/X.dol)*(l.cant||1); return {costo:v, precio:v, jm:v*X.c.comision_jm, txt:`${l.cant||1} × Máquina ${NOM_MAQ[l.modelo]} · cubre ${m.m3} m³${l.espacio ? ' · ' + l.espacio : ''}`}; }
  if(l.t==='rec'){ const k = liq(X.c.maquina)*l.litros; return {costo:k, precio:k*factor, jm:0, txt:`Recarga ${l.litros} L · ${l.esencia}${l.espacio ? ' · ' + l.espacio : ''} · dura ${Math.round(l.litros/2)} a ${l.litros} meses`}; }
  if(l.t==='dif'){ const k = liq(X.c.difusor)*l.litros + (l.varillas||0)*X.c.varillas_pack_usd; return {costo:k, precio:k*factor, jm:0, txt:`Difusor ${l.litros} L · ${l.esencia}${l.varillas ? ' · ' + l.varillas*100 + ' varillas' : ''}${l.espacio ? ' · ' + l.espacio : ''}`}; }
  if(l.t==='jab'){ const k = (X.c.jabon.base*X.c.jabon.base_usd_kg + X.c.jabon.aroma*u)*l.litros; return {costo:k, precio:k*factor, jm:0, txt:`Jabón de manos ${l.litros} L · ${l.esencia}`}; }
  if(l.t==='per'){ const n = l.cant||1; return {costo:n*X.c.perfume100.costo_ars/X.dol, precio:n*X.c.perfume100.precio_ars/X.dol, jm:0, txt:`${n} × Perfume 100 ml · ${l.esencia}${l.extra ? ' · ' + l.extra : ''}`}; }
  if(l.t==='env') return {costo:Number(l.usd)||0, precio:Number(l.usd)||0, jm:0, txt:'Envío a Paraguay'};
  return {costo:Number(l.costo)||0, precio:Number(l.precio)||0, jm:0, txt:l.desc||'Otro'};
}
function totales(pr){
  const X = ctx(), ls = pr.lineas.map(l=>Object.assign({l}, calcLinea(l, X, pr.factor)));
  const costo = ls.reduce((a,x)=>a+x.costo,0), precio = ls.reduce((a,x)=>a+x.precio,0), jm = ls.reduce((a,x)=>a+x.jm,0);
  const achu = precio*pr.achuPct, total = pr.achuModo==='suma' ? precio + achu : precio, gan = precio - costo + jm - (pr.achuModo==='suma' ? 0 : achu);
  return {X, ls, costo, precio, jm, achu, total, gan, pyg:X.pyg ? total*X.pyg : 0};
}
function vPres(){
  const pr = UI.pres; if(!pr || !REM.admin){ ir('admin'); return ''; }
  const T = totales(pr), X = T.X, ess = X.c.esencias;
  fijo(`<button class="btn ghost" onclick="guardarPres('Borrador')">Guardar</button><button class="btn" onclick="guardarPres('Publicado')">Publicar para ${esc(CONFIG.VENDEDORA)}</button>`);
  const sel = (i, campo, ops, val) => `<select onchange="UI.pres.lineas[${i}].${campo}=this.value;pintarPres()">${ops.map(([v,t])=>`<option value="${esc(v)}" ${v===val?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
  const num = (i, campo, val, paso) => `<input type="number" step="${paso||1}" value="${val}" onchange="UI.pres.lineas[${i}].${campo}=Number(this.value);pintarPres()">`;
  const txt = (i, campo, val, ph) => `<input value="${esc(val||'')}" placeholder="${ph||''}" onchange="UI.pres.lineas[${i}].${campo}=this.value;pintarPres()">`;
  const essOps = ess.map(e=>[e[0], `${e[0]} · US$ ${e[1]}/kg`]);
  const linea = (x, i) => { const l = x.l; let campos = '';
    if(l.t==='maq') campos = `${sel(i,'modelo',Object.entries(NOM_MAQ),l.modelo)}<label>Cant.${num(i,'cant',l.cant||1)}</label>${txt(i,'espacio',l.espacio,'Espacio')}`;
    if(['rec','dif','jab'].includes(l.t)) campos = `${sel(i,'esencia',essOps,l.esencia)}<label>Litros${num(i,'litros',l.litros||10)}</label>${l.t==='dif' ? `<label>Paq. varillas${num(i,'varillas',l.varillas||0)}</label>` : ''}${l.t!=='jab' ? txt(i,'espacio',l.espacio,'Espacio') : ''}`;
    if(l.t==='per') campos = `${sel(i,'esencia',essOps,l.esencia)}<label>Cant.${num(i,'cant',l.cant||1)}</label>${txt(i,'extra',l.extra,'Cofre de cedro / bolsa')}`;
    if(l.t==='env') campos = `<label>US$${num(i,'usd',l.usd||0)}</label>`;
    if(l.t==='otro') campos = `${txt(i,'desc',l.desc,'Descripción')}<label>Costo US$${num(i,'costo',l.costo||0,0.01)}</label><label>Precio US$${num(i,'precio',l.precio||0,0.01)}</label>`;
    return `<div class="card linea"><div class="lt"><b>${esc((TIPOS_LINEA.find(t=>t[0]===l.t)||[])[1])}</b><button class="mini" onclick="UI.pres.lineas.splice(${i},1);pintarPres()" aria-label="Quitar">✕</button></div>
      <div class="campos">${campos}</div><div class="lr"><span>Costo ${fmtU(x.costo)}</span><span>Precio <b>${fmtU(x.precio)}</b></span>${x.jm ? `<span>Comisión JM ${fmtU(x.jm)}</span>` : ''}</div></div>`; };
  return `<div class="eb">Presupuesto</div><h1>${esc(pr.nombre)}</h1>
    <div class="card"><dl class="tec"><dt>Dólar</dt><dd>BNA venta $ ${X.dol}</dd><dt>Factor</dt><dd><input type="number" step="0.1" value="${pr.factor}" style="width:80px" onchange="UI.pres.factor=Number(this.value);pintarPres()"></dd>
      <dt>${esc(CONFIG.VENDEDORA)}</dt><dd><input type="number" step="1" value="${Math.round(pr.achuPct*100)}" style="width:70px" onchange="UI.pres.achuPct=Number(this.value)/100;pintarPres()"> %
        <select onchange="UI.pres.achuModo=this.value;pintarPres()"><option value="sale" ${pr.achuModo==='sale'?'selected':''}>sale de mi ganancia</option><option value="suma" ${pr.achuModo==='suma'?'selected':''}>se suma al precio</option></select></dd>
      <dt>Achu ve</dt><dd><label style="font-size:14px"><input type="checkbox" ${pr.mostrarTotal?'checked':''} onchange="UI.pres.mostrarTotal=this.checked"> el total final (nunca los costos)</label></dd></dl></div>
    <div id="lineas">${T.ls.map(linea).join('')}</div>
    <div class="fld"><select id="nueva" onchange="if(this.value){agregarLinea(this.value);this.value=''}"><option value="">+ Agregar producto…</option>${TIPOS_LINEA.map(([k,t])=>`<option value="${k}">${t}</option>`).join('')}</select></div>
    <div class="card tot"><div><span>Costo total</span><b>${fmtU(T.costo)}</b></div><div><span>Precio de los productos</span><b>${fmtU(T.precio)}</b></div>
      <div><span>Comisión Jeane Mortenson (20 %)</span><b>${fmtU(T.jm)}</b></div><div><span>${esc(CONFIG.VENDEDORA)} (${Math.round(pr.achuPct*100)} %, ${pr.achuModo==='suma'?'se suma':'sale de tu parte'})</span><b>${fmtU(T.achu)}</b></div>
      <div><span>Tu ganancia</span><b>${fmtU(T.gan)}</b></div>
      <div class="gran"><span>Total para el cliente</span><b>${fmtU(T.total)}${T.pyg ? `<small>${fmtG(T.pyg)}</small>` : ''}</b></div></div>
    <button class="btn ghost" style="margin-top:12px" onclick="bajarPresupuesto()">⬇ Descargar presupuesto para el cliente (PNG)</button>`;
}
function pintarPres(){ const y = window.scrollY; pintar(); window.scrollTo(0, y); }
function agregarLinea(t){ const c = REM.admin.costos, e0 = c.esencias[0][0];
  const base = {maq:{modelo:'edimburgo', cant:1, espacio:''}, rec:{esencia:e0, litros:10, espacio:''}, dif:{esencia:e0, litros:5, varillas:1, espacio:''}, jab:{esencia:e0, litros:5}, per:{esencia:e0, cant:1, extra:'cofre de cedro'}, env:{usd:c.envio_py}, otro:{desc:'', costo:0, precio:0}}[t];
  UI.pres.lineas.push(Object.assign({t}, base)); pintarPres(); }
function guardarPres(estado){
  const pr = UI.pres, T = totales(pr), d = REM.admin, ahora = new Date().toLocaleString('es-PY');
  const resumen = T.ls.map(x=>'• ' + x.txt).join('\n');
  const o = {'Cliente':pr.nombre, 'Clave cliente':pr.cli, 'Fecha':ahora, 'Estado':estado, 'Mostrar total a Achu':pr.mostrarTotal ? 'Sí' : 'No',
    'Total para el cliente':fmtU(T.total) + (T.pyg ? ' · ' + fmtG(T.pyg) : ''), 'Total US$':Math.round(T.total*100)/100, 'Costo US$':Math.round(T.costo*100)/100,
    'Comisión JM US$':Math.round(T.jm*100)/100, 'Achu US$':Math.round(T.achu*100)/100, 'Ganancia ER US$':Math.round(T.gan*100)/100, 'Dólar':T.X.dol, 'Factor':pr.factor,
    'Resumen':resumen, 'Datos':JSON.stringify(pr)};
  enviarFilas('Presupuestos', [fila(pr.id, o)], true);
  d.presupuestos = (d.presupuestos||[]).filter(p=>p['ID']!==pr.id).concat([Object.assign({ID:pr.id}, o)]);
  aviso(estado==='Publicado' ? 'Publicado: ' + CONFIG.VENDEDORA + ' ya lo ve (sin costos)' : 'Guardado'); ir('admin_cli');
}

/* ---------- presupuesto para el cliente (PNG, solo desde administración) ---------- */
function imgP(src){ return new Promise(r=>{ const i = new Image(); i.onload = ()=>r(i); i.onerror = ()=>r(null); i.src = src; }); }
async function bajarPresupuesto(){
  try{ await Promise.all(['200 40px Montserrat','300 40px Montserrat','400 40px Montserrat','600 40px Montserrat'].map(f=>document.fonts.load(f))); }catch(e){}
  const pr = UI.pres, T = totales(pr), W = 1080, M = 70, GOLD = '#C9A45C', INK = '#F4EBDD', DIM = '#B9A98F';
  const logo = await imgP(LOGOS.er_claro), fotos = {}; for(const k of Object.keys(MAQ_IMG)) fotos[k] = await imgP(MAQ_IMG[k]);
  const cv = document.createElement('canvas'), c = cv.getContext('2d');
  const pasada = dib => { let y = 0;
    const t = (s, x, px, wt, col, al, maxW, lh, track) => { c.font = `${wt} ${px}px Montserrat`; c.fillStyle = col; c.textAlign = al||'left'; try{ c.letterSpacing = (track||0)+'px'; }catch(e){}
      const pal = String(s).split(' '); let ln = ''; const out = []; pal.forEach(w=>{ const pr2 = ln ? ln+' '+w : w; if(maxW && c.measureText(pr2).width > maxW && ln){ out.push(ln); ln = w; } else ln = pr2; }); if(ln) out.push(ln);
      out.forEach(l=>{ if(dib) c.fillText(l, x, y + px); y += lh || px*1.35; }); try{ c.letterSpacing = '0px'; }catch(e){} };
    y = 70; if(dib && logo){ const h = 90, w = logo.width*h/logo.height; c.drawImage(logo, W/2 - w/2, y, w, h); } y += 120;
    t('EMOTIONAL REMINDER · AROMA PARA TUS ESPACIOS', W/2, 20, 600, GOLD, 'center', 0, 34, 5);
    t('Propuesta para ' + pr.nombre, W/2, 54, 200, INK, 'center', W-2*M, 66);
    t(new Date().toLocaleDateString('es-AR', {day:'numeric', month:'long', year:'numeric'}), W/2, 22, 300, DIM, 'center', 0, 40);
    y += 20;
    T.ls.forEach(x=>{ const l = x.l, y0 = y; if(dib){ c.strokeStyle = 'rgba(201,164,92,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(M, y); c.lineTo(W-M, y); c.stroke(); } y += 24;
      let tx = M;
      if(l.t==='maq' && fotos[l.modelo]){ if(dib){ c.save(); c.beginPath(); c.roundRect ? c.roundRect(M, y, 170, 170, 16) : c.rect(M, y, 170, 170); c.clip(); c.drawImage(fotos[l.modelo], M, y, 170, 170); c.restore(); } tx = M + 200; }
      const yt = y; const tit = {maq:'Máquina ' + NOM_MAQ[l.modelo], rec:'Recarga ' + l.litros + ' L', dif:'Difusor de varillas ' + l.litros + ' L', jab:'Jabón de manos ' + l.litros + ' L', per:'Perfume 100 ml', env:'Envío a Paraguay', otro:l.desc||'Otro'}[l.t];
      t((l.cant && l.cant>1 ? l.cant + ' × ' : '') + tit, tx, 30, 400, INK, 'left', W - tx - M - 220, 40);
      const det = l.t==='maq' ? `Cubre hasta ${T.X.maq(l.modelo).m3} m³${l.espacio ? ' · ' + l.espacio : ''}` : l.t==='rec' ? `${l.esencia}${l.espacio ? ' · ' + l.espacio : ''} · rinde ${Math.round(l.litros/2)} a ${l.litros} meses` :
        l.t==='dif' ? `${l.esencia}${l.varillas ? ' · ' + l.varillas*100 + ' varillas' : ''}${l.espacio ? ' · ' + l.espacio : ''}` : l.t==='jab' ? l.esencia : l.t==='per' ? `${l.esencia}${l.extra ? ' · ' + l.extra : ''}` : '';
      if(det) t(det, tx, 22, 300, DIM, 'left', W - tx - M - 220, 32);
      if(dib){ c.font = '400 30px Montserrat'; c.fillStyle = GOLD; c.textAlign = 'right'; c.fillText(fmtU(x.precio), W-M, yt + 30); }
      y = Math.max(y, l.t==='maq' ? yt + 170 : y) + 24; });
    if(dib){ c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(M, y); c.lineTo(W-M, y); c.stroke(); } y += 30;
    if(pr.achuModo==='suma' && T.achu){ t('Gestión comercial', M, 24, 300, DIM, 'left', 0, 0); if(dib){ c.font = '400 24px Montserrat'; c.fillStyle = DIM; c.textAlign = 'right'; c.fillText(fmtU(T.achu), W-M, y + 24); } y += 44; }
    t('TOTAL', M, 26, 600, GOLD, 'left', 0, 0, 5); if(dib){ c.font = '300 52px Montserrat'; c.fillStyle = INK; c.textAlign = 'right'; c.fillText(fmtU(T.total), W-M, y + 44); } y += 64;
    if(T.pyg){ if(dib){ c.font = '300 28px Montserrat'; c.fillStyle = DIM; c.textAlign = 'right'; c.fillText(fmtG(T.pyg), W-M, y + 26); } y += 50; }
    y += 30; t('Máquinas sin impuestos argentinos · Factura E de exportación · Precios en dólares al tipo de cambio del día · Validez 7 días.', W/2, 19, 300, DIM, 'center', W-2*M, 28);
    y += 40; t('Agustín Melazo Díaz', W/2, 24, 400, INK, 'center', 0, 34); t('Licenciado en Biotecnología · Especialista en perfumería personalizada', W/2, 18, 300, DIM, 'center', 0, 30);
    return y + 70; };
  cv.width = W; cv.height = 4000; const H = pasada(false); cv.height = H;
  c.fillStyle = '#0E0C0B'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(201,164,92,.5)'; c.lineWidth = 1.5; c.strokeRect(30, 30, W-60, H-60); pasada(true);
  const blob = await new Promise(r=>cv.toBlob(r,'image/png')), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'presupuesto_' + (nz(pr.nombre)||'cliente').replace(/ /g,'_') + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
