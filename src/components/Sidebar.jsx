import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Typography,
  Button,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useConversation } from "../contexts/ConversationContext";

const Sidebar = () => {
  const { conversations, currentConversation, setConversations, setCurrentConversation } =
    useConversation();

  const handleConversationClick = (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleDeleteClick = (e, conversationId) => {
    e.stopPropagation();
    // Filter out the deleted conversation
    const updatedConversations = conversations.filter((conv) => conv.id !== conversationId);
    setConversations(updatedConversations);

    // If we deleted the active conversation, switch to the first one or null
    if (currentConversation?.id === conversationId) {
      if (updatedConversations.length > 0) {
        setCurrentConversation(updatedConversations[0]);
      } else {
        setCurrentConversation(null);
      }
    }
  };

  const handleCreateNew = () => {
    const newConversation = {
      id: Date.now(), // Simple ID generation
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
    };

    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setCurrentConversation(newConversation);
  };

  return (
    <Box
      sx={{
        width: 250,
        height: "100vh",
        bgcolor: "background.paper",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreateNew}>
          New Chat
        </Button>
      </Box>

      <Box sx={{ p: 1, flexGrow: 1, overflow: "auto" }}>
        <List>
          {conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              button
              selected={conversation.id === currentConversation?.id}
              onClick={() => handleConversationClick(conversation)}
              sx={{
                mb: 1,
                borderRadius: 1,
                bgcolor:
                  conversation.id === currentConversation?.id ? "action.selected" : "transparent",
              }}
            >
              <ListItemIcon>
                <ChatIcon />
              </ListItemIcon>
              <ListItemText
                primary={conversation.title || "Untitled"}
                secondary={
                  conversation.messages.length > 0
                    ? conversation.messages[conversation.messages.length - 1].content.substring(
                        0,
                        30,
                      ) + "..."
                    : "New conversation"
                }
              />
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={(e) => handleDeleteClick(e, conversation.id)}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItem>
          ))}

          {conversations.length === 0 && (
            <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body2">No conversations yet</Typography>
            </Box>
          )}
        </List>
      </Box>

      <Divider />

      <Box sx={{ p: 1 }}>
        <ListItem>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </Box>
    </Box>
  );
};

export default Sidebar;
