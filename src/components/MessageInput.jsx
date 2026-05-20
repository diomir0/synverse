import React, { useState, useRef, useEffect } from "react";
import { Box, TextField, IconButton, Chip, Tooltip, Typography } from "@mui/material";
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Image as ImageMUIIcon,
  Description as TextIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { processFile, isSupportedFile, fileSizeLabel } from "../utils/fileUtils";

const MessageInput = ({
  onSendMessage,
  isLoading,
  disabled,
  attachments,
  onAttachmentsChange,
  prefilledMessage,
  onPrefillConsumed,
}) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // When the parent pushes a prefilled message (e.g. from edit), set it in the input
  useEffect(() => {
    if (prefilledMessage) {
      setMessage(prefilledMessage);
      if (onPrefillConsumed) onPrefillConsumed();
      inputRef.current?.focus();
    }
  }, [prefilledMessage, onPrefillConsumed]);

  useEffect(() => {
    if (!isLoading && !disabled) {
      inputRef.current?.focus();
    }
  }, [isLoading, disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasText = message.trim();
    const hasFiles = attachments && attachments.length > 0;
    if ((hasText || hasFiles) && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // File picker
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = [];
    for (const file of files) {
      if (!isSupportedFile(file)) {
        console.warn(`Skipping unsupported file: ${file.name}`);
        continue;
      }
      try {
        const att = await processFile(file);
        newAttachments.push(att);
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...(attachments || []), ...newAttachments]);
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id) => {
    onAttachmentsChange((attachments || []).filter((a) => a.id !== id));
  };

  const hasContent = message.trim() || (attachments && attachments.length > 0);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        px: 0,
        pb: 0,
        bgcolor: "transparent",
      }}
    >
      {/* Attachment previews */}
      {attachments && attachments.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          {attachments.map((att) => (
            <Chip
              key={att.id}
              icon={
                att.type === "image" ? (
                  <ImageMUIIcon />
                ) : att.type === "pdf" ? (
                  <PdfIcon />
                ) : (
                  <TextIcon />
                )
              }
              label={
                <Box
                  component="span"
                  sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {att.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fileSizeLabel(att.size)}
                  </Typography>
                </Box>
              }
              onDelete={() => removeAttachment(att.id)}
              deleteIcon={<CloseIcon fontSize="small" />}
              variant="outlined"
              size="small"
              sx={{
                maxWidth: 260,
                "& .MuiChip-label": { px: 0.5 },
              }}
            />
          ))}
        </Box>
      )}

      {/* Image thumbnails row */}
      {attachments && attachments.filter((a) => a.type === "image").length > 0 && (
        <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
          {attachments
            .filter((a) => a.type === "image")
            .map((att) => (
              <Box
                key={att.id}
                sx={{
                  position: "relative",
                  width: 64,
                  height: 64,
                  borderRadius: 1,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  component="img"
                  src={att.previewUrl}
                  alt={att.name}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeAttachment(att.id)}
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bgcolor: "rgba(0,0,0,0.5)",
                    color: "white",
                    p: 0.25,
                    "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            ))}
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
        {/* Attach button */}
        <Tooltip title="Attach file (images, text, PDF)">
          <IconButton
            color="primary"
            onClick={handleAttachClick}
            disabled={isLoading || disabled}
            size="small"
            sx={{ mb: 0.5 }}
          >
            <AttachFileIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.txt,.md,.csv,.json,.xml,.yaml,.yml,.py,.js,.ts,.html,.css,.pdf,.log,.sh,.bat,.sql,.r,.env"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          minRows={1}
          maxRows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Select a model to start chatting..."
              : "Type your message... (Enter to send, Shift+Enter for new line)"
          }
          disabled={isLoading || disabled}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "divider",
            },
          }}
          InputProps={{
            endAdornment: (
              <IconButton
                type="submit"
                color="primary"
                disabled={isLoading || disabled || !hasContent}
                size="small"
                sx={{
                  bgcolor: hasContent && !disabled ? "primary.main" : "transparent",
                  color: hasContent && !disabled ? "primary.contrastText" : "action.disabled",
                  "&:hover": {
                    bgcolor: hasContent && !disabled ? "primary.dark" : "transparent",
                  },
                  mr: -0.5,
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default MessageInput;
