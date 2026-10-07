import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { query, Article } from '@/lib/db';
import { CHANNEL_URL, CHANNEL_NAME } from '@/lib/config';
import VideoEmbed from '@/components/VideoEmbed';

export const dynamic = 'force-dynamic';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const rows = await query<Article>(
    'SELECT title, summary, thumbnail_url FROM articles WHERE slug = $1',
    [slug]
  );
  const article = rows[0];

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: [
        {
          url: article.thumbnail_url,
          width: 1280,
          height: 720,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: [article.thumbnail_url],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const rows = await query<Article>(
    'SELECT * FROM articles WHERE slug = $1',
    [slug]
  );
  const article = rows[0];

  if (!article) {
    notFound();
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.video_published_at));

  return (
    <article className="article-detail">
      <div className="back-nav">
        <Link href="/" className="back-link">
          ← Back to All Articles
        </Link>
        {article.status === 'draft' && (
          <span className="draft-badge">Draft Preview</span>
        )}
      </div>

      <header className="article-header">
        <h1 className="article-title">{article.title}</h1>
        <div className="article-meta">
          <time dateTime={new Date(article.video_published_at).toISOString()}>
            Published: {formattedDate}
          </time>
          <span className="meta-separator">•</span>
          <span className="source-credit">
            Source:{' '}
            <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
              @{CHANNEL_NAME}
            </a>
          </span>
        </div>

        <div className="article-tags">
          {(article.tags || []).map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
              className="badge"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </header>

      {/* Embedded 16:9 YouTube Video */}
      <VideoEmbed videoId={article.video_id} title={article.title} />

      {/* Structured Article Sections */}
      <div className="content-body">
        {article.summary && (
          <section className="section-block">
            <h2>Summary</h2>
            <p>{article.summary}</p>
          </section>
        )}

        {article.key_takeaways && article.key_takeaways.length > 0 && (
          <section className="section-block">
            <h2>Key Takeaways</h2>
            <ul className="takeaways-list">
              {article.key_takeaways.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </section>
        )}

        {article.body && (
          <section className="section-block">
            <h2>What This Means for Players</h2>
            <div className="body-text">
              {article.body.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="channel-credit-box">
        <h3>Official Broadcast Attribution</h3>
        <p>
          This article is an editorial fan breakdown based on the official broadcast by{' '}
          <strong>{CHANNEL_NAME}</strong> on YouTube. All rights, characters, lore, and visual assets belong to COGNOSPHERE PTE. LTD.
        </p>
        <a
          href={`https://www.youtube.com/watch?v=${article.video_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="channel-button"
        >
          Watch Original Broadcast on YouTube ↗
        </a>
      </section>
    </article>
  );
}
