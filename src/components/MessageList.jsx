import React, { useState } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  SmartToy as BotIcon,
  Person as PersonIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { fileSizeLabel } from "../utils/fileUtils";

const MessageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

const MessageRow = styled(Box)(({ theme, $isuser }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
  alignItems: "flex-start",
  flexDirection: $isuser ? "row-reverse" : "row",
}));

const UserBubble = styled(Box)(({ theme }) => ({
  maxWidth: "80%",
  backgroundColor:
    theme.palette.mode === "dark" ? theme.palette.primary.dark : theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1.25, 2),
  borderRadius: "18px 18px 4px 18px",
  wordBreak: "break-word",
  boxShadow: "none",
}));

const AssistantBubble = styled(Box)(({ theme }) => ({
  width: "100%",
  backgroundColor: "transparent",
  color: theme.palette.text.primary,
  padding: theme.spacing(0.5, 0),
  wordBreak: "break-word",
  "& pre": {
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.grey[100],
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    overflow: "auto",
    fontSize: "0.875rem",
    border: `1px solid ${theme.palette.divider}`,
  },
  "& code": {
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.grey[100],
    padding: theme.spacing(0.25, 0.75),
    borderRadius: theme.spacing(0.5),
    fontSize: "0.875rem",
    fontFamily: "monospace",
  },
  "& pre code": {
    backgroundColor: "transparent",
    padding: 0,
    border: "none",
  },
  "& p": {
    margin: theme.spacing(0.5, 0),
    lineHeight: 1.7,
  },
  "& ul, & ol": {
    paddingLeft: theme.spacing(2),
    margin: theme.spacing(0.5, 0),
  },
  "& li": {
    margin: theme.spacing(0.25, 0),
  },
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    margin: theme.spacing(1, 0, 0.5),
  },
  "& blockquote": {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    margin: theme.spacing(1, 0),
    paddingLeft: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  "& table": {
    borderCollapse: "collapse",
    width: "100%",
    margin: theme.spacing(1, 0),
  },
  "& th, & td": {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(0.5, 1),
    textAlign: "left",
  },
  "& th": {
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.grey[100],
    fontWeight: 600,
  },
  "& a": {
    color: theme.palette.primary.main,
    textDecoration: "underline",
  },
}));

const StreamingIndicator = styled(Box)(({ theme }) => ({
  display: "inline-block",
  width: 8,
  height: 16,
  backgroundColor: theme.palette.primary.main,
  borderRadius: 1,
  animation: "blink 1s infinite",
  marginLeft: 4,
  verticalAlign: "text-bottom",
  "@keyframes blink": {
    "0%, 50%": { opacity: 1 },
    "51%, 100%": { opacity: 0 },
  },
}));

const AvatarIcon = styled(Box)(({ theme }) => ({
  width: 26,
  height: 26,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginTop: 2,
}));

const UserAvatar = styled(AvatarIcon)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const BotAvatar = styled(AvatarIcon)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[200],
  color: theme.palette.mode === "dark" ? theme.palette.grey[400] : theme.palette.grey[600],
}));

// Wrapper for a single message that adds a hover-reveal edit button
const EditableMessageRow = ({ message, isUser, isStreaming, isEditable, onEdit, children }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <MessageRow
      $isuser={isUser}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ position: "relative" }}
    >
      {children}
      {isEditable && hovered && (
        <Tooltip title="Edit message">
          <IconButton
            size="small"
            onClick={() => onEdit(message)}
            sx={{
              position: "absolute",
              top: 0,
              left: isUser ? "auto" : -36,
              right: isUser ? -36 : "auto",
              bgcolor: "background.paper",
              boxShadow: 1,
              "&:hover": { bgcolor: "action.hover" },
              transition: "opacity 0.15s",
            }}
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </MessageRow>
  );
};

const MessageList = ({ messages = [], editableMessageId, onEditMessage }) => {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <MessageContainer>
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isStreaming = message.isStreaming;
        const isEditable = isUser && message.id === editableMessageId;

        const messageContent = (
          <React.Fragment key={message.id || index}>
            {!isUser && (
              <BotAvatar>
                <BotIcon sx={{ fontSize: 14 }} />
              </BotAvatar>
            )}
            {isUser ? (
              <UserBubble>
                {/* Show attachment thumbnails inside the bubble */}
                {message.attachments && message.attachments.length > 0 && (
                  <AttachmentPreviews attachments={message.attachments} />
                )}
                {message.content && (
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {message.content}
                  </Typography>
                )}
              </UserBubble>
            ) : (
              <AssistantBubble>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                {isStreaming && <StreamingIndicator />}
              </AssistantBubble>
            )}
            {isUser && (
              <UserAvatar>
                <PersonIcon sx={{ fontSize: 14 }} />
              </UserAvatar>
            )}
          </React.Fragment>
        );

        if (isEditable) {
          return (
            <EditableMessageRow
              key={message.id || index}
              message={message}
              isUser={isUser}
              isStreaming={isStreaming}
              isEditable={true}
              onEdit={onEditMessage}
            >
              {messageContent.props.children}
            </EditableMessageRow>
          );
        }

        return (
          <MessageRow key={message.id || index} $isuser={isUser}>
            {!isUser && (
              <BotAvatar>
                <BotIcon sx={{ fontSize: 14 }} />
              </BotAvatar>
            )}
            {isUser ? (
              <UserBubble>
                {message.attachments && message.attachments.length > 0 && (
                  <AttachmentPreviews attachments={message.attachments} />
                )}
                {message.content && (
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {message.content}
                  </Typography>
                )}
              </UserBubble>
            ) : (
              <AssistantBubble>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                {isStreaming && <StreamingIndicator />}
              </AssistantBubble>
            )}
            {isUser && (
              <UserAvatar>
                <PersonIcon sx={{ fontSize: 14 }} />
              </UserAvatar>
            )}
          </MessageRow>
        );
      })}
    </MessageContainer>
  );
};

// ── Attachment previews rendered inside a user message bubble ────────

const AttBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const ImgThumb = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: theme.spacing(1),
  overflow: "hidden",
  border: `1px solid ${theme.palette.div}`,
  "& img": { width: "100%", height: "100%", objectFit: "cover" },
}));

const FileChip = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(1),
  backgroundColor:
    theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[200],
  fontSize: "0.75rem",
}));

function AttachmentPreviews({ attachments }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <AttBox>
      {attachments.map((att) => {
        if (att.type === "image" && att.previewUrl) {
          return (
            <ImgThumb key={att.id}>
              <Box component="img" src={att.previewUrl} alt={att.name} />
            </ImgThumb>
          );
        }
        // Text / PDF chip
        const Icon = att.type === "pdf" ? PdfIcon : FileIcon;
        return (
          <FileChip key={att.id}>
            <Icon sx={{ fontSize: 14 }} />
            <span>{att.name}</span>
            <span style={{ opacity: 0.6 }}>{fileSizeLabel(att.size)}</span>
          </FileChip>
        );
      })}
    </AttBox>
  );
}

export default MessageList;
