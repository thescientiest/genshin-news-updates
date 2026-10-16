import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

// ─── Config ──────────────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SITE_URL = (process.env.SITE_URL || 'https://genshin-news-updates.vercel.app').replace(/\/$/, '');
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

// ─── Telegram API Helper ────────────────────────────────────────────────────
async function telegramApi(method: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    console.error(`[Telegram API] ${method} error:`, err);
    return { ok: false, error: String(err) };
  }
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Command Handlers ──────────────────────────────────────────────────────

async function handleStart(chatId: number, firstName: string) {
  const welcomeText =
    `✦ <b>Welcome to Teyvat Chronicle, ${escapeHtml(firstName)}!</b> ✦\n\n` +
    `I am your automated Genshin Impact dispatch assistant. I continuously track official broadcasts, ` +
    `synthesize lore drops with AI, and publish articles directly to our cloud database.\n\n` +
    `<b>Available Commands:</b>\n` +
    `📜 <b>/latest</b> — Read the 3 most recent dispatches\n` +
    `🔍 <b>/search &lt;term&gt;</b> — Search database for a character or event\n` +
    `🌐 <b>/website</b> — Visit the live Next.js web application\n` +
    `ℹ️ <b>/help</b> — Display this instruction menu\n\n` +
    `<i>Enjoy the journey across Teyvat!</i>`;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '📜 View Latest Articles', callback_data: 'cmd_latest' },
        { text: '🌐 Open Website', url: SITE_URL },
      ],
    ],
  };

  await telegramApi('sendMessage', {
    chat_id: chatId,
    text: welcomeText,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

async function handleLatest(chatId: number) {
  try {
    const rows = await query<{
      title: string;
      summary: string;
      slug: string;
      thumbnail_url: string;
      video_published_at: Date;
    }>(
      `SELECT title, summary, slug, thumbnail_url, video_published_at 
       FROM articles 
       WHERE status = 'published' 
       ORDER BY video_published_at DESC 
       LIMIT 3`
    );

    if (!rows.length) {
      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: 'No published articles found in the archives.',
        parse_mode: 'HTML',
      });
      return;
    }

    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: '📜 <b>Top 3 Latest Genshin Impact Dispatches:</b>',
      parse_mode: 'HTML',
    });

    for (const row of rows) {
      const articleUrl = `${SITE_URL}/articles/${row.slug}`;
      const shortSummary =
        row.summary && row.summary.length > 200
          ? row.summary.slice(0, 200) + '...'
          : row.summary;

      const caption =
        `<b>${escapeHtml(row.title)}</b>\n\n` +
        `${escapeHtml(shortSummary || '')}\n`;

      const replyMarkup = {
        inline_keyboard: [[{ text: '📖 Read Breakdown', url: articleUrl }]],
      };

      if (row.thumbnail_url) {
        await telegramApi('sendPhoto', {
          chat_id: chatId,
          photo: row.thumbnail_url,
          caption,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        });
      } else {
        await telegramApi('sendMessage', {
          chat_id: chatId,
          text: caption,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        });
      }
    }
  } catch (err) {
    console.error('[Latest Error]', err);
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: '⚠️ Database connection error. Please try again later.',
      parse_mode: 'HTML',
    });
  }
}

async function handleSearch(chatId: number, searchQuery: string) {
  if (!searchQuery.trim()) {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: 'Please provide a search term. Example: <code>/search snezhnaya</code> or <code>/search paimon</code>',
      parse_mode: 'HTML',
    });
    return;
  }

  try {
    const pattern = `%${searchQuery}%`;
    const rows = await query<{
      title: string;
      summary: string;
      slug: string;
      thumbnail_url: string;
    }>(
      `SELECT title, summary, slug, thumbnail_url 
       FROM articles 
       WHERE status = 'published' AND (
         title ILIKE $1 OR summary ILIKE $2 OR body ILIKE $3
       )
       ORDER BY video_published_at DESC 
       LIMIT 3`,
      [pattern, pattern, pattern]
    );

    if (!rows.length) {
      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: `🔍 No articles found matching '<b>${escapeHtml(searchQuery)}</b>'. Try another keyword!`,
        parse_mode: 'HTML',
      });
      return;
    }

    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `🔍 <b>Found ${rows.length} article(s) matching '${escapeHtml(searchQuery)}':</b>`,
      parse_mode: 'HTML',
    });

    for (const row of rows) {
      const articleUrl = `${SITE_URL}/articles/${row.slug}`;
      const shortSummary =
        row.summary && row.summary.length > 180
          ? row.summary.slice(0, 180) + '...'
          : row.summary;

      const caption =
        `<b>${escapeHtml(row.title)}</b>\n\n` +
        `${escapeHtml(shortSummary || '')}`;

      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: caption,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '📖 Read Article', url: articleUrl }]],
        },
      });
    }
  } catch (err) {
    console.error('[Search Error]', err);
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: '⚠️ Database temporarily unreachable.',
      parse_mode: 'HTML',
    });
  }
}

// ─── Webhook POST Handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Optional: verify the secret token header set during webhook registration
  if (WEBHOOK_SECRET) {
    const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (headerSecret !== WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  if (!BOT_TOKEN) {
    console.error('[Webhook] TELEGRAM_BOT_TOKEN not configured');
    return new Response('Bot not configured', { status: 500 });
  }

  let update: Record<string, any>;
  try {
    update = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Handle Callback Query (inline keyboard buttons)
  if (update.callback_query) {
    const cb = update.callback_query;
    const cbChatId = cb?.message?.chat?.id;
    if (cb.data === 'cmd_latest' && cbChatId) {
      await handleLatest(cbChatId);
    }
    // Answer the callback so Telegram removes the loading spinner
    await telegramApi('answerCallbackQuery', {
      callback_query_id: cb.id,
    });
    return Response.json({ ok: true });
  }

  // Handle regular messages
  const message = update.message;
  if (!message?.text || !message?.chat?.id) {
    return Response.json({ ok: true });
  }

  const text = message.text.trim();
  const chatId = message.chat.id;
  const firstName = message.from?.first_name || 'Traveler';

  if (text.startsWith('/start')) {
    await handleStart(chatId, firstName);
  } else if (text.startsWith('/latest')) {
    await handleLatest(chatId);
  } else if (text.startsWith('/search')) {
    const searchTerm = text.slice(7).trim();
    await handleSearch(chatId, searchTerm);
  } else if (text.startsWith('/website')) {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `🌐 Visit our live website here:\n${SITE_URL}`,
      disable_web_page_preview: false,
    });
  } else if (text.startsWith('/help')) {
    await handleStart(chatId, firstName);
  }

  return Response.json({ ok: true });
}
