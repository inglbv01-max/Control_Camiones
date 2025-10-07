// --------------------------------------------------------
// INICIALIZACIÓN DE LA APP
// --------------------------------------------------------
async function initApp() {
  await initDB();

  // Crear superusuario si no existe
  const usuarios = await getAllItems('usuarios');
  const admin = usuarios.find(u => u.username === 'admin');
  if (!admin) {
    await addItem('usuarios', { username: 'admin', password: '1234', rol: 'superusuario' });
    console.log("Superusuario creado: admin / 1234");
  }
}

initApp();

// --------------------------------------------------------
// ELEMENTOS DEL DOM
// --------------------------------------------------------
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const syncStatus = document.getElementById('sync-status');
const btnSync = document.getElementById('btnSync');
const btnPDF = document.getElementById('btnPDF');

const camionSel = document.getElementById('camionSel');
const origenSel = document.getElementById('origenSel');
const destinoSel = document.getElementById('destinoSel');
const loteSel = document.getElementById('loteSel');
const tbodyViajes = document.getElementById('tbodyViajes');
const tbodyCamiones = document.getElementById('tbodyCamiones');
const listaUbicaciones = document.getElementById('listaUbicaciones');
const listaLotes = document.getElementById('listaLotes');

// Inputs para agregar
const newCamion = document.getElementById('newCamion');
const newPlaca = document.getElementById('newPlaca');
const newUbicacion = document.getElementById('newUbicacion');
const newLote = document.getElementById('newLote');

const fechaInput = document.getElementById('fecha');
const placaInput = document.getElementById('placa');
const salidaInput = document.getElementById('salida');
const llegadaInput = document.getElementById('llegada');
const obsInput = document.getElementById('obs');

// Botones
const btnGuardar = document.getElementById('btnGuardar');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnAddCamion = document.getElementById('btnAddCamion');
const btnAddUbicacion = document.getElementById('btnAddUbicacion');
const btnAddLote = document.getElementById('btnAddLote');

// --------------------------------------------------------
// LOGIN
// --------------------------------------------------------
btnLogin.addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  const usuarios = await getAllItems('usuarios');
  const user = usuarios.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem('usuarioActivo', username);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    syncStatus.textContent = '';
    await cargarSelects();
    await cargarViajes();
    await cargarCamiones();
    await cargarUbicacionesLotes();
  } else {
    document.getElementById('login-status').textContent = 'Usuario o contraseña incorrectos';
  }
});

// --------------------------------------------------------
// LOGOUT
// --------------------------------------------------------
btnLogout.addEventListener('click', () => {
  if (!navigator.onLine) {
    alert('No se puede cerrar sesión sin conexión a internet. Sincronice primero.');
    return;
  }
  localStorage.removeItem('usuarioActivo');
  document.getElementById('login-screen').style.display = 'block';
  document.getElementById('app-screen').style.display = 'none';
});

// --------------------------------------------------------
// FUNCIONES AUXILIARES
// --------------------------------------------------------

// Limpiar formulario de viajes
function limpiarFormulario() {
  fechaInput.value = '';
  camionSel.selectedIndex = 0;
  placaInput.value = '';
  origenSel.selectedIndex = 0;
  destinoSel.selectedIndex = 0;
  loteSel.selectedIndex = 0;
  salidaInput.value = '';
  llegadaInput.value = '';
  obsInput.value = '';
}

// --------------------------------------------------------
// VIAJES
// --------------------------------------------------------
btnGuardar.addEventListener('click', async () => {
  const viaje = {
    fecha: fechaInput.value,
    camion: camionSel.value,
    placa: placaInput.value,
    origen: origenSel.value,
    destino: destinoSel.value,
    lote: loteSel.value,
    salida: salidaInput.value,
    llegada: llegadaInput.value,
    obs: obsInput.value,
    sync: false
  };
  await addItem('viajes', viaje);
  await cargarViajes();
  limpiarFormulario();
});

btnLimpiar.addEventListener('click', limpiarFormulario);

async function cargarViajes() {
  const viajes = await getAllItems('viajes');
  tbodyViajes.innerHTML = '';
  viajes.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.fecha}</td>
      <td>${v.camion}</td>
      <td>${v.placa}</td>
      <td>${v.origen}</td>
      <td>${v.destino}</td>
      <td>${v.lote}</td>
      <td>${v.salida}</td>
      <td>${v.llegada}</td>
      <td>${v.obs}</td>
      <td><button class="danger" onclick="deleteItem('viajes', ${v.id}).then(cargarViajes)">Eliminar</button></td>`;
    tbodyViajes.appendChild(tr);
  });
}

// --------------------------------------------------------
// CAMIONES
// --------------------------------------------------------
btnAddCamion.addEventListener('click', async () => {
  if (!newCamion.value || !newPlaca.value) return;
  await addItem('camiones', { nombre: newCamion.value, placa: newPlaca.value });
  newCamion.value = '';
  newPlaca.value = '';
  await cargarCamiones();
  await cargarSelects();
});

async function cargarCamiones() {
  const camiones = await getAllItems('camiones');
  tbodyCamiones.innerHTML = '';
  camionSel.innerHTML = '<option value="">Seleccione</option>';
  camiones.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.nombre}</td><td>${c.placa}</td><td>
      <button class="danger" onclick="deleteItem('camiones', ${c.id}).then(() => { cargarCamiones(); cargarSelects(); })">Eliminar</button>
    </td>`;
    tbodyCamiones.appendChild(tr);
    camionSel.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
  });
}

