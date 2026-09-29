import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const report = JSON.parse(fs.readFileSync(path.join(root, "2048/evaluation.json"), "utf8"));

function result(slug, check) {
  return report.models[slug].checks.find((item) => item.id === check)?.status;
}

test("znane porażki są jawne i zgodne z ewaluacją", () => {
  assert.equal(report.models["qwen-3-5-4B"].status, "failed");
  assert.equal(result("qwen-3-5-4B", "artifact"), "failed");
  assert.equal(report.models["gpt-oss-20B"].status, "failed");
  assert.equal(result("gpt-oss-20B", "artifact"), "failed");
  assert.equal(report.models["glm-4-7-flash-q4-k-m"].status, "partial");
  assert.equal(result("glm-4-7-flash-q4-k-m", "merge"), "failed");
});

test("sukces oznacza przejście wszystkich wspólnych kontroli", () => {
  for (const slug of ["deepseek-v4-flash-iq2", "qwen-3-8-27B-MLX-8-bit", "muse-spark-1-2-free", "kimi-k3", "gpt-6-luna", "gpt-6-sol", "gpt-6-astra"]) {
    assert.equal(report.models[slug].status, "success");
    assert.ok(report.models[slug].checks.length >= 8);
    assert.ok(report.models[slug].checks.every((item) => item.status === "passed"));
  }

  assert.equal(report.models["nemotron-3-5-lightning"].status, "partial");
  assert.equal(report.models["nemotron-3-5-lightning"].checks.find((item) => item.id === "board").status, "failed");
});

test("GPT OSS nadal wskazuje brakujący entrypoint", () => {
  const html = fs.readFileSync(path.join(root, "2048/models/ollama/gpt-oss-20B/index.html"), "utf8");
  assert.match(html, /compiled\/main\.js/);
  assert.equal(fs.existsSync(path.join(root, "2048/models/ollama/gpt-oss-20B/compiled/main.js")), false);
});

test("Kimi zachowuje 22 scenariusze testowe", () => {
  const tests = fs.readFileSync(path.join(root, "2048/models/openrouter/kimi-k3/test/logic.test.js"), "utf8");
  assert.equal((tests.match(/^test\s*\(/gm) ?? []).length, 22);
});
