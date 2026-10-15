import Link from 'next/link';
import { Article } from '@/lib/db';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(article.video_published_at));

  const thumbnailUrl =
    article.thumbnail_url ||
    `https://i.ytimg.com/vi/${article.video_id}/hqdefault.jpg`;

  // Estimate read time based on word count
  const wordCount = (article.body || article.summary || '').split(/\s+/).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 180));

  if (featured) {
    return (
      <article className="article-card featured-card">
        <Link
          href={`/articles/${article.slug}`}
          prefetch={false}
          className="featured-thumbnail-link"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="thumbnail-wrapper featured-thumbnail-wrapper">
            <img
              src={thumbnailUrl}
              alt={`Thumbnail for ${article.title}`}
              loading="eager"
              decoding="async"
            />
            <div className="play-overlay">
              <span className="play-icon">▶</span>
            </div>
            <div className="thumbnail-badge featured-badge">✦ Spotlight Dispatch</div>
          </div>
        </Link>

        <div className="card-content featured-card-content">
          <div className="card-meta">
            <span className="read-time-pill">
              <span className="sparkle">✦</span> Latest Official Video
            </span>
            <div className="meta-info">
              <time dateTime={new Date(article.video_published_at).toISOString()}>
                {formattedDate}
              </time>
              <span className="dot-sep">•</span>
              <span>{readMinutes} min read</span>
            </div>
          </div>

          <h2 className="featured-title">
            <Link href={`/articles/${article.slug}`} prefetch={false}>
              {article.title}
            </Link>
          </h2>

          {article.summary && (
            <p className="featured-summary">{article.summary}</p>
          )}

          {article.key_takeaways && article.key_takeaways.length > 0 && (
            <div className="featured-takeaways">
              <div className="takeaways-header">Key Highlights:</div>
              <ul className="takeaways-preview-list">
                {article.key_takeaways.slice(0, 2).map((point, idx) => (
                  <li key={idx}>
                    <span className="bullet">✦</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card-footer">
            <div className="tags-list">
              {(article.tags || []).slice(0, 4).map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                  prefetch={false}
                  className="badge"
                >
                  #{tag}
                </Link>
              ))}
            </div>

            <Link href={`/articles/${article.slug}`} prefetch={false} className="read-more-btn">
              <span>Read Full Breakdown</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="article-card standard-card">
      <Link
        href={`/articles/${article.slug}`}
        prefetch={false}
        className="thumbnail-link"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="thumbnail-wrapper">
          <img
            src={thumbnailUrl}
            alt={`Thumbnail for ${article.title}`}
            loading="lazy"
            decoding="async"
          />
          <div className="play-overlay">
            <span className="play-icon">▶</span>
          </div>
          <div className="thumbnail-badge">Official Video</div>
        </div>
      </Link>

      <div className="card-content">
        <div className="card-meta">
          <time dateTime={new Date(article.video_published_at).toISOString()}>
            {formattedDate}
          </time>
          <span className="dot-sep">•</span>
          <span className="read-time">{readMinutes} min read</span>
        </div>

        <h2 className="card-title">
          <Link href={`/articles/${article.slug}`} prefetch={false}>
            {article.title}
          </Link>
        </h2>

        {article.summary && (
          <p className="card-summary">{article.summary}</p>
        )}

        <div className="card-footer">
          <div className="tags-list">
            {(article.tags || []).slice(0, 2).map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                prefetch={false}
                className="badge"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <Link href={`/articles/${article.slug}`} prefetch={false} className="read-more">
            <span>Breakdown</span>
            <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
