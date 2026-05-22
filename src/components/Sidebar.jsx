import React, { useState } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Chat as ChatIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useConversation } from "../contexts/ConversationContext";
import { useSettings } from "../contexts/SettingsContext";

const Sidebar = ({ onNewConversation, open = true, onToggle }) => {
  const { conversations, activeConversation, setActiveConversation, deleteConversation } =
    useConversation();
  const { currentModel } = useSettings();

  const navigate = useNavigate();
  const location = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const isOnSettings = location.pathname === "/settings";

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    // If we're on the settings page, navigate back to chat
    if (isOnSettings) {
      navigate("/");
    }
  };

  const handleDeleteClick = (e, conversationId) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete);
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleCreateNew = () => {
    onNewConversation();
    // If we're on the settings page, navigate back to chat
    if (isOnSettings) {
      navigate("/");
    }
  };

  // Format the conversation timestamp
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <Box
      sx={{
        width: open ? 260 : 0,
        minWidth: open ? 260 : 0,
        height: "100%",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 200ms ease, min-width 200ms ease",
        borderRight: open ? "1px solid" : "none",
        borderColor: "divider",
      }}
    >
      {/* New Chat Button */}
      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          size="small"
        >
          New Chat
        </Button>
      </Box>

      <Divider />

      {/* Conversation List */}
      <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
        {conversations.length > 0 ? (
          <List dense>
            {conversations.map((conversation) => (
              <ListItemButton
                key={conversation.id}
                selected={conversation.id === activeConversation?.id && !isOnSettings}
                onClick={() => handleConversationClick(conversation)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "action.selected",
                    "&:hover": {
                      bgcolor: "action.selected",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ChatIcon
                    fontSize="small"
                    color={
                      conversation.id === activeConversation?.id && !isOnSettings
                        ? "primary"
                        : "action"
                    }
                  />
                </ListItemIcon>
                <ListItemText
                  primary={conversation.title || "Untitled"}
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {conversation.messages?.length > 0
                        ? `${conversation.messages.length} msg${conversation.messages.length > 1 ? "s" : ""} · ${formatTime(conversation.updatedAt)}`
                        : "Empty"}
                    </Typography>
                  }
                  primaryTypographyProps={{
                    variant: "body2",
                    noWrap: true,
                    fontWeight:
                      conversation.id === activeConversation?.id && !isOnSettings ? 600 : 400,
                  }}
                />
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => handleDeleteClick(e, conversation.id)}
                  size="small"
                  sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <ChatIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No conversations yet
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Start a new chat to begin
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Settings Link */}
      <Box sx={{ p: 1 }}>
        <ListItemButton
          selected={isOnSettings}
          onClick={() => navigate(isOnSettings ? "/" : "/settings")}
          sx={{ borderRadius: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={isOnSettings ? "Back to Chat" : "Settings"}
            primaryTypographyProps={{ variant: "body2" }}
          />
        </ListItemButton>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs">
        <DialogTitle>Delete Conversation?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will permanently delete this conversation and all its messages. This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;
