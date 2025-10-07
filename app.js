// URL del endpoint de Google Apps Script
const ENDPOINT = "TU_URL_DE_APPS_SCRIPT_AQUI"; // ⚠️ Reemplaza esto con tu URL real

let usuarioActivo = null;

// Esperar que la DB esté lista antes de continuar
initDB().then(() => {
  inicializarSuperUsuario(); // Crear usuario por defecto si no existe
  verificarSesion();
});

// ==================== LOGIN ====================
async function inicializarSuperUsuario() {
  const usuarios = await getAllItems('usuarios');
  if (usuarios.length === 0) {
    await addItem('usuarios', { username: 'admin', password: '1234', rol: 'superusuario' });
    console.log("Superusuario creado: admin / 1234");
  }
}

async function verificarSesion() {
  const user = localStorage.getItem('usuarioActivo');
  if (user) {
    usuarioActivo = user;
    mostrarApp();
  }
}

document.getElementById('btnLogin').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const status = document.getElementById('login-status');

  const usuarios = await getAllItems('usuarios');
  const encontrado = usuarios.find(u => u.username === username && u.password === password);

  if (encontrado) {
    localStorage.setItem('usuarioActivo', username);
    usuarioActivo = username;
    mostrarApp();
  } else {
    status.textContent = "Usuario o contraseña incorrectos";
  }
});

function mostrarApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
}

// ==================== CIERRE DE SESIÓN ====================
document.getElementById('btnLogout').addEventListener('click', async () => {
  if (!navigator.onLine) {
    alert("No puedes cerrar sesión sin conexión. Conéctate para sincronizar primero.");
    return;
  }

  await sincronizarDatos();
  localStorage.removeItem('usuarioActivo');
  location.reload();
});

// ==================== SINCRONIZACIÓN ====================
document.getElementById('btnSync').addEventListener('click', async () => {
  if (!navigator.onLine) {
    alert("Sin conexión. Los datos se guardarán localmente.");
    return;
  }
  await sincronizarDatos();
});

async function sincronizarDatos() {
  const viajes = await getAllItems('viajes');
  if (viajes.length === 0) {
    alert("No hay viajes pendientes para sincronizar.");
    return;
  }

  document.getElementById('sync-status').textContent = "Sincronizando...";

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({ usuario: usuarioActivo, viajes })
    });

    document.getElementById('sync-status').textContent = "Sincronización completada ✅";
  } catch (err) {
    console.error(err);
    document.getElementById('sync-status').textContent = "Error al sincronizar ❌";
  }
}

// ==================== PDF GENERACIÓN (EJEMPLO) ====================
document.getElementById('btnPDF').addEventListener('click', async () => {
  const viajes = await getAllItems('viajes');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Reporte de Viajes", 10, 10);
  let y = 20;
  viajes.forEach(v => {
    doc.text(`${v.fecha || 'Sin fecha'} - ${v.camion || 'Camión'} - ${v.destino || 'Destino'}`, 10, y);
    y += 10;
  });

  doc.save("viajes.pdf");
});
