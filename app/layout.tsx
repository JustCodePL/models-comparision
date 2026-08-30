import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Porównania modeli — JustCode",
  description: "Publiczne, odtwarzalne porównania modeli programistycznych."
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
          <a className="header-link" href="https://github.com/JustCodePL/models-comparision">Kod źródłowy ↗</a>
        </header>
        {children}
        <footer>JustCode Model Lab · wyniki publikujemy również wtedy, gdy model sobie nie poradził.</footer>
      </body>
    </html>
  );
}
