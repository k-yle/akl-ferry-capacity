import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import { ArrowBack, Info } from "@mui/icons-material";
import { InfoModal } from "./InfoModal.tsx";

export const Navbar: React.FC<
  React.PropsWithChildren<{ title: string; showBackButton?: boolean }>
> = ({ title, showBackButton, children }) => {
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" style={{ height: children ? undefined : 70 }}>
        <Toolbar>
          {showBackButton && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              sx={{ mr: 2 }}
              onClick={() => navigate(-1)}
            >
              <ArrowBack />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            onClick={() => setModalOpen(true)}
          >
            <Info />
          </IconButton>
        </Toolbar>
        {children}
      </AppBar>

      {modalOpen && <InfoModal onClose={() => setModalOpen(false)} />}
    </Box>
  );
};
