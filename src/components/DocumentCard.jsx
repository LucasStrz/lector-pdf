function DocumentCard({
  title,
  fileName,
  totalPages,
  lastPage,
  onRead,
  onDelete,
}) {
  const progress = Math.min(Math.round((lastPage / totalPages) * 100), 100);

  return (
    <article className="document-card">
      <div>
        <h2>{title}</h2>
        <small>{fileName}</small>
        <p>
          Pagina {lastPage} de {totalPages}
        </p>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <small>{progress}% leido</small>
      </div>

      <div className="document-actions">
        <button onClick={onRead}>Leer</button>
        <button className="button-secondary" onClick={onDelete}>
          Eliminar
        </button>
      </div>
    </article>
  );
}

export default DocumentCard;
