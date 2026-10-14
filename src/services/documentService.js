import { getPdfPageCount } from './pdfService';

const DB_NAME = 'lector-pdf';
const DB_VERSION = 2;
const DOCUMENT_STORE = 'documents';
const LEGACY_PROGRESS_KEY = 'lector-pdf-progress';

export function storageErrorMessage(error) {
  if (error?.name === 'QuotaExceededError') return 'No hay espacio suficiente para guardar el PDF.';
  if (error?.name === 'SecurityError' || error?.name === 'InvalidStateError') {
    return 'El navegador no permite acceder al almacenamiento local.';
  }
  if (error?.name === 'PasswordException') return 'El PDF tiene contrasena y no se puede importar.';
  if (error?.name === 'InvalidPDFException') return 'El archivo no contiene un PDF valido.';
  return error?.message || 'No se pudo completar el guardado local.';
}

function legacyProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_PROGRESS_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    let blocked = false;
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (blocked) { request.transaction.abort(); return; }
      const database = request.result;

      if (!database.objectStoreNames.contains(DOCUMENT_STORE)) {
        database.createObjectStore(DOCUMENT_STORE, { keyPath: 'id' });
      }
      const progress = legacyProgress();
      const cursorRequest = request.transaction.objectStore(DOCUMENT_STORE).openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) return;
        const document = cursor.value;
        const page = progress[document.id];
        if (Number.isInteger(page) && page > 0) {
          cursor.update({ ...document, lastPage: page });
        }
        cursor.continue();
      };
    };

    request.onsuccess = () => {
      const database = request.result;
      if (blocked) { database.close(); return; }
      database.onversionchange = () => database.close();
      try { localStorage.removeItem(LEGACY_PROGRESS_KEY); } catch { /* Migration is already committed. */ }
      resolve(database);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(new Error('Cierra las otras pestanas de la app y vuelve a intentar.'));
    };
  });
}

function runTransaction(mode, operation) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        let transaction;
        let result;
        let failure;
        try {
          transaction = database.transaction(DOCUMENT_STORE, mode,
            mode === 'readwrite' ? { durability: 'strict' } : undefined);
          transaction.oncomplete = () => { database.close(); resolve(result); };
          transaction.onabort = () => {
            database.close();
            reject(failure || transaction.error || new Error('El guardado fue cancelado.'));
          };
          transaction.onerror = event => { failure = event.target.error; };
          const request = operation(transaction.objectStore(DOCUMENT_STORE), value => { result = value; });
          if (!request.onsuccess) request.onsuccess = () => { result = request.result; };
        } catch (error) {
          failure = error;
          if (transaction) transaction.abort();
          else { database.close(); reject(error); }
        }
      })
  );
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTitleFromFileName(fileName) {
  return fileName.replace(/\.pdf$/i, '').trim() || fileName;
}

export async function createDocumentFromFile(file) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

  if (!isPdf) {
    throw new Error('Solo se pueden agregar archivos PDF.');
  }
  if (!file.size) throw new Error('El archivo PDF esta vacio.');
  const header = new TextDecoder().decode(await file.slice(0, 1024).arrayBuffer());
  if (!header.includes('%PDF-')) throw new Error('El archivo no contiene un PDF valido.');

  const now = new Date().toISOString();
  const totalPages = await getPdfPageCount(file);

  return {
    id: createId(),
    title: getTitleFromFileName(file.name),
    fileName: file.name,
    file,
    totalPages,
    lastPage: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getStoredDocuments() {
  const documents = await runTransaction('readonly', (store) => store.getAll());

  return documents.sort((firstDocument, secondDocument) =>
    secondDocument.updatedAt.localeCompare(firstDocument.updatedAt)
  );
}

export function saveDocument(document) {
  return runTransaction('readwrite', (store) => store.put(document));
}

export function updateStoredDocumentProgress(documentId, page, totalPages) {
  return runTransaction('readwrite', (store, setResult) => {
    const request = store.get(documentId);
    request.onsuccess = () => {
      const document = request.result;
      if (!document) { store.transaction.abort(); return; }
      const total = totalPages ?? document.totalPages;
      if (!Number.isInteger(total) || total < 1 ||
          (page !== undefined && (!Number.isInteger(page) || page < 1 || page > total))) {
        store.transaction.abort();
        return;
      }
      const updated = { ...document, totalPages: total,
        lastPage: page ?? Math.min(Math.max(document.lastPage, 1), total),
        updatedAt: new Date().toISOString() };
      store.put(updated);
      setResult(updated);
    };
    return request;
  });
}

export function deleteStoredDocument(documentId) {
  return runTransaction('readwrite', (store) => store.delete(documentId));
}
