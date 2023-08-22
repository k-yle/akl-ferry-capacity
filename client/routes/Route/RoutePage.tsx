import { useContext, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import _SwipeableViews from "react-swipeable-views";
import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import { Navbar } from "../../components/Navbar.tsx";
import { DataContext } from "../../context/DataContext.tsx";
import { FerryRoute } from "../../types.def.ts";
import { TerminalTab } from "./TerminalTab.tsx";

// @ts-expect-error esm crap
const SwipeableViews = _SwipeableViews as typeof _SwipeableViews.default;

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
  const rsn = useParams().rsn!;

  const [tabIndex, setTabIndex] = useState(0);

  if (!routes || !terminals) return <CircularProgress />;

  const route = Object.values(routes).find((cat) => rsn in cat)?.[
    rsn as never
  ] as FerryRoute | undefined;

  if (!route) return <Navigate to="/" />;

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
            <Tab key={station} label={terminals[station][0]} />
          ))}
        </Tabs>
      </Navbar>
      <SwipeableViews axis="x" index={tabIndex} onChangeIndex={setTabIndex}>
        {route.stationIds.map((station, index) => (
          <TabPanel key={station} visible={index === tabIndex}>
            <TerminalTab stationId={station} rsn={rsn} />
          </TabPanel>
        ))}
      </SwipeableViews>
    </>
  );
};
