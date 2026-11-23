import type { OutcomeStatus } from "./types";

/** Labels for the 2048 game results. Experiments name each model's outcome themselves (variant.label). */
export const gameStatusLabels: Record<OutcomeStatus, string> = {
  success: "Działa",
  partial: "Działa z błędami",
  failed: "Nie działa",
  "not-evaluated": "Nie sprawdzono",
};
