import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dir = path.join(root, "experiments");
const slugs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((slug) => fs.existsSync(path.join(dir, slug, "experiment.json"))) : [];
const allowed = new Set(["success", "partial", "failed", "not-evaluated"]);

test("każdy eksperyment ma poprawny schemat, a media istnieją albo są pod pełnym adresem", () => {
  assert.ok(slugs.length > 0);
  for (const slug of slugs) {
    const experiment = JSON.parse(fs.readFileSync(path.join(dir, slug, "experiment.json"), "utf8"));
    assert.equal(experiment.slug, slug);
    for (const key of ["title", "series", "category", "date", "summary", "question", "hardware"]) assert.ok(experiment[key], `${slug}: brak ${key}`);
    const ids = new Set(experiment.variants.map((variant) => variant.id));
    assert.equal(ids.size, experiment.variants.length, `${slug}: powtórzony wariant`);
    for (const variant of experiment.variants) assert.ok(allowed.has(variant.status), `${slug}/${variant.id}: zły status`);
    assert.ok(experiment.variants.some((variant) => variant.name === experiment.verdict.chosen), `${slug}: werdykt wskazuje nieznany model`);
    const media = [experiment.reference, ...experiment.cases.flatMap((item) => item.results.map((result) => {
      assert.ok(ids.has(result.variant), `${slug}: nieznany wariant ${result.variant}`);
      return result.media;
    }))].filter(Boolean);
    for (const item of media) {
      if (/^https:\/\//.test(item.src)) continue;
      assert.match(item.src, /^media\/[^/]+$/);
      assert.ok(fs.existsSync(path.join(dir, slug, item.src)), `${slug}: brak ${item.src}`);
    }
  }
});

test("opisy eksperymentów nie zawierają lokalnych ścieżek", () => {
  for (const slug of slugs) {
    const text = fs.readFileSync(path.join(dir, slug, "experiment.json"), "utf8");
    assert.doesNotMatch(text, /\/Users\/|\.work\/|~\//, `${slug}: lokalna ścieżka`);
  }
});
