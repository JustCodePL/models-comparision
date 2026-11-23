import Link from "next/link";
import { notFound } from "next/navigation";
import { getModel, getModels, getTranscript, publicUrl } from "../../../lib/data";
import { gameStatusLabels as statusLabels } from "../../../lib/labels";

export function generateStaticParams() {
  return getModels().map(({ slug }) => ({ slug }));
}

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) notFound();
  const artifactUrl = model.artifact.kind === "web" ? publicUrl(`artifacts/2048/${model.provider}/${model.slug}/`) : undefined;
  const previewUrl = publicUrl(`previews/2048/${model.slug}.png`);
  return (
    <main>
      <nav className="breadcrumbs"><Link href="/">Testy</Link><span>/</span><Link href="/2048/">2048</Link><span>/</span><span>{model.name}</span></nav>
      <section className="model-hero">
        <div>
          <div className="tag-row"><span className="tag">{model.provider}</span><span className={`status-pill ${model.status}`}>{statusLabels[model.status]}</span></div>
          <h1>{model.name}</h1>
          <code>{model.modelId}</code>
          <p className="lead">{model.summary}</p>
          {artifactUrl ? <a className="primary-button" href={artifactUrl}>Zagraj ↗</a> : <span className="disabled-button">Brak gry do uruchomienia</span>}
        </div>
        {artifactUrl && <a className="artifact-shot" href={previewUrl} data-lightbox="" data-caption={`Gra modelu ${model.name}`}><img src={previewUrl} alt={`Gra modelu ${model.name}`} /></a>}
      </section>

      <section className="detail-grid">
        <div className="panel">
          <h2>Testy</h2>
          <ul className="checks">
            {model.evaluation.map((item) => <li key={item.id} className={item.status}><span>{item.status === "passed" ? "✓" : item.status === "failed" ? "×" : "–"}</span><div><strong>{item.label}</strong>{item.details && <small>{item.details}</small>}</div></li>)}
            {model.evaluation.length === 0 && <li className="skipped"><span>–</span><div><strong>Nie sprawdzono</strong><small>Model nie oddał gry.</small></div></li>}
          </ul>
        </div>
        <div className="panel">
          <h2>Szczegóły</h2>
          <dl className="metadata">
            <div><dt>Gdzie działał</dt><dd>{model.provider}</dd></div>
            <div><dt>Prób</dt><dd>{model.attempts.length}</dd></div>
            <div><dt>Narzędzie</dt><dd>{model.attempts[0]?.openCodeVersion ? `OpenCode ${model.attempts[0].openCodeVersion}` : model.provider === "codex" ? "Codex CLI" : "—"}</dd></div>
            {model.provider === "codex" && <div><dt>Tryb</dt><dd>Jeden prompt, bez dalszych poleceń</dd></div>}
            <div><dt>Model</dt><dd>{model.modelId}</dd></div>
          </dl>
        </div>
      </section>

      <section className="transcripts">
        <h2>Rozmowa z modelem</h2>
        <p className="muted">Bez rozumowania modelu, komunikatów systemowych i pełnych wyników narzędzi.</p>
        {model.attempts.map((attempt) => {
          const messages = getTranscript(model, attempt);
          const tokens = attempt.tokens;
          return (
            <details className="attempt" key={attempt.id} open={model.attempts.length === 1}>
              <summary><span><strong>{attempt.title}</strong><small>{attempt.summary}</small></span><span className={`status-pill ${attempt.status}`}>{statusLabels[attempt.status]}</span></summary>
              <div className="attempt-meta">
                <span>{attempt.durationSeconds ? `${Math.round(attempt.durationSeconds / 60)} min` : "—"}</span>
                <span>{tokens ? `${(tokens.input + tokens.output + (tokens.reasoning ?? 0)).toLocaleString("pl-PL")} tokenów` : "—"}</span>
                <span>{attempt.openCodeVersion ? `OpenCode ${attempt.openCodeVersion}` : model.provider === "codex" ? "Codex CLI" : "—"}</span>
              </div>
              <div className="messages">
                {messages.map((message, index) => <article className={`message ${message.role}`} key={`${attempt.id}-${index}`}><span>{message.role === "user" ? "Użytkownik" : message.role === "assistant" ? "Model" : message.tool ?? "Narzędzie"}</span><p>{message.text}</p></article>)}
              </div>
            </details>
          );
        })}
        {model.attempts.length === 0 && <div className="empty-state">Nie znaleziono rozmowy dla tego modelu.</div>}
      </section>
    </main>
  );
}
