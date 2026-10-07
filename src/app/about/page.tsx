import type { Metadata } from 'next';
import { CHANNEL_URL, CHANNEL_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'About Teyvat Chronicle',
  description: 'Learn about the automated Genshin Impact article platform, data pipeline, and legal attributions.',
};

export default function AboutPage() {
  return (
    <div className="about-container">
      <div className="about-header">
        <span className="badge">Fan Project</span>
        <h1>About Teyvat Chronicle</h1>
        <p className="subtitle">
          An automated intelligence hub turning official Genshin Impact broadcasts into structured knowledge.
        </p>
      </div>

      <div className="about-content">
        <section className="info-card">
          <h2>✦ How the Real-time Pipeline Works</h2>
          <p>
            Every 15 minutes, our automated pipeline monitors the official{' '}
            <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
              @{CHANNEL_NAME}
            </a>{' '}
            YouTube channel. When a new video is discovered, the pipeline:
          </p>
          <ol>
            <li>Extracts official subtitles and video metadata.</li>
            <li>Grounds character names, Archons, and lore using our curated Teyvat glossary.</li>
            <li>Synthesizes a structured article using Google Gemini 2.5 Flash.</li>
            <li>Stores the article into our PostgreSQL database with instant auto-publishing!</li>
          </ol>
        </section>

        <section className="info-card">
          <h2>✦ Grounding & Editorial Integrity</h2>
          <p>
            Our generation engine is strictly constrained to prevent hallucinations or speculative rumors. 
            Articles only detail events, gameplay mechanics, and lore revelations explicitly verified in official broadcasts.
          </p>
        </section>

        <section className="info-card disclaimer-card">
          <h2>✦ Legal & Attribution Disclaimer</h2>
          <p>
            <strong>Teyvat Chronicle</strong> is an unofficial, non-commercial fan-created website. 
            Genshin Impact, characters, names, audio, and visual materials are intellectual property and copyright of{' '}
            <strong>COGNOSPHERE PTE. LTD. (HoYoverse)</strong>.
          </p>
          <p>
            This website does not host copyrighted video files; all video players embed directly from the official YouTube broadcast.
          </p>
        </section>
      </div>
    </div>
  );
}
