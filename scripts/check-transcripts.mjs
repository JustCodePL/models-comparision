import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "2048");
const files = [];
for (const provider of fs.readdirSync(path.join(root, "models"))) {
  const providerDir = path.join(root, "models", provider);
  for (const slug of fs.readdirSync(providerDir)) {
    const attempts = path.join(providerDir, slug, "attempts");
    if (!fs.existsSync(attempts)) continue;
    for (const file of fs.readdirSync(attempts)) if (file.endsWith(".json")) files.push(path.join(attempts, file));
  }
}

const forbidden = [
  [/\/Users\//, "absolutna ścieżka użytkownika"],
  [/"type"\s*:\s*"reasoning"/i, "reasoning"],
  [/"synthetic"\s*:\s*true/i, "synthetic"],
  [/\b(ghp_|github_pat_|sk-)[A-Za-z0-9_-]+/, "prefiks sekretu"],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/i, "nagłówek autoryzacji"],
  [/authorization\s*[:=]\s*(?!\[USUNIĘTO\])/i, "nagłówek autoryzacji"]
];

if (files.length !== 12) throw new Error(`Oczekiwano 12 transkryptów, znaleziono ${files.length}`);
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  for (const [pattern, label] of forbidden) if (pattern.test(raw)) throw new Error(`${file}: wykryto ${label}`);
  const data = JSON.parse(raw);
  if (!Array.isArray(data.messages) || data.messages.length === 0) throw new Error(`${file}: pusty transkrypt`);
  for (const message of data.messages) {
    if (!["user", "assistant", "tool"].includes(message.role)) throw new Error(`${file}: niedozwolona rola`);
    if (message.role === "tool" && message.text.length > 220) throw new Error(`${file}: zbyt długi wynik narzędzia`);
  }
}
console.log(`Redakcja ${files.length} transkryptów: OK.`);
