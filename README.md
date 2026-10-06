# ✦ Teyvat Chronicle - Automated Genshin Impact News Hub

An automated fan website that converts new video uploads from the official [@GenshinImpact](https://www.youtube.com/@GenshinImpact) YouTube channel into structured news articles and community breakdowns.

## 🌟 Tech Stack

- **Pipeline**: Python (RSS Parser, `youtube-transcript-api`, Gemini/Fallback generator)
- **Website**: [Astro](https://astro.build) (Static Site Generation, mobile-first, zero-JS by default)
- **Content**: Markdown with YAML front matter (`src/content/articles/`)
- **Automation**: GitHub Actions (runs every 15 minutes)
- **Hosting**: Cloudflare Pages (free, global edge CDN)

---

## 📁 Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── update-articles.yml   # Runs pipeline every 15 minutes on GitHub
├── pipeline/
│   ├── data/
│   │   ├── glossary.json         # Genshin lore & character terminology
│   │   └── processed.json        # Tracks processed YouTube video IDs
│   ├── .env                      # Local environment configuration
│   ├── fetch_and_generate.py     # Main Python pipeline
│   └── requirements.txt          # Python dependencies
├── src/
│   ├── content/
│   │   ├── config.ts             # Article schema definition
│   │   └── articles/             # Generated Markdown articles
│   ├── components/
│   │   ├── ArticleCard.astro     # Feed card component
│   │   └── VideoEmbed.astro      # YouTube embed with attribution link
│   ├── layouts/
│   │   └── BaseLayout.astro      # Master layout with Genshin-inspired theme
│   └── pages/
│       ├── index.astro           # Homepage (latest published articles)
│       ├── articles/[...slug].astro # Full article view
│       ├── tags/                 # Tag archive & categories
│       └── about.astro           # About & legal attribution
├── astro.config.mjs
└── package.json
```

---

## 🚀 Getting Started Locally

### 1. Run the Python Pipeline

Generate articles from the latest YouTube videos:

```bash
# Run the pipeline (fetches up to 3 new videos by default)
python3 pipeline/fetch_and_generate.py
```

- If you have a Google Gemini API key (free at [Google AI Studio](https://aistudio.google.com/)), add it to `pipeline/.env`:
  ```ini
  GEMINI_API_KEY=your_key_here
  ```
- If no key is provided, the pipeline automatically uses its built-in **grounded offline extractor**, ensuring it never fails.

### 2. Run the Astro Website

Start the local development preview:

```bash
npm run dev
```

Visit `http://localhost:4321` in your browser.

---

## ✍️ Publishing Drafts

Newly generated articles are created with `draft: true` in their Markdown front matter:

```yaml
---
title: "Happy 6th Anniversary!"
date: 2026-09-28T08:00:15+00:00
videoId: "acwaALHhDY0"
tags: ["Genshin Impact", "AnniversaryMemoriesAlbum"]
draft: true
---
```

When you are ready to publish an article on the homepage and tag pages, change:
```yaml
draft: false
```

---

## ☁️ Deploying to Cloudflare Pages (Free)

1. Push your repository to **GitHub**.
2. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your GitHub repository.
4. Set the **Build settings**:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**. Cloudflare will build and host your site on a free `*.pages.dev` domain!

---

## ⚡ GitHub Actions Automation (Every 15 min)

The repository includes [.github/workflows/update-articles.yml](file:///.github/workflows/update-articles.yml).

To enable it:
1. Go to your GitHub repository > **Settings** > **Actions** > **General**.
2. Under **Workflow permissions**, select **Read and write permissions** (allows the bot to commit new articles).
3. (Optional) Go to **Settings** > **Secrets and variables** > **Actions** and add:
   - `GEMINI_API_KEY`: Your free Gemini API key.
   - `YOUTUBE_CHANNEL_ID`: `UCiS882YPwZt1NfaM0gR0D9Q` (defaults to @GenshinImpact).
