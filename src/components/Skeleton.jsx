export function PageSkeleton() {
  return <div className="page-skeleton" role="status" aria-label="Cargando pagina">
    <div aria-hidden="true" className="skeleton-paper">
      <div className="skeleton skeleton-heading" />
      {Array.from({ length: 9 }, (_, index) => <div key={index} className="skeleton skeleton-line" />)}
      <div className="skeleton skeleton-figure" />
      {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton skeleton-line" />)}
    </div>
  </div>;
}

export function LibrarySkeleton() {
  return <div className="document-list" role="status" aria-label="Cargando biblioteca" aria-busy="true">
    {Array.from({ length: 6 }, (_, index) => <div key={index} className="document-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-cover" />
      <div className="card-body">
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-button" />
      </div>
    </div>)}
  </div>;
}
