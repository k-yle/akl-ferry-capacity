import { Box, Modal, SxProps, Typography } from "@mui/material";

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
        {/* TODO: better attribution */}
        <ul>
          <li>Timetables are sourced from AT</li>
          <li>Live positions are from AT and AIS data</li>
          <li>Vessel information is from Wikipedia and Wikidata</li>
          <li>Vessel photos are from Wikimedia Commons</li>
          <li>Map data is &copy; OpenStreetMap</li>
        </ul>
      </Box>
    </Modal>
  );
};
