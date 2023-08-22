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
  VesselOnRoute,
} from "../types.def.ts";

type StaticInfo = {
  terminals: typeof FERRY_TERMINALS;
  routes: typeof FERRY_ROUTES;
};

export type IDataContext = Partial<StaticInfo> & {
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
        await appFetch<IDataContext["vessels"]>("/api/vessel_positions")
      );
    } catch (ex: any) {
      setError(ex);
    }
  }, []);

  useEffect(() => {
    updateVesselPositions();
    // update every 30sec
    const id = setInterval(updateVesselPositions, 30 * 1000);
    return () => clearInterval(id);
  }, [updateVesselPositions]);

  const ctx = useMemo(
    () => ({ ...staticInfo, vessels, error }),
    [staticInfo, vessels, error]
  );

  return <DataContext.Provider value={ctx}>{children}</DataContext.Provider>;
};
