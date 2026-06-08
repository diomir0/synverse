/**
 * Platform detection utility for Capacitor and Tauri.
 *
 * Provides a safe way to check whether the app is running on a native
 * platform (Android/iOS via Capacitor), a desktop platform (Tauri),
 * or on the web.
 *
 * On web the app keeps using localStorage directly.  On Capacitor native
 * it should use the async storageAdapter instead.  On Tauri, localStorage
 * works natively in the WebView.
 */

import { Capacitor } from "@capacitor/core";

/**
 * Check if running inside a Tauri desktop window.
 */
export const isTauriPlatform = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * Check if running on any native platform (Capacitor or Tauri).
 */
export const isNativePlatform = () => Capacitor.isNativePlatform() || isTauriPlatform();

/**
 * Default Ollama URL differs by platform:
 * - Web / Tauri → localhost (same machine)
 * - Capacitor native → a placeholder LAN address the user will customise
 */
export const getDefaultOllamaUrl = () =>
  Capacitor.isNativePlatform() ? "http://192.168.1.1:11434" : "http://localhost:11434";

/**
 * On Capacitor native and Tauri, CORS is not a concern:
 * - Capacitor: CapacitorHttp bypasses WebView CORS
 * - Tauri: the HTTP plugin uses reqwest (server-side, no browser CORS)
 * So proxy mode is only needed on plain web.
 */
export const shouldUseProxyByDefault = () => !Capacitor.isNativePlatform() && !isTauriPlatform();

console.log("[SV] Platform", {
  isTauri: isTauriPlatform(),
  isNative: Capacitor.isNativePlatform(),
  defaultUrl: getDefaultOllamaUrl(),
  useProxyByDefault: shouldUseProxyByDefault(),
});
