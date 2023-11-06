import type { FERRY_ROUTES, FerryRoute, Rsn } from "../types.def.ts";

export const repairError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(`${error}`);

export const findRoute = (routes: typeof FERRY_ROUTES | undefined, rsn: Rsn) =>
  Object.values(routes || {}).find((cat) => rsn in cat)?.[rsn as never] as
    | FerryRoute
    | undefined;
