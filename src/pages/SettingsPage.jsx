import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useOllama } from "../contexts/OllamaContext";
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
} from "@mui/material";

const SettingsPage = () => {
  const {
    systemPrompt,
    setSystemPrompt,
    defaultModel,
    setDefaultModel,
    autoSave,
    setAutoSave,
    ollamaUrl,
    setOllamaUrl,
  } = useSettings();

  const { models, refreshModels } = useOllama();
  const [saveStatus, setSaveStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSave = () => {
    setSaveStatus("success");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleRefreshModels = async () => {
    setIsRefreshing(true);
    try {
      await refreshModels();
    } catch (error) {
      console.error("Error refreshing models:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {saveStatus && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Ollama Configuration" />
            <CardContent>
              <TextField
                fullWidth
                label="Ollama URL"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                margin="normal"
                helperText="URL where Ollama is running (e.g., http://localhost:11434)"
              />

              <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleRefreshModels}
                  disabled={isRefreshing}
                  sx={{ mr: 2 }}
                >
                  {isRefreshing ? "Refreshing..." : "Refresh Models"}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {models.length > 0 ? `${models.length} models available` : "No models found"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Conversation Settings" />
            <CardContent>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="System Prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                margin="normal"
                helperText="Global system prompt that will be used for all conversations"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Default Model</InputLabel>
                <Select value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)}>
                  {models.map((model) => (
                    <MenuItem key={model.name} value={model.name}>
                      {model.name}
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

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Actions" />
            <CardContent>
              <Button variant="contained" onClick={handleSave} sx={{ mr: 2 }}>
                Save Settings
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setSystemPrompt("");
                  setDefaultModel("");
                  setAutoSave(true);
                }}
              >
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;
