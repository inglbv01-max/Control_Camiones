// === CONFIGURACIÓN ===
const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbwcMuKK7aRG2-rXBOYLLs8FdwDCSr6elmztrpsJgobod53NjdTG9VmsxjFe7E5hHg/exec'; // 🔁 Reemplazar con tu API real (si la tienes)
const DB_NAME = 'ControlCamionesDB';
let currentUser = null;

// === INICIALIZAR DB ===
async function startApp() {
  await initDB();

  // Verificar si hay usuario registrado (local)
  const users = await getAllItems('usuarios');
  if (users.length === 0) {
    await addItem('usuarios', { username: 'admin', password: '1234', role: 'Administrador' });
    console.log("Usuario admin creado");
  }

  // Mostrar login
  document.getElementById('login-section').style.display = 'block';
}

// === LOGIN ===
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const user = (await getAllItems('usuarios')).find(u => u.username === username && u.password === password);

  if (user) {
    currentUser = user;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('estado').textContent = `Conectado como ${user.username}`;
  } else {
    alert('Usuario o contraseña incorrectos');
  }
});

// === CERRAR SESIÓN ===
document.getElementById('logout-btn').addEventListener('click', () => {
  currentUser = null;
  document.getElementById('app-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
});

// === REGISTRAR VIAJE ===
document.getElementById('form-viaje').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nuevoViaje = {
    fecha: document.getElementById('fecha').value,
    camion: document.getElementById('camion').value,
    ubicacion: document.getElementById('ubicacion').value,
    lote: document.getElementById('lote').value,
    kilos: document.getElementById('kilos').value,
    sync: false,
    creadoPor: currentUser?.username || 'desconocido'
  };

  await addItem('viajes', nuevoViaje);
  alert('Viaje registrado localmente ✅');
  e.target.reset();
  listarViajes();
});

// === LISTAR VIAJES ===
async function listarViajes() {
  const viajes = await getAllItems('viajes');
  const tbody = document.getElementById('tabla-viajes');
  tbody.innerHTML = '';

  viajes.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.fecha}</td>
      <td>${v.camion}</td>
      <td>${v.ubicacion}</td>
      <td>${v.lote}</td>
      <td>${v.kilos}</td>
      <td>${v.sync ? '✅' : '🕓'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// === SINCRONIZAR CON SERVIDOR ===
document.getElementById('sync-btn').addEventListener('click', async () => {
  const syncStatus = document.getElementById('sync-status');
  syncStatus.textContent = '🔄 Sincronizando...';

  const viajes = await getAllItems('viajes');
  const pendientes = viajes.filter(v => !v.sync);

  if (pendientes.length === 0) {
    syncStatus.textContent = '✅ Todo está sincronizado.';
    return;
  }

  try {
    const response = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viajes: pendientes })
    });

    if (!response.ok) throw new Error('Error al conectar con el servidor');

    // Marcar como sincronizados
    for (let v of pendientes) {
      v.sync = true;
      await updateItem('viajes', v);
    }

    syncStatus.textContent = '✅ Datos sincronizados correctamente';
    listarViajes();
  } catch (err) {
    console.error(err);
    syncStatus.textContent = '⚠️ Error al sincronizar (modo offline activo)';
  }
});

// === CARGAR DATOS AL INICIAR ===
document.addEventListener('DOMContentLoaded', async () => {
  await startApp();
  listarViajes();
});
