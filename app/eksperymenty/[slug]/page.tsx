import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaView } from "../../../components/media-view";
import { getExperiment, getExperiments } from "../../../lib/experiments";
import type { OutcomeStatus } from "../../../lib/types";

const verdictLabels: Record<OutcomeStatus, string> = { success: "Dobry wynik", partial: "Z zastrzeżeniami", failed: "Odrzucony", "not-evaluated": "Nie oceniono" };

export function generateStaticParams() {
  return getExperiments().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const experiment = getExperiment((await params).slug);
  return experiment ? { title: `${experiment.title} — JustCode Model Lab`, description: experiment.summary } : {};
}

function formatSeconds(seconds: number) {
  return seconds < 90 ? `${seconds} s` : `${(seconds / 60).toFixed(1).replace(".", ",")} min`;
}

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const experiment = getExperiment((await params).slug);
  if (!experiment) notFound();
  const variants = new Map(experiment.variants.map((variant) => [variant.id, variant]));
  return (
    <main>
      <nav className="breadcrumbs"><Link href="/">Porównania</Link><span>/</span><span>{experiment.series}</span><span>/</span><span>{experiment.title}</span></nav>

      <section className="experiment-hero">
        <div className="tag-row"><span className="tag">{experiment.series}</span><span className="tag">{experiment.category}</span><span className="tag">{experiment.variants.length} modele</span><span className="tag">{experiment.date}</span></div>
        <h1>{experiment.title}</h1>
        <p className="lead">{experiment.summary}</p>
      </section>

      <section className="detail-grid">
        <div className="panel">
          <p className="eyebrow">PYTANIE</p>
          <p className="panel-text">{experiment.question}</p>
        </div>
        <div className="panel verdict">
          <p className="eyebrow">WERDYKT</p>
          <h2>{experiment.verdict.chosen}</h2>
          <p className="panel-text">{experiment.verdict.text}</p>
        </div>
      </section>

      <section className="experiment-section">
        <p className="eyebrow">JAK TO WYGENEROWANO</p>
        <h2>Metoda</h2>
        <ul className="method-list">
          <li><strong>Sprzęt:</strong> {experiment.hardware}</li>
          {experiment.method.map((line) => <li key={line}>{line}</li>)}
        </ul>
        {experiment.promptSuffix && <p className="muted small">Dopisek do każdego opisu: <code>{experiment.promptSuffix.trim()}</code></p>}

        <div className="variant-list">
          {experiment.variants.map((variant) => (
            <article className={`variant-row status-${variant.status}`} key={variant.id}>
              <div className="variant-main">
                <div className="model-title"><h3>{variant.name}</h3><span className={`status-pill ${variant.status}`}>{verdictLabels[variant.status]}</span>{variant.name === experiment.verdict.chosen && <span className="status-pill chosen">Wybrany</span>}</div>
                <code>{variant.modelId}</code>
                <p>{variant.summary}</p>
              </div>
              <dl className="variant-meta">
                {variant.settings && <div><dt>Ustawienia</dt><dd>{variant.settings}</dd></div>}
                {variant.time && <div><dt>Czas</dt><dd>{variant.time}</dd></div>}
                {variant.license && <div><dt>Licencja</dt><dd>{variant.license}</dd></div>}
              </dl>
            </article>
          ))}
        </div>

        {experiment.reference && (
          <figure className="reference">
            <MediaView experiment={experiment} media={experiment.reference} alt={experiment.reference.caption ?? "Obraz referencyjny"} />
            <figcaption>{experiment.reference.caption}</figcaption>
          </figure>
        )}
      </section>

      {experiment.cases.map((item) => {
        const seeds = [...new Set(item.results.map((result) => result.seed))];
        return (
          <section className="experiment-section case" key={item.id} id={item.id}>
            <p className="eyebrow">UJĘCIE {item.id}{item.usesReference !== undefined && (item.usesReference ? " · Z REFERENCJĄ" : " · BEZ REFERENCJI")}</p>
            <h2>{item.title}</h2>
            {item.challenge && <p className="muted">{item.challenge}</p>}
            {item.prompt && <details className="prompt-box"><summary>Opis ujęcia (prompt)</summary><pre>{item.prompt}{experiment.promptSuffix}</pre></details>}
            <div className="result-table">
              {experiment.variants.map((variant) => (
                <div className="result-row" key={variant.id}>
                  <div className="result-label"><strong>{variant.name}</strong><span className={`status-pill ${variant.status}`}>{verdictLabels[variant.status]}</span></div>
                  <div className="result-cells" style={{ gridTemplateColumns: `repeat(${seeds.length}, minmax(0, 1fr))` }}>
                    {seeds.map((seed) => {
                      const result = item.results.find((entry) => entry.variant === variant.id && entry.seed === seed);
                      if (!result) return <div className="result-missing" key={String(seed)}>brak wyniku</div>;
                      return (
                        <figure key={String(seed)}>
                          <MediaView experiment={experiment} media={result.media} alt={`${item.title}: ${variants.get(result.variant)?.name}, ziarno ${seed}`} />
                          <figcaption>{seed !== undefined && `ziarno ${seed}`}{result.seconds !== undefined && ` · ${formatSeconds(result.seconds)}`}{result.note && ` · ${result.note}`}</figcaption>
                        </figure>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section className="experiment-section">
        <p className="eyebrow">WNIOSKI</p>
        <h2>Czego się nauczyliśmy</h2>
        <ul className="method-list">{experiment.findings.map((line) => <li key={line}>{line}</li>)}</ul>
        {experiment.notices?.map((line) => <p className="notice" key={line}>{line}</p>)}
      </section>
    </main>
  );
}
