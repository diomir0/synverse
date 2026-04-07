import React, { useState } from "react";
import { Box, TextField, IconButton, Button, Fab } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

const MessageInput = ({ onSendMessage, isLoading, disabled }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
        <TextField
          fullWidth
          multiline
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading || disabled}
          sx={{ flex: 1 }}
          InputProps={{
            endAdornment: (
              <IconButton
                type="submit"
                color="primary"
                disabled={isLoading || disabled || !message.trim()}
                size="small"
              >
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default MessageInput;
