import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><p className="eyebrow">404</p><h1>Nie ma takiego wyniku.</h1><p className="lead">Ten model albo benchmark nie został jeszcze opublikowany.</p><Link className="primary-button" href="/">Wróć do indeksu</Link></main>;
}
