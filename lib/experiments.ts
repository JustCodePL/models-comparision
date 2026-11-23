import fs from "node:fs";
import path from "node:path";
import type { Experiment, MediaItem } from "./types";
import { publicUrl } from "./data";
import { site } from "./site";

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

/**
 * Images from the repository live under public/media/<slug>/. Video and audio (`media/x.mp4` in the JSON) live in the
 * environment's R2 bucket at MEDIA_BASE_URL/<slug>/x.mp4. Absolute URLs are kept as they are.
 */
export function mediaUrl(experiment: Experiment, media: MediaItem | string): string {
  const src = typeof media === "string" ? media : media.src;
  if (/^https?:\/\//.test(src)) return src;
  const type = typeof media === "string" ? "image" : media.type;
  if (type !== "image") {
    if (!site.mediaBaseUrl) throw new Error(`MEDIA_BASE_URL is not set, needed for ${src}`);
    return `${site.mediaBaseUrl}/${experiment.slug}/${src.replace(/^media\//, "")}`;
  }
  return publicUrl(`${src.replace(/^media\//, `media/${experiment.slug}/`)}`);
}
