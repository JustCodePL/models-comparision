import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Lightbox } from "../components/lightbox";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Testy modeli AI — JustCode",
  description: "Dajemy kilku modelom AI to samo zadanie i pokazujemy, co zrobił każdy z nich.",
  metadataBase: new URL(site.url),
  robots: site.indexing ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            <span className="brand-mark">JC</span>
            <span>Testy modeli AI</span>
          </Link>
        </header>
        {children}
        <footer>JustCode · Pokazujemy też wyniki, które się nie udały.</footer>
        <Lightbox />
        {site.tracking ? (
          <script defer src={site.tracking.scriptUrl} data-website-id={site.tracking.websiteId} />
        ) : null}
      </body>
    </html>
  );
}
