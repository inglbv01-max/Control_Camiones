// ------------------------------
// Configuración y Variables
// ------------------------------

const ENDPOINT = "TU_URL_DE_APPS_SCRIPT_AQUI"; // Reemplaza con tu endpoint de Google Sheets
let usuarioActivo = localStorage.getItem('usuarioActivo') || null;

const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const btnSync = document.getElementById('btnSync');
const btnPDF = document.getElementById('btnPDF');
const syncStatus = document.getElementById('sync-status');

// ------------------------------
// Login Multiusuario
// ------------------------------

// Lista inicial de usuarios
let usuarios = [
  { username: "super", password: "1234", rol: "super" } // Superusuario
];

// Función para validar login
btnLogin.addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  // Obtener usuarios guardados en IndexedDB
  let usuariosDB = await getAllItems('usuarios');
  usuariosDB = usuariosDB.length ? usuariosDB : usuarios;

  const user = usuariosDB.find(u => u.username === username && u.password === password);

  if (user) {
    usuarioActivo = user.username;
    localStorage.setItem('usuarioActivo', usuarioActivo);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    cargarViajes();
    cargarCamiones();
    cargarUbicacionesYLotes();
  } else {
    document.getElementById('login-status').textContent = 'Usuario o contraseña incorrectos';
  }
});

// ------------------------------
// Logout
// ------------------------------

btnLogout.addEventListener('click', async () => {
  const viajesPendientes = (await getAllItems('viajes')).filter(v => !v.sync);
  if (viajesPendientes.length > 0 || !navigator.onLine) {
    alert("No podés cerrar sesión sin conexión y con viajes pendientes de sincronizar.");
    return;
  }
  localStorage.removeItem('usuarioActivo');
  usuarioActivo = null;
  location.reload();
});

// ------------------------------
// Guardar Viaje
// ------------------------------

document.getElementById('btnGuardar').addEventListener('click', async () => {
  if (!usuarioActivo) { alert("Debés iniciar sesión"); return; }

  const viaje = {
    fecha: document.getElementById('fecha').value,
    camion: document.getElementById('camionSel').value,
    placa: document.getElementById('placa').value,
    origen: document.getElementById('origenSel').value,
    destino: document.getElementById('destinoSel').value,
    lote: document.getElementById('loteSel').value,
    salida: document.getElementById('salida').value,
    llegada: document.getElementById('llegada').value,
    obs: document.getElementById('obs').value,
    usuario: usuarioActivo,
    sync: false
  };

  await addItem('viajes', viaje);
  cargarViajes();
});

// ------------------------------
// Sincronizar Viajes
// ------------------------------

async function sincronizarViajes() {
  const viajes = await getAllItems('viajes');
  const pendientes = viajes.filter(v => !v.sync);

  if (pendientes.length === 0) {
    syncStatus.textContent = 'Todos los viajes ya están sincronizados.';
    return;
  }

  btnSync.disabled = true;
  btnPDF.disabled = true;
  syncStatus.textContent = 'Sincronizando...';

  for (const v of pendientes) {
    v.usuario = usuarioActivo;

    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(v),
        headers: { 'Content-Type': 'application/json' }
      });
      v.sync = true;
      await updateItem('viajes', v);
    } catch (error) {
      console.error("Error sincronizando:", error);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  syncStatus.textContent = 'Sincronización completada ✅';
  cargarViajes();

  setTimeout(() => { syncStatus.textContent = ''; }, 4000);
  btnSync.disabled = false;
  btnPDF.disabled = false;
}

btnSync.addEventListener('click', sincronizarViajes);

// ------------------------------
// Generar PDF
// ------------------------------

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
    doc.text(
      `Fecha: ${v.fecha}, Camión: ${v.placa}, Origen: ${v.origen}, Destino: ${v.destino}, Lote: ${v.lote}, Usuario: ${v.usuario}`,
      14,
      y
    );
    y += 10;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  doc.save('viajes.pdf');

  syncStatus.textContent = 'PDF generado ✅';
  setTimeout(() => { syncStatus.textContent = ''; }, 3000);
  btnPDF.disabled = false;
  btnSync.disabled = false;
});

// ------------------------------
// Cargar Catálogos y Viajes
// ------------------------------

async function cargarViajes() {
  const tbody = document.getElementById('tbodyViajes');
  const viajes = await getAllItems('viajes');
  tbody.innerHTML = '';
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
      <td>
        <button class="danger" onclick="deleteItem('viajes', ${v.id}).then(cargarViajes)">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Funciones para cargar camiones, ubicaciones y lotes
async function cargarCamiones() { /* similar a viajes, usando 'camiones' */ }
async function cargarUbicacionesYLotes() { /* similar, usando 'ubicaciones' y 'lotes' */ }
