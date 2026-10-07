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
                <span className="logo-icon">✦</span>
                <span className="brand-text">Teyvat<strong>Chronicle</strong></span>
              </Link>
              <nav className="nav-links">
                <Link href="/">Latest Articles</Link>
                <Link href="/about">About</Link>
                <Link href="/admin">Review</Link>
              </nav>
            </div>
          </header>

          <main className="container main-content">{children}</main>

          <footer className="site-footer">
            <div className="container footer-container">
              <p className="disclaimer">
                Teyvat Chronicle is an unofficial, non-commercial fan project. Genshin Impact and all related assets, logos, and audio are trademarks or registered trademarks of COGNOSPHERE PTE. LTD.
              </p>
              <div className="footer-links">
                <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  Official YouTube
                </a>
                <span>•</span>
                <Link href="/about">About This Project</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
