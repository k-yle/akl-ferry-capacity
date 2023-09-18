import { Container, Typography } from "@mui/material";
import type { VesselOnRoute } from "../types.def.ts";
import { RenderStopsForTrip } from "./RenderStopsForTrip.tsx";
import { Confidence } from "./Confidence.tsx";

export const CurrentTripForVessel: React.FC<{ vessel: VesselOnRoute }> = ({
  vessel,
}) => {
  if (!vessel.trip) return null;

  return (
    <Container>
      <Typography variant="h5">Current Trip</Typography>
      Confidence: <Confidence confidence={vessel.trip.confidence} />
      <RenderStopsForTrip trip={vessel.trip} />
      {vessel.potentialNextTrip && (
        <>
          <Typography variant="h5">Next Trip</Typography>
          Confidence:{" "}
          <Confidence confidence={vessel.potentialNextTrip.confidence} />
          <RenderStopsForTrip trip={vessel.potentialNextTrip} />
        </>
      )}
    </Container>
  );
};
