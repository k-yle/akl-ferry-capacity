import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import teal from "@mui/material/colors/teal.js";
import { HomePage } from "./routes/Home/HomePage.tsx";
import { RoutePage } from "./routes/Route/RoutePage.tsx";
import { DataProvider } from "./context/DataContext.tsx";
import { VesselPage } from "./routes/Route/VesselPage.tsx";
import { MapPage } from "./routes/Route/MapPage.tsx";

const theme = createTheme({
  // @ts-expect-error ESM bug
  palette: { primary: teal },
});

const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/routes/:rsn", Component: RoutePage },
  { path: "/vessels/:mmsi", Component: VesselPage },
  { path: "/map", Component: MapPage },
]);

export const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  </ThemeProvider>
);
