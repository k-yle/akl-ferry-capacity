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
import { DataContext } from "../../context/DataContext.tsx";
import { useTerminalInfo } from "../../hooks/useTerminalInfo.ts";
import { getRelativeDate } from "../../helpers/timeAgo.ts";
import type {
  Departure,
  FERRY_TERMINALS,
  VesselOnRoute,
} from "../../types.def.ts";

const hhmm = (date: Date) => {
  return [
    `${date.getHours()}`.padStart(2, "0"),
    `${date.getMinutes()}`.padStart(2, "0"),
  ].join(":");
};

export const VesselRow: React.FC<{
  dep: Departure;
  liveVessel?: VesselOnRoute;
}> = ({ dep, liveVessel }) => {
  const navigate = useNavigate();
  return (
    <ListItem
      alignItems="flex-start"
      secondaryAction={dep.time ? hhmm(new Date(dep.time)) : "Departed"}
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
            src={liveVessel.vessel.image}
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
            {liveVessel ? (
              <>
                {liveVessel.vessel.name}
                <br />
                {liveVessel.vessel.capacity.pax} passengers +{" "}
                {liveVessel.vessel.capacity.bike} bikes
              </>
            ) : (
              "Unknown Vessel"
            )}
            {dep.cancelled && (
              <>
                <br />
                <Chip label="Cancelled" color="error" size="small" />
              </>
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
    ...activeMissingDepartures.map(
      (vessel): Departure => ({
        // consturct a fake departure with all the facts we know
        cancelled: false,
        operator: vessel.vessel.operators[0].name,
        destinationLive:
          vessel.trip!.destination?.split(" To ")[1] || "Unknown",
        destination: vessel.trip!.destination || "Unknown",
        tripId: vessel.trip!.tripId,
        rsn,

        // this is the only stuff we don't know
        time: "",
        pier: 0,
      })
    ),
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
              (v) => v.trip?.tripId === departure.tripId
            );
            return (
              <Fragment key={departure.tripId}>
                {!!index && <Divider variant="inset" component="li" />}
                <VesselRow dep={departure} liveVessel={liveVessel} />
              </Fragment>
            );
          })
        ) : (
          <Alert severity="warning">No departures in the next two hours</Alert>
        )}
      </List>
      <Typography variant="body2">
        Updated {getRelativeDate(new Date(vessels.lastUpdated))}
      </Typography>
    </div>
  );
};
