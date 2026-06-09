import React, { useState } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  SmartToy as BotIcon,
  Person as PersonIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Check as CopiedIcon,
} from "@mui/icons-material";
import { fileSizeLabel } from "../utils/fileUtils";

const MessageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

const MessageRow = styled(Box)(({ theme, $isuser }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
  alignItems: "flex-start",
  flexDirection: $isuser ? "row-reverse" : "row",
}));

const UserBubble = styled(Box)(({ theme }) => ({
  maxWidth: "80%",
  backgroundColor: "#14b8a6",
  color: "#0b0d13",
  padding: theme.spacing(1, 2),
  borderRadius: "16px 16px 4px 16px",
  wordBreak: "break-word",
  boxShadow: "none",
  "& .MuiTypography-root": {
    fontWeight: 450,
  },
}));

const AssistantBubble = styled(Box)(({ theme }) => ({
  width: "100%",
  backgroundColor: "transparent",
  color: theme.palette.text.primary,
  padding: theme.spacing(0.5, 0),
  wordBreak: "break-word",
  lineHeight: 1.75,
  "& pre": {
    backgroundColor: "#0f1119",
    padding: theme.spacing(2),
    borderRadius: 10,
    overflow: "auto",
    fontSize: "0.85rem",
    border: "1px solid rgba(255,255,255,0.06)",
    margin: theme.spacing(1.5, 0),
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  },
  "& code": {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: theme.spacing(0.15, 0.6),
    borderRadius: 4,
    fontSize: "0.85rem",
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    color: "#2dd4bf",
  },
  "& pre code": {
    backgroundColor: "transparent",
    padding: 0,
    border: "none",
    color: "inherit",
    borderRadius: 0,
  },
  "& p": {
    margin: theme.spacing(0.5, 0),
    lineHeight: 1.75,
  },
  "& ul, & ol": {
    paddingLeft: theme.spacing(2.5),
    margin: theme.spacing(0.75, 0),
  },
  "& li": {
    margin: theme.spacing(0.3, 0),
    lineHeight: 1.65,
  },
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    margin: theme.spacing(1.5, 0, 0.5),
    color: "#e2e8f0",
    fontWeight: 600,
  },
  "& h1": { fontSize: "1.4rem" },
  "& h2": { fontSize: "1.2rem" },
  "& h3": { fontSize: "1.1rem" },
  "& blockquote": {
    borderLeft: "3px solid #14b8a6",
    margin: theme.spacing(1.25, 0),
    paddingLeft: theme.spacing(2),
    color: "#94a3b8",
    fontStyle: "italic",
  },
  "& table": {
    borderCollapse: "collapse",
    width: "100%",
    margin: theme.spacing(1.5, 0),
    fontSize: "0.875rem",
  },
  "& th, & td": {
    border: "1px solid rgba(255,255,255,0.08)",
    padding: theme.spacing(0.75, 1.25),
    textAlign: "left",
  },
  "& th": {
    backgroundColor: "#1a1f35",
    fontWeight: 600,
    color: "#e2e8f0",
  },
  "& td": {
    color: "#94a3b8",
  },
  "& a": {
    color: "#2dd4bf",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  "& hr": {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    margin: theme.spacing(2, 0),
  },
  // KaTeX math styling
  "& .katex-display": {
    margin: theme.spacing(1.5, 0),
    overflowX: "auto",
    overflowY: "hidden",
  },
  "& .katex": {
    fontSize: "1.1em",
  },
  // Strong/em emphasis colors
  "& strong": {
    color: "#e2e8f0",
    fontWeight: 600,
  },
  "& em": {
    color: "#94a3b8",
  },
}));

const StreamingIndicator = styled(Box)(({ theme }) => ({
  display: "inline-block",
  width: 6,
  height: 14,
  backgroundColor: "#14b8a6",
  borderRadius: 3,
  animation: "blink 1s infinite",
  marginLeft: 4,
  verticalAlign: "text-bottom",
  "@keyframes blink": {
    "0%, 50%": { opacity: 1 },
    "51%, 100%": { opacity: 0 },
  },
}));

const AvatarIcon = styled(Box)(({ theme }) => ({
  width: 28,
  height: 28,
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginTop: 2,
}));

