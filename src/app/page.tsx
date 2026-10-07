import { query, Article } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/config';
import ArticleCard from '@/components/ArticleCard';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Query published articles count
  const countRows = await query<{ count: string }>(
    "SELECT COUNT(*) FROM articles WHERE status = 'published'"
  );
  const totalCount = parseInt(countRows[0]?.count || '0', 10);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Query Page 1 with LIMIT and OFFSET
  const articles = await query<Article>(
    `SELECT * FROM articles 
     WHERE status = 'published' 
     ORDER BY video_published_at DESC 
     LIMIT $1 OFFSET $2`,
    [PAGE_SIZE, 0]
  );

  return (
    <div>
      <section className="hero-section">
        <div className="hero-badge">✦ Dynamic PostgreSQL Feed</div>
        <h1 className="hero-title">Official Genshin Impact Dispatches</h1>
        <p className="hero-subtitle">
          Real-time articles, story cutscene breakdowns, and event analysis generated directly from official YouTube broadcasts.
        </p>
      </section>

      <section className="articles-section">
        <div className="section-header">
          <h2>Published Articles</h2>
          <span className="count-badge">
            {totalCount} Total ({articles.length} on this page)
          </span>
        </div>

        {articles.length > 0 ? (
          <div className="articles-grid">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h3>No Published Articles Yet</h3>
            <p>
              Articles are added automatically as new videos drop!
            </p>
          </div>
        )}

        <Pagination currentPage={1} totalPages={totalPages} basePath="" />
      </section>
    </div>
  );
}
