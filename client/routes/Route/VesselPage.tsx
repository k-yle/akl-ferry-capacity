import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TimeAgo from "react-timeago-i18n";
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

  // the backend ensures the first operator is the current one
  const currentOwner = vessel.vessel.operators[0];

  const serviceProvider = vessel.trip?.operator;
  const differentOperator =
    serviceProvider && serviceProvider !== currentOwner.name;

  const ownerLink = (
    <a
      href={
        currentOwner.wikipedia ||
        `https://wikidata.org/wiki/${currentOwner.qId}`
      }
      target="_blank"
      rel="noopener noreferrer"
    >
      {currentOwner.name}
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
          avatar={
            <Avatar
              src={
                currentOwner.facebook
                  ? `https://graph.facebook.com/${currentOwner.facebook}/picture?type=large`
                  : undefined
              }
            >
              ?
            </Avatar>
          }
          action={
            <IconButton onClick={(event) => setMenuOpen(event.currentTarget)}>
              <MoreVert />
            </IconButton>
          }
          title={vessel.vessel.name}
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
            {vessel.vessel.startDate && (
              <>
                <br />
                <strong>Built:</strong>{" "}
                <TimeAgo date={vessel.vessel.startDate} />
              </>
            )}
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
