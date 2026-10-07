import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status || !['draft', 'published'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    await query('UPDATE articles SET status = $1 WHERE id = $2', [status, id]);
    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }
}
