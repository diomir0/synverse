import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { collectImages, formatTextAttachments } from "../utils/fileUtils";
import { getItem, setItem } from "../utils/storageAdapter";
import { getDefaultOllamaUrl, shouldUseProxyByDefault } from "../utils/platform";
import { httpRequest, streamingChatRequest, cancelNativeRequest } from "../utils/networkAdapter";
import {
  AVAILABLE_TOOLS,
  executeToolCall,
  buildToolResultMessage,
  buildSearchConfig,
} from "../tools";

const OllamaContext = createContext();

// Curated list of cloud models available on Ollama's cloud service
// Based on https://ollama.com/library models marked with "cloud" capability
const CLOUD_MODELS = [
  {
    name: "qwen3-coder:480b-cloud",
    description: "Alibaba's performant long context model for agentic and coding tasks (480B)",
    category: "coding",
  },
  {
    name: "gpt-oss:120b-cloud",
    description: "OpenAI's open-weight model for powerful reasoning and agentic tasks (120B)",
    category: "reasoning",
  },
  {
    name: "gpt-oss:20b-cloud",
    description: "OpenAI's open-weight model for versatile developer use cases (20B)",
    category: "reasoning",
  },
  {
    name: "deepseek-v3.1:671b-cloud",
    description: "Hybrid thinking/non-thinking mode model (671B MoE)",
    category: "reasoning",
  },
  {
    name: "deepseek-v3.2:cloud",
    description:
      "Harmonizes computational efficiency with superior reasoning and agent performance",
    category: "reasoning",
  },
  {
    name: "deepseek-v4-flash:cloud",
    description:
      "Efficient MoE reasoning across a 1M-token context window (284B total, 13B active)",
    category: "reasoning",
  },
  {
    name: "deepseek-v4-pro:cloud",
    description: "Frontier MoE model with 1M-token context and three reasoning modes",
    category: "reasoning",
  },
  {
    name: "gemma4:31b-cloud",
    description:
      "Google's frontier-level model for reasoning, agentic workflows, and multimodal understanding",
    category: "multimodal",
  },
  {
    name: "glm-5:cloud",
    description:
      "Strong reasoning and agentic model for complex systems engineering (744B total, 40B active)",
    category: "reasoning",
  },
  {
    name: "glm-5.1:cloud",
    description:
      "Next-gen flagship for agentic engineering with state-of-the-art coding (SWE-Bench Pro)",
    category: "coding",
  },
  {
    name: "minimax-m2:cloud",
    description: "High-efficiency model built for coding and agentic workflows",
    category: "coding",
  },
  {
    name: "minimax-m2.5:cloud",
    description: "State-of-the-art model for real-world productivity and coding tasks",
    category: "coding",
  },
  {
    name: "minimax-m2.7:cloud",
    description: "Coding, agentic workflows, and professional productivity",
    category: "coding",
  },
  {
    name: "kimi-k2:cloud",
    description: "State-of-the-art MoE language model for coding agent tasks",
    category: "reasoning",
  },
  {
    name: "kimi-k2.5:cloud",
    description: "Native multimodal agentic model with vision, language, and agentic capabilities",
    category: "multimodal",
  },
  {
    name: "kimi-k2.6:cloud",
    description: "Advanced long-horizon coding and proactive autonomous execution",
    category: "coding",
  },
  {
    name: "mistral-large-3:cloud",
    description: "General-purpose multimodal MoE model for production-grade tasks",
    category: "multimodal",
  },
  {
    name: "nemotron-3-super:120b-cloud",
    description: "NVIDIA MoE model for complex multi-agent applications (120B total, 12B active)",
    category: "reasoning",
  },
  {
    name: "nemotron-3-nano:4b-cloud",
    description: "NVIDIA efficient agentic model (4B parameters)",
    category: "reasoning",
  },
  {
    name: "qwen3-next:80b-cloud",
    description: "Strong parameter efficiency and inference speed (80B)",
    category: "reasoning",
  },
  {
    name: "qwen3.5:122b-cloud",
    description: "Exceptional utility and performance multimodal model (122B)",
    category: "multimodal",
  },
  {
    name: "devstral-small-2:24b-cloud",
    description: "Excels at using tools to explore codebases and edit multiple files (24B)",
    category: "coding",
  },
  {
    name: "devstral-2:123b-cloud",
    description: "Powerful software engineering agent with tool use (123B)",
    category: "coding",
  },
  {
    name: "cogito-2.1:671b-cloud",
    description: "Instruction tuned generative model under MIT license (671B)",
    category: "reasoning",
  },
  {
    name: "rnj-1:8b-cloud",
    description: "Optimized for code and STEM from Essential AI (8B)",
    category: "coding",
  },
  {
    name: "gemini-3-flash-preview:cloud",
    description: "Google's frontier intelligence built for speed at a fraction of the cost",
    category: "reasoning",
  },
  {
    name: "gemma3:27b-cloud",
    description: "Google's most capable single-GPU model with cloud acceleration (27B)",
    category: "general",
  },
  {
    name: "ministral-3:8b-cloud",
    description: "Mistral's edge deployment model with cloud acceleration (8B)",
    category: "general",
  },
];

