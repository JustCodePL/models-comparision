import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const comparison = JSON.parse(fs.readFileSync(path.join(root, "2048/comparison.json"), "utf8"));
const destinationRoot = path.join(root, "public/artifacts/2048");
fs.rmSync(destinationRoot, { recursive: true, force: true });

for (const ref of comparison.models) {
  const source = path.join(root, "2048/models", ref.provider, ref.slug);
  const model = JSON.parse(fs.readFileSync(path.join(source, "model.json"), "utf8"));
  if (model.artifact.kind === "none") continue;
  if (model.artifact.build) {
    execSync(model.artifact.build, { cwd: source, stdio: "inherit", shell: "/bin/sh" });
  }
  const destination = path.join(destinationRoot, ref.provider, ref.slug);
  fs.mkdirSync(destination, { recursive: true });
  for (const item of model.artifact.include) {
    const from = path.join(source, item);
    if (!fs.existsSync(from)) throw new Error(`${model.slug}: brakuje deklarowanego artefaktu ${item}`);
    fs.cpSync(from, path.join(destination, item), { recursive: true });
  }
}
console.log("Artefakty przygotowane bez modyfikacji kodu modeli.");
