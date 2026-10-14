import { useRef } from 'react';

import DocumentCard from '../components/DocumentCard';

function Library({
  documents,
  isLoading,
  isImporting,
  importMessage,
  errorMessage,
  onAddDocuments,
  onRead,
  onDeleteDocument,
}) {
  const fileInputRef = useRef(null);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length > 0) {
      onAddDocuments(selectedFiles);
    }

    event.target.value = '';
  }

  return (
    <main className="page">
      <section className="library-container">
        <div className="library-header">
          <div>
            <h1>Mi biblioteca PDF</h1>
            <p>
              Selecciona un documento para continuar leyendo desde tu ultima
              pagina guardada.
            </p>
          </div>

          <button disabled={isImporting || isLoading} onClick={openFilePicker}>{isImporting ? 'Importando...' : 'Agregar PDF'}</button>
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={isImporting || isLoading}
            onChange={handleFileChange}
          />
        </div>

        {importMessage && <p role="status" className="status-message">{importMessage}</p>}
        {errorMessage && <p role="alert" className="status-message error" style={{ whiteSpace: 'pre-line' }}>{errorMessage}</p>}

        {isLoading ? (
          <p className="status-message">Cargando biblioteca...</p>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <h2>Aun no hay PDFs guardados</h2>
            <p>Agrega tu primer documento para empezar a leer.</p>
            <button disabled={isImporting} onClick={openFilePicker}>Seleccionar PDF</button>
          </div>
        ) : (
          <div className="document-list">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                title={document.title}
                fileName={document.fileName}
                totalPages={document.totalPages}
                lastPage={document.lastPage}
                onRead={() => onRead(document)}
                onDelete={() => onDeleteDocument(document.id)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Library;
