import { useEffect, useMemo, useState } from "react";
import type { AlertColor } from "@mui/material";
import { getHHMM, isSameDay } from "../helpers/date.ts";

export type IcsEvent = {
  summary: string;
  location: string;
  description: string;
  /** ISO Date */
  start: string;
  /** ISO Date */
  end: string;
};

export type Ics = {
  name: string;
  /** ISO Date */
  lastUpdated: string;
  events: IcsEvent[];
};

export function useCruiseShips() {
  const [ics, setIcs] = useState<Ics>();

  useEffect(() => {
    fetch("https://akl.kyle.kiwi/cruise-ships?format=json")
      .then((r) => r.json<Ics>())
      .then(setIcs)
      .catch(console.error); // it's okay if this errors
  }, []);

  return useMemo(() => {
    if (!ics) return [];

    try {
      const warnings: { message: string; severity: AlertColor }[] = [];

      for (const event of ics.events) {
        const arrival = new Date(event.start.replace("Z", ""));
        const departure = new Date(event.end.replace("Z", ""));
        const now = new Date();

        const isAtAnchor = event.summary.endsWith("(⚓)");
        const isInFerryBasin = event.summary.endsWith("(PE)");

        if (isSameDay(arrival, now) || isSameDay(departure, now)) {
          warnings.push({
            severity: isAtAnchor
              ? "error"
              : isInFerryBasin
                ? "warning"
                : "info",
            message: `A berthing cruise ship may cause cancellations around ${getHHMM(
              arrival
            )} and ${getHHMM(departure)} today.`,
          });
        }
      }

      // only show severe warnings
      return warnings.filter((w) => w.severity !== "info");
    } catch {
      return [];
    }
  }, [ics]);
}
