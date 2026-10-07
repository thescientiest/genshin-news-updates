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

const rawDbUrl = process.env.DATABASE_URL;

if (!rawDbUrl) {
  console.error('❌ CRITICAL: process.env.DATABASE_URL is undefined! Please ensure DATABASE_URL is set in environment variables and redeploy.');
}

// Strip sslmode parameter so pg doesn't override rejectUnauthorized: false with strict verification
const connectionString = rawDbUrl
  ? rawDbUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
  : undefined;

export const pool =
  global._pgPool ||
  new Pool({
    connectionString,
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

function sanitizeRow(row: any): any {
  if (typeof row === 'string') {
    return row.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\u00a0/g, ' ');
  }
  if (Array.isArray(row)) {
    return row.map(sanitizeRow);
  }
  if (row && typeof row === 'object' && !(row instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(row)) {
      cleaned[key] = sanitizeRow(value);
    }
    return cleaned;
  }
  return row;
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
        return res.rows.map(sanitizeRow) as T[];
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
