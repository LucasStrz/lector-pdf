import { useRef } from 'react';

import DocumentCard from '../components/DocumentCard';

function Library({
  documents,
  isLoading,
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

          <button onClick={openFilePicker}>Agregar PDF</button>
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={handleFileChange}
          />
        </div>

        {errorMessage && <p className="status-message error">{errorMessage}</p>}

        {isLoading ? (
          <p className="status-message">Cargando biblioteca...</p>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <h2>Aun no hay PDFs guardados</h2>
            <p>Agrega tu primer documento para empezar a leer.</p>
            <button onClick={openFilePicker}>Seleccionar PDF</button>
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
