import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string; // e.g. "" for home (/page/[n]), or "/tags/music"
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    if (page === 1) {
      return basePath === '' ? '/' : basePath;
    }
    return `${basePath}/page/${page}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="pagination-container" aria-label="Article navigation">
      {currentPage > 1 ? (
        <Link href={getPageUrl(currentPage - 1)} className="page-btn prev-btn">
          ← Previous
        </Link>
      ) : (
        <span className="page-btn disabled">← Previous</span>
      )}

      <div className="page-numbers">
        {pages.map((p) => {
          const isCurrent = p === currentPage;
          return isCurrent ? (
            <span key={p} className="page-number active" aria-current="page">
              {p}
            </span>
          ) : (
            <Link key={p} href={getPageUrl(p)} className="page-number">
              {p}
            </Link>
          );
        })}
      </div>

      {currentPage < totalPages ? (
        <Link href={getPageUrl(currentPage + 1)} className="page-btn next-btn">
          Next →
        </Link>
      ) : (
        <span className="page-btn disabled">Next →</span>
      )}
    </nav>
  );
}
