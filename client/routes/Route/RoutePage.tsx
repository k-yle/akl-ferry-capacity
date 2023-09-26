import { useContext, useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import { Navbar } from "../../components/Navbar.tsx";
import { DataContext } from "../../context/DataContext.tsx";
import type { FerryRoute, Rsn } from "../../types.def.ts";
import { TerminalTab } from "./TerminalTab.tsx";

const TabPanel: React.FC<{ visible: boolean } & React.PropsWithChildren> = ({
  children,
  visible,
}) => {
  return (
    <div role="tabpanel" hidden={!visible}>
      {visible && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const RoutePage: React.FC = () => {
  const { routes, terminals } = useContext(DataContext);
  const rsn = useParams<{ rsn: Rsn }>().rsn!;

  const [tabIndex, setTabIndex] = useState<number | undefined>(undefined);

  const route = Object.values(routes || {}).find((cat) => rsn in cat)?.[
    rsn as never
  ] as FerryRoute | undefined;

  useEffect(() => {
    if (!route || tabIndex !== undefined) return;

    // if tabIndex is not yet defined, populate it from the URL
    const defaultIndex = route.stationIds.indexOf(
      +window.location.hash.slice(2) as never
    );
    setTabIndex(defaultIndex === -1 ? 0 : defaultIndex);
  }, [route, tabIndex]);

  useEffect(() => {
    // update the URL when the tabIndex changes
    if (!route || tabIndex === undefined) return;
    window.history.replaceState("", "", `#/${route.stationIds[tabIndex]}`);
  }, [route, tabIndex]);

  if (!routes || !terminals) return <CircularProgress />;

  if (!route) return <Navigate to="/" />;

  if (tabIndex === undefined) return <CircularProgress />;

  return (
    <>
      <Navbar title={route.name} showBackButton>
        <Tabs
          value={tabIndex}
          onChange={(_event, newValue) => setTabIndex(newValue)}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
        >
          {route.stationIds.map((station) => (
            <Tab key={station} label={terminals[station][0]} tabIndex={0} />
          ))}
        </Tabs>
      </Navbar>
      <>
        {route.stationIds.map((station, index) => (
          <TabPanel key={station} visible={index === tabIndex}>
            <TerminalTab stationId={station} rsn={rsn} />
          </TabPanel>
        ))}
      </>
    </>
  );
};
