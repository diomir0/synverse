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
  TextField,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Chat as ChatIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useConversation } from "../contexts/ConversationContext";
import { useSettings } from "../contexts/SettingsContext";

const Sidebar = ({ onNewConversation, open = true, onToggle }) => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    deleteConversation,
    updateConversation,
  } = useConversation();
  const { currentModel } = useSettings();

  const navigate = useNavigate();
  const location = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const isOnSettings = location.pathname === "/settings";

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
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

  const handleRenameClick = (e, conversation) => {
    e.stopPropagation();
    setConversationToRename(conversation);
    setRenameValue(conversation.title || "");
    setRenameDialogOpen(true);
  };

  const confirmRename = async () => {
    if (conversationToRename && renameValue.trim()) {
      await updateConversation({ ...conversationToRename, title: renameValue.trim() });
    }
    setRenameDialogOpen(false);
    setConversationToRename(null);
    setRenameValue("");
  };

  const handleCreateNew = () => {
    onNewConversation();
    if (isOnSettings) {
      navigate("/");
    }
  };

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
        bgcolor: "#0f1119",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition:
          "width 200ms cubic-bezier(0.4, 0, 0.2, 1), min-width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        borderRight: open ? "1px solid rgba(255,255,255,0.06)" : "none",
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
          sx={{
            borderColor: "rgba(20,184,166,0.4)",
            color: "#2dd4bf",
            "&:hover": {
              borderColor: "#14b8a6",
              bgcolor: "rgba(20,184,166,0.08)",
            },
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          New Chat
        </Button>
      </Box>

      <Divider />

      {/* Conversation List */}
      <Box sx={{ flex: 1, overflow: "auto", px: 1, pt: 1, pb: 1 }}>
        {conversations.length > 0 ? (
          <List dense disablePadding>
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversation?.id && !isOnSettings;
              return (
                <ListItemButton
                  key={conversation.id}
                  selected={isActive}
                  onClick={() => handleConversationClick(conversation)}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.25,
                    py: 1,
                    px: 1.5,
                    "&.Mui-selected": {
                      bgcolor: "rgba(20,184,166,0.1)",
                      "&:hover": {
                        bgcolor: "rgba(20,184,166,0.14)",
                      },
                    },
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.04)",
                    },
                    transition: "background-color 150ms ease",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ChatIcon
                      fontSize="small"
                      sx={{
                        color: isActive ? "#14b8a6" : "#475569",
                        fontSize: 18,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={conversation.title || "Untitled"}
                    secondary={
                      <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.68rem" }}>
                        {conversation.messages?.length > 0
                          ? `${conversation.messages.length} msg${conversation.messages.length > 1 ? "s" : ""} · ${formatTime(conversation.updatedAt)}`
                          : "Empty"}
                      </Typography>
                    }
                    primaryTypographyProps={{
                      variant: "body2",
                      noWrap: true,
                      fontWeight: isActive ? 600 : 400,
                      sx: {
                        color: isActive ? "#e2e8f0" : "#94a3b8",
                        fontSize: "0.85rem",
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      opacity: 0,
                      transition: "opacity 150ms ease",
                      ".MuiListItemButton-root:hover &": { opacity: 0.6 },
                    }}
                  >
                    <IconButton
                      aria-label="rename"
                      onClick={(e) => handleRenameClick(e, conversation)}
                      size="small"
                      sx={{
                        color: "#64748b",
                        "&:hover": { color: "#14b8a6" },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      onClick={(e) => handleDeleteClick(e, conversation.id)}
                      size="small"
                      sx={{
                        color: "#64748b",
                        "&:hover": { color: "#ef4444" },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <ChatIcon sx={{ fontSize: 36, color: "#2a2d3a", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "#64748b", mb: 0.5 }}>
              No conversations yet
            </Typography>
            <Typography variant="caption" sx={{ color: "#475569" }}>
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
          sx={{
            borderRadius: 1.5,
            py: 1,
            px: 1.5,
            "&.Mui-selected": {
              bgcolor: "rgba(20,184,166,0.1)",
              "&:hover": {
                bgcolor: "rgba(20,184,166,0.14)",
              },
            },
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.04)",
            },
            transition: "background-color 150ms ease",
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <SettingsIcon
              fontSize="small"
              sx={{
                color: isOnSettings ? "#14b8a6" : "#475569",
                fontSize: 18,
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary={isOnSettings ? "Back to Chat" : "Settings"}
            primaryTypographyProps={{
              variant: "body2",
              sx: {
                fontWeight: isOnSettings ? 600 : 400,
                color: isOnSettings ? "#e2e8f0" : "#94a3b8",
                fontSize: "0.85rem",
              },
            }}
          />
        </ListItemButton>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Conversation?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            This will permanently delete this conversation and all its messages. This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "#94a3b8" }}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Rename Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            size="small"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameValue.trim()) {
                confirmRename();
              }
            }}
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": {
                color: "#e2e8f0",
                "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&.Mui-focused fieldset": { borderColor: "#14b8a6" },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)} sx={{ color: "#94a3b8" }}>
            Cancel
          </Button>
          <Button
            onClick={confirmRename}
            disabled={!renameValue.trim()}
            sx={{
              color: "#2dd4bf",
              "&:hover": { bgcolor: "rgba(20,184,166,0.08)" },
            }}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;
