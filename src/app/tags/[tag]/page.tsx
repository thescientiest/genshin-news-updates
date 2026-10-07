import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { query, Article } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/config';
import ArticleCard from '@/components/ArticleCard';
import Pagination from '@/components/Pagination';

export const revalidate = 60;

interface TagPageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  return {
    title: `Articles Tagged #${decodedTag}`,
    description: `Browse official Genshin Impact news, updates, and cutscenes categorized under #${decodedTag}.`,
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tag } = await params;
  const { page } = await searchParams;
  const decodedTag = decodeURIComponent(tag);

  const currentPage = Math.max(1, parseInt(page || '1', 10));

  // Count matching articles for this tag (case-insensitive search in array)
  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*) FROM articles 
     WHERE status = 'published' 
     AND EXISTS (
       SELECT 1 FROM unnest(tags) t 
       WHERE LOWER(t) = LOWER($1)
     )`,
    [decodedTag]
  );
  const totalCount = parseInt(countRows[0]?.count || '0', 10);

  if (totalCount === 0) {
    notFound();
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  if (currentPage > totalPages) {
    notFound();
  }

  const offset = (currentPage - 1) * PAGE_SIZE;

  // Query articles for this tag
  const articles = await query<Article>(
    `SELECT * FROM articles 
     WHERE status = 'published' 
     AND EXISTS (
       SELECT 1 FROM unnest(tags) t 
       WHERE LOWER(t) = LOWER($1)
     )
     ORDER BY video_published_at DESC 
     LIMIT $2 OFFSET $3`,
    [decodedTag, PAGE_SIZE, offset]
  );

  return (
    <div>
      <div className="tag-header">
        <div className="back-nav">
          <Link href="/">← Back to All Articles</Link>
        </div>
        <h1>
          Tag: <span className="tag-highlight">#{decodedTag}</span>
        </h1>
        <p>
          {totalCount} {totalCount === 1 ? 'article' : 'articles'} found
        </p>
      </div>

      <div className="articles-grid">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/tags/${encodeURIComponent(decodedTag)}`}
        />
      )}
    </div>
  );
}
