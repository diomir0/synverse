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
  useColorScheme,
} from "@mui/material";
import { Refresh as RefreshIcon, Settings as SettingsIcon } from "@mui/icons-material";
import { useOllama } from "../contexts/OllamaContext";
import { useSettings } from "../contexts/SettingsContext";
import { useConversation } from "../contexts/ConversationContext";

const Header = () => {
  const { models } = useOllama();
  const { currentModel, setCurrentModel } = useSettings();
  const { conversations, setConversations } = useConversation();
  const handleModelChange = (newValue) => {
    setCurrentModel(newValue);
  };

  const handleNewConversation = () => {
    // Create a new conversation
    const newConversation = {
      id: Date.now(),
      title: `Conversation ${conversations.length + 1}`,
      messages: [],
    };
    setConversations([newConversation, ...conversations]);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Synverse
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          <Select
            value={currentModel || ""}
            onChange={(e) => handleModelChange(e.target.value)}
            size="small"
            sx={{ mr: 2, minWidth: 150 }}
          >
            {models.map((model) => (
              <MenuItem key={model.name} value={model.name}>
                {model.name}
              </MenuItem>
            ))}
          </Select>

          <IconButton color="inherit" onClick={handleNewConversation} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
