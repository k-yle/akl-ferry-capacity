import {
  Cause,
  Effect,
  type EntitySelector,
  type GTFSRealtime,
  type TranslatedString,
} from "gtfs-types";
import type { Alert, Rsn, StaticTimetableDB } from "../types.def.js";

const TRIVIAL_CAUSES = new Set<Cause>([Cause.CONSTRUCTION, Cause.MAINTENANCE]);

/** given a translated GTFS realtime string, gets the english string */
const findEnglishOrFirst = (string: TranslatedString | undefined) =>
  string?.translation.find((lang) => lang.language === "en")?.text ||
  string?.translation[0].text;

export function processServiceAlerts(
  realtime: GTFSRealtime,
  staticTimetableDB: StaticTimetableDB | null
) {
  if (!staticTimetableDB) return { alerts: [], cancellations: [] };

  const allRouteIds = Object.fromEntries(
    Object.values(staticTimetableDB.trips).map((trip) => [
      trip.routeId,
      trip.rsn,
    ])
  );

  const getRsnsIfInteresting = (entitySelectors: EntitySelector[]) => {
    const rsns = new Set<Rsn>();
    for (const appliesTo of entitySelectors) {
      // if there's a trip, check if we care about it
      if (
        appliesTo.trip?.trip_id &&
        appliesTo.trip.trip_id in staticTimetableDB.trips
      ) {
        rsns.add(staticTimetableDB.trips[appliesTo.trip.trip_id].rsn);
      }

      // if there's a route, check if we care about it
      if (appliesTo.route_id && appliesTo.route_id in allRouteIds) {
        rsns.add(allRouteIds[appliesTo.route_id]);
      }

      // if there's a stop, check if we care about it
      if (appliesTo.stop_id && appliesTo.stop_id in staticTimetableDB.stopIds) {
        const theseRsns = staticTimetableDB.stopIds[appliesTo.stop_id];
        for (const rsn of theseRsns) rsns.add(rsn);
      }
    }
    return [...rsns];
  };

  const alerts = realtime.response
    .entity!.filter((entity) => entity.alert?.informed_entity?.length)
    .flatMap((entity) => {
      const appliesTo = getRsnsIfInteresting(entity.alert!.informed_entity);
      if (!appliesTo.length) return [];

      const alert: Alert = {
        title: findEnglishOrFirst(entity.alert!.header_text),
        description: findEnglishOrFirst(entity.alert!.description_text),
        url: findEnglishOrFirst(entity.alert!.url),
        priority: TRIVIAL_CAUSES.has(entity.alert!.cause) ? "low" : "high",
        appliesTo,
      };
      return [alert];
    });

  const cancellations = realtime.response
    .entity!.filter(
      (entity) =>
        entity.alert?.effect === Effect.NO_SERVICE &&
        entity.alert.informed_entity
    )
    .flatMap((entity) =>
      entity
        .alert!.informed_entity!.map(
          (entitySelector) => entitySelector.trip?.trip_id
        )
        .filter((x): x is string => !!x && x in staticTimetableDB.trips)
    );

  return { alerts, cancellations };
}