// --------------------------------------------------------
// UBICACIONES / LOTES
// --------------------------------------------------------
btnAddUbicacion.addEventListener('click', async () => {
  if (!newUbicacion.value) return;
  await addItem('ubicaciones', { nombre: newUbicacion.value });
  newUbicacion.value = '';
  await cargarUbicacionesLotes();
  await cargarSelects();
});

btnAddLote.addEventListener('click', async () => {
  if (!newLote.value) return;
  await addItem('lotes', { nombre: newLote.value });
  newLote.value = '';
  await cargarUbicacionesLotes();
  await cargarSelects();
});

async function cargarUbicacionesLotes() {
  const ubicaciones = await getAllItems('ubicaciones');
  const lotes = await getAllItems('lotes');

  listaUbicaciones.innerHTML = '';
  listaLotes.innerHTML = '';
  origenSel.innerHTML = '<option value="">Seleccione</option>';
  destinoSel.innerHTML = '<option value="">Seleccione</option>';
  loteSel.innerHTML = '<option value="">Seleccione</option>';

  ubicaciones.forEach(u => {
    listaUbicaciones.innerHTML += `<li>${u.nombre} <button class="danger" onclick="deleteItem('ubicaciones', ${u.id}).then(cargarUbicacionesLotes)">Eliminar</button></li>`;
    origenSel.innerHTML += `<option value="${u.nombre}">${u.nombre}</option>`;
    destinoSel.innerHTML += `<option value="${u.nombre}">${u.nombre}</option>`;
  });

  lotes.forEach(l => {
    listaLotes.innerHTML += `<li>${l.nombre} <button class="danger" onclick="deleteItem('lotes', ${l.id}).then(cargarUbicacionesLotes)">Eliminar</button></li>`;
    loteSel.innerHTML += `<option value="${l.nombre}">${l.nombre}</option>`;
  });
}

// --------------------------------------------------------
// ACTUALIZAR SELECTS
// --------------------------------------------------------
async function cargarSelects() {
  await cargarCamiones();
  await cargarUbicacionesLotes();
}

// --------------------------------------------------------
// SINCRONIZACIÓN CON GOOGLE SHEETS
// --------------------------------------------------------
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwcMuKK7aRG2-rXBOYLLs8FdwDCSr6elmztrpsJgobod53NjdTG9VmsxjFe7E5hHg/exec"; // Reemplazar con tu URL real

btnSync.addEventListener('click', async () => {
  const viajes = await getAllItems('viajes');
  const pendientes = viajes.filter(v => !v.sync);
  if (pendientes.length === 0) {
    syncStatus.textContent = 'Todos los viajes ya están sincronizados.';
    return;
  }

  btnSync.disabled = true;
  btnPDF.disabled = true;
  syncStatus.textContent = 'Sincronizando...';
  const usuario = localStorage.getItem('usuarioActivo');

  for (const v of pendientes) {
    try {
      await fetch(`${ENDPOINT}?usuario=${usuario}`, {
        method: 'POST',
        body: JSON.stringify(v),
        headers: { 'Content-Type': 'application/json' }
      });
      v.sync = true;
      await updateItem('viajes', v);
    } catch (err) {
      console.error('Error sincronizando viaje:', err);
    }
  }

  syncStatus.textContent = 'Sincronización completada ✅';
  await cargarViajes();
  setTimeout(() => { syncStatus.textContent = ''; }, 4000);
  btnSync.disabled = false;
  btnPDF.disabled = false;
});

// --------------------------------------------------------
// GENERAR PDF
// --------------------------------------------------------
btnPDF.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  btnPDF.disabled = true;
  btnSync.disabled = true;
  syncStatus.textContent = 'Generando PDF...';

  const viajes = await getAllItems('viajes');
  doc.setFontSize(14);
  doc.text('Viajes Guardados', 14, 20);
  let y = 30;
  viajes.forEach(v => {
    doc.text(`Fecha: ${v.fecha}, Camión: ${v.placa}, Origen: ${v.origen}, Destino: ${v.destino}, Lote: ${v.lote}`, 14, y);
    y += 10;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  doc.save('viajes.pdf');

  syncStatus.textContent = 'PDF generado ✅';
  setTimeout(() => { syncStatus.textContent = ''; }, 3000);
  btnPDF.disabled = false;
  btnSync.disabled = false;
});
