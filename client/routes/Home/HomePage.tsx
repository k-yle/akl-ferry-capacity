import { useContext } from "react";
import { Link } from "react-router-dom";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { Navbar } from "../../components/Navbar.tsx";
import { DataContext } from "../../context/DataContext.tsx";
import type { FerryRoute } from "../../types.def.ts";

export const HomePage: React.FC = () => {
  const { routes } = useContext(DataContext);
  return (
    <>
      <Navbar title="Ferry Capacity" />
      {Object.entries(routes || {}).map(([category, _catRoutes]) => {
        const catRoutes = _catRoutes as Record<string, FerryRoute>;
        return (
          <Box
            key={category}
            sx={{
              flexGrow: 1,
              p: 4,
              width: "100%",
              textAlign: "center",
            }}
          >
            {/* <Typography mb={2} variant="subtitle2">{category}</Typography> */}
            <Grid container spacing={4}>
              {Object.entries(catRoutes).map(([code, route]) => {
                return (
                  <Grid key={code} item xs={6}>
                    <Link
                      to={`/routes/${code}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Paper sx={{ p: 1, textAlign: "center" }}>
                        <Typography variant="h6" sx={{ color: "primary" }}>
                          {route.name
                            .split("/")
                            .flatMap((segment) => [
                              segment,
                              <br key={segment} />,
                            ])}
                        </Typography>
                      </Paper>
                    </Link>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );
      })}
    </>
  );
};
