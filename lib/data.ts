import fs from "node:fs";
import path from "node:path";
import type { Attempt, ComparisonManifest, ModelEntry, TranscriptMessage } from "./types";

const root = process.cwd();

export function getComparison(): ComparisonManifest {
  return JSON.parse(fs.readFileSync(path.join(root, "2048/comparison.json"), "utf8"));
}

export function getModels(): ModelEntry[] {
  const comparison = getComparison();
  const reportPath = path.join(root, "2048/evaluation.json");
  const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : { models: {} };
  return comparison.models.map(({ provider, slug }) => {
    const file = path.join(root, "2048/models", provider, slug, "model.json");
    const model: ModelEntry = JSON.parse(fs.readFileSync(file, "utf8"));
    model.evaluation = report.models?.[slug]?.checks ?? model.evaluation;
    return model;
  });
}

export function getModel(slug: string): ModelEntry | undefined {
  return getModels().find((model) => model.slug === slug);
}

export function getTranscript(model: ModelEntry, attempt: Attempt): TranscriptMessage[] {
  if (!attempt.transcript) return [];
  const file = path.join(root, "2048/models", model.provider, model.slug, attempt.transcript);
  return JSON.parse(fs.readFileSync(file, "utf8")).messages;
}

export function publicUrl(relative: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}/${relative.replace(/^\/+/, "")}`;
}
