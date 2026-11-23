import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaView } from "../../../components/media-view";
import { getExperiment, getExperiments } from "../../../lib/experiments";

export function generateStaticParams() {
  return getExperiments().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const experiment = getExperiment((await params).slug);
  return experiment ? { title: `${experiment.title} — Testy modeli AI`, description: experiment.summary } : {};
}

function formatSeconds(seconds: number) {
  return seconds < 90 ? `${seconds} s` : `${(seconds / 60).toFixed(1).replace(".", ",")} min`;
}

const taskLabel = { obraz: "rysował ten kadr", wideo: "robił to ujęcie", "dźwięk": "nagrywał tę kwestię" } as const;

function timesLabel(count: number) {
  return ["", "raz", "dwa razy", "trzy razy", "cztery razy"][count] ?? `${count} razy`;
}

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const experiment = getExperiment((await params).slug);
  if (!experiment) notFound();
  const variants = new Map(experiment.variants.map((variant) => [variant.id, variant]));
  return (
    <main>
      <nav className="breadcrumbs"><Link href="/">Testy</Link><span>/</span><span>{experiment.title}</span></nav>

      <section className="experiment-hero">
        <h1>{experiment.title}</h1>
        <p className="lead">{experiment.summary}</p>
      </section>

      <section className="detail-grid">
        <div className="panel">
          <h2>Pytanie</h2>
          <p className="panel-text">{experiment.question}</p>
        </div>
        <div className="panel verdict">
          <h2>Wynik: {experiment.verdict.chosen}</h2>
          <p className="panel-text">{experiment.verdict.text}</p>
        </div>
      </section>

      <section className="experiment-section">
        <h2>Modele</h2>
        <div className="variant-list">
          {experiment.variants.map((variant) => (
            <article className={`variant-row status-${variant.status}`} key={variant.id}>
              <div className="variant-main">
                <div className="model-title"><h3>{variant.name}</h3><span className={`status-pill ${variant.status}`}>{variant.label}</span></div>
                <p>{variant.summary}</p>
              </div>
              <dl className="variant-meta">
                {variant.time && <div><dt>Czas</dt><dd>{variant.time}</dd></div>}
                {variant.settings && <div><dt>Ustawienia</dt><dd>{variant.settings}</dd></div>}
                {variant.license && <div><dt>Licencja</dt><dd>{variant.license}</dd></div>}
                <div><dt>Plik modelu</dt><dd><code>{variant.modelId}</code></dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="experiment-section">
        <h2>Jak testowaliśmy</h2>
        <ul className="method-list">
          <li>Sprzęt: {experiment.hardware}.</li>
          {experiment.method.map((line) => <li key={line}>{line}</li>)}
        </ul>
        {experiment.promptSuffix && <p className="muted small">Dopisek do każdego opisu: <code>{experiment.promptSuffix.trim()}</code></p>}
        {experiment.reference && (
          <figure className="reference">
            <MediaView experiment={experiment} media={experiment.reference} alt={experiment.reference.caption ?? "Obraz wzorcowy"} />
            <figcaption>{experiment.reference.caption}</figcaption>
          </figure>
        )}
      </section>

      {experiment.cases.map((item) => {
        const seeds = [...new Set(item.results.map((result) => result.seed))];
        return (
          <section className="experiment-section case" key={item.id} id={item.id}>
            <h2>{item.title}</h2>
            {item.challenge && <p className="muted">Na co patrzymy: {item.challenge}</p>}
            {item.prompt && <details className="prompt-box"><summary>Opis, który dostał model</summary><pre>{item.prompt}{experiment.promptSuffix}</pre></details>}
            <div className="result-table">
              {seeds.length > 1 && (
                <div className="result-row result-head">
                  <p className="muted small">Każdy model {taskLabel[experiment.category]} {timesLabel(seeds.length)} z tym samym opisem. Próby różnią się tylko losowym startem (seed), więc widać, jak bardzo wynik zależy od przypadku.</p>
                  <div className="result-cells" style={{ gridTemplateColumns: `repeat(${Math.max(seeds.length, 2)}, minmax(0, 1fr))` }}>
                    {seeds.map((seed, index) => <span key={String(seed)}>Próba {index + 1}{seed !== undefined && <small> · seed {seed}</small>}</span>)}
                  </div>
                </div>
              )}
              {experiment.variants.filter((variant) => item.results.some((result) => result.variant === variant.id)).map((variant) => (
                <div className="result-row" key={variant.id}>
                  <div className="result-label"><strong>{variant.name}</strong><span className={`status-pill ${variant.status}`}>{variant.label}</span></div>
                  <div className="result-cells" style={{ gridTemplateColumns: `repeat(${Math.max(seeds.length, 2)}, minmax(0, 1fr))` }}>
                    {seeds.map((seed) => {
                      const result = item.results.find((entry) => entry.variant === variant.id && entry.seed === seed);
                      if (!result) return <div className="result-missing" key={String(seed)}>brak wyniku</div>;
                      const attempt = seeds.length > 1 ? `próba ${seeds.indexOf(seed) + 1}` : undefined;
                      const caption = [attempt, seed !== undefined && `seed ${seed}`, result.seconds !== undefined && formatSeconds(result.seconds), result.note].filter(Boolean).join(" · ");
                      return (
                        <figure key={String(seed)}>
                          <MediaView experiment={experiment} media={result.media} alt={`${item.title}: ${variants.get(result.variant)?.name}${caption ? `, ${caption}` : ""}`} />
                          <figcaption>{caption}</figcaption>
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
        <h2>Wnioski</h2>
        <ul className="method-list">{experiment.findings.map((line) => <li key={line}>{line}</li>)}</ul>
        {experiment.notices?.map((line) => <p className="notice" key={line}>{line}</p>)}
      </section>
    </main>
  );
}
