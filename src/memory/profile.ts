import { readFileSync } from "node:fs";
import { config } from "../config.js";

export function loadProfile(): string {
  try {
    return readFileSync(config.paths.profile, "utf8");
  } catch {
    console.warn("[profile] No profile.md found; using empty system context.");
    return "";
  }
}
