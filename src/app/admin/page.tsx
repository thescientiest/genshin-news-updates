import { query, Article } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const articles = await query<Article>(
    'SELECT * FROM articles ORDER BY video_published_at DESC'
  );

  return <AdminDashboardClient initialArticles={articles} />;
}
