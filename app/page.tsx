import Link from "next/link";
import { getComparison, getModels, publicUrl } from "../lib/data";
import { getExperiments, mediaUrl } from "../lib/experiments";
import type { MediaItem } from "../lib/types";

type Entry = { href: string; title: string; summary: string; date: string; image?: string; imagePosition?: string; icon?: string; facts: string[] };

const months = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];
function monthLabel(date: string) {
  const [year, month] = date.split("-");
  return `${months[Number(month) - 1]} ${year}`;
}

function variantsLabel(count: number) {
  const word = count === 1 ? "wariant" : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? "warianty" : "wariantów";
  return `${count} ${word}`;
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
      const results = experiment.cases.flatMap((item) => item.results);
      const visual = (media: MediaItem) => (media.type === "image" ? media.src : media.type === "video" ? media.poster : undefined);
      const coverMedia = results.filter((result) => result.variant === chosen?.id).map((result) => result.media).find(visual)
        ?? results.map((result) => result.media).find(visual)
        ?? experiment.reference;
      const coverSrc = coverMedia && visual(coverMedia);
      // Portrait (9:16) covers are cropped around the middle, where faces usually are; landscape ones keep the top.
      const portrait = coverMedia?.width && coverMedia.height && coverMedia.height > coverMedia.width;
      return {
        href: `/eksperymenty/${experiment.slug}/`,
        title: experiment.title,
        summary: experiment.summary,
        date: experiment.date,
        image: coverSrc ? mediaUrl(experiment, coverSrc) : undefined,
        imagePosition: experiment.coverPosition ?? (portrait ? "center 40%" : undefined),
        icon: experiment.category === "dźwięk" ? "♪" : undefined,
        facts: [variantsLabel(experiment.variants.length), `wybrany: ${experiment.verdict.chosen}`],
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
              {entry.image ? <img src={entry.image} alt="" loading="lazy" style={entry.imagePosition ? { objectPosition: entry.imagePosition } : undefined} /> : <span className="entry-placeholder" aria-hidden="true">{entry.icon}</span>}
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
