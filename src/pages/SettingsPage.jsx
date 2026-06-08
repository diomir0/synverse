import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useOllama } from "../contexts/OllamaContext";
import Sidebar from "../components/Sidebar";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Cloud as CloudIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Link as LinkIcon,
} from "@mui/icons-material";

const SettingsPage = ({ sidebarOpen, onToggleSidebar }) => {
  const {
    globalSystemPrompt,
    setGlobalSystemPrompt,
    defaultModel,
    setDefaultModel,
    autoSave,
    setAutoSave,
    currentModel,
    setCurrentModel,
  } = useSettings();

  const {
    models,
    ollamaUrl,
    setOllamaUrl,
    apiKey,
    setApiKey,
    useProxy,
    setUseProxy,
    isCloudMode,
    ollamaStatus,
    checkConnection,
    getOllamaModels,
    getAllAvailableModels,
    cloudModels,
  } = useOllama();

  const [saveStatus, setSaveStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [customModelName, setCustomModelName] = useState("");

  const handleRefreshModels = async () => {
    setIsRefreshing(true);
    try {
      await getOllamaModels();
    } catch (error) {
      console.error("Error refreshing models:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = () => {
    setSaveStatus("success");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleReset = () => {
    setGlobalSystemPrompt("You are a helpful AI assistant. Respond clearly and concisely.");
    setDefaultModel("");
    setAutoSave(true);
    setOllamaUrl("http://localhost:11434");
    setApiKey("");
    setUseProxy(false);
    setSaveStatus("success");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const allModels = getAllAvailableModels();

  // Group cloud models by category
  const cloudModelsByCategory = cloudModels.reduce((acc, model) => {
    const cat = model.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(model);
    return acc;
  }, {});

  const categoryLabels = {
    coding: "Coding & Development",
    reasoning: "Reasoning & General",
    multimodal: "Multimodal (Vision + Language)",
    general: "General Purpose",
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        width: "100%",
        bgcolor: "#0b0d13",
      }}
    >
      <Sidebar onNewConversation={() => {}} open={sidebarOpen} onToggle={onToggleSidebar} />
      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        <Box sx={{ maxWidth: 900, mx: "auto" }}>
          <Typography
            variant="h4"
            sx={{
              color: "#e2e8f0",
              fontWeight: 600,
              mb: 3,
              letterSpacing: "-0.02em",
            }}
          >
            Settings
          </Typography>

          {saveStatus && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                bgcolor: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                color: "#86efac",
                "& .MuiAlert-icon": { color: "#22c55e" },
              }}
            >
              Settings saved successfully!
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Ollama Connection Configuration */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title="Ollama Configuration"
                  subheader="Connect to a local Ollama instance or Ollama Cloud"
                  avatar={<LinkIcon sx={{ color: "#14b8a6" }} />}
                />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Ollama URL"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    margin="normal"
                    helperText={
                      isCloudMode
                        ? "Cloud mode detected. You'll need an API key for cloud access."
                        : "URL where Ollama is running (e.g., http://localhost:11434)"
                    }
                    InputProps={{
                      startAdornment: isCloudMode ? (
                        <InputAdornment position="start">
                          <CloudIcon sx={{ color: "#14b8a6", fontSize: 18 }} />
                        </InputAdornment>
                      ) : null,
                    }}
                  />

                  <TextField
                    fullWidth
                    label="API Key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    margin="normal"
                    helperText="Required for Ollama Cloud. Get your key from ollama.com after signing in."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowApiKey(!showApiKey)}
                            edge="end"
                            size="small"
                            sx={{ color: "#64748b" }}
                          >
                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Switch checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} />
                    }
                    label="Use dev server proxy (helps with CORS issues in development)"
                    sx={{ mt: 1 }}
                  />

                  <Box sx={{ display: "flex", alignItems: "center", mt: 2, gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={checkConnection}
                      disabled={ollamaStatus === "connecting"}
                      startIcon={<RefreshIcon />}
                      sx={{
                        borderColor: "rgba(20,184,166,0.4)",
                        color: "#2dd4bf",
                        "&:hover": {
                          borderColor: "#14b8a6",
                          bgcolor: "rgba(20,184,166,0.08)",
                        },
                      }}
                    >
                      Test Connection
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleRefreshModels}
                      disabled={isRefreshing}
                      startIcon={<RefreshIcon />}
                      sx={{
                        borderColor: "rgba(255,255,255,0.12)",
                        color: "#94a3b8",
                        "&:hover": {
                          borderColor: "rgba(255,255,255,0.2)",
                          bgcolor: "rgba(255,255,255,0.04)",
                        },
                      }}
                    >
                      {isRefreshing ? "Refreshing..." : "Refresh Models"}
                    </Button>
                    <Chip
                      icon={ollamaStatus === "connected" ? <CheckCircleIcon /> : <ErrorIcon />}
                      label={
                        ollamaStatus === "connected"
                          ? `Connected${isCloudMode ? " (Cloud)" : ""}`
                          : ollamaStatus === "connecting"
                            ? "Connecting..."
                            : "Disconnected"
                      }
                      color={
                        ollamaStatus === "connected"
                          ? "success"
                          : ollamaStatus === "connecting"
                            ? "warning"
                            : "error"
                      }
                      variant="outlined"
                      sx={{
                        borderColor:
                          ollamaStatus === "connected" ? "rgba(20,184,166,0.4)" : undefined,
                        color: ollamaStatus === "connected" ? "#2dd4bf" : undefined,
                      }}
                    />
                  </Box>

                  {isCloudMode && (
                    <Alert
                      severity="info"
                      sx={{
                        mt: 2,
                        bgcolor: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        color: "#93c5fd",
                        "& .MuiAlert-icon": { color: "#60a5fa" },
                      }}
                    >
                      You are connecting to Ollama Cloud. Cloud models require an API key. Get yours
                      at{" "}
                      <a
                        href="https://ollama.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#93c5fd" }}
                      >
                        ollama.com
                      </a>{" "}
                      after creating an account and running <code>ollama signin</code>.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Cloud Model Library */}
            {isCloudMode && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Available Cloud Models"
                    subheader="Models available on Ollama Cloud. Select a model name to use it in your chats."
                    avatar={<CloudIcon sx={{ color: "#14b8a6" }} />}
                  />
                  <CardContent>
                    {Object.entries(cloudModelsByCategory).map(([category, modelList]) => (
                      <Box key={category} sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={{ mb: 1, color: "#e2e8f0" }}
                        >
                          {categoryLabels[category] || category}
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {modelList.map((model) => (
                            <Tooltip key={model.name} title={model.description}>
                              <Chip
                                label={model.name}
                                variant={currentModel === model.name ? "filled" : "outlined"}
                                color={currentModel === model.name ? "primary" : "default"}
                                onClick={() => setCurrentModel(model.name)}
                                size="small"
                                sx={
                                  currentModel === model.name
                                    ? {}
                                    : {
                                        borderColor: "rgba(255,255,255,0.1)",
                                        color: "#94a3b8",
                                      }
                                }
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    ))}

                    <Divider sx={{ my: 2 }} />

                    {/* Custom model name input */}
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "#64748b" }}>
                      Or enter a custom model name:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <TextField
                        size="small"
                        label="Model name (e.g., llama3:8b)"
                        value={customModelName}
                        onChange={(e) => setCustomModelName(e.target.value)}
                        sx={{ flex: 1 }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customModelName.trim()) {
                            setCurrentModel(customModelName.trim());
                            setCustomModelName("");
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!customModelName.trim()}
                        onClick={() => {
                          if (customModelName.trim()) {
                            setCurrentModel(customModelName.trim());
                            setCustomModelName("");
                          }
                        }}
                      >
                        Use
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Conversation Settings */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Conversation Settings" />
                <CardContent>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="System Prompt"
                    value={globalSystemPrompt}
                    onChange={(e) => setGlobalSystemPrompt(e.target.value)}
                    margin="normal"
                    helperText="Global system prompt that will be used for all conversations"
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Default Model</InputLabel>
                    <Select value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)}>
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {allModels.map((model) => (
                        <MenuItem key={model.name} value={model.name}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {model.name}
                            {model.isCloud && <CloudIcon sx={{ fontSize: 14, color: "#14b8a6" }} />}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
                    }
                    label="Auto-save conversations"
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Current Models */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title={isCloudMode ? "Your Pulled Models" : "Available Models"}
                  subheader={
                    isCloudMode
                      ? "Models you've pulled/registered on Ollama Cloud"
                      : "Models available on your local Ollama instance"
                  }
                />
                <CardContent>
                  {models.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {models.map((model) => (
                        <Chip
                          key={model.name}
                          label={model.name}
                          icon={
                            model.name.includes("-cloud") ? (
                              <CloudIcon sx={{ fontSize: 16, color: "#14b8a6" }} />
                            ) : undefined
                          }
                          variant={currentModel === model.name ? "filled" : "outlined"}
                          color={currentModel === model.name ? "primary" : "default"}
                          onClick={() => setCurrentModel(model.name)}
                          size="small"
                          sx={
                            currentModel === model.name
                              ? {}
                              : {
                                  borderColor: "rgba(255,255,255,0.1)",
                                  color: "#94a3b8",
                                }
                          }
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {ollamaStatus === "connected"
                        ? "No models found. Pull models with `ollama pull <model-name>`"
                        : "Connect to Ollama to see available models"}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
                <Button variant="contained" onClick={handleSave}>
                  Save Settings
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  sx={{
                    borderColor: "rgba(245,158,11,0.4)",
                    color: "#fbbf24",
                    "&:hover": {
                      borderColor: "#f59e0b",
                      bgcolor: "rgba(245,158,11,0.08)",
                    },
                  }}
                >
                  Reset to Defaults
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;
