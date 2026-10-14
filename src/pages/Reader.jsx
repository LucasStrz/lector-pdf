import { useEffect, useMemo } from 'react';

function Reader({ document, onBack, onUpdatePage, errorMessage }) {
  const fileUrl = useMemo(() => {
    if (!document.file) {
      return '';
    }

    return URL.createObjectURL(document.file);
  }, [document.file]);

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  const pdfUrl = useMemo(() => {
    if (!fileUrl) {
      return '';
    }

    return `${fileUrl}#page=${document.lastPage}&toolbar=1&navpanes=0`;
  }, [document.lastPage, fileUrl]);

  function goToPage(page) {
    const nextPage = Math.min(Math.max(page, 1), document.totalPages);

    onUpdatePage(document.id, nextPage);
  }

  function goToPreviousPage() {
    if (document.lastPage > 1) {
      goToPage(document.lastPage - 1);
    }
  }

  function goToNextPage() {
    if (document.lastPage < document.totalPages) {
      goToPage(document.lastPage + 1);
    }
  }

  function handlePageSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    goToPage(Number(formData.get('page')));
  }

  return (
    <main className="page">
      <section className="reader-container">
        <div className="reader-header">
          <button onClick={onBack}>Volver</button>

          <div>
            <h1>{document.title}</h1>
            <p>
              Pagina {document.lastPage} de {document.totalPages}
            </p>
          </div>
        </div>

        {errorMessage && <p className="status-message error">{errorMessage}</p>}

        <div className="pdf-viewer">
          {pdfUrl ? (
            <iframe
              key={`${document.id}-${document.lastPage}`}
              title={document.title}
              src={pdfUrl}
            />
          ) : (
            <div className="pdf-placeholder">
              <h2>PDF no disponible</h2>
              <p>Vuelve a agregar este documento desde la biblioteca.</p>
            </div>
          )}
        </div>

        <div className="reader-controls">
          <button
            onClick={goToPreviousPage}
            disabled={document.lastPage === 1}
          >
            Anterior
          </button>

          <form className="page-form" onSubmit={handlePageSubmit}>
            <label htmlFor="page-number">Pagina</label>
            <input
              key={document.lastPage}
              id="page-number"
              name="page"
              type="number"
              min="1"
              max={document.totalPages}
              defaultValue={document.lastPage}
            />
            <span>/ {document.totalPages}</span>
          </form>

          <button
            onClick={goToNextPage}
            disabled={document.lastPage === document.totalPages}
          >
            Siguiente
          </button>
        </div>
      </section>
    </main>
  );
}

export default Reader;
