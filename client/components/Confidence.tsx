import { Chip } from "@mui/material";
import { VesselTripConfidence } from "../types.def.ts";

export const Confidence: React.FC<{ confidence: VesselTripConfidence }> = ({
  confidence,
}) => {
  switch (confidence) {
    case VesselTripConfidence.CERTAIN: {
      return <Chip size="small" label="Certain" color="success" />;
    }
    case VesselTripConfidence.VERY_LIKELY: {
      return <Chip size="small" label="High" color="success" />;
    }
    case VesselTripConfidence.LIKELY: {
      return <Chip size="small" label="Medium" color="warning" />;
    }
    case VesselTripConfidence.UNCERTAIN: {
      return <Chip size="small" label="Low" color="error" />;
    }
    default: {
      confidence satisfies never;
      return null; // impossible, just to keep eslint happy
    }
  }
};
