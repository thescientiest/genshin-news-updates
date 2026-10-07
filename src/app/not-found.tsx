import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="icon">✦</div>
      <h1>404 — Lost in Teyvat</h1>
      <p>
        The dispatch, page number, or article you are looking for does not exist in our archives.
      </p>
      <Link href="/" className="home-btn">
        Return to Dispatch Headquarters
      </Link>
    </div>
  );
}
