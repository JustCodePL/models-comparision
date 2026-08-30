export type OutcomeStatus = "success" | "partial" | "failed" | "not-evaluated";

export type TranscriptMessage = {
  role: "user" | "assistant" | "tool";
  text: string;
  tool?: string;
  status?: "completed" | "error";
};

export type Attempt = {
  id: string;
  sessionId?: string;
  title: string;
  status: OutcomeStatus;
  startedAt?: string;
  durationSeconds?: number;
  tokens?: { input: number; output: number; reasoning: number };
  openCodeVersion?: string;
  summary: string;
  transcript?: string;
};

export type EvaluationCheck = {
  id: string;
  label: string;
  status: "passed" | "failed" | "skipped";
  details?: string;
};

export type Artifact = {
  kind: "web" | "none";
  entrypoint?: string;
  include?: string[];
  build?: string;
};

export type ModelEntry = {
  slug: string;
  name: string;
  provider: "ollama" | "opencode" | "openrouter";
  modelId: string;
  status: OutcomeStatus;
  summary: string;
  artifact: Artifact;
  attempts: Attempt[];
  evaluation: EvaluationCheck[];
};

export type ComparisonManifest = {
  slug: string;
  title: string;
  description: string;
  prompt: string;
  publishedAt: string;
  models: Array<{ provider: ModelEntry["provider"]; slug: string }>;
};
