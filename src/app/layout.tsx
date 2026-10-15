import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { SITE_NAME, SITE_DESCRIPTION, CHANNEL_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Official Genshin Impact Dispatches`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='50,5 90,50 50,95 10,50' fill='%23f59e0b'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="site-wrapper">
          <header className="site-header">
            <div className="container nav-container">
              <Link href="/" className="brand-logo">
                <span className="logo-gem">✦</span>
                <span className="brand-text">
                  Teyvat<strong>Chronicle</strong>
                </span>
              </Link>

              <nav className="nav-links">
                <Link href="/" className="nav-link">
                  Dispatches
                </Link>
                <Link href="/about" className="nav-link">
                  About
                </Link>
                <a
                  href="https://t.me/giupdatesbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="telegram-cta-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                  </svg>
                  <span>Telegram Alerts</span>
                </a>
              </nav>
            </div>
          </header>

          <main className="container main-content">{children}</main>

          <footer className="site-footer">
            <div className="container footer-container">
              <div className="footer-top">
                <div className="footer-brand">
                  <span className="logo-gem">✦</span>
                  <span className="brand-text">Teyvat<strong>Chronicle</strong></span>
                </div>
                <div className="footer-tagline">
                  <span>Official Genshin Impact News & Cutscene Breakdowns</span>
                </div>
              </div>

              <p className="disclaimer">
                Teyvat Chronicle is an unofficial, non-commercial fan project. Genshin Impact and all related visual assets, lore, audio, and character names are copyrighted trademarks of <strong>COGNOSPHERE PTE. LTD. (HoYoverse)</strong>.
              </p>

              <div className="footer-links">
                <Link href="/">Dispatches</Link>
                <span>•</span>
                <Link href="/about">About This Project</Link>
                <span>•</span>
                <a href="https://t.me/giupdatesbot" target="_blank" rel="noopener noreferrer">
                  Telegram Bot (@giupdatesbot)
                </a>
                <span>•</span>
                <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  Official YouTube Channel ↗
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