export const OllamaProvider = ({ children }) => {
  const [ollamaStatus, setOllamaStatus] = useState("unknown");
  const [models, setModels] = useState([]);
  const [modelCapabilities, setModelCapabilities] = useState({}); // {modelName: string[]}

  // Default values — will be overwritten by persisted settings on mount
  const [ollamaUrl, setOllamaUrlState] = useState(getDefaultOllamaUrl());
  const [apiKey, setApiKeyState] = useState("");
  const [useProxy, setUseProxyState] = useState(shouldUseProxyByDefault());

  // Loading flag — prevents writing defaults back to storage
  // before persisted values have been read.
  const [loaded, setLoaded] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      console.log("[SV] OllamaProvider: loading persisted settings");
      try {
        const [storedUrl, storedKey, storedProxy] = await Promise.all([
          getItem("ollamaUrl"),
          getItem("ollamaApiKey"),
          getItem("ollamaUseProxy"),
        ]);

        if (storedUrl !== null) setOllamaUrlState(storedUrl);
        if (storedKey !== null) setApiKeyState(storedKey);
        if (storedProxy !== null) setUseProxyState(JSON.parse(storedProxy));

        console.log("[SV] OllamaProvider: settings loaded", {
          url: storedUrl ?? "(default)",
          hasKey: storedKey !== null,
          proxy: storedProxy ?? "(default)",
        });
        setLoaded(true);
      } catch (err) {
        console.error("[SV] OllamaProvider: failed to load settings", err);
        setLoaded(true);
      }
    })();
  }, []);

  // AbortController ref for cancelling in-progress generation requests
  const abortControllerRef = useRef(null);

  // Use refs to hold the latest values so callbacks always see current state
  // without causing callback references to change (which would trigger useEffect loops)
  const ollamaUrlRef = useRef(ollamaUrl);
  const apiKeyRef = useRef(apiKey);
  const useProxyRef = useRef(useProxy);

  // Keep refs in sync with state
  useEffect(() => {
    ollamaUrlRef.current = ollamaUrl;
  }, [ollamaUrl]);
  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);
  useEffect(() => {
    useProxyRef.current = useProxy;
  }, [useProxy]);

  // Monotonically increasing ID for connection attempts so stale responses are ignored
  const connectionAttemptId = useRef(0);

  // Determine if we're in cloud mode based on URL
  const isCloudMode = ollamaUrl.includes("ollama.com");

  // Save URL to storage
  const setOllamaUrl = useCallback((url) => {
    setItem("ollamaUrl", url);
    setOllamaUrlState(url);
  }, []);

  // Save API key to storage
  const setApiKey = useCallback((key) => {
    setItem("ollamaApiKey", key);
    setApiKeyState(key);
  }, []);

  // Save proxy setting
  const setUseProxy = useCallback((val) => {
    setItem("ollamaUseProxy", JSON.stringify(val));
    setUseProxyState(val);
  }, []);

  // Get the effective API base URL (reads from ref, safe to call from any callback)
  const getApiBaseUrl = useCallback(() => {
    if (useProxyRef.current) {
      return "/ollama-api";
    }
    return ollamaUrlRef.current;
  }, []); // stable — reads from refs

  // Build headers for API requests (reads from refs)
  // When using the proxy, auth & target are sent via custom headers
  // that the Vite middleware reads; Authorization is NOT sent directly
  // because the proxy adds it server-side (avoids browser CORS preflight).
  const buildHeaders = useCallback(() => {
    const headers = {
      "Content-Type": "application/json",
    };
    if (useProxyRef.current) {
      // Tell the proxy where to forward
      headers["X-Ollama-URL"] = ollamaUrlRef.current;
      if (apiKeyRef.current) {
        headers["X-Ollama-Key"] = apiKeyRef.current;
      }
    } else {
      // Direct request — add auth header normally
      if (apiKeyRef.current) {
        headers["Authorization"] = `Bearer ${apiKeyRef.current}`;
      }
    }
    return headers;
  }, []); // stable — reads from refs

  // Check Ollama connection status (stable callback, reads from refs)
  const checkConnection = useCallback(async () => {
    // Bump the attempt ID so any in-flight request from a previous attempt is discarded
    const attemptId = ++connectionAttemptId.current;

    try {
      setOllamaStatus("connecting");
      const baseUrl = getApiBaseUrl();
      console.log("[SV] checkConnection: attempting", {
        baseUrl,
        useProxy: useProxyRef.current,
        attemptId,
      });
      const response = await httpRequest(`${baseUrl}/api/tags`, {
        method: "GET",
        headers: buildHeaders(),
      });

      // If a newer attempt has started, discard this result
      if (attemptId !== connectionAttemptId.current) return;

      console.log("[SV] checkConnection: response", {
        ok: response.ok,
        status: response.status,
        attemptId,
      });

      if (response.ok) {
        const data = await response.json();
        // Double-check after async boundary
        if (attemptId !== connectionAttemptId.current) return;
        setModels(data.models || []);
        setOllamaStatus("connected");
        console.log("[SV] checkConnection: connected, models:", data.models?.length ?? 0);
        return true;
      } else {
        console.warn("[SV] checkConnection: non-ok response", response.status);
        setOllamaStatus("disconnected");
        return false;
      }
    } catch (error) {
      if (attemptId !== connectionAttemptId.current) return;
      console.error("[SV] checkConnection: failed", error);
      setOllamaStatus("disconnected");
      return false;
    }
  }, [getApiBaseUrl, buildHeaders]); // these are now stable

  // Debounced auto-connect: re-check when URL, API key, or proxy setting changes.
  // The debounce prevents rapid-fire reconnection while the user types in the URL field.
  // Skip until persisted settings have been loaded to avoid connecting with defaults.
  useEffect(() => {
    if (!loaded) return;
    console.log("[SV] OllamaProvider: auto-connect triggered", {
      ollamaUrl,
      useProxy,
      hasKey: !!apiKey,
    });
    const timer = setTimeout(() => {
      checkConnection();
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [ollamaUrl, apiKey, useProxy, loaded, checkConnection]); // checkConnection is stable

  // Fetch models from /api/tags
  const getOllamaModels = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await httpRequest(`${baseUrl}/api/tags`, {
        method: "GET",
        headers: buildHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedModels = data.models || [];
        setModels(fetchedModels);
        return fetchedModels;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch models:", error);
      return [];
    }
  }, [getApiBaseUrl, buildHeaders]); // stable

  // Query /api/show for a model's capabilities and cache the result.
  const checkModelSupportsTools = useCallback(
    async (modelName) => {
      if (!modelName) return false;
      if (modelCapabilities[modelName]?.includes("tools")) return true;

      try {
        const baseUrl = getApiBaseUrl();
        const response = await httpRequest(`${baseUrl}/api/show`, {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify({ model: modelName }),
        });

        if (!response.ok) return false;
        const data = await response.json();
        const capabilities = data.capabilities || [];
        setModelCapabilities((prev) => ({ ...prev, [modelName]: capabilities }));
        return capabilities.includes("tools");
      } catch (error) {
        console.error(`[SV] Failed to fetch capabilities for ${modelName}:`, error);
        return false;
      }
    },
    [getApiBaseUrl, buildHeaders, modelCapabilities],
  );

  // Convert internal message list to the Ollama /api/chat message format.
  // Used by both generateResponse and generateResponseWithTools.
  const buildOllamaMessages = useCallback(
    (messages, systemPrompt) => {
      const chatMessages = [];
      if (systemPrompt) {
        chatMessages.push({ role: "system", content: systemPrompt });
      }
      for (const msg of messages) {
        const chatMsg = { role: msg.role, content: msg.content };
        if (msg.role === "tool") {
          // Ollama uses tool_name on tool result messages.
          if (msg.tool_name) chatMsg.tool_name = msg.tool_name;
          // Preserve any tool_call_id if the backend expects it.
          if (msg.tool_call_id) chatMsg.tool_call_id = msg.tool_call_id;
        } else {
          const textPart = formatTextAttachments(msg.attachments);
          if (textPart) {
            chatMsg.content = textPart + "\n\n" + chatMsg.content;
          }
          const images = collectImages(msg.attachments);
          if (images.length > 0) {
            chatMsg.images = images;
          }
        }
        chatMessages.push(chatMsg);
      }
      return chatMessages;
    },
    [], // pure function of inputs
  );

  // Generate a response using the /api/chat endpoint.
  // On web: streams tokens live via fetch + ReadableStream.
  // On native: fetches the complete response via CapacitorHttp (stream:false).
  const generateResponse = useCallback(
    async (messages, model, systemPrompt, onChunk) => {
      abortControllerRef.current = new AbortController();
      const baseUrl = getApiBaseUrl();
      const chatMessages = buildOllamaMessages(messages, systemPrompt);

      try {
        const fullResponse = await streamingChatRequest(
          `${baseUrl}/api/chat`,
          buildHeaders(),
          {
            model: model,
            messages: chatMessages,
          },
          onChunk,
          abortControllerRef.current.signal,
        );

        return fullResponse;
      } catch (error) {
        if (error.name === "AbortError") {
          return "";
        }
        console.error("Failed to generate response:", error);
        throw error;
      }
    },
    [getApiBaseUrl, buildHeaders, buildOllamaMessages], // stable
  );

  // Generate a response with tool calling support.
  // Runs a request/execute loop until the model no longer emits tool_calls
  // or maxIterations is reached, then streams the final answer.
  const generateResponseWithTools = useCallback(
    async (messages, model, systemPrompt, onChunk, options = {}) => {
      const { toolConfig = {}, maxIterations = 3 } = options;
      abortControllerRef.current = new AbortController();
      const baseUrl = getApiBaseUrl();
      const headers = buildHeaders();
      let currentMessages = [...messages];

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Non-streaming request so we can cleanly capture tool_calls.
        const body = {
          model,
          messages: buildOllamaMessages(currentMessages, systemPrompt),
          tools: AVAILABLE_TOOLS,
          stream: false,
        };

        let response;
        try {
          response = await httpRequest(`${baseUrl}/api/chat`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: abortControllerRef.current.signal,
          });
        } catch (error) {
          if (error.name === "AbortError") return "";
          throw error;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama API error (${response.status}): ${errorText || "Unknown error"}`);
        }

        const data = await response.json();
        const assistantMessage = data.message || {};

        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          // No more tools needed. Stream the final answer without tools.
          return generateResponse(currentMessages, model, systemPrompt, onChunk);
        }

        // Notify the UI which tools are being invoked.
        if (onChunk) onChunk("", "", { toolCalls: assistantMessage.tool_calls });

        // Execute tools in parallel and append results to history.
        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (toolCall) => {
            const result = await executeToolCall(toolCall, toolConfig);
            return buildToolResultMessage(toolCall, result);
          }),
        );

        currentMessages.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: assistantMessage.tool_calls,
        });
        currentMessages.push(...toolResults);
      }

      // Max iterations reached: fall back to a normal generation without tools.
      return generateResponse(currentMessages, model, systemPrompt, onChunk);
    },
    [getApiBaseUrl, buildHeaders, buildOllamaMessages, generateResponse],
  );

  // Abort an in-progress generation request
  // On web: aborts the fetch via AbortController.
  // On native: rejects the deferred promise in networkAdapter so the
  //           pending CapacitorHttp request is cancelled from the UI side.
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancelNativeRequest();
  }, []);

  // Get all available models: local/pulled + cloud catalog
  const getAllAvailableModels = useCallback(() => {
    const localModels = models.map((m) => ({
      name: m.name,
      description: m.details?.parent_model || m.details?.format || "Local model",
      size: m.size,
      isCloud: m.name.includes("-cloud"),
      isLocal: true,
    }));

    if (isCloudMode) {
      const cloudModelNames = new Set(localModels.map((m) => m.name));
      const additionalCloudModels = CLOUD_MODELS.filter((m) => !cloudModelNames.has(m.name)).map(
        (m) => ({
          ...m,
          isCloud: true,
          isLocal: false,
        }),
      );

      return [...localModels, ...additionalCloudModels];
    }

    return localModels;
  }, [models, isCloudMode]);

  const value = {
    ollamaStatus,
    models,
    ollamaUrl,
    setOllamaUrl,
    apiKey,
    setApiKey,
    useProxy,
    setUseProxy,
    isCloudMode,
    checkConnection,
    getOllamaModels,
    checkModelSupportsTools,
    generateResponse,
    generateResponseWithTools,
    stopGeneration,
    getAllAvailableModels,
    cloudModels: CLOUD_MODELS,
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

export default OllamaContext;
