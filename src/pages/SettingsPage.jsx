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

const SettingsPage = () => {
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
        bgcolor: "background.default",
      }}
    >
      <Sidebar onNewConversation={() => {}} />
      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        <Box sx={{ maxWidth: 900, mx: "auto" }}>
          <Typography variant="h4" gutterBottom>
            Settings
          </Typography>

          {saveStatus && (
            <Alert severity="success" sx={{ mb: 2 }}>
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
                  avatar={<LinkIcon />}
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
                          <CloudIcon color="primary" fontSize="small" />
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
                  />

                  <Box sx={{ display: "flex", alignItems: "center", mt: 2, gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={checkConnection}
                      disabled={ollamaStatus === "connecting"}
                      startIcon={<RefreshIcon />}
                    >
                      Test Connection
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleRefreshModels}
                      disabled={isRefreshing}
                      startIcon={<RefreshIcon />}
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
                    />
                  </Box>

                  {isCloudMode && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      You are connecting to Ollama Cloud. Cloud models require an API key. Get yours
                      at{" "}
                      <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">
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
                    avatar={<CloudIcon />}
                  />
                  <CardContent>
                    {Object.entries(cloudModelsByCategory).map(([category, modelList]) => (
                      <Box key={category} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
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
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    ))}

                    <Divider sx={{ my: 2 }} />

                    {/* Custom model name input */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
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
                            {model.isCloud && <CloudIcon fontSize="small" color="primary" />}
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
                          icon={model.name.includes("-cloud") ? <CloudIcon /> : undefined}
                          variant={currentModel === model.name ? "filled" : "outlined"}
                          color={currentModel === model.name ? "primary" : "default"}
                          onClick={() => setCurrentModel(model.name)}
                          size="small"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
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
              <Card>
                <CardHeader title="Actions" />
                <CardContent>
                  <Button variant="contained" onClick={handleSave} sx={{ mr: 2 }}>
                    Save Settings
                  </Button>
                  <Button variant="outlined" onClick={handleReset} color="warning">
                    Reset to Defaults
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;
