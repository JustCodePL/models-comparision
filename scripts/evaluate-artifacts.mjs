import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "@playwright/test";

const root = process.cwd();
const publicDir = path.join(root, "public");
const previewDir = path.join(publicDir, "previews/2048");
fs.mkdirSync(previewDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(root, "2048/comparison.json"), "utf8"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const requested = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const file = path.resolve(publicDir, `.${requested}`);
  if (!file.startsWith(`${publicDir}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": mime[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : fs.existsSync(systemChrome) ? { executablePath: systemChrome } : {};
const browser = await chromium.launch({ ...launchOptions, headless: true });

const adapters = {
  "deepseek-v4-flash-iq2": { cells: ".grid-cell", tiles: "#tiles .tile", restart: "#new-game", board: "#board" },
  "glm-4-7-flash-q4-k-m": { cells: "#game-board [data-row]", tiles: "#game-board [data-row]", restart: ".new-game-btn", board: "#game-board", logicalCells: true },
  "qwen-3-8-27B-MLX-8-bit": { cells: "#board .cell", tiles: "#board .tile", restart: "#new-game", board: "#board" },
  "muse-spark-1-2-free": { cells: "#board .cell", tiles: "#board .tile", restart: "#newGameBtn", board: "#board" },
  "nemotron-3-5-lightning": { cells: "#board .tile", tiles: "#board .tile:not(:empty)", restart: "#newGame", board: "#board" },
  "kimi-k3": { cells: "#cells .cell", tiles: "#tiles .tile", restart: "#new-game", board: "#board" }
};

function check(id, label, status, details) {
  return { id, label, status, ...(details ? { details } : {}) };
}

const report = { generatedAt: new Date().toISOString(), models: {} };
for (const ref of manifest.models) {
  const source = path.join(root, "2048/models", ref.provider, ref.slug);
  const model = JSON.parse(fs.readFileSync(path.join(source, "model.json"), "utf8"));
  const checks = [];
  if (model.artifact.kind === "none") {
    checks.push(check("artifact", "Dostępność artefaktu", model.status === "not-evaluated" ? "skipped" : "failed", model.status === "not-evaluated" ? "Brak sesji i artefaktu." : "Model nie utworzył plików."));
    report.models[model.slug] = { status: model.status, checks };
    continue;
  }

  const staged = path.join(publicDir, "artifacts/2048", ref.provider, ref.slug);
  const entrypoint = path.join(staged, model.artifact.entrypoint);
  const html = fs.existsSync(entrypoint) ? fs.readFileSync(entrypoint, "utf8") : "";
  const referenced = [...html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/g)].map((match) => match[1]).filter((item) => !/^(https?:|data:|#)/.test(item));
  const missing = referenced.filter((item) => !fs.existsSync(path.resolve(staged, item)));
  checks.push(check("artifact", "Dostępność plików", missing.length ? "failed" : "passed", missing.length ? `Brak: ${missing.join(", ")}` : undefined));

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    Math.random = () => 0;
    localStorage.clear();
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) runtimeErrors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  const url = `http://127.0.0.1:${port}/artifacts/2048/${ref.provider}/${ref.slug}/`;
  try {
    const response = await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    const adapter = adapters[model.slug];
    const startPassed = response?.ok() && runtimeErrors.length === 0 && missing.length === 0;
    checks.push(check("startup", "Start bez błędów", startPassed ? "passed" : "failed", runtimeErrors[0] ?? (missing.length ? "Brak zależności wejściowej." : undefined)));
    if (!adapter || !startPassed) {
      for (const [id, label] of [["board", "Plansza 4 × 4"], ["initial", "Dwa kafelki początkowe"], ["restart", "Restart"], ["movement", "Sterowanie ruchem"], ["merge", "Łączenie 2 + 2 = 4"], ["spawn", "Nowy kafelek po ruchu"], ["mobile", "Widok mobilny"]]) checks.push(check(id, label, "skipped"));
    } else {
      const cellCount = adapter.logicalCells ? await page.evaluate(() => eval("board.length === 4 && board.every(row => row.length === 4)") ? 16 : 0) : await page.locator(adapter.cells).count();
      const boardBounds = await page.locator(adapter.board).first().boundingBox();
      const boardHasGridShape = boardBounds && boardBounds.width >= 150 && boardBounds.height >= 150 && boardBounds.height / boardBounds.width >= 0.65;
      const boardPassed = cellCount === 16 && boardHasGridShape;
      const boardSize = boardBounds ? `${Math.round(boardBounds.width)} × ${Math.round(boardBounds.height)} px` : "brak wymiarów";
      checks.push(check("board", "Plansza 4 × 4", boardPassed ? "passed" : "failed", `Wykryto ${cellCount} pól; rozmiar planszy: ${boardSize}.`));
      const tileValues = async () => page.locator(adapter.tiles).allTextContents().then((items) => items.map((item) => Number(item.trim())).filter(Number.isFinite));
      const initial = await tileValues();
      checks.push(check("initial", "Dwa kafelki początkowe", initial.length === 2 ? "passed" : "failed", `Wykryto ${initial.length} kafelków.`));
      await page.locator(adapter.restart).first().click();
      await page.waitForTimeout(120);
      const restarted = await tileValues();
      checks.push(check("restart", "Restart", restarted.length === 2 ? "passed" : "failed"));
      const before = restarted.join(",");
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(500);
      const after = await tileValues();
      checks.push(check("movement", "Sterowanie ruchem", after.join(",") !== before ? "passed" : "failed"));
      checks.push(check("merge", "Łączenie 2 + 2 = 4", after.includes(4) ? "passed" : "failed", after.includes(4) ? undefined : `Wartości po ruchu: ${after.join(", ") || "brak"}.`));
      checks.push(check("spawn", "Nowy kafelek po prawidłowym ruchu", after.includes(4) && after.length === 2 ? "passed" : "failed"));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(120);
      const bounds = await page.locator(adapter.board).first().boundingBox();
      checks.push(check("mobile", "Widok mobilny", bounds && bounds.width <= 390 ? "passed" : "failed"));
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(previewDir, `${model.slug}.png`), fullPage: true });
  } catch (error) {
    checks.push(check("startup", "Start bez błędów", "failed", error.message));
  } finally {
    await context.close();
  }

  const failed = checks.filter((item) => item.status === "failed").map((item) => item.id);
  const actualStatus = failed.length === 0 ? "success" : checks.some((item) => item.id === "startup" && item.status === "passed") ? "partial" : "failed";
  if (actualStatus !== model.status) throw new Error(`${model.slug}: manifest=${model.status}, ewaluacja=${actualStatus}; błędy: ${failed.join(", ")}`);
  report.models[model.slug] = { status: actualStatus, checks };
}

await browser.close();
await new Promise((resolve) => server.close(resolve));
fs.writeFileSync(path.join(root, "2048/evaluation.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log("Ewaluacja artefaktów i zrzuty ekranu: OK.");
