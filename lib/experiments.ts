import fs from "node:fs";
import path from "node:path";
import type { Experiment, MediaItem } from "./types";
import { publicUrl } from "./data";

const experimentsDir = path.join(process.cwd(), "experiments");

export function getExperiments(): Experiment[] {
  if (!fs.existsSync(experimentsDir)) return [];
  return fs.readdirSync(experimentsDir)
    .filter((slug) => fs.existsSync(path.join(experimentsDir, slug, "experiment.json")))
    .map((slug) => JSON.parse(fs.readFileSync(path.join(experimentsDir, slug, "experiment.json"), "utf8")) as Experiment)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getExperiment(slug: string): Experiment | undefined {
  return getExperiments().find((experiment) => experiment.slug === slug);
}

/** Media from the repository live under public/media/<slug>/; external media (R2) keep their absolute URL. */
export function mediaUrl(experiment: Experiment, media: MediaItem | string): string {
  const src = typeof media === "string" ? media : media.src;
  if (/^https?:\/\//.test(src)) return src;
  return publicUrl(`${src.replace(/^media\//, `media/${experiment.slug}/`)}`);
}
