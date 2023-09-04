import { Fragment, useContext } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import { DirectionsBoat } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import TimeAgo from "react-timeago-i18n";
import { DataContext } from "../../context/DataContext.tsx";
import { useTerminalInfo } from "../../hooks/useTerminalInfo.ts";
import {
  VesselTripConfidence,
  type Departure,
  type FERRY_TERMINALS,
  type VesselOnRoute,
} from "../../types.def.ts";

/** services that departed longer than this ago will be hidden */
const MAX_OLD_MINUTES = 10;

const hhmm = (date: Date) => {
  return [
    `${date.getHours()}`.padStart(2, "0"),
    `${date.getMinutes()}`.padStart(2, "0"),
  ].join(":");
};

const renderNameAndConfidence = (
  name: string,
  confidence: VesselTripConfidence
) => {
  switch (confidence) {
    case VesselTripConfidence.CERTAIN: {
      return name;
    }
    case VesselTripConfidence.VERY_LIKELY: {
      return (
        <>
          <em>very likely</em> {name}
        </>
      );
    }
    case VesselTripConfidence.LIKELY: {
      return (
        <>
          <em>probably</em> {name}
        </>
      );
    }
    case VesselTripConfidence.UNCERTAIN: {
      return (
        <>
          <em>maybe</em> {name}
        </>
      );
    }
    default: {
      confidence satisfies never;
      return name; // impossible, just to keep eslint happy
    }
  }
};

export const VesselRow: React.FC<{
  dep: Departure;
  liveVessel?: VesselOnRoute;
  confidence?: VesselTripConfidence;
}> = ({ dep, liveVessel, confidence }) => {
  const navigate = useNavigate();
  return (
    <ListItem
      alignItems="flex-start"
      secondaryAction={
        <>
          {hhmm(new Date(dep.time))}
          {new Date(dep.time) < new Date() && (
            <em>
              <br />
              Departed
            </em>
          )}
        </>
      }
      style={{
        background: dep.cancelled ? "#f3e0ff" : undefined,
        cursor: liveVessel ? "pointer" : undefined,
      }}
      onClick={
        liveVessel
          ? () => navigate(`/vessels/${liveVessel.vessel.mmsi}`)
          : undefined
      }
    >
      <ListItemAvatar>
        {liveVessel ? (
          <img
            // the width option tells commons to load a thumbnail
            src={`${liveVessel.vessel.image}?width=150`}
            alt={liveVessel.vessel.name}
            style={{ width: 50, borderRadius: 4 }}
          />
        ) : (
          <Avatar>
            <DirectionsBoat />
          </Avatar>
        )}
      </ListItemAvatar>
      <ListItemText
        primary={<>To {dep.destinationLive}</>}
        secondary={
          <>
            {!!dep.pier && (
              <>
                <Typography
                  sx={{ display: "inline" }}
                  component="span"
                  variant="body2"
                  color="text.primary"
                >
                  Pier {dep.pier}
                </Typography>{" "}
                —{" "}
              </>
            )}
            {dep.cancelled ? (
              <Chip label="Cancelled" color="error" size="small" />
            ) : liveVessel ? (
              <>
                {renderNameAndConfidence(liveVessel.vessel.name, confidence!)}
                <br />
                {liveVessel.vessel.capacity.seats ||
                  liveVessel.vessel.capacity.pax}{" "}
                passengers + {liveVessel.vessel.capacity.bike} bikes
              </>
            ) : (
              "Unknown Vessel"
            )}
          </>
        }
      />
    </ListItem>
  );
};

export const TerminalTab: React.FC<{
  stationId: keyof typeof FERRY_TERMINALS;
  rsn: string;
}> = ({ stationId, rsn }) => {
  const { vessels, error } = useContext(DataContext);
  const [terminalInfo, error2] = useTerminalInfo(stationId);

  console.log("terminalInfo", terminalInfo);
  console.log("vessels", vessels);

  if (!terminalInfo || !vessels) return <CircularProgress />;

  if (error || error2) {
    return <Alert severity="error">Failed to load data</Alert>;
  }

  const knownDepartures = terminalInfo.departures.filter(
    (dep) => dep.rsn === rsn
  );
  const knownTripIds = new Set(knownDepartures.map((d) => d.tripId));
  const activeMissingDepartures = vessels.list.filter(
    (v) => v.trip?.rsn === rsn && !knownTripIds.has(v.trip.tripId)
  );

  const allDepartures: Departure[] = [
    ...activeMissingDepartures.flatMap((vessel) => {
      const trip = vessel.trip!;
      const stopTime = trip.stopTimes.find((time) => +time.stop === stationId);
      if (!stopTime) return [];

      // true if the this stop is the last stop of the trip.
      // in that case, there's no use showing it
      const isLastStop =
        trip.stopTimes.indexOf(stopTime) === trip.stopTimes.length - 1;

      if (isLastStop) return [];

      const time = ((d) => {
        const [hh, mm] = stopTime.time.split(":");
        d.setHours(+hh);
        d.setMinutes(+mm);
        return d.toISOString();
      })(new Date());

      const minutesUntilDepature = (+new Date(time) - Date.now()) / 1000 / 60;

      // hide if this trip departed over minutes ago
      if (minutesUntilDepature < -MAX_OLD_MINUTES) return [];

      const departure: Departure = {
        // consturct a fake departure with all the facts we know
        cancelled: false,
        operator: vessel.vessel.operators[0].name,
        destinationLive: trip.destination.split(" To ")[1],
        destination: trip.destination,
        tripId: vessel.trip!.tripId,
        rsn,
        time,
        pier: +(stopTime.pier || 0),
        dates: vessel.trip!.dates,
        stopTimes: vessel.trip!.stopTimes,
      };
      return [departure];
    }),
    ...knownDepartures,
  ];

  return (
    <div>
      <Box mb={2}>
        {terminalInfo.alerts.map((alert) => (
          <Alert
            key={alert.text}
            severity={alert.priority === "high" ? "warning" : "info"}
          >
            {alert.text}
          </Alert>
        ))}
      </Box>
      <List sx={{ width: "100%", maxWidth: 600, bgcolor: "background.paper" }}>
        {allDepartures.length ? (
          allDepartures.map((departure, index) => {
            const liveVessel = vessels.list.find(
              (v) =>
                v.trip?.tripId === departure.tripId ||
                v.potentialNextTrip?.tripId === departure.tripId
            );
            const confidence =
              liveVessel?.trip?.tripId === departure.tripId
                ? liveVessel.trip.confidence
                : liveVessel?.potentialNextTrip?.tripId === departure.tripId
                ? liveVessel.potentialNextTrip.confidence
                : undefined;
            return (
              <Fragment key={departure.tripId}>
                {!!index && <Divider variant="inset" component="li" />}
                <VesselRow
                  dep={departure}
                  liveVessel={liveVessel}
                  confidence={confidence}
                />
              </Fragment>
            );
          })
        ) : (
          <Alert severity="warning">No departures in the next two hours</Alert>
        )}
      </List>
      <Typography variant="body2">
        Updated <TimeAgo date={new Date(vessels.lastUpdated)} hideSeconds />
      </Typography>
    </div>
  );
};
