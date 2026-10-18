import Link from 'next/link';
import { query, Article } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/config';
import ArticleCard from '@/components/ArticleCard';
import Pagination from '@/components/Pagination';

export const revalidate = 60;

const FEATURED_TOPICS = [
  { label: 'Snezhnaya', tag: 'Snezhnaya', descriptor: 'Archon Chapter' },
  { label: 'Lore', tag: 'Lore', descriptor: 'Historiography' },
  { label: 'Cutscenes', tag: 'Cutscene', descriptor: 'Cinematics' },
  { label: 'Anniversary', tag: 'Anniversary', descriptor: 'Milestones' },
  { label: 'Music', tag: 'Music', descriptor: 'HOYO-MiX' },
  { label: 'HoYoverse', tag: 'HoYoverse', descriptor: 'Transmissions' },
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
      {/* Editorial Masthead */}
      <section className="editorial-masthead">
        <div className="masthead-main">
          <div className="archival-edition-tag">
            <span className="edition-symbol">✦</span>
            <span>Teyvat Intelligence Record · Official Transmissions</span>
          </div>

          <h1 className="masthead-title">
            Chronicles & Dispatches
          </h1>

          <p className="masthead-deck">
            Authoritative records, cutscene analyses, and lore breakdowns transcribed directly from official HoYoverse broadcasts. Structured, permanent, and lore-grounded.
          </p>

          <div className="masthead-meta-strip">
            <div className="meta-strip-item">
              <span className="meta-label">Archive Scope</span>
              <span className="meta-value">Teyvat Chapters I–VII</span>
            </div>
            <div className="meta-strip-divider" aria-hidden="true"></div>
            <div className="meta-strip-item">
              <span className="meta-label">Source Frequency</span>
              <span className="meta-value">Official YouTube Feed</span>
            </div>
          </div>
        </div>

        {/* Curated Topic Taxonomy / Registers */}
        <aside className="masthead-sidebar">
          <div className="taxonomy-header">
            <span className="taxonomy-title">Dispatch Registers</span>
            <span className="taxonomy-sub">By Category</span>
          </div>
          <div className="taxonomy-grid">
            {FEATURED_TOPICS.map(({ label, tag, descriptor }) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                prefetch={false}
                className="taxonomy-item"
              >
                <div className="taxonomy-item-name">{label}</div>
                <div className="taxonomy-item-meta">{descriptor}</div>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      {/* Main Articles Stream */}
      <section className="articles-section">
        <div className="section-ledger-bar">
          <div className="ledger-title-group">
            <span className="ledger-mark" aria-hidden="true">✦</span>
            <h2>Archival Dispatches</h2>
          </div>
          <div className="ledger-counter">
            <span className="counter-label">Cataloged Folio</span>
            <span className="counter-value">{totalCount} Records</span>
          </div>
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
              New dispatches are generated and cataloged automatically as official broadcasts premiere.
            </p>
          </div>
        )}

        <Pagination currentPage={1} totalPages={totalPages} basePath="" />
      </section>
    </div>
  );
}
