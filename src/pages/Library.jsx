import DocumentCard from '../components/DocumentCard';

function Library({ documents, onRead }) {
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

          <button>Agregar PDF</button>
        </div>

        <div className="document-list">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              title={document.title}
              totalPages={document.totalPages}
              lastPage={document.lastPage}
              onRead={() => onRead(document)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Library;