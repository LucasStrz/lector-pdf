import DocumentCard from '../components/DocumentCard';

function Library() {
  const documents = [
    {
      id: 1,
      title: 'Manual de React',
      totalPages: 120,
      lastPage: 15,
    },
    {
      id: 2,
      title: 'Guia de JavaScript',
      totalPages: 80,
      lastPage: 8,
    },
    {
      id: 3,
      title: 'Libro de Base de Datos',
      totalPages: 200,
      lastPage: 64,
    },
  ];

  function handleRead(document) {
    alert(`Abriendo: ${document.title}`);
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

          <button>Agregar PDF</button>
        </div>

        <div className="document-list">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              title={document.title}
              totalPages={document.totalPages}
              lastPage={document.lastPage}
              onRead={() => handleRead(document)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Library;