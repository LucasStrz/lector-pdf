import { ArrowUpRight, MoreHorizontal } from 'lucide-react';
import DocumentThumbnail from './DocumentThumbnail';

function DocumentCard({ document, onRead, onMenu }) {
  const { title, totalPages, lastPage, file } = document;
  const progress = Math.min(Math.round((lastPage / totalPages) * 100), 100);
  return <article className="document-card">
    <div className="card-preview">
      <DocumentThumbnail file={file} title={title} />
      <span className="pdf-badge">PDF</span>
      {progress === 100 && <span className="completed-badge">Completado</span>}
    </div>
    <div className="card-body">
      <h2 title={title}>{title}</h2>
      <div className="card-progress-label"><span>Pagina {lastPage} de {totalPages}</span><strong>{progress}%</strong></div>
      <div className="progress-bar" role="progressbar" aria-label={'Progreso de ' + title}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
        <div className="progress-fill" style={{ width: progress + '%' }} />
      </div>
      <div className="document-actions">
        <button onClick={onRead}>Leer <ArrowUpRight size={18} /></button>
        <button className="button-secondary icon-button" title="Menu PDF" aria-label={'Menu PDF de ' + title}
          aria-haspopup="dialog" onClick={onMenu}><MoreHorizontal size={22} /></button>
      </div>
    </div>
  </article>;
}

export default DocumentCard;
