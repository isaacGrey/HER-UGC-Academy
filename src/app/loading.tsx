export default function Loading() {
  return (
    <main
      id="main"
      className="main"
      aria-label="Loading portal"
      aria-busy="true"
    >
      <div className="stack">
        <div className="card skeleton" />
        <div className="grid">
          <div className="card skeleton" />
          <div className="card skeleton" />
          <div className="card skeleton" />
        </div>
      </div>
    </main>
  );
}
