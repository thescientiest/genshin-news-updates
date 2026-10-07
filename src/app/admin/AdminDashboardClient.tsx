'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Article } from '@/lib/db';

interface AdminDashboardClientProps {
  initialArticles: Article[];
}

export default function AdminDashboardClient({
  initialArticles,
}: AdminDashboardClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;

  const filteredArticles = articles.filter((a) => {
    if (filter === 'draft') return a.status === 'draft';
    if (filter === 'published') return a.status === 'published';
    return true;
  });

  const toggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    setLoadingId(id);

    try {
      const res = await fetch('/api/admin/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });

      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: nextStatus as 'draft' | 'published' } : a
          )
        );
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      alert('Error updating status');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Editorial Review Dashboard</h1>
          <p>Review incoming dispatches and publish or unpublish articles.</p>
        </div>

        <div className="stats-pills">
          <button
            onClick={() => setFilter('all')}
            className={`pill ${filter === 'all' ? 'active' : ''}`}
          >
            All ({articles.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`pill ${filter === 'published' ? 'active' : ''}`}
          >
            Published ({publishedCount})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`pill ${filter === 'draft' ? 'active' : ''}`}
          >
            Drafts ({draftCount})
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="articles-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Article Title</th>
              <th>Video ID</th>
              <th>Published Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles.map((article) => {
              const formattedDate = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date(article.video_published_at));

              return (
                <tr key={article.id}>
                  <td>
                    <span
                      className={`status-tag ${
                        article.status === 'published' ? 'published' : 'draft'
                      }`}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="title-cell">
                    <Link href={`/articles/${article.slug}`} target="_blank">
                      {article.title} ↗
                    </Link>
                  </td>
                  <td className="id-cell">{article.video_id}</td>
                  <td>{formattedDate}</td>
                  <td>
                    <button
                      onClick={() => toggleStatus(article.id, article.status)}
                      disabled={loadingId === article.id}
                      className={`action-btn ${
                        article.status === 'published' ? 'unpublish' : 'publish'
                      }`}
                    >
                      {loadingId === article.id
                        ? '...'
                        : article.status === 'published'
                        ? 'Unpublish'
                        : 'Publish'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .admin-container {
          padding-top: 1rem;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .admin-header h1 {
          font-size: 2rem;
          color: #ffffff;
        }

        .admin-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .stats-pills {
          display: flex;
          gap: 0.5rem;
        }

        .pill {
          padding: 0.4rem 0.9rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pill.active {
          background: rgba(245, 158, 11, 0.2);
          border-color: var(--gold);
          color: var(--gold-light);
        }

        .table-wrapper {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow-x: auto;
        }

        .articles-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }

        .articles-table th {
          background: rgba(11, 17, 32, 0.6);
          padding: 1rem;
          color: var(--text-muted);
          font-weight: 600;
          border-bottom: 1px solid var(--border-subtle);
        }

        .articles-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary);
        }

        .title-cell {
          font-weight: 600;
          max-width: 380px;
        }

        .title-cell a {
          color: var(--text-primary);
        }

        .title-cell a:hover {
          color: var(--gold-light);
        }

        .id-cell {
          font-family: monospace;
          color: var(--text-muted);
        }

        .status-tag {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-tag.published {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-tag.draft {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .action-btn {
          padding: 0.4rem 0.85rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          border: 0;
          transition: transform 0.1s ease;
        }

        .action-btn.publish {
          background: var(--gold);
          color: #0b1120;
        }

        .action-btn.unpublish {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
        }

        .action-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
