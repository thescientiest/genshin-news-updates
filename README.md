# ✦ Teyvat Chronicle - Dynamic Genshin Impact News Platform

A server-rendered, dynamic web application built with **Next.js (App Router)** and **PostgreSQL (Neon)** that automatically transforms official [@GenshinImpact](https://www.youtube.com/@GenshinImpact) YouTube uploads into rich news articles using **Google Gemini 2.5 Flash**.

## 🌟 Tech Stack

- **Frontend**: [Next.js (App Router)](https://nextjs.org) (Server-rendered, dynamic SQL queries)
- **Database**: PostgreSQL on [Neon](https://neon.tech) (Connection pooling, auto-scaling)
- **AI Engine**: Google Gemini 2.5 Flash (Grounded with curated Teyvat lore glossary)
- **Data Pipeline**: Python 3 (`psycopg2-binary`, `youtube-transcript-api`, `google-generativeai`)
- **Automation**: GitHub Actions (runs every 15 minutes)

---

## 📁 Project Architecture

```text
.
├── database/
│   ├── schema.sql                 # PostgreSQL table definition & composite indexes
│   └── init_db.py                 # Schema setup & data migration tool
├── pipeline/
│   ├── data/
│   │   └── glossary.json          # Curated Genshin terminology reference
│   ├── fetch_and_generate.py      # RSS -> Subtitles -> Gemini -> PostgreSQL
│   └── requirements.txt           # Python pipeline dependencies
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with Genshin celestial theme
│   │   ├── page.tsx               # Homepage (Page 1 of published articles)
│   │   ├── page/[n]/page.tsx      # Dynamic paginated routes (/page/2, /page/3...)
│   │   ├── articles/[slug]/       # Full article view with 16:9 YouTube embed
│   │   ├── tags/[tag]/page.tsx    # Paginated category tag archive
│   │   ├── admin/                 # Editorial Review Dashboard
│   │   │   ├── page.tsx
│   │   │   └── AdminDashboardClient.tsx
│   │   ├── api/admin/toggle-status/ # API to toggle published/draft status
│   │   ├── about/page.tsx         # About page & attribution
│   │   └── not-found.tsx          # 404 handler for invalid pages
│   ├── components/
│   │   ├── ArticleCard.tsx        # 16:9 thumbnail preview card
│   │   ├── Pagination.tsx         # Page numbers, Prev/Next buttons
│   │   └── VideoEmbed.tsx         # YouTube player with official channel credit
│   └── lib/
│       ├── db.ts                  # PostgreSQL pool client (pg)
│       └── config.ts              # Global constants (PAGE_SIZE = 12)
└── package.json
```

---

## 🚀 Running Locally

### 1. Configure `.env`
Ensure your `.env` contains your Gemini API key and Neon Database URL:
```ini
YOUTUBE_CHANNEL_ID=UCiS882YPwZt1NfaM0gR0D9Q
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 2. Run the Next.js Web App
```bash
npm run dev
```
Open **[http://localhost:4321](http://localhost:4321)**.

### 3. Run the Pipeline Script Manually
```bash
python3 pipeline/fetch_and_generate.py 3
```

---

## ⚡ Deployment & Hosting

### 1. Database (Neon)
Your database is hosted on Neon PostgreSQL with composite indexes:
- `(status, video_published_at DESC)` for instantaneous feed queries.
- `slug` for article lookups.
- `GIN(tags)` for tag queries.

### 2. GitHub Actions Automation (Every 15 min)
In your GitHub Repository > **Settings** > **Secrets and variables** > **Actions**:
- `GEMINI_API_KEY`: Your Gemini API key.
- `DATABASE_URL`: Your Neon PostgreSQL connection string.

### 3. Web Hosting (AWS Amplify / Vercel / Cloudflare)
Deploy this Next.js app to **AWS Amplify** or **Vercel** with zero configuration:
- Add the environment variable `DATABASE_URL` in the hosting dashboard.
