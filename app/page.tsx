import Link from "next/link";
import { getComparison, getModels, publicUrl } from "../lib/data";
import { getExperiments, mediaUrl } from "../lib/experiments";

type Entry = { href: string; title: string; summary: string; date: string; image?: string; facts: string[] };

const months = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];
function monthLabel(date: string) {
  const [year, month] = date.split("-");
  return `${months[Number(month) - 1]} ${year}`;
}

export default function Home() {
  const comparison = getComparison();
  const models = getModels();
  const working = models.filter((model) => model.status === "success").length;

  const entries: Entry[] = [
    {
      href: "/2048/",
      title: "Gra 2048",
      summary: comparison.description,
      date: comparison.publishedAt,
      image: publicUrl("previews/2048/kimi-k3.png"),
      facts: [`${models.length} modeli`, `${working} gier działa`],
    },
    ...getExperiments().map((experiment) => {
      const chosen = experiment.variants.find((variant) => variant.name === experiment.verdict.chosen);
      const cover = experiment.cases[0]?.results.find((result) => result.variant === chosen?.id && result.media.type === "image")?.media ?? experiment.reference;
      return {
        href: `/eksperymenty/${experiment.slug}/`,
        title: experiment.title,
        summary: experiment.summary,
        date: experiment.date,
        image: cover ? mediaUrl(experiment, cover) : undefined,
        facts: [`${experiment.variants.length} modele`, `wybrany: ${experiment.verdict.chosen}`],
      };
    }),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main>
      <section className="intro">
        <h1>Testy modeli AI</h1>
        <p className="lead">Dajemy kilku modelom to samo zadanie i pokazujemy, co zrobił każdy z nich.</p>
      </section>

      <ol className="entry-list">
        {entries.map((entry, index) => (
          <li key={entry.href}>
            <Link href={entry.href} className="entry">
              <span className="entry-number">{index + 1}</span>
              {entry.image ? <img src={entry.image} alt="" loading="lazy" /> : <span className="entry-placeholder" />}
              <div className="entry-copy">
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
                <p className="entry-facts">{[monthLabel(entry.date), ...entry.facts].join(" · ")}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
