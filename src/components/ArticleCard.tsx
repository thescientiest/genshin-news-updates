import Link from 'next/link';
import { Article } from '@/lib/db';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(article.video_published_at));

  const thumbnailUrl =
    article.thumbnail_url ||
    `https://i.ytimg.com/vi/${article.video_id}/hqdefault.jpg`;

  return (
    <article className="article-card">
      <Link
        href={`/articles/${article.slug}`}
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
        </div>
      </Link>

      <div className="card-content">
        <div className="card-meta">
          <time dateTime={new Date(article.video_published_at).toISOString()}>
            {formattedDate}
          </time>
          <div className="tags-list">
            {(article.tags || []).slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                className="badge"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        <h2 className="card-title">
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h2>

        {article.summary && (
          <p className="card-summary">{article.summary}</p>
        )}

        <div className="card-action">
          <Link href={`/articles/${article.slug}`} className="read-more">
            Read Breakdown & Watch <span>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
