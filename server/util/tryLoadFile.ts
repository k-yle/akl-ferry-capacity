import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TEMP_FOLDER } from "../constants.ts";

export function tryLoadFile<T>(fileName: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(TEMP_FOLDER, fileName), "utf8"));
  } catch {
    console.log(`File not available: “${fileName}”`);
    return fallback;
  }
}
