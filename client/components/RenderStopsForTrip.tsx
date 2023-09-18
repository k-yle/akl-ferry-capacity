import { useContext } from "react";
import { Card, List, ListItem, ListItemText } from "@mui/material";
import { Link } from "react-router-dom";
import { DataContext } from "../context/DataContext.tsx";
import type { StationId, TripWithConfidence } from "../types.def.ts";
import { stripSeconds } from "../helpers/date.ts";

export const RenderStopsForTrip: React.FC<{ trip: TripWithConfidence }> = ({
  trip,
}) => {
  const { terminals } = useContext(DataContext);
  if (!terminals) return null;

  return (
    <Card
      component={Link}
      to={`/routes/${trip.rsn}`}
      sx={{
        maxWidth: 345,
        margin: "32px auto",
        padding: "4px 16px",
        display: "block",
        textDecoration: "none",
      }}
    >
      <List>
        {trip.stopTimes.map((stopTime) => {
          const stationId = +stopTime.stop as StationId;
          const [stationName] = terminals[stationId];
          return (
            <ListItem
              key={stopTime.time}
              disableGutters
              secondaryAction={stripSeconds(stopTime.time)}
            >
              <ListItemText primary={stationName} />
            </ListItem>
          );
        })}
      </List>
    </Card>
  );
};
