import Link from 'next/link';
import { query, Article } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/config';
import ArticleCard from '@/components/ArticleCard';
import Pagination from '@/components/Pagination';

export const revalidate = 60;

const FEATURED_TOPICS = [
  { label: 'Snezhnaya', tag: 'Snezhnaya' },
  { label: 'Lore', tag: 'Lore' },
  { label: 'Cutscenes', tag: 'Cutscene' },
  { label: 'Anniversary', tag: 'Anniversary' },
  { label: 'Music', tag: 'Music' },
  { label: 'HoYoverse', tag: 'HoYoverse' },
];

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

  const spotlightArticle = articles[0];
  const regularArticles = articles.slice(1);

  return (
    <div className="home-layout">
      {/* Hero Banner */}
      <section className="hero-section">
        <div className="hero-status-pill">
          <span className="live-dot-pulse"></span>
          <span>Automated Ingestion Pipeline Active</span>
          <span className="pill-divider">•</span>
          <span className="sync-rate">Synced Every 15m</span>
        </div>

        <h1 className="hero-title">
          Official Genshin Impact <span className="title-gradient">Dispatches</span>
        </h1>
        
        <p className="hero-subtitle">
          Real-time article synthesis, lore deep-dives, and story cutscene breakdowns grounded strictly in official YouTube broadcasts and voice transcripts.
        </p>

        {/* Quick Topic Explorer */}
        <div className="topic-bar">
          <span className="topic-bar-label">Explore Topics:</span>
          <div className="topic-pills">
            {FEATURED_TOPICS.map(({ label, tag }) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                prefetch={false}
                className="topic-pill"
              >
                #{label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Articles Stream */}
      <section className="articles-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <span className="section-icon">✦</span>
            <h2>Archive & Dispatches</h2>
          </div>
          <span className="count-badge">
            <strong>{totalCount}</strong> Articles Archived
          </span>
        </div>

        {articles.length > 0 ? (
          <div className="articles-stream">
            {/* Spotlight Card for Page 1 Newest Release */}
            {spotlightArticle && (
              <div className="spotlight-wrapper">
                <ArticleCard article={spotlightArticle} featured={true} />
              </div>
            )}

            {/* Grid for Remaining Dispatches */}
            {regularArticles.length > 0 && (
              <div className="articles-grid">
                {regularArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h3>No Published Articles Yet</h3>
            <p>
              New dispatches are generated and auto-published automatically as official broadcasts premiere!
            </p>
          </div>
        )}

        <Pagination currentPage={1} totalPages={totalPages} basePath="" />
      </section>
    </div>
  );
}
