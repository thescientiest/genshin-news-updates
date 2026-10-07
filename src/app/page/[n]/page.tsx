import { notFound } from 'next/navigation';
import { query, Article } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/config';
import ArticleCard from '@/components/ArticleCard';
import Pagination from '@/components/Pagination';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ n: string }>;
}

export default async function PaginatedArticlesPage({ params }: PageProps) {
  const { n } = await params;
  const pageNum = parseInt(n, 10);

  // Validate page number
  if (isNaN(pageNum) || pageNum < 1) {
    notFound();
  }

  // Count total published articles
  const countRows = await query<{ count: string }>(
    "SELECT COUNT(*) FROM articles WHERE status = 'published'"
  );
  const totalCount = parseInt(countRows[0]?.count || '0', 10);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Return 404 if page exceeds totalPages
  if (pageNum > totalPages) {
    notFound();
  }

  const offset = (pageNum - 1) * PAGE_SIZE;

  // Query articles for this page
  const articles = await query<Article>(
    `SELECT * FROM articles 
     WHERE status = 'published' 
     ORDER BY video_published_at DESC 
     LIMIT $1 OFFSET $2`,
    [PAGE_SIZE, offset]
  );

  return (
    <div>
      <section className="articles-section">
        <div className="section-header">
          <h1>
            Articles <span className="page-indicator">— Page {pageNum}</span>
          </h1>
          <span className="count-badge">
            Showing {offset + 1}–{Math.min(offset + articles.length, totalCount)} of {totalCount}
          </span>
        </div>

        <div className="articles-grid">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        <Pagination currentPage={pageNum} totalPages={totalPages} basePath="" />
      </section>
    </div>
  );
}
