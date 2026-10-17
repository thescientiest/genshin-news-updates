import { NextRequest } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

/**
 * GET /api/telegram/setup
 * 
 * Registers (or removes) the Telegram webhook.
 * 
 * Usage:
 *   Register:   GET /api/telegram/setup
 *   Unregister: GET /api/telegram/setup?action=delete
 *   Check:      GET /api/telegram/setup?action=info
 */
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.ADMIN_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
  const providedSecret = request.nextUrl.searchParams.get('secret');

  if (expectedSecret && providedSecret !== expectedSecret) {
    return Response.json({ error: 'Unauthorized: invalid or missing secret parameter' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    return Response.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });
  }

  const action = request.nextUrl.searchParams.get('action') || 'set';

  // --- Delete webhook ---
  if (action === 'delete') {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`,
      { method: 'POST' }
    );
    const data = await res.json();
    return Response.json({ action: 'deleteWebhook', result: data });
  }

  // --- Get webhook info ---
  if (action === 'info') {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );
    const data = await res.json();
    return Response.json({ action: 'getWebhookInfo', result: data });
  }

  // --- Set webhook ---
  // Build the webhook URL from the current request's origin
  const origin = request.nextUrl.origin;
  const webhookUrl = `${origin}/api/telegram/webhook`;

  const payload: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
    max_connections: 40,
  };

  // If a secret is configured, include it so Telegram sends it as a header
  if (WEBHOOK_SECRET) {
    payload.secret_token = WEBHOOK_SECRET;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();

  return Response.json({
    action: 'setWebhook',
    webhookUrl,
    result: data,
  });
}
