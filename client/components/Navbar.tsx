import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { ArrowBack, Menu as MenuIcon } from "@mui/icons-material";
import { InfoModal } from "./InfoModal.tsx";

export const Navbar: React.FC<
  React.PropsWithChildren<{ title: string; showBackButton?: boolean }>
> = ({ title, showBackButton, children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
            onClick={() => setMenuOpen(true)}
            ref={menuButton}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
        {children}
      </AppBar>

      {menuOpen && (
        <Menu
          open
          anchorEl={menuButton.current}
          onClose={() => setMenuOpen(false)}
        >
          <MenuItem
            onClick={() => {
              setMenuOpen(false);
              setModalOpen(true);
            }}
          >
            About
          </MenuItem>
          {/* the LinkComponent prop doesn't work :( */}
          {pathname !== "/map" && (
            <MenuItem onClick={() => navigate("/map")}>Map</MenuItem>
          )}
        </Menu>
      )}

      {modalOpen && <InfoModal onClose={() => setModalOpen(false)} />}
    </Box>
  );
};
