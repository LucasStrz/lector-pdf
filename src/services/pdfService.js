import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export async function loadPdf(file) {
  return getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
}

export async function getPdfPageCount(file) {
  const task = await loadPdf(file);
  try {
    const pdf = await task.promise;
    return pdf.numPages;
  } finally {
    await task.destroy();
  }
}
