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
  Tooltip,
  Button,
  Fab,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const Sidebar = ({
  conversations,
  activeConversationId,
  setActiveConversation,
  onCreateNew,
  onDelete,
}) => {
  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleDeleteClick = (e, conversationId) => {
    e.stopPropagation();
    onDelete(conversationId);
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
        <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={onCreateNew}>
          New Chat
        </Button>
      </Box>

      <Box sx={{ p: 1, flexGrow: 1, overflow: "auto" }}>
        <List>
          {conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              button
              selected={conversation.id === activeConversationId}
              onClick={() => handleConversationClick(conversation)}
              sx={{
                mb: 1,
                borderRadius: 1,
                bgcolor:
                  conversation.id === activeConversationId ? "action.selected" : "transparent",
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
