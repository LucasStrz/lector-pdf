import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { loadPdf } from '../services/pdfService';

function Reader({ document, onBack, onUpdatePage, onPdfLoaded, errorMessage, isSaving }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(600);
  const [status, setStatus] = useState('Cargando PDF...');
  const loadedRef = useRef(onPdfLoaded);

  useEffect(() => { loadedRef.current = onPdfLoaded; }, [onPdfLoaded]);
  useEffect(() => {
    let cancelled = false;
    let task;
    async function open() {
      try {
        task = await loadPdf(document.file);
        const result = await task.promise;
        if (cancelled) { await task.destroy(); return; }
        if (!cancelled) {
          setPdf(result);
          loadedRef.current(document.id, result.numPages);
        }
      } catch (error) {
        if (!cancelled) setStatus(error.name === 'PasswordException'
          ? 'Este PDF requiere una contrasena.' : 'No se pudo abrir el PDF.');
      }
    }
    open();
    return () => { cancelled = true; if (task) void task.destroy(); };
  }, [document.id, document.file]);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(100, entry.contentRect.width - 32)));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    let renderTask;
    // Detached canvases isolate renders during rapid navigation.
    async function render() {
      try {
        const page = await pdf.getPage(Math.min(Math.max(document.lastPage, 1), pdf.numPages));
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: width / base.width * zoom });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = window.document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width * ratio);
        canvas.height = Math.ceil(viewport.height * ratio);
        renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport,
          transform: [ratio, 0, 0, ratio, 0, 0] });
        await renderTask.promise;
        if (cancelled) return;
        const visible = canvasRef.current;
        visible.width = canvas.width;
        visible.height = canvas.height;
        visible.style.width = viewport.width + 'px';
        visible.style.height = viewport.height + 'px';
        visible.getContext('2d').drawImage(canvas, 0, 0);
        setStatus('');
      } catch (error) {
        if (!cancelled && error.name !== 'RenderingCancelledException') setStatus('No se pudo mostrar la pagina.');
      }
    }
    render();
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [pdf, document.lastPage, width, zoom]);

  const total = pdf?.numPages ?? document.totalPages;
  function goToPage(value) {
    if (!isSaving && Number.isInteger(value) && value >= 1 && value <= total) onUpdatePage(document.id, value);
  }

  return <main className="page">
    <section className="reader-container">
      <div className="reader-header">
        <button onClick={onBack}><ArrowLeft size={18} /> Volver</button>
        <div><h1>{document.title}</h1><p>Pagina {document.lastPage} de {total}</p></div>
      </div>
      {errorMessage && <p role="alert" className="status-message error">{errorMessage}</p>}
      {isSaving && <p role="status" className="status-message">Guardando progreso...</p>}
      <div className="reader-controls">
        <button title="Pagina anterior" aria-label="Pagina anterior" disabled={!pdf || isSaving || document.lastPage <= 1} onClick={() => goToPage(document.lastPage - 1)}><ChevronLeft /></button>
        <form className="page-form" onSubmit={event => { event.preventDefault(); goToPage(Number(new FormData(event.currentTarget).get('page'))); }}>
          <label htmlFor="page-number">Pagina</label>
          <input key={document.lastPage} id="page-number" name="page" type="number" required min="1" max={total} defaultValue={document.lastPage} />
          <span>/ {total}</span><button disabled={!pdf || isSaving} type="submit">Ir</button>
        </form>
        <button title="Pagina siguiente" aria-label="Pagina siguiente" disabled={!pdf || isSaving || document.lastPage >= total} onClick={() => goToPage(document.lastPage + 1)}><ChevronRight /></button>
        <div className="zoom-controls">
          <button title="Alejar" aria-label="Alejar" disabled={zoom <= 0.5} onClick={() => setZoom(value => Math.max(0.5, value - 0.25))}><ZoomOut /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button title="Acercar" aria-label="Acercar" disabled={zoom >= 2} onClick={() => setZoom(value => Math.min(2, value + 0.25))}><ZoomIn /></button>
          <button title="Ajustar al ancho" aria-label="Ajustar al ancho" onClick={() => setZoom(1)}><Maximize /></button>
        </div>
      </div>
      <div ref={containerRef} className="pdf-viewer pdf-canvas-viewer">
        {status && <p role="status" className="status-message">{status}</p>}
        <canvas ref={canvasRef} aria-label={'Pagina ' + document.lastPage + ' de ' + document.title} />
      </div>
    </section>
  </main>;
}

export default Reader;
