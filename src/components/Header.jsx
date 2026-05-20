import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Chip,
  Menu,
  useTheme,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Cloud as CloudIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useOllama } from "../contexts/OllamaContext";
import { useSettings } from "../contexts/SettingsContext";

const Header = ({ setDarkMode, darkMode }) => {
  const { ollamaStatus, models, isCloudMode, getAllAvailableModels, cloudModels, checkConnection } =
    useOllama();
  const { currentModel, setCurrentModel } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isOnSettings = location.pathname === "/settings";

  const [modelAnchorEl, setModelAnchorEl] = useState(null);
  const allModels = getAllAvailableModels();

  const handleModelChange = (modelName) => {
    setCurrentModel(modelName);
    setModelAnchorEl(null);
  };

  const statusColor =
    ollamaStatus === "connected" ? "success" : ollamaStatus === "connecting" ? "warning" : "error";

  const statusLabel =
    ollamaStatus === "connected"
      ? isCloudMode
        ? "Cloud Connected"
        : "Connected"
      : ollamaStatus === "connecting"
        ? "Connecting..."
        : "Disconnected";

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar variant="dense">
        <Typography variant="h6" component="div" sx={{ fontWeight: 600, mr: 2 }}>
          Synverse
        </Typography>

        {/* Connection status chip */}
        <Chip
          size="small"
          label={statusLabel}
          color={statusColor}
          variant="outlined"
          sx={{ mr: 2, borderColor: "rgba(255,255,255,0.5)", color: "rgba(255,255,255,0.9)" }}
          icon={
            isCloudMode && ollamaStatus === "connected" ? (
              <CloudIcon sx={{ fontSize: 16 }} />
            ) : undefined
          }
        />

        {/* Model selector */}
        <Box sx={{ display: "flex", alignItems: "center", mr: 2, minWidth: 200 }}>
          <FormControl size="small" fullWidth>
            <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Model</InputLabel>
            <Select
              value={currentModel || ""}
              onChange={(e) => handleModelChange(e.target.value)}
              label="Model"
              sx={{
                bgcolor: "rgba(255,255,255,0.1)",
                borderRadius: 1,
                "& .MuiSelect-select": { color: "white" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.5)",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: { maxHeight: 400 },
                },
              }}
            >
              {/* Local/pulled models */}
              {models.length > 0 && [
                <MenuItem key="local-header" disabled dense>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">
                    {isCloudMode ? "Pulled Models" : "Local Models"}
                  </Typography>
                </MenuItem>,
                ...models.map((model) => (
                  <MenuItem key={model.name} value={model.name} dense>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {model.name.includes("-cloud") && (
                        <CloudIcon fontSize="small" color="primary" />
                      )}
                      {model.name}
                    </Box>
                  </MenuItem>
                )),
              ]}

              {/* Cloud models (when in cloud mode) */}
              {isCloudMode &&
                cloudModels.length > 0 && [
                  <MenuItem key="cloud-header" disabled dense>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                      Cloud Models
                    </Typography>
                  </MenuItem>,
                  ...cloudModels.map((model) => (
                    <MenuItem key={model.name} value={model.name} dense>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CloudIcon fontSize="small" color="primary" />
                        {model.name}
                      </Box>
                    </MenuItem>
                  )),
                ]}

              {allModels.length === 0 && (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    {ollamaStatus === "connected"
                      ? "No models available"
                      : "Connect to Ollama first"}
                  </Typography>
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            color="inherit"
            onClick={checkConnection}
            size="small"
            title="Reconnect to Ollama"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>

          <IconButton
            color="inherit"
            onClick={() => setDarkMode(!darkMode)}
            size="small"
            title="Toggle theme"
          >
            {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>

          <IconButton
            color="inherit"
            onClick={() => navigate(isOnSettings ? "/" : "/settings")}
            size="small"
            title={isOnSettings ? "Back to Chat" : "Settings"}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
