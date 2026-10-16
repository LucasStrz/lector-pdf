import { pdfjs } from 'react-pdf';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function loadPdf(file) {
  return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
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
