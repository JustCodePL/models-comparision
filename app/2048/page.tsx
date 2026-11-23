import Link from "next/link";
import { getComparison, getModels } from "../../lib/data";
import { gameStatusLabels as statusLabels } from "../../lib/labels";

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
      <nav className="breadcrumbs"><Link href="/">Testy</Link><span>/</span><span>2048</span></nav>
      <section className="comparison-hero">
        <div>
          <h1>Gra 2048</h1>
          <p className="lead">Każdy model dostał to samo polecenie: napisz grę 2048 do przeglądarki. Kodu nie poprawialiśmy. Każdą grę sprawdziliśmy tym samym zestawem testów w przeglądarce.</p>
        </div>
        <div className="benchmark-stats">
          <div><strong>{models.length}</strong><span>modeli</span></div>
          <div><strong>{models.reduce((sum, model) => sum + model.attempts.length, 0)}</strong><span>prób</span></div>
          <div><strong>{models.filter((model) => model.status === "success").length}</strong><span>działa</span></div>
        </div>
      </section>

      <ul className="legend">
        <li><span className="status-pill success">Działa</span> gra przechodzi wszystkie testy</li>
        <li><span className="status-pill partial">Działa z błędami</span> gra się uruchamia, ale część testów nie przechodzi</li>
        <li><span className="status-pill failed">Nie działa</span> gry nie ma albo się nie uruchamia</li>
      </ul>

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
              <span><b>{model.provider}</b>gdzie działał</span>
              <span><b>{model.attempts.length}</b>{attemptsLabel(model.attempts.length)}</span>
              <span><b>{totalTokens(model).toLocaleString("pl-PL")}</b>tokenów</span>
            </div>
            <span className="row-arrow">→</span>
          </Link>
        ))}
      </section>

      <details className="prompt-box">
        <summary>Polecenie, które dostał każdy model</summary>
        <pre>{comparison.prompt}</pre>
      </details>
    </main>
  );
}
