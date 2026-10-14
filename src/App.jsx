import { useEffect, useState } from 'react';

import Library from './pages/Library';
import Reader from './pages/Reader';

import {
  createDocumentFromFile,
  deleteStoredDocument,
  getStoredDocuments,
  saveDocument,
  updateStoredDocumentProgress,
} from './services/documentService';
import {
  getAllProgress,
  saveDocumentProgress,
} from './services/progressService';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDocuments() {
      try {
        const savedProgress = getAllProgress();
        const storedDocuments = await getStoredDocuments();

        if (!isMounted) {
          return;
        }

        setDocuments(
          storedDocuments.map((document) => ({
            ...document,
            lastPage: savedProgress[document.id] ?? document.lastPage,
          }))
        );
      } catch (error) {
        console.error('Error al cargar documentos:', error);

        if (isMounted) {
          setErrorMessage('No se pudo cargar la biblioteca local.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleRead(document) {
    setSelectedDocument(document);
  }

  function handleBackToLibrary() {
    setSelectedDocument(null);
  }

  async function handleAddDocuments(files) {
    setErrorMessage('');

    try {
      const newDocuments = await Promise.all(
        files.map((file) => createDocumentFromFile(file))
      );

      await Promise.all(newDocuments.map((document) => saveDocument(document)));

      setDocuments((currentDocuments) => [
        ...newDocuments,
        ...currentDocuments,
      ]);
    } catch (error) {
      console.error('Error al agregar PDF:', error);
      setErrorMessage(error.message || 'No se pudo agregar el PDF.');
    }
  }

  function handleUpdatePage(documentId, newPage) {
    saveDocumentProgress(documentId, newPage);
    updateStoredDocumentProgress(documentId, newPage).catch((error) => {
      console.error('Error al guardar progreso:', error);
      setErrorMessage('No se pudo guardar el progreso local.');
    });

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => {
        if (document.id === documentId) {
          return {
            ...document,
            lastPage: newPage,
            updatedAt: new Date().toISOString(),
          };
        }

        return document;
      })
    );

    setSelectedDocument((currentDocument) => {
      if (currentDocument?.id !== documentId) {
        return currentDocument;
      }

      return {
        ...currentDocument,
        lastPage: newPage,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  async function handleDeleteDocument(documentId) {
    setErrorMessage('');

    try {
      await deleteStoredDocument(documentId);

      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document.id !== documentId)
      );

      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error('Error al eliminar PDF:', error);
      setErrorMessage('No se pudo eliminar el PDF.');
    }
  }

  if (selectedDocument) {
    return (
      <Reader
        document={selectedDocument}
        onBack={handleBackToLibrary}
        onUpdatePage={handleUpdatePage}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <Library
      documents={documents}
      isLoading={isLoading}
      errorMessage={errorMessage}
      onAddDocuments={handleAddDocuments}
      onRead={handleRead}
      onDeleteDocument={handleDeleteDocument}
    />
  );
}

export default App;
