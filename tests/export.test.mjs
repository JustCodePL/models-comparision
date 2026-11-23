import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "out");
const comparison = JSON.parse(fs.readFileSync(path.join(process.cwd(), "2048/comparison.json"), "utf8"));

test("eksport zawiera wszystkie publiczne trasy i 404", () => {
  const experiments = fs.readdirSync(path.join(process.cwd(), "experiments")).map((slug) => `eksperymenty/${slug}/index.html`);
  const routes = ["index.html", "2048/index.html", "404.html", ...comparison.models.map((model) => `2048/${model.slug}/index.html`), ...experiments];
  for (const route of routes) assert.ok(fs.existsSync(path.join(out, route)), `Brak ${route}`);
});

test("odnośniki do artefaktów prowadzą od katalogu głównego", () => {
  const html = fs.readFileSync(path.join(out, "2048/kimi-k3/index.html"), "utf8");
  assert.match(html, /"\/artifacts\/2048\/openrouter\/kimi-k3\//);
});

test("wyeksportowano artefakty i zrzuty", () => {
  assert.ok(fs.existsSync(path.join(out, "artifacts/2048/openrouter/kimi-k3/index.html")));
  assert.ok(fs.existsSync(path.join(out, "previews/2048/kimi-k3.png")));
  for (const variant of ["luna", "sol", "astra"]) {
    const slug = `gpt-6-${variant}`;
    assert.ok(fs.existsSync(path.join(out, "artifacts/2048/codex", slug, "index.html")));
    assert.ok(fs.existsSync(path.join(out, "previews/2048", `${slug}.png`)));
  }
});

test("media eksperymentów są w eksporcie", () => {
  const html = fs.readFileSync(path.join(out, "eksperymenty/klatki-startowe-lokomotywa/index.html"), "utf8");
  assert.match(html, /"\/media\/klatki-startowe-lokomotywa\/A01_flux3_5501\.webp/);
  assert.ok(fs.existsSync(path.join(out, "media/klatki-startowe-lokomotywa/A01_flux3_5501.webp")));
});

test("bez ENABLE_ROBOTS=1 strona ma noindex", () => {
  const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  if (process.env.ENABLE_ROBOTS === "1") assert.doesNotMatch(html, /noindex/);
  else assert.match(html, /<meta name="robots" content="noindex, nofollow"\/>/);
});
