import express from "express";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { FERRY_ROUTES, FERRY_TERMINALS } from "./constants.ts";
import { fetchVesselInfo } from "./api/fetchVesselInfo.ts";
import { fetchTimetables } from "./api/fetchTimetables.ts";
import { fetchVesselsPositions } from "./api/fetchVesselsPositions.ts";
import { fetchTerminalDepartures } from "./api/fetchTerminalDepartures.ts";

const PORT = 51200;

const app = express();

const __dirname = fileURLToPath(new URL(".", import.meta.url));
app.use(express.static(join(__dirname, "../dist")));

app.get("/api/static", (_req, res) => {
  res.send({ routes: FERRY_ROUTES, terminals: FERRY_TERMINALS });
});

app.get("/api/admin/update/vessel_info", async (req, res) => {
  try {
    // TODO: auth
    await fetchVesselInfo();
    return res.send({ ok: true });
  } catch (ex) {
    // TODO: sentry
    console.error(ex);
    return res.status(400).send({ error: `${ex}` });
  }
});
app.get("/api/admin/update/timetables", async (_req, res) => {
  try {
    // TODO: auth
    await fetchTimetables();
    return res.send({ ok: true });
  } catch (ex) {
    // TODO: sentry
    console.error(ex);
    return res.status(400).send({ error: `${ex}` });
  }
});

app.get("/api/vessels", async (_req, res) => {
  try {
    const [list, lastUpdated] = await fetchVesselsPositions();
    return res.send({ lastUpdated, list });
  } catch (ex) {
    // TODO: sentry
    console.error(ex);
    return res.status(400).send({ error: `${ex}` });
  }
});

app.get("/api/terminals/:stationId", async (req, res) => {
  const stationId = +req.params.stationId;
  if (!(stationId in FERRY_TERMINALS)) {
    return res.status(404).send({ error: "Invalid terminal" });
  }

  try {
    return res.send(await fetchTerminalDepartures(stationId));
  } catch (ex) {
    // TODO: sentry
    console.error(ex);
    return res.status(400).send({ error: `${ex}` });
  }
});

app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
