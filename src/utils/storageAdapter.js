/**
 * Storage adapter — transparent persistence for web and Android.
 *
 * On web:  uses localStorage (synchronous, fast).
 * On native (Android via Capacitor): uses @capacitor/preferences
 *           (async, persistent across app updates).
 *
 * All methods are async so calling code has a single, consistent API.
 * On web the async calls resolve immediately, so there is no perceptible
 * delay compared to raw localStorage.
 */

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const isNative = Capacitor.isNativePlatform();

/**
 * Retrieve a stored value by key.
 * Returns null if the key does not exist.
 */
export async function getItem(key) {
  if (isNative) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

/**
 * Store a value by key.
 */
export async function setItem(key, value) {
  if (isNative) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

/**
 * Remove a stored value by key.
 */
export async function removeItem(key) {
  if (isNative) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}
