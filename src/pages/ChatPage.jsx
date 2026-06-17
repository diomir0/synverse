import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOllama } from "../contexts/OllamaContext";
import { useConversation } from "../contexts/ConversationContext";
import { useSettings } from "../contexts/SettingsContext";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import ToolIndicator from "../components/ToolIndicator";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import {
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Refresh as RefreshIcon,
  SmartToy as BotIcon,
} from "@mui/icons-material";

/**
 * Generate a succinct auto-title from the first user message.
 * Takes the first line, picks up to 4 words, and title-cases the result.
 */
function generateAutoTitle(message) {
  if (!message || !message.trim()) return "New Conversation";
  const firstLine = message.split(/\n/)[0].trim();
  const words = firstLine.split(/\s+/).filter(Boolean).slice(0, 4);
  if (words.length === 0) return "New Conversation";
  const title = words.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
}

const ChatPage = ({ sidebarOpen, onToggleSidebar }) => {
  const {
    ollamaStatus,
    generateResponse,
    generateResponseWithTools,
    checkModelSupportsTools,
    stopGeneration,
    checkConnection,
    isCloudMode,
  } = useOllama();
  const { currentModel, globalSystemPrompt, webSearchEnabled, webSearchProvider, webSearchApiKey } =
    useSettings();
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
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [prefilledMessage, setPrefilledMessage] = useState("");
  const [showCloudBanner, setShowCloudBanner] = useState(true);
  const [activeToolCalls, setActiveToolCalls] = useState(null);
  const [modelSupportsTools, setModelSupportsTools] = useState(false);
  const messagesEndRef = useRef(null);
  const cloudBannerTimerRef = useRef(null);

  // Auto-dismiss the cloud banner after 3 seconds, re-trigger when reconnecting.
  useEffect(() => {
    if (isCloudMode && ollamaStatus === "connected" && showCloudBanner) {
      cloudBannerTimerRef.current = setTimeout(() => setShowCloudBanner(false), 3000);
      return () => clearTimeout(cloudBannerTimerRef.current);
    }
  }, [isCloudMode, ollamaStatus, showCloudBanner]);

  // Re-show the banner whenever connection is re-established in cloud mode.
  const prevStatusRef = useRef(ollamaStatus);
  useEffect(() => {
    if (prevStatusRef.current !== "connected" && ollamaStatus === "connected" && isCloudMode) {
      setShowCloudBanner(true);
    }
    prevStatusRef.current = ollamaStatus;
  }, [ollamaStatus, isCloudMode]);

  // On mount, activate the most recent conversation if none is active.
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect whether the currently selected model supports tool calling.
  useEffect(() => {
    let cancelled = false;
    if (currentModel) {
      checkModelSupportsTools(currentModel).then((supports) => {
        if (!cancelled) setModelSupportsTools(supports);
      });
    } else {
      setModelSupportsTools(false);
    }
    return () => {
      cancelled = true;
    };
  }, [currentModel, checkModelSupportsTools]);

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
      setActiveToolCalls(null);

      const toolConfig = { provider: webSearchProvider, apiKey: webSearchApiKey };
      const useTools = webSearchEnabled && modelSupportsTools;

      // Append tool guidance to the system prompt when web tools are active.
      const effectiveSystemPrompt = useTools
        ? `${globalSystemPrompt || ""}\n\nYou have access to web_search and web_fetch tools. Use them whenever the user asks about current events, recent data, prices, weather, or any facts that may have changed after your training cutoff. Always cite the source URL when you use fetched information, and prefer concise, factual answers.`.trim()
        : globalSystemPrompt;

      const responseHandler = (chunk, accumulated, meta) => {
        if (meta?.toolCalls) {
          setActiveToolCalls(meta.toolCalls);
        } else {
          setActiveToolCalls(null);
        }
        setStreamingContent(accumulated);
      };

      const fullResponse = useTools
        ? await generateResponseWithTools(
            updatedMessages,
            currentModel,
            effectiveSystemPrompt,
            responseHandler,
            { toolConfig, maxIterations: 3 },
          )
        : await generateResponse(
            updatedMessages,
            currentModel,
            effectiveSystemPrompt,
            responseHandler,
          );

      setActiveToolCalls(null);

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
            ? generateAutoTitle(message)
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

  // ── Edit last user message ────────────────────────────────────────
  const getEditableMessageId = useCallback(() => {
    if (!activeConversation?.messages?.length) return null;
    if (isLoading) return null;
    const msgs = activeConversation.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user") return msgs[i].id;
    }
    return null;
  }, [activeConversation, isLoading]);

  const handleEditMessage = useCallback(
    (message) => {
      if (!activeConversation) return;
      const msgIndex = activeConversation.messages.findIndex((m) => m.id === message.id);
      if (msgIndex === -1) return;
      const updatedMessages = activeConversation.messages.slice(0, msgIndex);
      const updatedConversation = {
        ...activeConversation,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      };
      setActiveConversation(updatedConversation);
      setPrefilledMessage(message.content || "");
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
          gap={3}
        >
          <CircularProgress size={48} thickness={3} />
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" sx={{ color: "#e2e8f0", mb: 0.5 }}>
              Connecting
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Establishing connection to {isCloudMode ? "Ollama Cloud" : "Ollama"}...
            </Typography>
          </Box>
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
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <CloudOffIcon sx={{ fontSize: 32, color: "#ef4444" }} />
          </Box>
          <Typography variant="h6" sx={{ color: "#e2e8f0", fontWeight: 600 }}>
            Cannot connect to {isCloudMode ? "Ollama Cloud" : "Ollama"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#64748b", textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}
          >
            {isCloudMode
              ? "Make sure you have a valid API key set in Settings. Go to Settings → Ollama Configuration to configure your cloud connection."
              : "Make sure Ollama is running on your machine. You can start it with `ollama serve` or download it from ollama.com."}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={checkConnection}
            sx={{
              mt: 1,
              borderColor: "rgba(20,184,166,0.4)",
              color: "#2dd4bf",
              "&:hover": {
                borderColor: "#14b8a6",
                bgcolor: "rgba(20,184,166,0.08)",
              },
            }}
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
        position: "relative",
        display: "flex",
        height: "100%",
        width: "100%",
        bgcolor: "#0b0d13",
        overflow: "hidden",
      }}
    >
      {/* Sidebar — overlays the chat content */}
      <Sidebar
        onNewConversation={handleNewConversation}
        open={sidebarOpen}
        onToggle={onToggleSidebar}
      />

      {/* Backdrop — closes sidebar on tap/click outside */}
      {sidebarOpen && (
        <Box
          onClick={onToggleSidebar}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0,0,0,0.4)",
            zIndex: 1199,
          }}
        />
      )}

      {/*
        Main chat area — always fills the full width.
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
            {isCloudMode && showCloudBanner && (
              <Box
                onClick={() => setShowCloudBanner(false)}
                sx={{
                  px: 2,
                  py: 0.5,
                  bgcolor: "rgba(20,184,166,0.08)",
                  borderBottom: "1px solid rgba(20,184,166,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  transition: "opacity 300ms ease",
                  "&:hover": {
                    bgcolor: "rgba(20,184,166,0.14)",
                  },
                }}
              >
                <CloudIcon sx={{ fontSize: 14, color: "#14b8a6" }} />
                <Typography variant="caption" sx={{ color: "#2dd4bf" }}>
                  Connected to Ollama Cloud
                </Typography>
              </Box>
            )}

            {error && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  sx={{
                    mt: 1.5,
                    px: 2,
                    py: 1,
                    maxWidth: 768,
                    bgcolor: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#fca5a5" }}>
                    {error}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setError(null)}
                    sx={{ color: "#fca5a5", minWidth: "auto", ml: 1 }}
                  >
                    ✕
                  </Button>
                </Box>
              </Box>
            )}

            {/* Scrollable message area */}
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
                      <>
                        <ToolIndicator toolCalls={activeToolCalls} />
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
                      </>
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
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "14px",
                          bgcolor: "rgba(20,184,166,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          mb: 2.5,
                        }}
                      >
                        <BotIcon sx={{ fontSize: 28, color: "#14b8a6" }} />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          color: "#e2e8f0",
                          fontWeight: 600,
                          mb: 1,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        Welcome to Synverse
                      </Typography>
                      <Typography variant="body1" sx={{ color: "#64748b", mb: 3, lineHeight: 1.6 }}>
                        {currentModel
                          ? `Start chatting with ${currentModel}`
                          : "Select a model and start chatting"}
                      </Typography>
                      {!currentModel && (
                        <Typography variant="body2" sx={{ color: "#475569" }}>
                          Choose a model from the dropdown in the header
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>
            </Box>

            {/* Stop button + Input */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 768, px: 3, pb: 3 }}>
                <MessageInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  disabled={!currentModel || ollamaStatus !== "connected"}
                  attachments={pendingAttachments}
                  onAttachmentsChange={setPendingAttachments}
                  prefilledMessage={prefilledMessage}
                  onPrefillConsumed={() => setPrefilledMessage("")}
                  onStopGeneration={handleStopGeneration}
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
