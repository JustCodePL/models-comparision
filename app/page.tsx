import Link from "next/link";
import { getComparison, getModels, publicUrl } from "../lib/data";
import { getExperiments, mediaUrl } from "../lib/experiments";

export default function Home() {
  const comparison = getComparison();
  const models = getModels();
  const completed = models.filter((model) => model.status === "success").length;
  const failed = models.filter((model) => model.status === "failed").length;
  const experiments = getExperiments();

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">PUBLICZNE PORÓWNANIA · BEZ RETUSZU</p>
        <h1>Ten sam problem.<br /><span>Różne modele.</span></h1>
        <p className="lead">Pokazujemy kod, rozmowę i wynik wspólnej ewaluacji. Udane implementacje i porażki są tak samo ważną częścią obrazu.</p>
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">BENCHMARK 001</p>
          <h2>Dostępne porównania</h2>
        </div>
        <span className="muted">Aktualizacja {comparison.publishedAt}</span>
      </section>

      <Link href="/2048/" className="comparison-card">
        <div className="comparison-preview">
          <img src={publicUrl("previews/2048/kimi-k3.png")} alt="Zrzut ekranu gry 2048 wygenerowanej przez Kimi K3" />
          <span className="number-watermark">2048</span>
        </div>
        <div className="comparison-copy">
          <div className="tag-row"><span className="tag">GRA</span><span className="tag">FRONTEND</span><span className="tag">{models.length} MODELI</span></div>
          <h3>2048 w przeglądarce</h3>
          <p>{comparison.description}</p>
          <div className="score-strip">
            <span><strong>{completed}</strong> sukcesy</span>
            <span><strong>{failed}</strong> porażki</span>
            <span className="card-action">Otwórz porównanie →</span>
          </div>
        </div>
      </Link>

      {experiments.length > 0 && (
        <>
          <section className="section-heading spaced">
            <div>
              <p className="eyebrow">OBRAZ · WIDEO · DŹWIĘK</p>
              <h2>Eksperymenty z modelami generatywnymi</h2>
            </div>
            <span className="muted">{experiments.length} {experiments.length === 1 ? "eksperyment" : "eksperymenty"}</span>
          </section>
          <div className="experiment-list">
            {experiments.map((experiment) => {
              const chosen = experiment.variants.find((variant) => variant.name === experiment.verdict.chosen);
              const cover = experiment.cases[0]?.results.find((result) => result.variant === chosen?.id && result.media.type === "image")?.media ?? experiment.reference;
              return (
                <Link href={`/eksperymenty/${experiment.slug}/`} className="experiment-card" key={experiment.slug}>
                  {cover && <img src={mediaUrl(experiment, cover)} alt={experiment.title} loading="lazy" />}
                  <div className="comparison-copy">
                    <div className="tag-row"><span className="tag">{experiment.series}</span><span className="tag">{experiment.category}</span><span className="tag">{experiment.variants.length} modele</span></div>
                    <h3>{experiment.title}</h3>
                    <p>{experiment.summary}</p>
                    <div className="score-strip"><span><strong>{experiment.verdict.chosen}</strong> wybrany</span><span className="card-action">Otwórz eksperyment →</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
