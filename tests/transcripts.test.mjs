import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("transkrypty zawierają tylko publiczne typy wiadomości", () => {
  const files = [];
  const models = path.join(process.cwd(), "2048/models");
  for (const provider of fs.readdirSync(models)) for (const slug of fs.readdirSync(path.join(models, provider))) {
    const attempts = path.join(models, provider, slug, "attempts");
    if (fs.existsSync(attempts)) for (const file of fs.readdirSync(attempts)) files.push(path.join(attempts, file));
  }
  assert.equal(files.length, 8);
  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(raw, /\/Users\//);
    assert.doesNotMatch(raw, /reasoning|synthetic/i);
    const transcript = JSON.parse(raw);
    assert.ok(transcript.messages.every((message) => ["user", "assistant", "tool"].includes(message.role)));
  }
});
