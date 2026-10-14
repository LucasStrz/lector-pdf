const DB_NAME = 'lector-pdf';
const DB_VERSION = 1;
const DOCUMENT_STORE = 'documents';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(DOCUMENT_STORE)) {
        database.createObjectStore(DOCUMENT_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction(mode, operation) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(DOCUMENT_STORE, mode);
        const store = transaction.objectStore(DOCUMENT_STORE);
        const request = operation(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => reject(transaction.error);
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

async function estimatePdfPageCount(file) {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder('latin1').decode(buffer);
  const pageMatches = text.match(/\/Type\s*\/Page\b/g);

  return Math.max(pageMatches?.length ?? 1, 1);
}

export async function createDocumentFromFile(file) {
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

  if (!isPdf) {
    throw new Error('Solo se pueden agregar archivos PDF.');
  }

  const now = new Date().toISOString();
  const totalPages = await estimatePdfPageCount(file);

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

export async function updateStoredDocumentProgress(documentId, page) {
  const document = await runTransaction('readonly', (store) =>
    store.get(documentId)
  );

  if (!document) {
    return null;
  }

  const updatedDocument = {
    ...document,
    lastPage: page,
    updatedAt: new Date().toISOString(),
  };

  await saveDocument(updatedDocument);

  return updatedDocument;
}

export function deleteStoredDocument(documentId) {
  return runTransaction('readwrite', (store) => store.delete(documentId));
}