const UserAvatar = styled(AvatarIcon)(({ theme }) => ({
  backgroundColor: "#14b8a6",
  color: "#0b0d13",
}));

const BotAvatar = styled(AvatarIcon)(({ theme }) => ({
  backgroundColor: "rgba(20,184,166,0.1)",
  color: "#14b8a6",
}));

// Wrapper for a single message that adds a hover-reveal edit button.
const EditableMessageRow = ({ message, isUser, isStreaming, isEditable, onEdit, children }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <MessageRow
      $isuser={isUser}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: "relative",
        ...(isUser ? { paddingRight: 2 } : { paddingLeft: 2 }),
      }}
    >
      {children}
      {isEditable && (
        <Tooltip title="Edit message">
          <IconButton
            size="small"
            onClick={() => onEdit(message)}
            sx={{
              position: "absolute",
              top: 0,
              left: isUser ? "auto" : 0,
              right: isUser ? 0 : "auto",
              bgcolor: "#1a1f35",
              color: "#64748b",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              "&:hover": { bgcolor: "#252b40", color: "#e2e8f0" },
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.15s ease",
            }}
          >
            <EditIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
    </MessageRow>
  );
};

// Wrapper for assistant messages that adds a hover/tap-reveal copy button.
const AssistantMessageRow = ({ message, children }) => {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tapped, setTapped] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      // Fallback for environments where Clipboard API is unavailable
      const ta = document.createElement("textarea");
      ta.value = message.content;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // On mobile (touch), tapping the message reveals the copy button.
  // On desktop (hover), hovering reveals it.
  const showCopy = hovered || tapped;

  return (
    <MessageRow
      $isuser={false}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setTapped(false);
      }}
      onTouchEnd={() => setTapped((prev) => !prev)}
      sx={{ position: "relative", paddingLeft: 2 }}
    >
      {children}
      <Tooltip title={copied ? "Copied!" : "Copy answer"}>
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            bgcolor: "#1a1f35",
            color: copied ? "#14b8a6" : "#64748b",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            "&:hover": { bgcolor: "#252b40", color: "#e2e8f0" },
            opacity: showCopy ? 1 : 0,
            transition: "opacity 0.15s ease",
            // Ensure tap target is large enough on mobile
            minWidth: 36,
            minHeight: 36,
          }}
        >
          {copied ? <CopiedIcon sx={{ fontSize: 14 }} /> : <CopyIcon sx={{ fontSize: 14 }} />}
        </IconButton>
      </Tooltip>
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {message.content}
                </ReactMarkdown>
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

        // User messages render with a simple MessageRow.
        // Assistant messages use AssistantMessageRow for the copy button.
        if (isUser) {
          return (
            <MessageRow key={message.id || index} $isuser={isUser}>
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
              <UserAvatar>
                <PersonIcon sx={{ fontSize: 14 }} />
              </UserAvatar>
            </MessageRow>
          );
        }

        return (
          <AssistantMessageRow key={message.id || index} message={message}>
            <BotAvatar>
              <BotIcon sx={{ fontSize: 14 }} />
            </BotAvatar>
            <AssistantBubble>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {message.content}
              </ReactMarkdown>
              {isStreaming && <StreamingIndicator />}
            </AssistantBubble>
          </AssistantMessageRow>
        );
      })}
    </MessageContainer>
  );
};

// ── Attachment previews rendered inside a user message bubble ────────

const AttBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(0.75),
  marginBottom: theme.spacing(0.75),
}));

const ImgThumb = styled(Box)(({ theme }) => ({
  width: 72,
  height: 72,
  borderRadius: 8,
  overflow: "hidden",
  border: "1px solid rgba(0,0,0,0.15)",
  "& img": { width: "100%", height: "100%", objectFit: "cover" },
}));

const FileChip = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.4, 0.8),
  borderRadius: 6,
  backgroundColor: "rgba(0,0,0,0.15)",
  fontSize: "0.72rem",
  color: "#0b0d13",
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
            <Icon sx={{ fontSize: 12 }} />
            <span>{att.name}</span>
            <span style={{ opacity: 0.7 }}>{fileSizeLabel(att.size)}</span>
          </FileChip>
        );
      })}
    </AttBox>
  );
}

export default MessageList;
