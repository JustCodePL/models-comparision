import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const databasePath = process.env.OPENCODE_DB ?? path.join(process.env.HOME, ".local/share/opencode/opencode.db");
const db = new DatabaseSync(databasePath, { readOnly: true });

const targets = [
  ["ollama", "deepseek-v4-flash-iq2", "attempt-1", "ses_fb556aa77ffeGnRluz2YNz9ZF4"],
  ["ollama", "deepseek-v4-flash-iq2", "attempt-2", "ses_fb54e8c18ffeoteK96DBiNgleE"],
  ["ollama", "glm-4-7-flash-q4-k-m", "attempt-1", "ses_fb5f1cc55ffeupswUvGToG1oQV"],
  ["ollama", "gpt-oss-20B", "attempt-1", "ses_fb5ddfceaffe0OwxRFKHkhPf0i"],
  ["ollama", "qwen-3-5-4B", "attempt-1", "ses_fb5ffee25ffe0XT3t5fv58fSHN"],
  ["ollama", "qwen-3-8-27B-MLX-8-bit", "attempt-1", "ses_fb62140adffec4qKr0pNqe0mFK"],
  ["opencode", "muse-spark-1-2-free", "attempt-1", "ses_fb5d601efffezSLDkiYDt47HDY"],
  ["opencode", "nemotron-3-5-lightning", "attempt-1", "ses_fac46622fffe88xbhlPQJiLC4v"],
  ["openrouter", "kimi-k3", "attempt-1", "ses_fae51d4dbffeUx2FGmJleCj2SL"]
];

function cleanText(value) {
  return String(value ?? "")
    .replaceAll("/Users/artur/sources/justcode/models-comparision/", "")
    .replaceAll("/Users/artur/projects/2048/", "2048/models/")
    .replace(/\/Users\/[^\s"'`<>]+/g, "<ścieżka-lokalna>")
    .replace(/(authorization\s*[:=]\s*)([^\s,;]+)/gi, "$1[USUNIĘTO]")
    .replace(/\b(Bearer)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 [USUNIĘTO]")
    .replace(/\b(ghp_|github_pat_|sk-)[A-Za-z0-9_-]+/g, "[USUNIĘTO]")
    .trim();
}

function relativeToolPath(value, provider, slug) {
  const raw = String(value ?? "").trim().replaceAll("\\", "/");
  if (!raw) return ".";
  if (raw.startsWith("/var/folders/") || raw.startsWith("/tmp/")) {
    return `<plik-tymczasowy>/${path.posix.basename(raw)}`;
  }
  const modelMarker = `/${slug}`;
  const modelIndex = raw.indexOf(modelMarker);
  if (modelIndex >= 0) {
    const relative = raw.slice(modelIndex + modelMarker.length).replace(/^\/+/, "");
    return relative || ".";
  }
  if (raw.startsWith("/Users/artur/projects/2048/")) {
    const historicalRoots = [
      `/Users/artur/projects/2048/${slug}`,
      `/Users/artur/projects/2048/local/${slug}`,
      `/Users/artur/projects/2048/opencode/${slug}`,
      `/Users/artur/projects/2048/openrouter/${slug}`
    ];
    return historicalRoots
      .map((directory) => path.posix.relative(directory, raw) || ".")
      .sort((left, right) => left.split("/").length - right.split("/").length)[0];
  }
  if (raw.startsWith("/")) return `<poza-katalogiem-zadania>/${path.posix.basename(raw)}`;
  return path.posix.normalize(raw).replace(/^\.\//, "") || ".";
}

function toolTarget(part, provider, slug) {
  const input = part.state?.input ?? {};
  const filePath = input.filePath ?? input.filepath ?? input.file ?? input.path ?? input.directory;
  const base = filePath !== undefined ? relativeToolPath(filePath, provider, slug) : undefined;
  const pattern = typeof input.pattern === "string" ? input.pattern.trim() : "";
  if (base && pattern) return base === "." ? pattern : path.posix.join(base, pattern);
  return base ?? (pattern || undefined);
}

function toolMessage(part, provider, slug) {
  const state = part.state ?? {};
  const failed = state.status === "error";
  const target = toolTarget(part, provider, slug);
  let detail = "";
  const error = String(state.error ?? state.output ?? "");
  if (failed && /reject|permission/i.test(error)) detail = " Operacja została odrzucona przez użytkownika.";
  else if (failed) detail = " Narzędzie zgłosiło błąd.";
  return {
    role: "tool",
    tool: String(part.tool ?? "narzędzie"),
    status: failed ? "error" : "completed",
    text: `Narzędzie ${part.tool ?? "narzędzie"}${target ? ` · ${target}` : ""}: ${failed ? "błąd" : "zakończone"}.${detail}`
  };
}

function importSession(provider, slug, attemptId, sessionId) {
  const session = db.prepare("SELECT id, title, model, time_created, time_updated, tokens_input, tokens_output, tokens_reasoning FROM session WHERE id = ?").get(sessionId);
  if (!session) throw new Error(`Brak sesji ${sessionId}`);

  const rows = db.prepare(`
    SELECT m.id AS message_id, m.data AS message_data, p.data AS part_data
    FROM message m JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
    ORDER BY m.time_created, p.time_created, p.id
  `).all(sessionId);

  const messages = [];
  for (const row of rows) {
    const message = JSON.parse(row.message_data);
    const part = JSON.parse(row.part_data);
    if (message.synthetic === true || part.synthetic === true) continue;
    if (part.type === "text" && (message.role === "user" || message.role === "assistant")) {
      const text = cleanText(part.text);
      if (!text || /^(You have .*weighted tokens left|Continue if you have next steps)/i.test(text)) continue;
      const item = { role: message.role, text };
      const previous = messages.at(-1);
      if (!previous || previous.role !== item.role || previous.text !== item.text) messages.push(item);
    } else if (part.type === "tool" && message.role === "assistant") {
      messages.push(toolMessage(part, provider, slug));
    }
  }

  const output = {
    schemaVersion: 1,
    sessionId,
    title: cleanText(session.title),
    source: "OpenCode SQLite — eksport oczyszczony",
    messages
  };
  const directory = path.join(root, "2048/models", provider, slug, "attempts");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${attemptId}.json`), `${JSON.stringify(output, null, 2)}\n`);
  return output;
}

let commonPrompt = "";
for (const target of targets) {
  const output = importSession(...target);
  const candidate = output.messages.find((message) => message.role === "user" && message.text.startsWith("# Zadanie:"));
  if (!commonPrompt && candidate) commonPrompt = candidate.text;
}

if (!commonPrompt) throw new Error("Nie znaleziono wspólnego promptu");
const comparisonPath = path.join(root, "2048/comparison.json");
const comparison = JSON.parse(fs.readFileSync(comparisonPath, "utf8"));
comparison.prompt = commonPrompt;
fs.writeFileSync(comparisonPath, `${JSON.stringify(comparison, null, 2)}\n`);
console.log(`Zaimportowano ${targets.length} sesji i wspólny prompt.`);
