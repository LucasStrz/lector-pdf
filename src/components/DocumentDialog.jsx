import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, FileText, HardDrive, Pencil, Save, Trash2, X, LoaderCircle } from 'lucide-react';
import { storageErrorMessage } from '../services/documentService';
import DocumentThumbnail from './DocumentThumbnail';

function formatDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return 'No disponible';
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return 'No disponible';
  return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function DocumentDialog({ document, onClose, onRename, onDelete, onRead }) {
  const dialogRef = useRef(null);
  const submittingRef = useRef(false);
  const [mode, setMode] = useState('details');
  const [title, setTitle] = useState(document.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const cancelRef = useRef(null);
  const progress = Math.min(100, Math.round(document.lastPage / document.totalPages * 100));

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (mode === 'rename') { inputRef.current?.focus(); inputRef.current?.select(); }
    if (mode === 'delete') cancelRef.current?.focus();
  }, [mode]);

  function changeMode(next) {
    setError('');
    setTitle(document.title);
    setMode(next);
  }

  async function submit(event) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (mode === 'rename' && !title.trim()) { setError('Escribe un titulo.'); return; }
    submittingRef.current = true;
    setBusy(true);
    setError('');
    try {
      if (mode === 'rename') { await onRename(document.id, title.trim()); setMode('details'); }
      else { await onDelete(document.id); onClose(); }
    } catch (failure) { setError(storageErrorMessage(failure)); }
    finally { submittingRef.current = false; setBusy(false); }
  }

  return <dialog ref={dialogRef} className="document-dialog" aria-labelledby="document-dialog-title"
    onCancel={event => { event.preventDefault(); if (!submittingRef.current) onClose(); }}>
    <div className="dialog-header">
      <div className="dialog-heading">
        {mode !== 'details' && <button className="button-secondary icon-button" title="Volver a detalles" aria-label="Volver a detalles" disabled={busy} onClick={() => changeMode('details')}><ArrowLeft size={18} /></button>}
        <h2 id="document-dialog-title">{mode === 'details' ? 'Tu documento' : mode === 'rename' ? 'Cambiar titulo' : 'Eliminar PDF'}</h2>
      </div>
      <button className="button-secondary icon-button" title="Cerrar" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={20} /></button>
    </div>
    {mode === 'details' ? <>
      <div className="document-summary">
        <DocumentThumbnail file={document.file} title={document.title} />
        <div><span className="eyebrow">EN TU BIBLIOTECA</span><h3>{document.title}</h3>
          <p>{document.lastPage} / {document.totalPages} paginas · {progress}% leido</p>
          <div className="progress-bar"><div className="progress-fill" style={{ width: progress + '%' }} /></div>
        </div>
      </div>
      <dl className="document-metadata">
        <div><dt><Pencil size={16} />Titulo personal</dt><dd>{document.title}</dd></div>
        <div><dt><FileText size={16} />Archivo original</dt><dd>{document.fileName}</dd></div>
        <div><dt><HardDrive size={16} />Tamano y formato</dt><dd>{formatSize(document.file?.size)} · PDF</dd></div>
        <div><dt><CalendarDays size={16} />Agregado</dt><dd>{formatDate(document.createdAt)}</dd></div>
        <div><dt><CalendarDays size={16} />Ultima actualizacion</dt><dd>{formatDate(document.updatedAt)}</dd></div>
        <div><dt><HardDrive size={16} />Almacenamiento</dt><dd>En este dispositivo</dd></div>
      </dl>
      <div className="document-menu-actions">
        <button onClick={() => { onClose(); onRead(document); }}>Leer documento <ArrowUpRight size={18} /></button>
        <button className="button-secondary" onClick={() => changeMode('rename')}><Pencil size={18} />Cambiar titulo</button>
        <button className="button-danger-quiet" onClick={() => changeMode('delete')}><Trash2 size={18} />Eliminar de la biblioteca</button>
      </div>
    </> : <form onSubmit={submit}>
      {mode === 'rename' ? <label className="title-field">Titulo personal
        <input ref={inputRef} required maxLength={120} value={title} disabled={busy} onChange={event => setTitle(event.target.value)} />
      </label> : <p className="delete-warning">Se eliminaran <strong>{document.title}</strong> y su progreso de este dispositivo. Esta accion no se puede deshacer.</p>}
      {error && <p role="alert" className="status-message error">{error}</p>}
      <div className="dialog-actions">
        <button ref={cancelRef} type="button" className="button-secondary" disabled={busy} onClick={() => changeMode('details')}>Cancelar</button>
        <button className={mode === 'delete' ? 'button-danger' : ''} disabled={busy || (mode === 'rename' && !title.trim())}>
          {busy ? <LoaderCircle size={18} className="loading-spinner" /> : mode === 'delete' ? <Trash2 size={18} /> : <Save size={18} />}
          {busy ? 'Procesando...' : mode === 'delete' ? 'Eliminar' : 'Guardar'}
        </button>
      </div>
    </form>}
  </dialog>;
}

export default DocumentDialog;
