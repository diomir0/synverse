import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  Box,
  Button,
  IconButton,
} from "@mui/material";
import { Refresh as RefreshIcon, Settings as SettingsIcon } from "@mui/icons-material";

const Header = ({ currentModel, models, onModelChange, onNewConversation }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Ollama Chat
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          <Select
            value={currentModel}
            onChange={(e) => onModelChange(e.target.value)}
            size="small"
            sx={{ mr: 2, minWidth: 150 }}
          >
            {models.map((model) => (
              <MenuItem key={model.name} value={model.name}>
                {model.name}
              </MenuItem>
            ))}
          </Select>

          <IconButton color="inherit" onClick={onNewConversation} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
