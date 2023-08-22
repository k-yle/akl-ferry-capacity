import csv from "csv-parser";
import { createReadStream } from "fs";

/**
 * reads an entire csv file into memory, obvioulsy
 * not suitable for `stop_times` or `shapes`
 */
export function csvToJsonObject<T>(path: string, key: keyof T) {
  return new Promise<Record<string, T[]>>((resolve, reject) => {
    const results: Record<string, T[]> = {};
    createReadStream(path)
      .pipe(csv())
      .on("data", (data) => {
        results[data[key]] ||= [];
        results[data[key]].push(data);
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}
