import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { loadPdf } from '../services/pdfService';

const thumbnails = new WeakMap();
let renderQueue = Promise.resolve();

function thumbnailFor(file) {
  if (thumbnails.has(file)) return thumbnails.get(file);
  // Keep thumbnail work bounded when a large library enters the viewport.
  const result = renderQueue.then(async () => {
    const task = await loadPdf(file);
    try {
      const pdf = await task.promise;
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(340 / base.width, 420 / base.height) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      return await new Promise((resolve, reject) => canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Miniatura no disponible.')), 'image/webp', 0.88
      ));
    } finally { await task.destroy(); }
  });
  renderQueue = result.catch(() => {});
  thumbnails.set(file, result);
  return result;
}

function DocumentThumbnail({ file, title }) {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '160px' });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !file) return;
    let active = true;
    let objectUrl;
    thumbnailFor(file).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file, visible]);

  return <div ref={containerRef} className="document-thumbnail">
    {url ? <img src={url} alt={'Primera pagina de ' + title} draggable="false" /> :
      failed || !file ? <div className="thumbnail-fallback"><FileText size={36} /><span>Sin vista previa</span></div> :
        <div className="thumbnail-skeleton skeleton" aria-label="Cargando miniatura" role="status" />}
  </div>;
}

export default DocumentThumbnail;
