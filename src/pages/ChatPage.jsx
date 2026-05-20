import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOllama } from "../contexts/OllamaContext";
import { useConversation } from "../contexts/ConversationContext";
import { useSettings } from "../contexts/SettingsContext";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import {
  Box,
  CircularProgress,
  Alert,
  Button,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Refresh as RefreshIcon,
  StopCircle as StopIcon,
} from "@mui/icons-material";

const ChatPage = () => {
  const { ollamaStatus, generateResponse, stopGeneration, checkConnection, isCloudMode } =
    useOllama();
  const { currentModel, globalSystemPrompt } = useSettings();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    createConversation,
    saveConversation,
  } = useConversation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState([]); // files staged in the input
  const [prefilledMessage, setPrefilledMessage] = useState(""); // used to push edited message text into the input
  const messagesEndRef = useRef(null);

  // On mount, activate the most recent conversation if none is active.
  // Do NOT auto-create empty conversations — that caused multiplication bugs.
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, streamingContent]);

  const handleSendMessage = async (message) => {
    if ((!message && pendingAttachments.length === 0) || isLoading) return;

    if (ollamaStatus === "disconnected") {
      setError("Cannot connect to Ollama. Please check your settings.");
      return;
    }

    if (!currentModel) {
      setError("Please select a model first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStreamingContent("");

    // Snapshot & clear attachments so they aren't sent twice
    const attachments = [...pendingAttachments];
    setPendingAttachments([]);

    try {
      let conversation = activeConversation;
      if (!conversation) {
        conversation = createConversation("New Conversation", currentModel);
      }

      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const updatedMessages = [...(conversation.messages || []), userMessage];

      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      };

      setActiveConversation(updatedConversation);

      const fullResponse = await generateResponse(
        updatedMessages,
        currentModel,
        globalSystemPrompt,
        (chunk, accumulated) => {
          setStreamingContent(accumulated);
        },
      );

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullResponse,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      const finalConversation = {
        ...updatedConversation,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
        title:
          conversation.title === "New Conversation" && updatedMessages.length === 1
            ? message.substring(0, 50) + (message.length > 50 ? "..." : "")
            : conversation.title,
      };

      setStreamingContent("");
      setActiveConversation(finalConversation);
      await saveConversation(finalConversation);
    } catch (err) {
      setError(err.message || "Failed to generate response");
      console.error("Error generating response:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Stop generation ───────────────────────────────────────────────
  const handleStopGeneration = useCallback(() => {
    stopGeneration();
  }, [stopGeneration]);

  // ── Edit last unanswered user message ─────────────────────────────
  // The last user message that hasn't received an assistant reply yet
  // is the last message in the array when it's a user message and
  // the assistant hasn't responded.
  const getEditableMessageId = useCallback(() => {
    if (!activeConversation?.messages?.length) return null;
    if (isLoading) return null; // don't allow edit while streaming
    const msgs = activeConversation.messages;
    const last = msgs[msgs.length - 1];
    if (last.role === "user") return last.id;
    return null;
  }, [activeConversation, isLoading]);

  const handleEditMessage = useCallback(
    (message) => {
      if (!activeConversation) return;
      // Remove the message from the conversation
      const updatedMessages = activeConversation.messages.filter((m) => m.id !== message.id);
      const updatedConversation = {
        ...activeConversation,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      };
      setActiveConversation(updatedConversation);

      // Push the message content into the input field
      setPrefilledMessage(message.content || "");

      // Restore attachments to the input staging area
      if (message.attachments && message.attachments.length > 0) {
        setPendingAttachments(message.attachments);
      }
    },
    [activeConversation, setActiveConversation],
  );

  const handleNewConversation = () => {
    createConversation("New Conversation", currentModel);
  };

  const renderConnectionStatus = () => {
    if (ollamaStatus === "connecting") {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Connecting to {isCloudMode ? "Ollama Cloud" : "Ollama"}...
          </Typography>
        </Box>
      );
    }

    if (ollamaStatus === "disconnected") {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
          flexDirection="column"
          gap={2}
          p={3}
        >
          <CloudOffIcon sx={{ fontSize: 60, color: "error.main" }} />
          <Typography variant="h6" color="error">
            Cannot connect to {isCloudMode ? "Ollama Cloud" : "Ollama"}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
            {isCloudMode
              ? "Make sure you have a valid API key set in Settings. Go to Settings → Ollama Configuration to configure your cloud connection."
              : "Make sure Ollama is running on your machine. You can start it with `ollama serve` or download it from ollama.com."}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={checkConnection}
            sx={{ mt: 2 }}
          >
            Retry Connection
          </Button>
        </Box>
      );
    }

    return null;
  };

  const displayMessages = activeConversation?.messages || [];
  const showStreaming = isLoading && streamingContent;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        width: "100%",
        bgcolor: "background.default",
      }}
    >
      {/* Sidebar */}
      <Sidebar onNewConversation={handleNewConversation} />

      {/*
        Main chat area — the outer box fills the remaining screen.
        Inside, content is centered horizontally like claude.ai:
        a wide but capped column floating in open space.
      */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minWidth: 0,
        }}
      >
        {/* Connection status overlay */}
        {(ollamaStatus === "connecting" || ollamaStatus === "disconnected") && (
          <Box sx={{ flex: 1 }}>{renderConnectionStatus()}</Box>
        )}

        {ollamaStatus === "connected" && (
          <>
            {isCloudMode && (
              <Box
                sx={{
                  px: 2,
                  py: 0.5,
                  bgcolor: "primary.dark",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CloudIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">Connected to Ollama Cloud</Typography>
              </Box>
            )}

            {error && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Alert
                  severity="error"
                  onClose={() => setError(null)}
                  sx={{ mt: 1, maxWidth: 768 }}
                >
                  {error}
                </Alert>
              </Box>
            )}

            {/* Scrollable message area — centers the conversation column */}
            <Box sx={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 768, px: 3, py: 3 }}>
                {displayMessages.length > 0 || showStreaming ? (
                  <>
                    <MessageList
                      messages={displayMessages}
                      editableMessageId={getEditableMessageId()}
                      onEditMessage={handleEditMessage}
                    />
                    {showStreaming && (
                      <MessageList
                        messages={[
                          {
                            id: "streaming",
                            role: "assistant",
                            content: streamingContent,
                            timestamp: new Date().toISOString(),
                            isStreaming: true,
                          },
                        ]}
                      />
                    )}
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "50vh",
                      textAlign: "center",
                    }}
                  >
                    <Box>
                      <CloudIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                      <Typography variant="h5" gutterBottom>
                        Welcome to Synverse
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {currentModel
                          ? `Start chatting with ${currentModel}`
                          : "Select a model and start chatting"}
                      </Typography>
                      {!currentModel && (
                        <Typography variant="body2" color="text.secondary">
                          Choose a model from the dropdown in the header
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>
            </Box>

            {/* Stop button + Input — same centered column as messages */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 768, px: 3, pb: 3 }}>
                {isLoading && (
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                    <Tooltip title="Stop generation">
                      <IconButton
                        onClick={handleStopGeneration}
                        size="small"
                        sx={{
                          borderRadius: "50%",
                          border: "2px solid",
                          borderColor: "text.secondary",
                          p: 0.5,
                          color: "text.secondary",
                          "&:hover": {
                            borderColor: "text.primary",
                            color: "text.primary",
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        <StopIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  disabled={!currentModel || ollamaStatus !== "connected"}
                  attachments={pendingAttachments}
                  onAttachmentsChange={setPendingAttachments}
                  prefilledMessage={prefilledMessage}
                  onPrefillConsumed={() => setPrefilledMessage("")}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ChatPage;
