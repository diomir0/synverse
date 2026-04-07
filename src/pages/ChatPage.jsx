import React, { useState, useEffect, useRef } from "react";
import { useOllama } from "../contexts/OllamaContext";
import { useConversation } from "../contexts/ConversationContext";
import { useSettings } from "../contexts/SettingsContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import { Box, Container, Grid, CircularProgress, Alert } from "@mui/material";

const ChatPage = () => {
  const { isConnected, isConnecting, currentModel, setCurrentModel, models, generateResponse } =
    useOllama();

  const {
    conversations,
    activeConversation,
    setActiveConversation,
    createNewConversation,
    saveConversation,
    deleteConversation,
  } = useConversation();

  const { systemPrompt } = useSettings();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim() || !isConnected || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add user message to conversation
      const userMessage = {
        id: Date.now(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      const updatedConversation = {
        ...activeConversation,
        messages: [...activeConversation.messages, userMessage],
      };

      setActiveConversation(updatedConversation);
      await saveConversation(updatedConversation);

      // Generate AI response
      const response = await generateResponse(
        updatedConversation.messages,
        currentModel,
        systemPrompt,
      );

      // Add AI response to conversation
      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
      };

      setActiveConversation(finalConversation);
      await saveConversation(finalConversation);
    } catch (err) {
      setError(err.message || "Failed to generate response");
      console.error("Error generating response:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const newConversation = createNewConversation();
    setActiveConversation(newConversation);
  };

  const handleDeleteConversation = (conversationId) => {
    deleteConversation(conversationId);
    if (activeConversation?.id === conversationId) {
      const remainingConversations = conversations.filter((c) => c.id !== conversationId);
      if (remainingConversations.length > 0) {
        setActiveConversation(remainingConversations[0]);
      } else {
        setActiveConversation(null);
      }
    }
  };

  if (isConnecting) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isConnected) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Alert severity="error">Cannot connect to Ollama. Please ensure Ollama is running.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        setActiveConversation={setActiveConversation}
        onCreateNew={handleNewConversation}
        onDelete={handleDeleteConversation}
      />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        <Header
          currentModel={currentModel}
          models={models}
          onModelChange={setCurrentModel}
          onNewConversation={handleNewConversation}
        />

        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {activeConversation ? (
            <MessageList messages={activeConversation.messages} />
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                textAlign: "center",
              }}
            >
              <Box>
                <h2>Welcome to Ollama Chat</h2>
                <p>Start a new conversation or select an existing one</p>
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!isConnected || isLoading}
        />
      </Box>
    </Box>
  );
};

export default ChatPage;
