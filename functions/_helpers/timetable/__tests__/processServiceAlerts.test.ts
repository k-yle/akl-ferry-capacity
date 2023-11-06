import { describe, expect, it } from "vitest";
import { Cause, Effect, Entity, GTFSRealtime } from "gtfs-types";
import { processServiceAlerts } from "../processServiceAlerts.js";
import { StaticTimetableDB, TripObject } from "../../types.def.js";

describe("processServiceAlerts", () => {
  it("should work", () => {
    const realtime: GTFSRealtime = {
      status: "",
      response: {
        header: <never>{},
        entity: [
          // these ones are relevant:
          <Entity>{
            alert: {
              header_text: {
                translation: [
                  { language: "mi", text: "Ko te Waka Kōpikō ki Downtown ā…" },
                  { language: "en", text: "6am to Downtown is cancelled" },
                ],
              },
              effect: Effect.NO_SERVICE,
              informed_entity: [{ trip: { trip_id: "t1" } }],
            },
          },
          <Entity>{
            alert: {
              url: {
                translation: [{ language: "pt", text: "https://example.com" }],
              },
              cause: Cause.POLICE_ACTIVITY,
              effect: Effect.SIGNIFICANT_DELAYS,
              informed_entity: [{ stop_id: "stop91234hmbPier1" }],
            },
          },
          <Entity>{
            alert: {
              cause: Cause.CONSTRUCTION,
              informed_entity: [{ route_id: "rBAYS" }],
            },
          },

          // these ones are irrelevant:
          <Entity>{
            alert: {
              effect: Effect.NO_SERVICE,
              informed_entity: [{ trip: { trip_id: "t99" } }],
            },
          },
          <Entity>{
            alert: {
              cause: Cause.POLICE_ACTIVITY,
              effect: Effect.SIGNIFICANT_DELAYS,
              informed_entity: [{ stop_id: "waitematāPlatform3" }],
            },
          },
          <Entity>{
            alert: {
              cause: Cause.CONSTRUCTION,
              informed_entity: [{ route_id: "r27T" }],
            },
          },
        ],
      },
    };
    const staticDB = <StaticTimetableDB>{
      stopIds: {
        stop91234hmbPier1: ["HMB"],
        stop91234downtownPier5: ["HMB", "BAYS"],
      },
      trips: {
        t1: <TripObject>{ routeId: "rHMB", rsn: "HMB" },
        t2: <TripObject>{ routeId: "rBAYS", rsn: "BAYS" },
      },
    };

    expect(processServiceAlerts(realtime, staticDB)).toStrictEqual({
      alerts: [
        {
          // added because the trip_id matched
          appliesTo: ["HMB"],
          description: undefined,
          priority: "high",
          title: "6am to Downtown is cancelled",
          url: undefined,
        },
        {
          // added because the stop_id matched
          appliesTo: ["HMB"],
          description: undefined,
          priority: "high",
          title: undefined,
          url: "https://example.com",
        },
        {
          // added because the route_id matched
          appliesTo: ["BAYS"],
          description: undefined,
          priority: "low",
          title: undefined,
          url: undefined,
        },
      ],
      cancellations: ["t1"],
    });
  });
});
