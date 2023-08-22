import { exec } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream, promises as fs } from "node:fs";
import { promisify } from "node:util";
import { Agency, Route, Trip, VehicleType } from "gtfs-types";
import { Extract } from "unzip-stream";
import { config as dotenv } from "dotenv";
import type { TripObjectFile } from "../functions/_helpers/types.def.js";
import { csvToJsonObject } from "./util/csvToJsonObject.js";

dotenv({ path: ".dev.vars" });

const __dirname = fileURLToPath(new URL(".", import.meta.url));
export const TEMP_FOLDER = join(__dirname, "../tmp");

// don't use the https://cdn01.at.govt.nz/data/gtfs.zip URL, that's the better
// data source (it has school busses), but the IDs don't match the IDs used by
// the cancellations API...
const AT_GTFS_URL = "https://gtfs.at.govt.nz/gtfs.zip";

const execAsync = promisify(exec);
export async function fetchTimetables() {
  const token = process.env.UPLOAD_TOKEN;
  if (!token) throw new Error("No UPLOAD_TOKEN configured");

  await fs.mkdir(TEMP_FOLDER, { recursive: true });

  //
  // 1. Download zip
  //
  console.log(`Downloading GTFS Zip...`);
  const pathToZip = join(TEMP_FOLDER, "gtfs.zip");

  const { stdout, stderr } = await execAsync(
    `curl "${AT_GTFS_URL}" -o ${pathToZip}`
  );
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);

  //
  // 2. Unzip
  //
  console.log("Unzipping GTFS file...");
  const folderPath = join(TEMP_FOLDER, "gtfs");

  await new Promise((resolve, reject) => {
    createReadStream(pathToZip)
      .pipe(Extract({ path: folderPath }))
      .on("close", resolve)
      .on("error", reject);
  });

  //
  // 3. Read GTFS tables
  //
  console.log("Reading CSV file...");
  const agencies = await csvToJsonObject<Agency>(
    join(TEMP_FOLDER, "gtfs", "agency.txt"),
    "agency_id"
  );
  const routes = await csvToJsonObject<Route>(
    join(TEMP_FOLDER, "gtfs", "routes.txt"),
    "route_id"
  );
  const trips = await csvToJsonObject<Trip>(
    join(TEMP_FOLDER, "gtfs", "trips.txt"),
    "trip_id"
  );

  //
  // 4. Merge GTFS tables into an object keyed by the trip_id
  //
  console.log("Merging tables...");
  const tripObject: TripObjectFile = {};
  for (const tripId in trips) {
    const trip = trips[tripId][0];
    const route = routes[trip.route_id][0];
    const agency = agencies[route.agency_id!]?.[0]?.agency_name || "Unknown";

    if (+route.route_type === VehicleType.FERRY) {
      tripObject[tripId] = {
        rsn: route.route_short_name!,
        operator: agency,
        destination: trip.trip_headsign || "Unknown",
        // TODO: get trip start & end times from stop_times.txt
      };
    }
  }

  //
  // 5. Save TripObj to disk
  //
  console.log("Saving result to disk...");
  await fs.writeFile(
    join(TEMP_FOLDER, "tripObj.json"),
    JSON.stringify(tripObject, null, 2)
  );

  //
  // 6. Upload TripObj to the API
  //
  const response = await fetch(
    "https://ferry.kyle.kiwi/api/admin/update_timetables",
    {
      method: "POST",
      body: JSON.stringify(tripObject),
      headers: { Authentication: token },
    }
  ).then((r) => r.json());

  if (response.error) throw new Error(response.error);

  console.log("Done!");
}

fetchTimetables();
