/**
 * Platform detection utility for Capacitor.
 *
 * Provides a safe way to check whether the app is running on a native
 * platform (Android/iOS) or on the web.
 *
 * On web the app keeps using localStorage directly.  On native it
 * should use the async storageAdapter instead.
 */

import { Capacitor } from "@capacitor/core";

export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Default Ollama URL differs by platform:
 * - Web → localhost (dev machine)
 * - Native → a placeholder LAN address the user will customise
 */
export const getDefaultOllamaUrl = () =>
  Capacitor.isNativePlatform() ? "http://192.168.1.1:11434" : "http://localhost:11434";

/**
 * On native platforms the Vite dev-server proxy does not exist,
 * so proxy mode must be disabled.
 */
export const shouldUseProxyByDefault = () => !Capacitor.isNativePlatform();
