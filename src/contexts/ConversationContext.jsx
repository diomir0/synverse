import React, { createContext, useContext, useState, useEffect } from "react";
import { useOllama } from "./OllamaContext";

const ConversationContext = createContext();

// Database helper class
class ConversationDB {
  static dbName = "ChatConversations";
  static storeName = "conversations";
  static db = null;

  static async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error("IndexedDB error:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: "id" });
          objectStore.createIndex("createdAt", "createdAt", { unique: false });
          objectStore.createIndex("title", "title", { unique: false });
        }
      };
    });
  }

  static async getAll() {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error getting all conversations:", error);
      throw error;
    }
  }

  static async save(conversation) {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(conversation);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error saving conversation:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }
}

export const ConversationProvider = ({ children }) => {
  const { ollamaConnected } = useOllama();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load conversations from IndexedDB on mount
  useEffect(() => {
    const loadConversations = async () => {
      if (!ollamaConnected) return;

      try {
        setIsLoading(true);
        setError(null);
        const loadedConversations = await ConversationDB.getAll();
        setConversations(loadedConversations || []);

        // Set the most recent conversation as active if none is set
        if (loadedConversations && loadedConversations.length > 0 && !currentConversation) {
          const latest = loadedConversations.reduce((latest, conv) =>
            !latest || new Date(conv.createdAt) > new Date(latest.createdAt) ? conv : latest,
          );
          setCurrentConversation(latest);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setError("Failed to load conversations: " + err.message);
        // Initialize with empty array even if there's an error
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [ollamaConnected, currentConversation]);

  // Save conversation to IndexedDB
  const saveConversation = async (conversation) => {
    try {
      await ConversationDB.save(conversation);
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === conversation.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = conversation;
          return updated;
        }
        return [...prev, conversation];
      });
      return conversation;
    } catch (err) {
      console.error("Failed to save conversation:", err);
      setError("Failed to save conversation: " + err.message);
      throw err;
    }
  };

  // Create new conversation
  const createConversation = async (title = "New Conversation") => {
    const newConversation = {
      id: Date.now().toString(),
      title: title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      model: "llama3",
    };

    try {
      await saveConversation(newConversation);
      setCurrentConversation(newConversation);
      return newConversation;
    } catch (err) {
      setError("Failed to create conversation: " + err.message);
      throw err;
    }
  };

  // Delete conversation
  const deleteConversation = async (id) => {
    try {
      await ConversationDB.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (currentConversation?.id === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setCurrentConversation(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      setError("Failed to delete conversation: " + err.message);
      throw err;
    }
  };

  // Update conversation
  const updateConversation = async (updatedConversation) => {
    const conversation = {
      ...updatedConversation,
      updatedAt: new Date(),
    };

    try {
      await saveConversation(conversation);
      setCurrentConversation(conversation);
      return conversation;
    } catch (err) {
      setError("Failed to update conversation: " + err.message);
      throw err;
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (currentConversation && ollamaConnected) {
      const timer = setTimeout(() => {
        if (currentConversation.messages.length > 0) {
          saveConversation(currentConversation);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentConversation, ollamaConnected]);

  const value = {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    createConversation,
    deleteConversation,
    updateConversation,
    isLoading,
    error,
    saveConversation,
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
