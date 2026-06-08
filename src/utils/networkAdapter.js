/**
 * Network adapter — transparent HTTP for web, Android, and Tauri desktop.
 *
 * On web:  uses the browser fetch API (with optional Vite proxy for CORS).
 * On native (Android via Capacitor): uses CapacitorHttp.request() to
 *          bypass WebView CORS restrictions entirely.
 * On Tauri desktop: uses @tauri-apps/plugin-http fetch which routes
 *          requests through reqwest (Rust), bypassing browser CORS.
 *
 * Streaming:
 * - Web / Tauri: live token streaming via fetch + ReadableStream.
 * - Native (Capacitor): full response via CapacitorHttp (stream:false).
 *           CapacitorHttp does not support streaming responses, so the
 *           complete reply arrives at once.  Cancellation is supported
 *           via a deferred-promise race.
 */

import { Capacitor, CapacitorHttp } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();
const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

console.log("[SV] NetworkAdapter init", { isNative, isTauri });

// Browser-like User-Agent injected into native HTTP requests.
// Ollama's server (ollama.com) employs bot-detection that rejects
// known non-browser User-Agents (e.g. Android Dalvik → 403 Forbidden).
// Spoofing a standard Chrome User-Agent circumvents the block without
// affecting the API contract.
const ANDROID_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36";

const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0.6422.113 Safari/537.36";

/**
 * Merge a browser-like User-Agent into the headers map for native / Tauri
 * requests.  CapacitorHttp on Android sends via java.net.HttpURLConnection
 * whose default User-Agent ("Dalvik/2.1.0 …") is rejected by ollama.com
 * with HTTP 403.  Tauri's reqwest sends "reqwest/X.Y.Z" which is currently
 * accepted but could be blocked by the same bot-detection at any time.
 */
function withBrowserUA(headers = {}) {
  const ua = isTauri ? DESKTOP_USER_AGENT : ANDROID_USER_AGENT;
  return { ...headers, "User-Agent": ua };
}

// Lazy-loaded Tauri HTTP fetch — imported on first use, not at module
// evaluation time.  The previous top-level await blocked the entire module
// graph during Tauri's production init, which caused a white screen when
// the dynamic import stalled or the IPC bridge wasn't ready yet.
let tauriFetch = null;
let tauriFetchPromise = null;

async function getTauriFetch() {
  if (tauriFetch) return tauriFetch;
  if (!tauriFetchPromise) {
    console.log("[SV] getTauriFetch: importing @tauri-apps/plugin-http");
    tauriFetchPromise = import("@tauri-apps/plugin-http")
      .then(({ fetch }) => {
        console.log("[SV] getTauriFetch: import resolved");
        tauriFetch = fetch;
        return fetch;
      })
      .catch((err) => {
        console.error("[SV] getTauriFetch: import failed", err);
        tauriFetchPromise = null; // allow retry
        throw err;
      });
  }
  return tauriFetchPromise;
}

// ── Non-streaming requests ────────────────────────────────────────

/**
 * Make a non-streaming HTTP request.
 * Returns a Response-like object with ok, status, json(), text().
 *
 * On web the signal option is respected (for AbortSignal.timeout etc.).
 * On native the signal is ignored; timeouts are handled by CapacitorHttp's
 * own connectTimeout / readTimeout.
 * On Tauri the Tauri fetch supports AbortSignal natively.
 */
export async function httpRequest(url, options = {}) {
  // Tauri: use plugin-http fetch (bypasses CORS, same API as browser fetch)
  // Inject a browser-like User-Agent so ollama.com's bot-detection accepts
  // the request (same fix as the Android Dalvik bypass).
  if (isTauri) {
    console.log("[SV] httpRequest: Tauri path", { url, method: options.method || "GET" });
    try {
      const fetchFn = await getTauriFetch();
      const tauriOptions = {
        ...options,
        headers: withBrowserUA(options.headers),
      };
      return fetchFn(url, tauriOptions);
    } catch (err) {
      console.error("[SV] httpRequest: Tauri fetch failed", err);
      throw err;
    }
  }

  if (!isNative) {
    return fetch(url, options);
  }

  const method = (options.method || "GET").toUpperCase();
  const headers = withBrowserUA(options.headers);
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
 * On web/Tauri, cancellation is handled by AbortController.
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
 * @param {AbortSignal} signal For cancellation (web and Tauri)
 * @returns {Promise<string>} Full response text
 */
export async function streamingChatRequest(url, headers, body, onChunk, signal) {
  // Tauri: use plugin-http fetch with streaming (same API as browser fetch)
  // Inject a browser-like User-Agent so ollama.com's bot-detection accepts
  // the request (same fix as the Android Dalvik bypass).
  if (isTauri) {
    console.log("[SV] streamingChatRequest: Tauri path", { url });
    try {
      const fetchFn = await getTauriFetch();
      return _streamingFetch(url, withBrowserUA(headers), body, onChunk, signal, fetchFn);
    } catch (err) {
      console.error("[SV] streamingChatRequest: Tauri fetch failed", err);
      throw err;
    }
  }

  if (!isNative) {
    return _streamingFetch(url, headers, body, onChunk, signal, fetch);
  }
  return _nativeChatRequest(url, headers, body, onChunk);
}

// ── Web / Tauri: live streaming via fetch ──────────────────────────

/**
 * Streaming fetch implementation.  Accepts a fetch function so it works
 * identically for browser fetch (web) and Tauri plugin-http fetch.
 */
async function _streamingFetch(url, headers, body, onChunk, signal, fetchFn = fetch) {
  const response = await fetchFn(url, {
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

// ── Native (Capacitor): full response via CapacitorHttp ────────────

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
        headers: withBrowserUA(headers),
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
