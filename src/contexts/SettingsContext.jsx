import React, { createContext, useContext, useState, useEffect } from "react";
import { getItem, setItem } from "../utils/storageAdapter";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [globalSystemPrompt, setGlobalSystemPrompt] = useState(
    "You are a helpful AI assistant. Respond clearly and concisely.",
  );
  const [defaultModel, setDefaultModel] = useState("");
  const [autoSave, setAutoSave] = useState(true);
  const [currentModel, setCurrentModel] = useState("");

  // Loading flag — prevents writing defaults back to storage
  // before the real values have been read.
  const [loaded, setLoaded] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      const [storedPrompt, storedModel, storedAutoSave, storedCurrentModel] = await Promise.all([
        getItem("globalSystemPrompt"),
        getItem("defaultModel"),
        getItem("autoSave"),
        getItem("currentModel"),
      ]);

      if (storedPrompt !== null) setGlobalSystemPrompt(storedPrompt);
      if (storedModel !== null) setDefaultModel(storedModel);
      if (storedAutoSave !== null) setAutoSave(JSON.parse(storedAutoSave));
      if (storedCurrentModel !== null) setCurrentModel(storedCurrentModel);

      setLoaded(true);
    })();
  }, []);

  // Persist changes (skip until initial load is complete)
  useEffect(() => {
    if (!loaded) return;
    setItem("globalSystemPrompt", globalSystemPrompt);
  }, [globalSystemPrompt, loaded]);

  useEffect(() => {
    if (!loaded) return;
    setItem("defaultModel", defaultModel);
  }, [defaultModel, loaded]);

  useEffect(() => {
    if (!loaded) return;
    setItem("autoSave", JSON.stringify(autoSave));
  }, [autoSave, loaded]);

  useEffect(() => {
    if (!loaded) return;
    setItem("currentModel", currentModel);
  }, [currentModel, loaded]);

  const value = {
    globalSystemPrompt,
    setGlobalSystemPrompt,
    defaultModel,
    setDefaultModel,
    autoSave,
    setAutoSave,
    currentModel,
    setCurrentModel,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
