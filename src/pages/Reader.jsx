function Reader({ document, onBack, onUpdatePage }) {
  function goToPreviousPage() {
    if (document.lastPage > 1) {
      onUpdatePage(document.id, document.lastPage - 1);
    }
  }

  function goToNextPage() {
    if (document.lastPage < document.totalPages) {
      onUpdatePage(document.id, document.lastPage + 1);
    }
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

        <div className="pdf-placeholder">
          <h2>Pagina {document.lastPage}</h2>
          <p>
            Aqui se mostrara el contenido real del PDF en una proxima etapa.
          </p>
        </div>

        <div className="reader-controls">
          <button
            onClick={goToPreviousPage}
            disabled={document.lastPage === 1}
          >
            Anterior
          </button>

          <span>
            {document.lastPage} / {document.totalPages}
          </span>

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