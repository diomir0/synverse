import React from "react";
import { Box, Typography, Paper, Divider, Avatar, useTheme } from "@mui/material";
import { Person as UserIcon, Assistant as AssistantIcon } from "@mui/icons-material";

const MessageList = ({ messages }) => {
  const theme = useTheme();

  if (!messages || messages.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 4, color: "text.secondary" }}>
        <Typography variant="body2">No messages yet. Start a conversation!</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {messages.map((message, index) => (
        <React.Fragment key={message.id}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              ...(message.role === "user" ? { justifyContent: "flex-end" } : {}),
            }}
          >
            {message.role === "assistant" && (
              <Avatar sx={{ bgcolor: "primary.main", mt: 0.5 }}>
                <AssistantIcon />
              </Avatar>
            )}

            <Paper
              elevation={1}
              sx={{
                p: 2,
                maxWidth: "80%",
                bgcolor: message.role === "user" ? "primary.light" : "background.default",
                color: message.role === "user" ? "primary.contrastText" : "text.primary",
              }}
            >
              <Typography variant="body1" component="div">
                {message.content}
              </Typography>
            </Paper>

            {message.role === "user" && (
              <Avatar sx={{ bgcolor: "secondary.main", mt: 0.5 }}>
                <UserIcon />
              </Avatar>
            )}
          </Box>

          {index < messages.length - 1 && <Divider sx={{ my: 1 }} />}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default MessageList;
