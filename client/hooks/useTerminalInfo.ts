import { useCallback, useEffect, useState } from "react";
import { appFetch } from "../api/appFetch.ts";
import type { TerminalLiveInfo } from "../types.def.ts";

export function useTerminalInfo(
  stationId: number
): [terminalInfo?: TerminalLiveInfo, error?: Error] {
  const [terminalInfo, setTerminalInfo] = useState<TerminalLiveInfo>();
  const [error, setError] = useState<Error>();

  const fetchTerminalInfo = useCallback(async () => {
    try {
      setTerminalInfo(
        await appFetch<TerminalLiveInfo>(`/api/terminals/${stationId}`)
      );
      setError(undefined);
    } catch (ex) {
      setError(ex instanceof Error ? ex : new Error(`${ex}`));
    }
  }, [stationId]);

  useEffect(() => {
    fetchTerminalInfo();
    const id = setInterval(fetchTerminalInfo, 1000 * 60 * 2);
    return () => clearInterval(id);
  }, [stationId, fetchTerminalInfo]);

  return [terminalInfo, error];
}
