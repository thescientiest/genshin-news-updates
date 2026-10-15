import type { Metadata } from 'next';
import Link from 'next/link';
import { CHANNEL_URL, CHANNEL_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'About Teyvat Chronicle',
  description: 'Learn about Teyvat Chronicle, our structured Genshin Impact dispatches, and official attributions.',
};

export default function AboutPage() {
  return (
    <div className="about-container">
      <div className="about-header">
        <span className="badge">Community Fan Archive</span>
        <h1>About Teyvat Chronicle</h1>
        <p className="subtitle">
          Your dedicated editorial hub for official Genshin Impact news, cutscene breakdowns, and story analysis.
        </p>
      </div>

      <div className="about-content">
        <section className="info-card">
          <h2>✦ What We Provide</h2>
          <p>
            <strong>Teyvat Chronicle</strong> transforms official video broadcasts into clear, searchable, mobile-friendly articles designed for players and lore enthusiasts.
          </p>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">📜</span>
              <div>
                <h3>Structured Dispatches</h3>
                <p>Read concise summaries of trailers, animated shorts, and event announcements without having to scrub through entire videos.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">📌</span>
              <div>
                <h3>Key Takeaways at a Glance</h3>
                <p>Every article features bulleted highlights detailing essential takeaways, character debuts, and event rewards.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <div>
                <h3>Story & Lore Analysis</h3>
                <p>Understand the broader narrative implications—from Snezhnayan developments to Archon lore—explained clearly for players.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">✈️</span>
              <div>
                <h3>Instant Telegram Alerts</h3>
                <p>Get notified the moment a new official dispatch drops, or query our archive anytime through our interactive Telegram bot.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="info-card">
          <h2>✦ Connect With Us</h2>
          <p>
            Follow new releases as they premiere or explore past dispatches across all regions of Teyvat:
          </p>
          <div className="about-action-buttons">
            <Link href="/" className="channel-button">
              Browse Latest Dispatches
            </Link>
            <a
              href="https://t.me/giupdatesbot"
              target="_blank"
              rel="noopener noreferrer"
              className="channel-button telegram-sub-btn"
            >
              Join Telegram Alerts (@giupdatesbot)
            </a>
          </div>
        </section>

        <section className="info-card disclaimer-card">
          <h2>✦ Legal & Attribution Disclaimer</h2>
          <p>
            <strong>Teyvat Chronicle</strong> is an unofficial, non-commercial fan project created for the Genshin Impact community. 
            All game characters, names, video footage, audio, lore concepts, and trademarks belong to{' '}
            <strong>COGNOSPHERE PTE. LTD. (HoYoverse)</strong>.
          </p>
          <p>
            All video players embed directly from the official{' '}
            <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
              @{CHANNEL_NAME}
            </a>{' '}
            YouTube channel to ensure all views, credits, and ad revenues remain with the original creators.
          </p>
        </section>
      </div>
    </div>
  );
}
