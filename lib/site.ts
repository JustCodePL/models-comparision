/** Per-environment settings, read at build time from the .env that CI loads from Infisical. */
export const site = {
  url: process.env.PAGE_URL || "https://models-comparision.justcode.ac",
  indexing: process.env.ENABLE_ROBOTS === "1",
  tracking:
    process.env.TRACKING_SCRIPT_URL && process.env.TRACKING_ID
      ? { scriptUrl: process.env.TRACKING_SCRIPT_URL, websiteId: process.env.TRACKING_ID }
      : null,
  /** Video and audio live in the environment's R2 bucket under <slug>/<file>. */
  mediaBaseUrl: (process.env.MEDIA_BASE_URL ?? "").replace(/\/+$/, ""),
};
