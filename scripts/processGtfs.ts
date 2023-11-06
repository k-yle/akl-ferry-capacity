import { exec } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream, promises as fs } from "node:fs";
import { promisify } from "node:util";
import {
  type Agency,
  type Route,
  type Trip,
  VehicleType,
  type Calendar,
  type CalendarDates,
  type Stop,
  type StopTime,
} from "gtfs-types";
import { Extract } from "unzip-stream";
import { config as dotenv } from "dotenv";
import type {
  Rsn,
  StaticTimetableDB,
} from "../functions/_helpers/types.def.js";
import { csvToJsonObject } from "./util/csvToJsonObject.js";
import { getDatesForTrip } from "./util/date.ts";

dotenv({ path: ".dev.vars" });

const __dirname = fileURLToPath(new URL(".", import.meta.url));
export const TEMP_FOLDER = join(__dirname, "../tmp");

// don't use the https://cdn01.at.govt.nz/data/gtfs.zip URL, that's the better
// data source (it has school busses), but the IDs don't match the IDs used by
// the cancellations API...
const AT_GTFS_URL = "https://gtfs.at.govt.nz/gtfs.zip";

const execAsync = promisify(exec);
export async function fetchTimetables() {
  /** if true, network requests are skipped */
  const dryRun = process.argv.includes("--dry");
  const developmentApi = process.argv.includes("--dev");

  const token = process.env.UPLOAD_TOKEN;
  if (!token) throw new Error("No UPLOAD_TOKEN configured");

  await fs.mkdir(TEMP_FOLDER, { recursive: true });

  //
  // 1. Download zip
  //
  const pathToZip = join(TEMP_FOLDER, "gtfs.zip");

  if (!dryRun) {
    console.log(`Downloading GTFS Zip...`);
    const { stdout, stderr } = await execAsync(
      `curl "${AT_GTFS_URL}" -o ${pathToZip}`
    );
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  }

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
  const calendar = await csvToJsonObject<Calendar>(
    join(TEMP_FOLDER, "gtfs", "calendar.txt"),
    "service_id"
  );
  const calendarDates = await csvToJsonObject<CalendarDates>(
    join(TEMP_FOLDER, "gtfs", "calendar_dates.txt"),
    "service_id"
  );
  const routes = await csvToJsonObject<Route>(
    join(TEMP_FOLDER, "gtfs", "routes.txt"),
    "route_id"
  );
  const trips = await csvToJsonObject<Trip>(
    join(TEMP_FOLDER, "gtfs", "trips.txt"),
    "trip_id"
  );
  const stops = await csvToJsonObject<Stop>(
    join(TEMP_FOLDER, "gtfs", "stops.txt"),
    "stop_id"
  );
  const stopTimes = await csvToJsonObject<StopTime>(
    join(TEMP_FOLDER, "gtfs", "stop_times.txt"),
    "trip_id"
  );

  //
  // 4. Merge GTFS tables into an object keyed by the trip_id
  //
  console.log("Merging tables...");
  const staticTimetableDB: StaticTimetableDB = {
    stopIds: {},
    trips: {},
  };
  for (const tripId in trips) {
    const trip = trips[tripId][0];
    const route = routes[trip.route_id][0];
    const agency = agencies[route.agency_id!]?.[0]?.agency_name || "Unknown";

    if (+route.route_type === VehicleType.FERRY) {
      const rsn = <Rsn>route.route_short_name;

      const finalStopTimes = stopTimes[tripId]
        .sort((a, b) => +a.stop_sequence - +b.stop_sequence)
        .map((stopTime) => {
          const stop = stops[stopTime.stop_id][0];
          const station = stops[stop.parent_station!][0];

          staticTimetableDB.stopIds[stop.stop_id] ||= [];
          if (staticTimetableDB.stopIds[stop.stop_id].includes(rsn)) {
            staticTimetableDB.stopIds[stop.stop_id].push(rsn);
          }

          return {
            stop: station.stop_code!,
            pier: stop.platform_code,
            time: (stopTime.departure_time || stopTime.arrival_time)!,
            headsign: stopTime.stop_headsign!,
          };
        });

      const dates = getDatesForTrip(
        calendar[trip.service_id][0],
        calendarDates[trip.service_id]
      );

      staticTimetableDB.trips[tripId] = {
        tripId,
        rsn,
        routeId: route.route_id,
        operator: agency,
        destination: trip.trip_headsign || "Unknown",
        dates,
        stopTimes: finalStopTimes,
      };
    }
  }

  //
  // 5. Save TripObj to disk
  //
  console.log("Saving result to disk...");
  await fs.writeFile(
    join(TEMP_FOLDER, "tripObj.json"),
    JSON.stringify(staticTimetableDB, null, 2)
  );

  //
  // 6. Upload TripObj to the API
  //
  if (!dryRun) {
    console.log("Uploading result to server...");
    const API_URL = developmentApi
      ? "http://127.0.0.1:8788"
      : "https://akl.boats";

    const response = await fetch(`${API_URL}/api/admin/update_timetables`, {
      method: "POST",
      body: JSON.stringify(staticTimetableDB),
      headers: { Authentication: token },
    }).then((r) => r.json());

    if (typeof response === "object" && response && "error" in response) {
      throw new Error(`${response.error}`);
    }

    //
    // 7. Update the list of vessels
    //
    console.log("Updating vessel list...");
    const response2 = await fetch(
      `${API_URL}/api/admin/update_vessel_info?authentication=${token}`
    ).then((r) => r.text());
    if (response2 !== "OK") throw new Error(response2);
  }

  console.log("Done!");
}

fetchTimetables();
