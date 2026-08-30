import Link from "next/link";
import { notFound } from "next/navigation";
import { getModel, getModels, getTranscript, publicUrl } from "../../../lib/data";
import type { OutcomeStatus } from "../../../lib/types";

const statusLabels: Record<OutcomeStatus, string> = { success: "Sukces", partial: "Częściowy", failed: "Niepowodzenie", "not-evaluated": "Nie oceniono" };

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
      <nav className="breadcrumbs"><Link href="/">Porównania</Link><span>/</span><Link href="/2048/">2048</Link><span>/</span><span>{model.name}</span></nav>
      <section className="model-hero">
        <div>
          <div className="tag-row"><span className="tag">{model.provider}</span><span className={`status-pill ${model.status}`}>{statusLabels[model.status]}</span></div>
          <h1>{model.name}</h1>
          <code>{model.modelId}</code>
          <p className="lead">{model.summary}</p>
          {artifactUrl ? <a className="primary-button" href={artifactUrl}>Uruchom grę / zobacz artefakt ↗</a> : <span className="disabled-button">Brak artefaktu do uruchomienia</span>}
        </div>
        {artifactUrl && <div className="artifact-shot"><img src={previewUrl} alt={`Zrzut artefaktu modelu ${model.name}`} /></div>}
      </section>

      <section className="detail-grid">
        <div className="panel">
          <p className="eyebrow">WSPÓLNA EWALUACJA</p>
          <h2>Kontrole techniczne</h2>
          <ul className="checks">
            {model.evaluation.map((item) => <li key={item.id} className={item.status}><span>{item.status === "passed" ? "✓" : item.status === "failed" ? "×" : "–"}</span><div><strong>{item.label}</strong>{item.details && <small>{item.details}</small>}</div></li>)}
            {model.evaluation.length === 0 && <li className="skipped"><span>–</span><div><strong>Brak ewaluacji</strong><small>Nie ma artefaktu ani sesji do oceny.</small></div></li>}
          </ul>
        </div>
        <div className="panel">
          <p className="eyebrow">METADANE</p>
          <h2>Przebieg próby</h2>
          <dl className="metadata">
            <div><dt>Dostawca</dt><dd>{model.provider}</dd></div>
            <div><dt>Prób</dt><dd>{model.attempts.length}</dd></div>
            <div><dt>OpenCode</dt><dd>{model.attempts[0]?.openCodeVersion ?? "—"}</dd></div>
            <div><dt>Model</dt><dd>{model.modelId}</dd></div>
          </dl>
        </div>
      </section>

      <section className="transcripts">
        <p className="eyebrow">HISTORIA OPENCODE</p>
        <h2>Rozmowa i próby</h2>
        <p className="muted">Reasoning, komunikaty systemowe, pełne wyniki narzędzi i dane lokalne zostały usunięte.</p>
        {model.attempts.map((attempt) => {
          const messages = getTranscript(model, attempt);
          const tokens = attempt.tokens;
          return (
            <details className="attempt" key={attempt.id} open={model.attempts.length === 1}>
              <summary><span><strong>{attempt.title}</strong><small>{attempt.summary}</small></span><span className={`status-pill ${attempt.status}`}>{statusLabels[attempt.status]}</span></summary>
              <div className="attempt-meta">
                <span>{attempt.durationSeconds ? `${Math.round(attempt.durationSeconds / 60)} min` : "—"}</span>
                <span>{tokens ? `${(tokens.input + tokens.output + tokens.reasoning).toLocaleString("pl-PL")} tokenów` : "—"}</span>
                <span>{attempt.openCodeVersion ? `OpenCode ${attempt.openCodeVersion}` : "—"}</span>
              </div>
              <div className="messages">
                {messages.map((message, index) => <article className={`message ${message.role}`} key={`${attempt.id}-${index}`}><span>{message.role === "user" ? "Użytkownik" : message.role === "assistant" ? "Model" : message.tool ?? "Narzędzie"}</span><p>{message.text}</p></article>)}
              </div>
            </details>
          );
        })}
        {model.attempts.length === 0 && <div className="empty-state">Nie znaleziono rozmowy OpenCode dla tego modelu.</div>}
      </section>
    </main>
  );
}
