// Build without a browser (e.g. the Docker image for the test address): reuse the committed
// 2048/evaluation.json and 2048/previews instead of failing. CI for GitHub Pages runs the full
// evaluation through `npm test`, which still fails when Chromium is missing.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const root = process.cwd();
const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (fs.existsSync(systemChrome) ? systemChrome : undefined);

let browserAvailable = false;
try {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  await browser.close();
  browserAvailable = true;
} catch {
  browserAvailable = false;
}

if (browserAvailable) {
  const run = spawnSync(process.execPath, ["scripts/evaluate-artifacts.mjs"], { stdio: "inherit" });
  process.exit(run.status ?? 1);
}

const missing = ["2048/evaluation.json", "2048/previews"].filter((item) => !fs.existsSync(path.join(root, item)));
if (missing.length) {
  console.error(`Brak przeglądarki i zapisanych wyników: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("Brak przeglądarki: używam zapisanej ewaluacji 2048 i zrzutów z repozytorium.");
