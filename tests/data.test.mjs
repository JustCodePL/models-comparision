import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const comparison = JSON.parse(fs.readFileSync(path.join(root, "2048/comparison.json"), "utf8"));
const allowed = new Set(["success", "partial", "failed", "not-evaluated"]);

test("manifest ma jedenaście modeli, unikalne slugi i wspólny prompt", () => {
  assert.equal(comparison.models.length, 11);
  assert.equal(new Set(comparison.models.map((model) => model.slug)).size, comparison.models.length);
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
  assert.equal(sessions.length, 12);
  assert.equal(new Set(sessions).size, sessions.length);
});

test("GPT-6 ma po jednej sesji z dokładnie wspólnym promptem", () => {
  for (const variant of ["luna", "sol", "astra"]) {
    const slug = `gpt-6-${variant}`;
    const model = JSON.parse(fs.readFileSync(path.join(root, "2048/models/codex", slug, "model.json"), "utf8"));
    assert.equal(model.attempts.length, 1);
    const transcript = JSON.parse(fs.readFileSync(path.join(root, "2048/models/codex", slug, model.attempts[0].transcript), "utf8"));
    assert.equal(transcript.messages.filter((message) => message.role === "user").length, 1);
    assert.equal(transcript.messages[0].text, comparison.prompt);
    assert.equal(transcript.sessionId, model.attempts[0].sessionId);
  }
});

test("DeepSeek ma dwie próby, a Nemotron ma częściowo ukończoną próbę", () => {
  const deepseek = JSON.parse(fs.readFileSync(path.join(root, "2048/models/ollama/deepseek-v4-flash-iq2/model.json"), "utf8"));
  const nemotron = JSON.parse(fs.readFileSync(path.join(root, "2048/models/opencode/nemotron-3-5-lightning/model.json"), "utf8"));
  assert.equal(deepseek.attempts.length, 2);
  assert.deepEqual(deepseek.attempts.map((attempt) => attempt.status), ["failed", "success"]);
  assert.equal(nemotron.status, "partial");
  assert.equal(nemotron.attempts.length, 1);
  assert.equal(nemotron.artifact.kind, "web");
});
