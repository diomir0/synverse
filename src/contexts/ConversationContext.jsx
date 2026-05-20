import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const ConversationContext = createContext();

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

  static async clearAll() {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error clearing conversations:", error);
      throw error;
    }
  }
}

export const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track whether we've already loaded from DB (prevents duplicate loads in StrictMode)
  const hasLoadedRef = useRef(false);

  // Load conversations from IndexedDB on mount.
  // Also purges empty conversations that were created by previous auto-creation bugs.
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loaded = await ConversationDB.getAll();
        const all = loaded || [];

        // Purge empty conversations (no messages) — they're noise from auto-creation
        const nonEmpty = all.filter((c) => c.messages && c.messages.length > 0);

        if (nonEmpty.length < all.length) {
          console.log(`Purging ${all.length - nonEmpty.length} empty conversation(s)`);
          // Rewrite the store with only the non-empty ones
          await ConversationDB.clearAll();
          for (const conv of nonEmpty) {
            await ConversationDB.save(conv);
          }
        }

        setConversations(nonEmpty);

        if (nonEmpty.length > 0) {
          const latest = nonEmpty.reduce((a, b) =>
            new Date(a.updatedAt || a.createdAt) > new Date(b.updatedAt || b.createdAt) ? a : b,
          );
          setActiveConversation(latest);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setError("Failed to load conversations: " + err.message);
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Save conversation to IndexedDB
  const saveConversation = useCallback(async (conversation) => {
    try {
      await ConversationDB.save(conversation);
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversation.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = conversation;
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
  }, []);

  // Create new conversation.
  // IMPORTANT: does NOT auto-save to IndexedDB — it's only persisted
  // once the user actually sends a message. This avoids empty stubs.
  const createConversation = useCallback((title = "New Conversation", model = "") => {
    const newConversation = {
      id: Date.now().toString(),
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      model,
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversation(newConversation);
    // Deliberately do NOT saveConversation here — wait for the first message
    return newConversation;
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (id) => {
    try {
      await ConversationDB.delete(id);
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        setActiveConversation((prevActive) => {
          if (prevActive?.id === id) {
            return remaining.length > 0
              ? remaining.reduce((a, b) =>
                  new Date(a.updatedAt || a.createdAt) > new Date(b.updatedAt || b.createdAt)
                    ? a
                    : b,
                )
              : null;
          }
          return prevActive;
        });
        return remaining;
      });
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      setError("Failed to delete conversation: " + err.message);
      throw err;
    }
  }, []);

  // Update conversation
  const updateConversation = useCallback(
    async (updatedConversation) => {
      const conversation = {
        ...updatedConversation,
        updatedAt: new Date().toISOString(),
      };
      try {
        await saveConversation(conversation);
        setActiveConversation(conversation);
        return conversation;
      } catch (err) {
        setError("Failed to update conversation: " + err.message);
        throw err;
      }
    },
    [saveConversation],
  );

  // Auto-save active conversation (only when it has messages)
  useEffect(() => {
    if (activeConversation && activeConversation.messages?.length > 0) {
      const timer = setTimeout(() => {
        saveConversation(activeConversation);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeConversation, saveConversation]);

  const value = {
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
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

export default ConversationContext;
