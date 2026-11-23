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
  tokens?: { input: number; output: number; reasoning?: number };
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
  provider: "ollama" | "opencode" | "openrouter" | "codex";
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

export type MediaItem = {
  type: "image" | "video" | "audio";
  src: string;
  width?: number;
  height?: number;
  poster?: string;
  caption?: string;
};

export type ExperimentVariant = {
  id: string;
  name: string;
  modelId: string;
  license?: string;
  status: OutcomeStatus;
  settings?: string;
  time?: string;
  summary: string;
};

export type ExperimentResult = {
  variant: string;
  seed?: number;
  seconds?: number;
  note?: string;
  media: MediaItem;
};

export type ExperimentCase = {
  id: string;
  title: string;
  challenge?: string;
  usesReference?: boolean;
  prompt?: string;
  results: ExperimentResult[];
};

export type Experiment = {
  slug: string;
  title: string;
  series: string;
  category: "obraz" | "wideo" | "dźwięk";
  date: string;
  summary: string;
  question: string;
  hardware: string;
  method: string[];
  promptSuffix?: string;
  variants: ExperimentVariant[];
  reference?: MediaItem;
  cases: ExperimentCase[];
  verdict: { chosen: string; text: string };
  findings: string[];
  notices?: string[];
};
