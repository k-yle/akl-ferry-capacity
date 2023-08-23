import { Box, Modal, type SxProps, Typography } from "@mui/material";

const modalStyle: SxProps = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(500px, 100vw)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export const InfoModal: React.FC<{ onClose(): void }> = ({ onClose }) => {
  return (
    <Modal open onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2">
          About
        </Typography>
        <Typography variant="body1">
          This app shows you which ferry is currently operating each route in
          Auckland, and how many passengers and bikes it can take.
          <br />
          <br />
          It’s quite common that the smaller ferries leave people behind because
          of their limited capacity. This app helps you judge whether to take
          the ferry or not.
          <br />
          <br />
          All this data is freely available:
        </Typography>
        <ul>
          <li>
            Timetables are sourced from{" "}
            <a
              href="https://at.govt.nz/about-us/at-data-sources/general-transit-feed-specification"
              target="_blank"
              rel="noreferrer noopener"
            >
              AT
            </a>
          </li>
          <li>
            Live positions are from{" "}
            <a
              href="https://dev-portal.at.govt.nz"
              target="_blank"
              rel="noreferrer noopener"
            >
              AT
            </a>{" "}
            and{" "}
            <a
              href="https://en.wikipedia.org/wiki/Automatic_identification_system"
              target="_blank"
              rel="noreferrer noopener"
            >
              AIS
            </a>{" "}
            data
          </li>
          <li>
            Vessel information is from{" "}
            <a
              href="https://en.wikipedia.org/wiki/WP:C"
              target="_blank"
              rel="noreferrer noopener"
            >
              Wikipedia
            </a>{" "}
            and{" "}
            <a
              href="https://wikidata.org/wiki/Wikidata:Copyright"
              target="_blank"
              rel="noreferrer noopener"
            >
              Wikidata
            </a>
          </li>
          <li>
            Vessel photos are from{" "}
            <a
              href="https://commons.wikimedia.org/wiki/Commons:Licensing"
              target="_blank"
              rel="noreferrer noopener"
            >
              Wikimedia Commons
            </a>
          </li>
          <li>
            Map data is &copy;{" "}
            <a
              href="https://osm.org/copyright"
              target="_blank"
              rel="noreferrer noopener"
            >
              OpenStreetMap
            </a>
          </li>
        </ul>
      </Box>
    </Modal>
  );
};
