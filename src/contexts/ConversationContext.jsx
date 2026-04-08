import React, { createContext, useContext, useState, useEffect } from "react";
import OllamaContext from "./OllamaContext";
import SettingsContext from "./SettingsContext";

const ConversationContext = createContext();

export const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { ollamaStatus, models } = useContext(OllamaContext);
  const { globalSystemPrompt } = useContext(SettingsContext);

  // Load conversations from IndexedDB on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const db = await openDB();
        const storedConversations = await db.getAll("conversations");
        setConversations(storedConversations);

        if (storedConversations.length > 0 && !activeConversationId) {
          setActiveConversationId(storedConversations[0].id);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };

    if (ollamaStatus === "connected") {
      loadConversations();
    }
  }, [ollamaStatus, activeConversationId]);

  // Auto-save conversations every 5 minutes
  useEffect(() => {
    if (ollamaStatus !== "connected") return;

    const interval = setInterval(async () => {
      if (conversations.length > 0) {
        try {
          const db = await openDB();
          for (const conv of conversations) {
            await db.put("conversations", conv);
          }
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [conversations, ollamaStatus]);

  // Save conversation before app exit
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (conversations.length > 0) {
        try {
          const db = await openDB();
          for (const conv of conversations) {
            await db.put("conversations", conv);
          }
        } catch (error) {
          console.error("Save before exit failed:", error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [conversations]);

  const openDB = async () => {
    if ("indexedDB" in window) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open("OllamaChatDB", 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("conversations")) {
            const store = db.createObjectStore("conversations", { keyPath: "id" });
            store.createIndex("createdAt", "createdAt", { unique: false });
            store.createIndex("title", "title", { unique: false });
          }
        };
      });
    } else {
      throw new Error("IndexedDB not supported");
    }
  };

  const createNewConversation = async (modelName) => {
    if (!modelName) return null;

    const newConversation = {
      id: Date.now().toString(),
      title: `New Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      model: modelName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };

    try {
      const db = await openDB();
      await db.add("conversations", newConversation);

      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);

      return newConversation;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return null;
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const db = await openDB();
      const conversation = await db.get("conversations", conversationId);

      if (conversation) {
        setActiveConversationId(conversationId);
        return conversation;
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
    return null;
  };

  const updateConversationTitle = async (conversationId, newTitle) => {
    try {
      const db = await openDB();
      const conversation = await db.get("conversations", conversationId);

      if (conversation) {
        conversation.title = newTitle;
        conversation.updatedAt = new Date().toISOString();

        await db.put("conversations", conversation);
        setConversations((prev) =>
          prev.map((conv) => (conv.id === conversationId ? conversation : conv)),
        );
      }
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
  };

  const addMessage = async (conversationId, message) => {
    try {
      const db = await openDB();
      const conversation = await db.get("conversations", conversationId);

      if (conversation) {
        conversation.messages.push(message);
        conversation.updatedAt = new Date().toISOString();

        await db.put("conversations", conversation);

        setConversations((prev) =>
          prev.map((conv) => (conv.id === conversationId ? conversation : conv)),
        );

        return conversation;
      }
    } catch (error) {
      console.error("Failed to add message:", error);
    }
    return null;
  };

  const deleteConversation = async (conversationId) => {
    try {
      const db = await openDB();
      await db.delete("conversations", conversationId);

      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));

      if (activeConversationId === conversationId) {
        const remainingConversations = conversations.filter((conv) => conv.id !== conversationId);
        if (remainingConversations.length > 0) {
          setActiveConversationId(remainingConversations[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const getActiveConversation = () => {
    return conversations.find((conv) => conv.id === activeConversationId) || null;
  };

  const getConversationById = (id) => {
    return conversations.find((conv) => conv.id === id) || null;
  };

  const exportConversation = (conversationId) => {
    const conversation = getConversationById(conversationId);
    if (!conversation) return null;

    const exportData = {
      ...conversation,
      exportDate: new Date().toISOString(),
      exportFormat: "ollama-chat-export",
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `conversation-${conversationId}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importConversation = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const conversation = JSON.parse(event.target.result);

        // Validate imported conversation
        if (!conversation.id || !conversation.messages) {
          throw new Error("Invalid conversation format");
        }

        const db = await openDB();
        await db.add("conversations", conversation);

        setConversations((prev) => [conversation, ...prev]);

        if (!activeConversationId) {
          setActiveConversationId(conversation.id);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Failed to import conversation:", error);
      throw error;
    }
  };

  const value = {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    loadConversation,
    updateConversationTitle,
    addMessage,
    deleteConversation,
    getActiveConversation,
    getConversationById,
    exportConversation,
    importConversation,
    isSaving,
    setIsSaving,
  };

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
};
