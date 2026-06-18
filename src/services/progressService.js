const STORAGE_KEY = 'lector-pdf-progress';

export function getAllProgress() {
  const savedProgress = localStorage.getItem(STORAGE_KEY);

  if (!savedProgress) {
    return {};
  }

  try {
    return JSON.parse(savedProgress);
  } catch (error) {
    console.error('Error al leer el progreso guardado:', error);
    return {};
  }
}

export function getDocumentProgress(documentId) {
  const progress = getAllProgress();

  return progress[documentId] || null;
}

export function saveDocumentProgress(documentId, page) {
  const progress = getAllProgress();

  const updatedProgress = {
    ...progress,
    [documentId]: page,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
}