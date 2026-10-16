import { useRef, useState } from 'react';
import { Search, X, Plus, BookOpen, HardDrive, Files } from 'lucide-react';

import DocumentCard from '../components/DocumentCard';
import DocumentDialog from '../components/DocumentDialog';
import { LibrarySkeleton } from '../components/Skeleton';

function searchable(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

function Library({
  documents,
  isLoading,
  isImporting,
  importMessage,
  errorMessage,
  onAddDocuments,
  onRead,
  onDeleteDocument,
  onRenameDocument,
  viewState,
  onViewStateChange,
}) {
  const fileInputRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const searchRef = useRef(null);
  const [menuId, setMenuId] = useState(null);
  const menuDocument = documents.find(document => document.id === menuId);
  const { query, sort } = viewState;
  const needle = searchable(query.trim());
  const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
  const visibleDocuments = documents.filter(document =>
    searchable(document.title + ' ' + document.fileName).includes(needle)
  ).sort((first, second) => {
    let difference = 0;
    if (sort === 'title') difference = collator.compare(first.title, second.title);
    if (sort === 'title-desc') difference = collator.compare(second.title, first.title);
    if (sort === 'progress') difference = second.lastPage / second.totalPages - first.lastPage / first.totalPages;
    if (sort === 'progress-asc') difference = first.lastPage / first.totalPages - second.lastPage / second.totalPages;
    if (sort === 'recent') difference = (second.updatedAt || '').localeCompare(first.updatedAt || '');
    if (sort === 'added') difference = (second.createdAt || '').localeCompare(first.createdAt || '');
    return difference || collator.compare(first.title, second.title) || String(first.id).localeCompare(String(second.id));
  });

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function closeMenu() {
    setMenuId(null);
    requestAnimationFrame(() => {
      const target = menuTriggerRef.current?.isConnected ? menuTriggerRef.current : searchRef.current;
      target?.focus({ preventScroll: true });
    });
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
        <header className="app-header">
          <div className="app-brand"><span className="brand-mark"><BookOpen size={21} /></span>Lector</div>
          <span className="local-label"><HardDrive size={14} />En este dispositivo</span>
        </header>
        <div className="library-header">
          <div>
            <h1>Mi biblioteca</h1>
          </div>

          <button disabled={isImporting || isLoading} onClick={openFilePicker}><Plus size={18} />{isImporting ? 'Importando...' : 'Agregar PDF'}</button>
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

        <div className="library-toolbar">
          <div className="library-search">
            <Search size={18} aria-hidden="true" />
            <input ref={searchRef} type="search" aria-label="Buscar documentos" placeholder="Buscar por titulo o archivo"
              value={query} onChange={event => onViewStateChange({ ...viewState, query: event.target.value })} />
            {query && <button className="button-secondary icon-button" title="Limpiar busqueda" aria-label="Limpiar busqueda"
              onClick={() => onViewStateChange({ ...viewState, query: '' })}><X size={18} /></button>}
          </div>
          <label className="library-sort">Ordenar
            <select value={sort} onChange={event => onViewStateChange({ ...viewState, sort: event.target.value })}>
              <option value="recent">Modificados recientemente</option>
              <option value="added">Agregados recientemente</option>
              <option value="title">Titulo: A a Z</option>
              <option value="title-desc">Titulo: Z a A</option>
              <option value="progress">Mayor progreso</option>
              <option value="progress-asc">Menor progreso</option>
            </select>
          </label>
        </div>
        {!isLoading && <div className="library-results-header">
          <p role="status" className="library-count"><Files size={16} />{visibleDocuments.length} de {documents.length} documentos</p>
          
        </div>}

        {isLoading ? (
          <LibrarySkeleton />
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <h2>Aun no hay PDFs guardados</h2>
            <p>Agrega tu primer documento para empezar a leer.</p>
            <button disabled={isImporting} onClick={openFilePicker}>Seleccionar PDF</button>
          </div>
        ) : visibleDocuments.length === 0 ? (
          <div className="library-no-results">
            <h2>Sin resultados</h2>
            <button className="button-secondary" onClick={() => onViewStateChange({ ...viewState, query: '' })}>Limpiar busqueda</button>
          </div>
        ) : (
          <div className="document-list">
            {visibleDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onRead={() => onRead(document)}
                onMenu={event => { menuTriggerRef.current = event.currentTarget; setMenuId(document.id); }}
              />
            ))}
          </div>
        )}
      </section>
      {menuDocument && <DocumentDialog key={menuDocument.id} document={menuDocument}
        onClose={closeMenu} onRename={onRenameDocument} onDelete={onDeleteDocument} onRead={onRead} />}
    </main>
  );
}

export default Library;
