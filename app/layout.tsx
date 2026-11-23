import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Porównania modeli — JustCode",
  description: "Publiczne, odtwarzalne porównania modeli: programistycznych i generatywnych (obraz, wideo, dźwięk).",
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
            <span>Model Lab</span>
          </Link>
        </header>
        {children}
        <footer>JustCode Model Lab · wyniki publikujemy również wtedy, gdy model sobie nie poradził.</footer>
        {site.tracking ? (
          <script defer src={site.tracking.scriptUrl} data-website-id={site.tracking.websiteId} />
        ) : null}
      </body>
    </html>
  );
}
