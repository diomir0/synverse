import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Catch unhandled errors and promise rejections that escape React.
// These log to the console (visible via devtools in `tauri dev` or
// Ctrl+Shift+I) and help diagnose white-screen crashes.
window.addEventListener("error", (event) => {
  console.error("[SV] Unhandled error:", event.error || event.message, event);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("[SV] Unhandled promise rejection:", event.reason, event);
});

// Tauri serves files via a custom protocol (e.g. https://tauri.localhost/)
// with no server-side rewrite, so history-API routes like /settings would
// 404 on refresh.  Use HashRouter (/#/…) on Tauri so all routes resolve
// client-side.  On web and Capacitor, BrowserRouter works fine.
const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const Router = isTauri ? HashRouter : BrowserRouter;

console.log("[SV] Boot", {
  isTauri,
  router: isTauri ? "HashRouter" : "BrowserRouter",
  url: window.location?.href,
  userAgent: navigator?.userAgent,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>
  </React.StrictMode>,
);
