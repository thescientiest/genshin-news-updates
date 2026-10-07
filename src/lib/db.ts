import { Pool } from 'pg';

export interface Article {
  id: number;
  video_id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  key_takeaways: string[];
  tags: string[];
  thumbnail_url: string;
  video_published_at: Date;
  created_at: Date;
  status: 'draft' | 'published';
}

// Global connection pool to prevent connection exhaustion in serverless Next.js
declare global {
  var _pgPool: Pool | undefined;
}

const dbUrl = process.env.DATABASE_URL;

export const pool =
  global._pgPool ||
  new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}
