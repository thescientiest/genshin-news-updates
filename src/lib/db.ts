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

if (!dbUrl) {
  console.error('❌ CRITICAL: process.env.DATABASE_URL is undefined! Please ensure DATABASE_URL is set in environment variables and redeploy.');
}

export const pool =
  global._pgPool ||
  new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(text, params);
        return res.rows;
      } finally {
        client.release();
      }
    } catch (err: any) {
      if (attempts >= maxAttempts) {
        console.error('Database query failed after retry:', err.message);
        throw err;
      }
      console.warn(`Database connection attempt ${attempts} failed (${err.message}). Retrying in 1s...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return [];
}
