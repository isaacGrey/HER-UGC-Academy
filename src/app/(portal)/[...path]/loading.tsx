export default function LoadingContent() {
  return (
    <div aria-label="Loading content" aria-busy="true" className="stack">
      <div className="card skeleton" />
      <div className="grid">
        <div className="card skeleton" />
        <div className="card skeleton" />
        <div className="card skeleton" />
      </div>
    </div>
  );
}
