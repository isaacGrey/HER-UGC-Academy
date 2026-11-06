import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="card status-page">
      <span className="eyebrow">404 · A DIFFERENT DIRECTION</span>
      <h1>This page isn’t here.</h1>
      <p>The link may be outdated, or the content is no longer available.</p>
      <Link href="/" className="button">
        Back to your workspace
      </Link>
    </main>
  );
}
