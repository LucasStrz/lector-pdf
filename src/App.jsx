import { useState } from 'react';
import Library from './pages/Library';
import Reader from './pages/Reader';

function App() {
  const [documents, setDocuments] = useState([
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
  ]);

  const [selectedDocument, setSelectedDocument] = useState(null);

  function handleRead(document) {
    setSelectedDocument(document);
  }

  function handleBackToLibrary() {
    setSelectedDocument(null);
  }

  function handleUpdatePage(documentId, newPage) {
    const updatedDocuments = documents.map((document) => {
      if (document.id === documentId) {
        return {
          ...document,
          lastPage: newPage,
        };
      }

      return document;
    });

    setDocuments(updatedDocuments);

    const updatedSelectedDocument = updatedDocuments.find(
      (document) => document.id === documentId
    );

    setSelectedDocument(updatedSelectedDocument);
  }

  if (selectedDocument) {
    return (
      <Reader
        document={selectedDocument}
        onBack={handleBackToLibrary}
        onUpdatePage={handleUpdatePage}
      />
    );
  }

  return <Library documents={documents} onRead={handleRead} />;
}

export default App;