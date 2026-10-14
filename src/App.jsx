import { useEffect, useRef, useState } from 'react';
import Library from './pages/Library';
import Reader from './pages/Reader';
import {
  createDocumentFromFile, deleteStoredDocument, getStoredDocuments,
  saveDocument, storageErrorMessage, updateStoredDocumentProgress,
} from './services/documentService';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const busyRef = useRef(false);
  const queueRef = useRef(Promise.resolve());
  const pendingRef = useRef(0);

  useEffect(() => {
    let active = true;
    getStoredDocuments().then(items => { if (active) setDocuments(items); })
      .catch(error => { if (active) setErrorMessage(storageErrorMessage(error)); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function warnBeforeClose(event) {
      if (busyRef.current || pendingRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', warnBeforeClose);
    return () => window.removeEventListener('beforeunload', warnBeforeClose);
  }, []);

  function applySavedDocument(updated) {
    setDocuments(items => items.map(item => item.id === updated.id ? updated : item));
    setSelectedDocument(item => item?.id === updated.id ? updated : item);
  }

  function persistProgress(id, page, totalPages) {
    pendingRef.current++;
    setIsSaving(true);
    setErrorMessage('');
    // Serialize writes so older updates cannot overwrite newer progress.
    const operation = queueRef.current.then(() => updateStoredDocumentProgress(id, page, totalPages));
    queueRef.current = operation.catch(() => {});
    operation.then(applySavedDocument).catch(error => setErrorMessage(storageErrorMessage(error)))
      .finally(() => {
        pendingRef.current--;
        setIsSaving(pendingRef.current > 0);
      });
  }

  async function handleAddDocuments(files) {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsImporting(true);
    setErrorMessage('');
    setImportMessage('');
    let added = 0;
    const failures = [];
    try {
      for (const file of files) {
        try {
          const document = await createDocumentFromFile(file);
          await saveDocument(document);
          setDocuments(items => [document, ...items]);
          added++;
        } catch (error) {
          failures.push(file.name + ': ' + storageErrorMessage(error));
        }
      }
      setImportMessage(added + ' PDF(s) guardados. ' + failures.length + ' archivo(s) fallidos.');
      setErrorMessage(failures.join('\n'));
    } finally {
      busyRef.current = false;
      setIsImporting(false);
    }
  }

  async function handleDeleteDocument(id) {
    setErrorMessage('');
    try {
      await deleteStoredDocument(id);
      setDocuments(items => items.filter(item => item.id !== id));
    } catch (error) { setErrorMessage(storageErrorMessage(error)); }
  }

  if (selectedDocument) return <Reader
    key={selectedDocument.id}
    document={selectedDocument}
    isSaving={isSaving}
    onPdfLoaded={(id, total) => {
      if (selectedDocument.totalPages !== total ||
          selectedDocument.lastPage < 1 || selectedDocument.lastPage > total) {
        persistProgress(id, undefined, total);
      }
    }}
    onBack={() => setSelectedDocument(null)}
    onUpdatePage={(id, page) => persistProgress(id, page)}
    errorMessage={errorMessage}
  />;

  return <Library documents={documents} isLoading={isLoading}
    isImporting={isImporting} importMessage={importMessage}
    errorMessage={errorMessage} onAddDocuments={handleAddDocuments}
    onRead={document => { setErrorMessage(''); setSelectedDocument(document); }}
    onDeleteDocument={handleDeleteDocument} />;
}

export default App;
