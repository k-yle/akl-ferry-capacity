import { promises as fs } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Vessel, VesselInfo } from "../types.def.ts";
import { API_HEADERS, TEMP_FOLDER } from "../constants.ts";

type WikidataAPI = {
  results: {
    bindings: {
      vessel: { type: "uri"; value: string };
      vesselLabel: { type: "literal"; value: string };
      image?: { type: "uri"; value: string };
      loa?: { type: "literal"; value: string };
      capacity?: { type: "literal"; value: string };
      capacityMode?: { type: "uri"; value: string };
      operator?: { type: "uri"; value: string };
      operatorLabel?: { type: "literal"; value: string };
      operatorStartTime?: { type: "uri"; value: string };
      operatorEndTime?: { type: "uri"; value: string };
      mmsi: { type: "literal"; value: string };
    }[];
  };
};

const transportModeMap = (qId: string): keyof Vessel["capacity"] | undefined =>
  qId === "Q319604" ? "pax" : qId === "Q11442" ? "bike" : undefined;

const getQId = (url: string) => url.split("/entity/")[1];

export async function fetchVesselInfo() {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  const query = await fs.readFile(
    join(__dirname, "../../queryVesselInfo.sparql"),
    "utf8"
  );

  const req = await fetch(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    { headers: { ...API_HEADERS, Accept: "application/sparql-results+json" } }
  );
  const apiResp: WikidataAPI = await req.json();

  const vesselInfo: VesselInfo = {};

  for (const row of apiResp.results.bindings) {
    const qId = getQId(row.vessel.value);
    const mmsi = +row.mmsi.value;

    vesselInfo[mmsi] ||= {
      name: row.vesselLabel.value,
      qId,
      mmsi,
      capacity: {},
      operators: [],
    };

    // maybe save simple attributes
    if (row.image) vesselInfo[mmsi].image = row.image.value;
    if (row.loa) vesselInfo[mmsi].loa = +row.loa.value;

    // maybe save capacity
    if (row.capacity && row.capacityMode) {
      const type = transportModeMap(getQId(row.capacityMode.value));
      // make sure the type is valid
      if (type) {
        vesselInfo[mmsi].capacity[type] = +row.capacity.value;
      }
    }

    // maybe save operator
    if (row.operator && row.operatorLabel) {
      let name = row.operatorLabel.value;
      if (name === "Fullers Group") name = "Fullers360";

      const operator = {
        qId: getQId(row.operator.value),
        name,
        start: row.operatorStartTime?.value,
        end: row.operatorEndTime?.value,
      };

      // the API gives us back duplicates, so filter them out
      const key = JSON.stringify(operator);
      const isDuplicate = vesselInfo[mmsi].operators.some(
        (entry) => JSON.stringify(entry) === key
      );
      if (!isDuplicate) {
        vesselInfo[mmsi].operators.push(operator);
      }
    }
  }

  await fs.mkdir(TEMP_FOLDER, { recursive: true });

  await fs.writeFile(
    join(TEMP_FOLDER, "vesselInfo.json"),
    JSON.stringify(vesselInfo, null, 2)
  );
}
