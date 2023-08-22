import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { Navbar } from "../../components/Navbar.tsx";
import { DataContext } from "../../context/DataContext.tsx";

export const VesselPage: React.FC = () => {
  const mmsi = +useParams().mmsi!;
  const navigate = useNavigate();

  const { vessels } = useContext(DataContext);
  const [menuOpen, setMenuOpen] = useState<HTMLElement | undefined>();

  if (!vessels) return <CircularProgress />;

  const vessel = vessels?.list.find((v) => v.vessel.mmsi === mmsi);

  const MTUrl = `https://www.marinetraffic.com/ais/details/ships/${mmsi}`;
  const WQUrl = `https://wikidata.org/wiki/${vessel?.vessel.qId}`;

  if (!vessel) {
    return (
      <>
        <Navbar title="Not Found" showBackButton />
        <Alert style={{ margin: 8 }} severity="warning">
          This ferry is currently offline. You might find more details{" "}
          <a href={MTUrl} target="_blank" rel="noopener noreferrer">
            on MarineTraffic.com
          </a>
          .
        </Alert>
      </>
    );
  }

  const owner = vessel.vessel.operators[0].name;
  const serviceProvider = vessel.trip?.operator;
  const differentOperator = serviceProvider && serviceProvider !== owner;

  const ownerLink = (
    <a
      href={`https://wikidata.org/wiki/${vessel.vessel.operators[0].qId}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {owner}
    </a>
  );

  return (
    <>
      <Navbar title={vessel.vessel.name} showBackButton />

      <Menu
        anchorEl={menuOpen}
        open={!!menuOpen}
        onClose={() => setMenuOpen(undefined)}
      >
        <MenuItem
          onClick={() => {
            navigate("/map");
            setMenuOpen(undefined);
          }}
        >
          View on Map
        </MenuItem>
        <MenuItem
          onClick={() => {
            window.open(MTUrl, "_blank");
            setMenuOpen(undefined);
          }}
        >
          View on MarineTraffic.com
        </MenuItem>
        <MenuItem
          onClick={() => {
            window.open(WQUrl, "_blank");
            setMenuOpen(undefined);
          }}
        >
          View on Wikipedia
        </MenuItem>
      </Menu>

      <Card sx={{ maxWidth: 345, margin: "32px auto" }}>
        <CardHeader
          // TODO: logo image in URL
          avatar={<Avatar>R</Avatar>}
          action={
            <IconButton onClick={(event) => setMenuOpen(event.currentTarget)}>
              <MoreVert />
            </IconButton>
          }
          title={vessel.vessel.name}
          // TODO: fix operator everywhere
          subheader={
            differentOperator ? (
              <>
                Operated by {serviceProvider}, owned by {ownerLink}
              </>
            ) : (
              <>Operated by {ownerLink}</>
            )
          }
        />
        <CardMedia
          component="img"
          height="194"
          image={vessel.vessel.image}
          alt="Paella dish"
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            <strong>Capacity:</strong> {vessel.vessel.capacity.pax} passengers +{" "}
            {vessel.vessel.capacity.bike || <em>Unknown</em>} bikes
            <br />
            <strong>Built:</strong> 27 years ago
            {/** TODO: incorret info */}
            <br />
            {vessel.trip && (
              <>
                <strong>Current Route:</strong>{" "}
                <Link to={`/routes/${vessel.trip?.rsn}`}>
                  {vessel.trip?.destination}
                </Link>
              </>
            )}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
};
