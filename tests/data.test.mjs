import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const comparison = JSON.parse(fs.readFileSync(path.join(root, "2048/comparison.json"), "utf8"));
const allowed = new Set(["success", "partial", "failed", "not-evaluated"]);

test("manifest ma osiem modeli i unikalne slugi", () => {
  assert.equal(comparison.models.length, 8);
  assert.equal(new Set(comparison.models.map((model) => model.slug)).size, 8);
  assert.match(comparison.prompt, /^# Zadanie:/);
});

test("każdy wpis ma poprawny schemat i unikalne sesje", () => {
  const sessions = [];
  for (const ref of comparison.models) {
    const model = JSON.parse(fs.readFileSync(path.join(root, "2048/models", ref.provider, ref.slug, "model.json"), "utf8"));
    assert.equal(model.slug, ref.slug);
    assert.equal(model.provider, ref.provider);
    assert.ok(model.name && model.modelId && model.summary);
    assert.ok(allowed.has(model.status));
    for (const attempt of model.attempts) {
      assert.ok(allowed.has(attempt.status));
      assert.ok(attempt.summary);
      if (attempt.sessionId) sessions.push(attempt.sessionId);
    }
  }
  assert.equal(sessions.length, 8);
  assert.equal(new Set(sessions).size, sessions.length);
});

test("DeepSeek ma dwie próby, a Nemotron nie udaje wyniku", () => {
  const deepseek = JSON.parse(fs.readFileSync(path.join(root, "2048/models/ollama/deepseek-v4-flash-iq2/model.json"), "utf8"));
  const nemotron = JSON.parse(fs.readFileSync(path.join(root, "2048/models/opencode/nemotron-3-5-lightning/model.json"), "utf8"));
  assert.equal(deepseek.attempts.length, 2);
  assert.deepEqual(deepseek.attempts.map((attempt) => attempt.status), ["failed", "success"]);
  assert.equal(nemotron.status, "not-evaluated");
  assert.equal(nemotron.attempts.length, 0);
});
