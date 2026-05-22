/**
 * Network adapter — transparent HTTP for web and Android.
 *
 * On web:  uses the browser fetch API (with optional Vite proxy for CORS).
 * On native (Android via Capacitor): uses CapacitorHttp.request() to
 *          bypass WebView CORS restrictions entirely.
 *
 * Streaming:
 * - Web:   live token streaming via fetch + ReadableStream.
 * - Native: full response via CapacitorHttp (stream:false).
 *           CapacitorHttp does not support streaming responses, so the
 *           complete reply arrives at once.  Cancellation is supported
 *           via a deferred-promise race.
 */

import { Capacitor, CapacitorHttp } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

// ── Non-streaming requests ────────────────────────────────────────

/**
 * Make a non-streaming HTTP request.
 * Returns a Response-like object with ok, status, json(), text().
 *
 * On web the signal option is respected (for AbortSignal.timeout etc.).
 * On native the signal is ignored; timeouts are handled by CapacitorHttp's
 * own connectTimeout / readTimeout.
 */
export async function httpRequest(url, options = {}) {
  if (!isNative) {
    return fetch(url, options);
  }

  const method = (options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };
  let data;
  if (options.body) {
    data = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
  }

  const response = await CapacitorHttp.request({
    url,
    method,
    headers,
    data,
    connectTimeout: 10000,
    readTimeout: 10000,
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: async () => response.data,
    text: async () =>
      typeof response.data === "string" ? response.data : JSON.stringify(response.data),
  };
}

// ── Streaming chat requests ───────────────────────────────────────

/** @type {{ reject: ((reason?: any) => void) | null }} */
const nativeCancelRef = { reject: null };

/**
 * Cancel an in-progress native streaming request.
 * On web, cancellation is handled by AbortController.
 */
export function cancelNativeRequest() {
  if (nativeCancelRef.reject) {
    nativeCancelRef.reject(new DOMException("The user aborted a request.", "AbortError"));
    nativeCancelRef.reject = null;
  }
}

/**
 * Make a streaming chat request to the Ollama /api/chat endpoint.
 *
 * @param {string}   url     Full API URL
 * @param {object}   headers Request headers
 * @param {object}   body    Request body (model, messages, etc.)
 * @param {function} onChunk Callback: (chunkText, accumulatedText)
 * @param {AbortSignal} signal For cancellation (web only)
 * @returns {Promise<string>} Full response text
 */
export async function streamingChatRequest(url, headers, body, onChunk, signal) {
  if (!isNative) {
    return _streamingFetch(url, headers, body, onChunk, signal);
  }
  return _nativeChatRequest(url, headers, body, onChunk);
}

// ── Web: live streaming via fetch ──────────────────────────────────

async function _streamingFetch(url, headers, body, onChunk, signal) {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${errorText || "Unknown error"}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const json = JSON.parse(trimmed);
        if (json.message?.content) {
          fullResponse += json.message.content;
          if (onChunk) onChunk(json.message.content, fullResponse);
        }
        if (json.done) return fullResponse;
      } catch (e) {
        console.warn("Failed to parse streaming chunk:", trimmed);
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    try {
      const json = JSON.parse(buffer.trim());
      if (json.message?.content) {
        fullResponse += json.message.content;
        if (onChunk) onChunk(json.message.content, fullResponse);
      }
    } catch (e) {
      // Ignore
    }
  }

  return fullResponse;
}

// ── Native: full response via CapacitorHttp ────────────────────────

async function _nativeChatRequest(url, headers, body, onChunk) {
  // Build a deferred promise so cancelNativeRequest() can reject the race
  let cancelReject;
  const cancelPromise = new Promise((_, reject) => {
    cancelReject = reject;
    nativeCancelRef.reject = reject;
  });

  try {
    const response = await Promise.race([
      CapacitorHttp.request({
        url,
        method: "POST",
        headers,
        data: { ...body, stream: false },
        connectTimeout: 10000,
        readTimeout: 300000, // 5 min for long LLM responses
      }),
      cancelPromise,
    ]);

    if (response.status >= 400) {
      throw new Error(
        `Ollama API error (${response.status}): ${
          typeof response.data === "string" ? response.data : JSON.stringify(response.data)
        }`,
      );
    }

    // Ollama /api/chat with stream:false returns:
    // { message: { role: "assistant", content: "..." }, done: true, ... }
    const content = response.data?.message?.content || "";
    if (onChunk) onChunk(content, content);
    return content;
  } catch (err) {
    if (err.name === "AbortError") {
      // User cancelled — return empty (matches web abort behaviour)
      return "";
    }
    throw err;
  } finally {
    nativeCancelRef.reject = null;
  }
}
