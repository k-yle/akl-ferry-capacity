import { useContext } from "react";
import { Link } from "react-router-dom";
import { DataContext } from "../context/DataContext.tsx";
import type { StationId, TripWithConfidence } from "../types.def.ts";
import { renderNameAndConfidence } from "../routes/Route/TerminalTab.tsx";
import { getHHMM, getInNMinutes, stripSeconds } from "../helpers/date.ts";

export const RenderTripName: React.FC<{ trip: TripWithConfidence }> = ({
  trip,
}) => {
  const { terminals } = useContext(DataContext);

  const tripStart = +trip.stopTimes[0].stop as StationId;
  const tripEnd = +trip.stopTimes.at(-1)!.stop as StationId;

  const tripStartTime = trip.stopTimes.at(-1)!.time;

  // if the current trip finished more than 30 minutes ago,
  // that means the crew just forget to turn off the transponder.
  const isTripComplete =
    tripStartTime !== "00:00:09" && tripStartTime < getHHMM(getInNMinutes(-30));

  return (
    <>
      {isTripComplete ? (
        <> – Out of Service, last used on the </>
      ) : (
        <>{renderNameAndConfidence("", trip.confidence)} operating the </>
      )}
      {tripStartTime === "00:00:09" ? (
        // in this case we don't have a GTFS trip, but we know the destination
        <>
          service to{" "}
          <Link to={`/routes/${trip.rsn}`}>{terminals?.[tripEnd][0]}</Link>
        </>
      ) : (
        <>
          {stripSeconds(tripStartTime)}{" "}
          <Link to={`/routes/${trip.rsn}`}>
            {terminals?.[tripStart][0]} to {terminals?.[tripEnd][0]}
          </Link>
        </>
      )}
    </>
  );
};
