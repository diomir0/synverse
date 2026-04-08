import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [globalSystemPrompt, setGlobalSystemPrompt] = useState(() => {
    return (
      localStorage.getItem("globalSystemPrompt") ||
      "You are a helpful AI assistant. Respond clearly and concisely."
    );
  });
  const [defaultModel, setDefaultModel] = useState(() => {
    return localStorage.getItem("defaultModel") || "";
  });
  const [autoSave, setAutoSave] = useState(() => {
    return JSON.parse(localStorage.getItem("autoSave")) || true;
  });

  useEffect(() => {
    localStorage.setItem("globalSystemPrompt", globalSystemPrompt);
  }, [globalSystemPrompt]);

  useEffect(() => {
    localStorage.setItem("defaultModel", defaultModel);
  }, [defaultModel]);

  useEffect(() => {
    localStorage.setItem("autoSave", JSON.stringify(autoSave));
  }, [autoSave]);

  const value = {
    globalSystemPrompt,
    setGlobalSystemPrompt,
    defaultModel,
    setDefaultModel,
    autoSave,
    setAutoSave,
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
