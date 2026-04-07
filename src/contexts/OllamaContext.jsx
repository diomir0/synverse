import React, { createContext, useContext, useState, useEffect } from "react";

const OllamaContext = createContext();

export const OllamaProvider = ({ children }) => {
  const [ollamaStatus, setOllamaStatus] = useState("unknown"); // 'unknown', 'connecting',
  ("connected", "disconnected");
  const [models, setModels] = useState([]);
  const [ollamaUrl, setOllamaUrl] = useState(() => {
    return localStorage.getItem("ollamaUrl") || "http://localhost:11434";
  });

  useEffect(() => {
    localStorage.setItem("ollamaUrl", ollamaUrl);
  }, [ollamaUrl]);

  useEffect(() => {
    const checkOllamaStatus = async () => {
      if (ollamaStatus === "connected") return;

      try {
        setOllamaStatus("connecting");
        const response = await fetch(`${ollamaUrl}/api/tags`);
        if (response.ok) {
          const data = await response.json();
          setModels(data.models || []);
          setOllamaStatus("connected");
        } else {
          setOllamaStatus("disconnected");
        }
      } catch (error) {
        console.error("Failed to connect to Ollama:", error);
        setOllamaStatus("disconnected");
      }
    };

    const interval = setInterval(checkOllamaStatus, 5000);
    checkOllamaStatus();

    return () => clearInterval(interval);
  }, [ollamaUrl]);

  const getOllamaModels = async () => {
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
        return data.models || [];
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
    return [];
  };

  const generateResponse = async (conversationId, prompt, model, onChunk) => {
    if (ollamaStatus !== "connected") {
      throw new Error("Ollama is not connected");
    }

    const stream = true;
    const data = {
      model: model,
      prompt: prompt,
      stream: stream,
    };

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const json = JSON.parse(line.slice(6));
                if (json.response) {
                  fullResponse += json.response;
                  if (onChunk) {
                    onChunk(json.response);
                  }
                }
                if (json.done) {
                  return fullResponse;
                }
              } catch (e) {
                // Handle JSON parsing errors
                console.error("JSON parsing error:", e);
              }
            }
          }
        }
      } else {
        const result = await response.json();
        return result.response;
      }
    } catch (error) {
      console.error("Failed to generate response:", error);
      throw error;
    }
  };

  const value = {
    ollamaStatus,
    models,
    ollamaUrl,
    setOllamaUrl,
    getOllamaModels,
    generateResponse,
  };

  return <OllamaContext.Provider value={value}>{children}</OllamaContext.Provider>;
};

export const useOllama = () => {
  const context = useContext(OllamaContext);
  if (!context) {
    throw new Error("useOllama must be used within an OllamaProvider");
  }
  return context;
};
