import { TripObjFile, VesselInfo } from "./types.def.ts";
import { tryLoadFile } from "./util/tryLoadFile.ts";

// singletons. a server restart is required when these files are updated.
export const vesselInfo = tryLoadFile<VesselInfo>("vesselInfo.json", {});
export const tripObj = tryLoadFile<TripObjFile>("tripObj.json", {});
