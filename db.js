const DB_NAME = 'ControlCamionesDB';
const DB_VERSION = 1;
let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;

      if (!db.objectStoreNames.contains('viajes')) {
        db.createObjectStore('viajes', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('camiones')) {
        db.createObjectStore('camiones', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('ubicaciones')) {
        db.createObjectStore('ubicaciones', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('lotes')) {
        db.createObjectStore('lotes', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('usuarios')) {
        const store = db.createObjectStore('usuarios', { keyPath: 'id', autoIncrement: true });
        store.createIndex('username', 'username', { unique: true });
      }
    };

    request.onsuccess = (e) => { db = e.target.result; resolve(); };
    request.onerror = (e) => reject(e);
  });
}

// CRUD Genérico
function addItem(storeName, item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllItems(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function updateItem(storeName, item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function deleteItem(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Inicializar DB al cargar
initDB().then(() => console.log("IndexedDB inicializada"));
