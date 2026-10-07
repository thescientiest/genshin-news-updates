'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught an error:', error);
  }, [error]);

  return (
    <div className="not-found-container">
      <div className="icon" style={{ color: '#ef4444' }}>⚠️</div>
      <h1>Connection Interrupted</h1>
      <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
        The database connection was interrupted or is currently reconnecting. 
        If this is an idle cold-start, wait a couple of seconds and try refreshing.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          className="home-btn"
          style={{ cursor: 'pointer', border: 'none' }}
        >
          Try Again
        </button>
        <Link href="/" className="home-btn" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
