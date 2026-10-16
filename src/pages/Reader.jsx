import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, LoaderCircle, RotateCw } from 'lucide-react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { PageSkeleton } from '../components/Skeleton';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

function Reader({ document, onBack, onUpdatePage, onPdfLoaded, errorMessage, isSaving }) {
  const containerRef = useRef(null);
  const navigationRef = useRef(null);
  const keyboardNavigationRef = useRef(false);
  const [navigationVisible, setNavigationVisible] = useState(true);
  const [pdf, setPdf] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [zoomNotice, setZoomNotice] = useState(false);
  const [width, setWidth] = useState(600);
  const [displayedPage, setDisplayedPage] = useState(null);
  const [failedPage, setFailedPage] = useState(null);
  const requestedPageRef = useRef(null);
  const [retry, setRetry] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(100, entry.contentRect.width)));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf) return;
    let timer;
    let nearBottom = false;
    let touchStart = null;
    const navigation = navigationRef.current;
    function show() { setNavigationVisible(true); clearTimeout(timer); }
    function hideLater() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const keyboardFocus = keyboardNavigationRef.current && navigation.contains(window.document.activeElement);
        if (!nearBottom && !keyboardFocus) setNavigationVisible(false);
      }, 2800);
    }
    function pointerMove(event) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const wasNear = nearBottom;
      nearBottom = event.clientY >= window.innerHeight - 110;
      if (nearBottom) show();
      else if (wasNear) hideLater();
    }
    function touch(event) {
      keyboardNavigationRef.current = false;
      if (event.pointerType === 'touch') {
        touchStart = { x: event.clientX, y: event.clientY, time: event.timeStamp };
      } else if (!nearBottom) hideLater();
    }
    function touchEnd(event) {
      if (event.pointerType !== 'touch' || !touchStart) return;
      const start = touchStart;
      touchStart = null;
      const target = event.target;
      if (!target.closest('.pdf-viewer') || target.closest('a, button, input, select, textarea, [role="button"]')) return;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;
      if (event.timeStamp - start.time > 450 || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
      show();
      hideLater();
    }
    function keyboard(event) {
      if (event.key === 'Tab') { keyboardNavigationRef.current = true; show(); hideLater(); }
      if (event.key === 'Escape') onBack();
    }
    function focusOut() { hideLater(); }
    hideLater();
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerdown', touch);
    window.addEventListener('pointerup', touchEnd);
    window.addEventListener('keydown', keyboard);
    navigation.addEventListener('focusin', show);
    navigation.addEventListener('focusout', focusOut);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('pointerup', touchEnd);
      window.removeEventListener('keydown', keyboard);
      navigation.removeEventListener('focusin', show);
      navigation.removeEventListener('focusout', focusOut);
    };
  }, [pdf, onBack]);

  useEffect(() => {
    if (!zoomNotice) return;
    const timer = setTimeout(() => setZoomNotice(false), 1400);
    return () => clearTimeout(timer);
  }, [zoom, zoomNotice]);

  const renderedPageNumber = displayedPage?.pageNumber;
  useLayoutEffect(() => {
    if (!renderedPageNumber) return;
    containerRef.current.scrollTop = 0;
    containerRef.current.scrollLeft = 0;
  }, [renderedPageNumber]); // Zooming preserves the reading position.

  function changeZoom(step) {
    const next = Math.min(2.5, Math.max(0.5, zoom + step));
    if (next !== zoom) { setZoom(next); setZoomNotice(true); }
  }

  function handleLoadSuccess(loadedPdf) {
    setPdf(loadedPdf);
    onPdfLoaded(document.id, loadedPdf.numPages);
  }

  const total = pdf?.numPages ?? document.totalPages;
  const pageNumber = Math.min(Math.max(document.lastPage, 1), total);

  useEffect(() => {
    function navigateWithKeyboard(event) {
      if (!pdf || event.defaultPrevented || event.isComposing ||
          event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const target = event.target;
      if (target instanceof Element && (target.isContentEditable ||
          target.closest('input, textarea, select, [role="textbox"], [role="slider"], [role="spinbutton"]'))) return;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;
      event.preventDefault();
      if (isSaving || event.repeat) return;
      const nextPage = pageNumber + (event.key === 'ArrowRight' ? 1 : -1);
      if (nextPage >= 1 && nextPage <= total) onUpdatePage(document.id, nextPage);
    }
    window.addEventListener('keydown', navigateWithKeyboard);
    return () => window.removeEventListener('keydown', navigateWithKeyboard);
  }, [pdf, isSaving, pageNumber, total, document.id, onUpdatePage]);

  const renderKey = pageNumber + ':' + width + ':' + zoom + ':' + retry;
  const requestedPage = { key: renderKey, pageNumber, width, zoom };
  const pages = displayedPage?.key === renderKey
    ? [displayedPage]
    : [...(displayedPage ? [displayedPage] : []), requestedPage];

  useEffect(() => { requestedPageRef.current = renderKey; }, [renderKey]);

  function goToPage(value) {
    if (!isSaving && Number.isInteger(value) && value >= 1 && value <= total) onUpdatePage(document.id, value);
  }

  function retryDocument() {
    setPdf(null);
    setDisplayedPage(null);
    setFailedPage(null);
    setLoadError(false);
    setRetry(value => value + 1);
  }

  const loadingMessage = <PageSkeleton />;
  const documentError = <div role="alert" className="status-message error reader-error">
    <p>No se pudo abrir el PDF.</p>
    <button onClick={retryDocument}><RotateCw size={18} /> Reintentar</button>
  </div>;

  return <main className="immersive-reader">
      <header className="reader-topbar">
        <div className="reader-back"><button onClick={onBack} title="Volver a la biblioteca" aria-label="Volver a la biblioteca"><ArrowLeft size={21} /></button></div>
        <h1 title={document.title}>{document.title}</h1>
        <div className="reader-zoom" role="group" aria-label="Zoom">
          <button title={'Alejar (zoom actual: ' + Math.round(zoom * 100) + '%)'} aria-label="Alejar" disabled={!pdf || zoom <= 0.5} onClick={() => changeZoom(-0.25)}><ZoomOut size={21} /></button>
          <button title={'Acercar (zoom actual: ' + Math.round(zoom * 100) + '%)'} aria-label="Acercar" disabled={!pdf || zoom >= 2.5} onClick={() => changeZoom(0.25)}><ZoomIn size={21} /></button>
        </div>
      </header>
      {zoomNotice && <output className="reader-zoom-notice" role="status">{Math.round(zoom * 100)}%</output>}
      {errorMessage && <p role="alert" className="status-message error reader-storage-error">{errorMessage}</p>}
      <nav ref={navigationRef} className={'reader-bottombar' + (navigationVisible ? '' : ' is-hidden')} aria-label="Navegacion del PDF">
        <button title="Anterior" aria-label="Pagina anterior" disabled={!pdf || isSaving || document.lastPage <= 1} onClick={() => goToPage(document.lastPage - 1)}><ChevronLeft size={24} /></button>
        <span className="reader-page-count" aria-live="polite" aria-atomic="true">{pageNumber} <span>/</span> {total}</span>
        <button title="Siguiente" aria-label="Pagina siguiente" disabled={!pdf || isSaving || document.lastPage >= total} onClick={() => goToPage(document.lastPage + 1)}><ChevronRight size={24} /></button>
      </nav>
      <div ref={containerRef} className="pdf-viewer pdf-canvas-viewer">
        {pdf && displayedPage && displayedPage.key !== renderKey && failedPage !== renderKey &&
          <div className="reader-render-status" role="status" aria-label="Cargando pagina"><LoaderCircle size={18} className="loading-spinner" /></div>}
        <Document
          key={retry}
          file={document.file}
          suspense={false}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={() => { setLoadError(true); setPdf(null); }}
          onSourceError={() => { setLoadError(true); setPdf(null); }}
          onItemClick={({ pageNumber }) => goToPage(pageNumber)}
          externalLinkTarget="_blank"
          loading={loadError ? documentError : loadingMessage}
          error={documentError}
          noData={<p role="alert" className="status-message error">PDF no disponible.</p>}
        >
          {failedPage === renderKey && <div role="alert" className="status-message error reader-error">
            <p>No se pudo mostrar la pagina.</p>
            <button onClick={() => { setFailedPage(null); setRetry(value => value + 1); }}><RotateCw size={18} /> Reintentar</button>
          </div>}
          <div className="pdf-page-stage" aria-busy={displayedPage?.key !== renderKey}>
            {pages.map(page => {
              const pending = displayedPage && displayedPage.key !== page.key;
              return <div key={page.key} className={pending ? 'pdf-page-pending' : 'pdf-page-visible'} aria-hidden={pending ? true : undefined}>
                <Page
                  pageNumber={page.pageNumber}
                  width={page.width}
                  scale={page.zoom}
                  devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)}
                  onRenderSuccess={() => {
                    if (requestedPageRef.current === page.key) setDisplayedPage(page);
                  }}
                  onLoadError={() => setFailedPage(page.key)}
                  onRenderError={() => setFailedPage(page.key)}
                  loading={displayedPage ? null : <PageSkeleton />}
                  error={<p role="alert" className="status-message error">No se pudo mostrar la pagina.</p>}
                />
              </div>;
            })}
          </div>
        </Document>
      </div>
  </main>;
}

export default Reader;
