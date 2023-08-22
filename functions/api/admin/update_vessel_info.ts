import { Handler, Vessel, VesselInfo } from "../../_helpers/types.def.js";
import { API_HEADERS } from "../../_helpers/constants.js";

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
      operatorWikipedia?: { type: "uri"; value: string };
      operatorFacebook?: { type: "literal"; value: string };
      startDate?: { type: "literal"; value: string };
      mmsi: { type: "literal"; value: string };
    }[];
  };
};

const transportModeMap = (qId: string): keyof Vessel["capacity"] | undefined =>
  qId === "Q319604" ? "pax" : qId === "Q11442" ? "bike" : undefined;

const getQId = (url: string) => url.split("/entity/")[1];

export const onRequest: Handler = async (context) => {
  // check for ?authentication=****
  const { searchParams } = new URL(context.request.url);
  if (searchParams.get("authentication") !== context.env.UPLOAD_TOKEN) {
    return Response.json({ error: "unauthenticated" });
  }

  const query = `
    SELECT DISTINCT ?vessel ?vesselLabel ?image ?loa ?mmsi ?capacity ?capacityMode ?operator ?operatorLabel ?operatorStartTime ?operatorEndTime ?operatorWikipedia ?operatorFacebook ?startDate
    WHERE
    {
      ?vessel wdt:P31/wdt:P279* wd:Q25653; # instanceof ferry
              wdt:P8047 wd:Q664. # with country of registry = NZ

      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mi". }

      OPTIONAL {?vessel wdt:P18 ?image .}
      OPTIONAL {?vessel wdt:P2043 ?loa .}
      OPTIONAL {?vessel wdt:P729 ?startDate .}
      ?vessel wdt:P587 ?mmsi . # required, otherwise the data is useless to us
      OPTIONAL {
        ?vessel p:P1083 ?capacityB .
        ?capacityB ps:P1083 ?capacity .
        ?capacityB pq:P518 ?capacityMode .
      }
      OPTIONAL {
        ?vessel p:P137 ?operatorB .
        ?operatorB ps:P137 ?operator .
        OPTIONAL { ?operatorB pq:P580 ?operatorStartTime . }
        OPTIONAL { ?operatorB pq:P582 ?operatorEndTime . }
        OPTIONAL { ?operator wdt:P2013 ?operatorFacebook . }
        OPTIONAL {
          ?operatorWikipedia schema:about ?operator.
          ?operatorWikipedia schema:isPartOf <https://en.wikipedia.org/>.
        }
      }
    }
  `;

  const request = await fetch(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    { headers: { ...API_HEADERS, Accept: "application/sparql-results+json" } }
  );
  const apiResp: WikidataAPI = await request.json();

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
    if (row.image) {
      vesselInfo[mmsi].image = row.image.value.replace("http://", "https://");
    }
    if (row.loa) vesselInfo[mmsi].loa = +row.loa.value;
    if (row.startDate) vesselInfo[mmsi].startDate = row.startDate.value;

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
        wikipedia: row.operatorWikipedia?.value,
        facebook: row.operatorFacebook?.value,
      };

      // the API gives us back duplicates, so filter them out
      const key = JSON.stringify(operator);
      const isDuplicate = vesselInfo[mmsi].operators.some(
        (entry) => JSON.stringify(entry) === key
      );
      if (!isDuplicate) {
        vesselInfo[mmsi].operators.push(operator);

        // sort by start date, and put entries with no start date first
        vesselInfo[mmsi].operators = vesselInfo[mmsi].operators
          .sort((a, b) => +new Date(a.start!) - +new Date(b.start!))
          .reverse();
      }
    }
  }

  await context.env.DB.put("vesselInfo", JSON.stringify(vesselInfo));

  return new Response("OK");
};
