import Link from "next/link";
import { getComparison, getModels } from "../../lib/data";
import type { OutcomeStatus } from "../../lib/types";

const statusLabels: Record<OutcomeStatus, string> = {
  success: "Sukces",
  partial: "Częściowy",
  failed: "Niepowodzenie",
  "not-evaluated": "Nie oceniono"
};

function totalTokens(model: ReturnType<typeof getModels>[number]) {
  return model.attempts.reduce((sum, attempt) => sum + (attempt.tokens?.input ?? 0) + (attempt.tokens?.output ?? 0) + (attempt.tokens?.reasoning ?? 0), 0);
}

function attemptsLabel(count: number) {
  if (count === 1) return "próba";
  if (count >= 2 && count <= 4) return "próby";
  return "prób";
}

export default function Comparison2048() {
  const comparison = getComparison();
  const models = getModels();
  return (
    <main>
      <nav className="breadcrumbs"><Link href="/">Porównania</Link><span>/</span><span>2048</span></nav>
      <section className="comparison-hero">
        <div>
          <p className="eyebrow">BENCHMARK 001 · FRONTEND</p>
          <h1>Gra <span>2048</span></h1>
          <p className="lead">Osiem modeli dostało ten sam prompt. Nie naprawialiśmy ich kodu — testujemy i publikujemy dokładnie to, co powstało.</p>
        </div>
        <div className="benchmark-stats">
          <div><strong>{models.length}</strong><span>modeli</span></div>
          <div><strong>{models.reduce((sum, model) => sum + model.attempts.length, 0)}</strong><span>prób</span></div>
          <div><strong>{models.filter((model) => model.status === "success").length}</strong><span>sukcesy</span></div>
        </div>
      </section>

      <div className="notice"><strong>Jak czytać wyniki?</strong> „Sukces” oznacza przejście całej wspólnej ewaluacji. „Częściowy” oznacza uruchamialny artefakt z błędem funkcjonalnym. Znane porażki są publikowane celowo.</div>

      <section className="model-list" aria-label="Wyniki modeli">
        {models.map((model, index) => (
          <Link className={`model-row status-${model.status}`} href={`/2048/${model.slug}/`} key={model.slug}>
            <span className="rank">{String(index + 1).padStart(2, "0")}</span>
            <div className="model-main">
              <div className="model-title"><h2>{model.name}</h2><span className={`status-pill ${model.status}`}>{statusLabels[model.status]}</span></div>
              <code>{model.modelId}</code>
              <p>{model.summary}</p>
            </div>
            <div className="model-meta">
              <span><b>{model.provider}</b>dostawca</span>
              <span><b>{model.attempts.length}</b>{attemptsLabel(model.attempts.length)}</span>
              <span><b>{totalTokens(model).toLocaleString("pl-PL")}</b>tokenów</span>
            </div>
            <span className="row-arrow">→</span>
          </Link>
        ))}
      </section>

      <details className="prompt-box">
        <summary>Wspólny prompt użyty w porównaniu</summary>
        <pre>{comparison.prompt}</pre>
      </details>
    </main>
  );
}
