import {
  createContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { appFetch } from "../api/appFetch.ts";
import type {
  FERRY_ROUTES,
  FERRY_TERMINALS,
  Rsn,
  VesselOnRoute,
} from "../types.def.ts";
import { repairError } from "../helpers/general.ts";

type StaticInfo = {
  terminals: typeof FERRY_TERMINALS;
  routes: typeof FERRY_ROUTES;
};

export type IDataContext = Partial<StaticInfo> & {
  altRsns: Record<string, Rsn>;
  error: Error | undefined;
  vessels: { lastUpdated: number; list: VesselOnRoute[] } | undefined;
};

export const DataContext = createContext({} as IDataContext);

export const DataProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [staticInfo, setStaticInfo] = useState<StaticInfo>();
  const [vessels, setVessels] = useState<IDataContext["vessels"]>();

  const [error, setError] = useState<Error>();

  useEffect(() => {
    appFetch<StaticInfo>("/api/static").then(setStaticInfo).catch(setError);
  }, []);

  const updateVesselPositions = useCallback(async () => {
    try {
      setVessels(
        await appFetch<NonNullable<IDataContext["vessels"]>>(
          "/api/vessel_positions"
        )
      );
    } catch (ex) {
      setError(repairError(ex));
    }
  }, []);

  useEffect(() => {
    updateVesselPositions();
    // update every 30sec
    const id = setInterval(updateVesselPositions, 30 * 1000);
    return () => clearInterval(id);
  }, [updateVesselPositions]);

  /** map of all alterantive RSNs to their main RSN */
  const altRsns = useMemo(() => {
    return Object.fromEntries<Rsn>(
      Object.values(staticInfo?.routes || {}).flatMap((object) =>
        Object.entries(object).flatMap(
          ([mainRsn, r]) =>
            (r.altRsn as string[] | undefined)?.map((altRsn) => [
              altRsn,
              mainRsn as Rsn,
            ]) || []
        )
      )
    );
  }, [staticInfo]);

  const context = useMemo(
    () => ({ ...staticInfo, altRsns, vessels, error }),
    [staticInfo, altRsns, vessels, error]
  );

  return (
    <DataContext.Provider value={context}>{children}</DataContext.Provider>
  );
};
