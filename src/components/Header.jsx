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
  MenuItem as MuiMenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Cloud as CloudIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useOllama } from "../contexts/OllamaContext";
import { useSettings } from "../contexts/SettingsContext";

const Header = ({ setDarkMode, darkMode, sidebarOpen, onToggleSidebar }) => {
  const { ollamaStatus, models, isCloudMode, getAllAvailableModels, cloudModels, checkConnection } =
    useOllama();
  const { currentModel, setCurrentModel } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isOnSettings = location.pathname === "/settings";

  // Responsive breakpoint — compact layout below 600 px
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));

  const [modelAnchorEl, setModelAnchorEl] = useState(null);
  const [overflowAnchorEl, setOverflowAnchorEl] = useState(null);
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
        ? "Cloud"
        : "OK"
      : ollamaStatus === "connecting"
        ? "…"
        : "Off";

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar variant="dense" sx={{ gap: 1 }}>
        {/* Sidebar toggle */}
        <IconButton
          color="inherit"
          onClick={onToggleSidebar}
          size="small"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        {/* App title — hidden on very small screens */}
        {!isCompact && (
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
            Synverse
          </Typography>
        )}

        {/* Connection status chip — compact on small screens */}
        <Chip
          size="small"
          label={statusLabel}
          color={statusColor}
          variant="outlined"
          sx={{
            borderColor: "rgba(255,255,255,0.5)",
            color: "rgba(255,255,255,0.9)",
            flexShrink: 0,
            "& .MuiChip-label": { px: isCompact ? 0.5 : 1 },
          }}
          icon={
            isCloudMode && ollamaStatus === "connected" ? (
              <CloudIcon sx={{ fontSize: 14 }} />
            ) : undefined
          }
        />

        {/* Model selector — fills remaining space */}
        <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
          <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Model</InputLabel>
          <Select
            value={currentModel || ""}
            onChange={(e) => handleModelChange(e.target.value)}
            label="Model"
            sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              borderRadius: 1,
              "& .MuiSelect-select": {
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                pr: 3,
              },
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
                  {ollamaStatus === "connected" ? "No models available" : "Connect to Ollama first"}
                </Typography>
              </MenuItem>
            )}
          </Select>
        </FormControl>

        {/* Action buttons — inline on wide screens, overflow menu on compact */}
        {isCompact ? (
          <>
            <IconButton
              color="inherit"
              size="small"
              onClick={(e) => setOverflowAnchorEl(e.currentTarget)}
              title="More actions"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={overflowAnchorEl}
              open={Boolean(overflowAnchorEl)}
              onClose={() => setOverflowAnchorEl(null)}
            >
              <MuiMenuItem
                onClick={() => {
                  checkConnection();
                  setOverflowAnchorEl(null);
                }}
              >
                <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
                Reconnect
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  setDarkMode(!darkMode);
                  setOverflowAnchorEl(null);
                }}
              >
                {darkMode ? (
                  <LightModeIcon fontSize="small" sx={{ mr: 1 }} />
                ) : (
                  <DarkModeIcon fontSize="small" sx={{ mr: 1 }} />
                )}
                {darkMode ? "Light mode" : "Dark mode"}
              </MuiMenuItem>
              <MuiMenuItem
                onClick={() => {
                  navigate(isOnSettings ? "/" : "/settings");
                  setOverflowAnchorEl(null);
                }}
              >
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                {isOnSettings ? "Back to Chat" : "Settings"}
              </MuiMenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
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
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
