function DocumentCard({ title, totalPages, lastPage, onRead }) {
  const progress = Math.round((lastPage / totalPages) * 100);

  return (
    <article className="document-card">
      <div>
        <h2>{title}</h2>
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

      <button onClick={onRead}>Leer</button>
    </article>
  );
}

export default DocumentCard;