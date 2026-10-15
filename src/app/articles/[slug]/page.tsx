import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { query, Article } from '@/lib/db';
import { CHANNEL_URL, CHANNEL_NAME } from '@/lib/config';
import VideoEmbed from '@/components/VideoEmbed';

export const revalidate = 60;

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

  // Word count and reading time
  const wordCount = (article.body || article.summary || '').split(/\s+/).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <article className="article-detail">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <Link href="/" className="breadcrumb-link">
          Home
        </Link>
        <span className="breadcrumb-sep">/</span>
        <Link href="/" className="breadcrumb-link">
          Dispatches
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{article.title}</span>
      </nav>

      <header className="article-header">
        <div className="header-top-meta">
          <span className="dispatch-badge">✦ Official Broadcast Dispatch</span>
          {article.status === 'draft' && (
            <span className="draft-badge">Draft Preview</span>
          )}
        </div>

        <h1 className="article-title">{article.title}</h1>

        <div className="article-meta-bar">
          <div className="meta-left">
            <time dateTime={new Date(article.video_published_at).toISOString()}>
              {formattedDate}
            </time>
            <span className="meta-separator">•</span>
            <span>{readMinutes} min read</span>
            <span className="meta-separator">•</span>
            <span className="source-credit">
              Source:{' '}
              <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                @{CHANNEL_NAME}
              </a>
            </span>
          </div>

          <div className="meta-right">
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(`https://genshin-news-updates.vercel.app/articles/${article.slug}`)}&text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
              </svg>
              <span>Share to Telegram</span>
            </a>
          </div>
        </div>

        <div className="article-tags">
          {(article.tags || []).map((tag) => (
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
      </header>

      {/* Embedded 16:9 YouTube Video */}
      <VideoEmbed videoId={article.video_id} title={article.title} />

      {/* Structured Article Sections */}
      <div className="content-body">
        {article.summary && (
          <section className="section-block summary-card">
            <div className="section-title-tag">
              <span className="accent-line"></span>
              <h2>Summary & Overview</h2>
            </div>
            <p className="summary-paragraph">{article.summary}</p>
          </section>
        )}

        {article.key_takeaways && article.key_takeaways.length > 0 && (
          <section className="section-block takeaways-card">
            <div className="section-title-tag">
              <span className="accent-line gold-accent"></span>
              <h2>Key Takeaways</h2>
            </div>
            <ul className="takeaways-list">
              {article.key_takeaways.map((point, index) => (
                <li key={index} className="takeaway-item">
                  <span className="bullet-star">✦</span>
                  <span className="point-text">{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {article.body && (
          <section className="section-block analysis-card">
            <div className="section-title-tag">
              <span className="accent-line cyan-accent"></span>
              <h2>What This Means for Players</h2>
            </div>
            <div className="body-text">
              {article.body.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="channel-credit-box">
        <div className="credit-icon">✦</div>
        <h3>Official Broadcast Attribution</h3>
        <p>
          This article is an editorial fan breakdown based on the official broadcast by{' '}
          <strong>{CHANNEL_NAME}</strong> on YouTube. All rights, characters, lore, and visual assets belong to COGNOSPHERE PTE. LTD.
        </p>
        <div className="credit-buttons">
          <a
            href={`https://www.youtube.com/watch?v=${article.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="channel-button"
          >
            Watch Original Broadcast on YouTube ↗
          </a>
          <a
            href="https://t.me/giupdatesbot"
            target="_blank"
            rel="noopener noreferrer"
            className="channel-button telegram-sub-btn"
          >
            Get Live Alerts on Telegram
          </a>
        </div>
      </section>
    </article>
  );
}
