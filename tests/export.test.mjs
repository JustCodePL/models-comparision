import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "out");
const comparison = JSON.parse(fs.readFileSync(path.join(process.cwd(), "2048/comparison.json"), "utf8"));

test("eksport zawiera wszystkie publiczne trasy i 404", () => {
  const routes = ["index.html", "2048/index.html", "404.html", ...comparison.models.map((model) => `2048/${model.slug}/index.html`)];
  for (const route of routes) assert.ok(fs.existsSync(path.join(out, route)), `Brak ${route}`);
});

test("odnośniki do artefaktów zawierają prefiks repozytorium", () => {
  const html = fs.readFileSync(path.join(out, "2048/kimi-k3/index.html"), "utf8");
  assert.match(html, /\/models-comparision\/artifacts\/2048\/openrouter\/kimi-k3\//);
});

test("wyeksportowano artefakty i zrzuty", () => {
  assert.ok(fs.existsSync(path.join(out, "artifacts/2048/openrouter/kimi-k3/index.html")));
  assert.ok(fs.existsSync(path.join(out, "previews/2048/kimi-k3.png")));
});
