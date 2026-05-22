import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import Header from "./components/Header";
import { ConversationProvider } from "./contexts/ConversationContext";
import { OllamaProvider } from "./contexts/OllamaContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { getItem, setItem } from "./utils/storageAdapter";

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // Synchronous first paint — use localStorage so there's no flash.
    // The storage adapter is async; for theme we prefer instant feedback.
    const saved = localStorage.getItem("theme");
    return saved ? JSON.parse(saved) : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Persist theme changes (async — works on both web and native)
  useEffect(() => {
    setItem("theme", JSON.stringify(darkMode));
  }, [darkMode]);

  // On native platforms, overwrite with the value from persistent storage
  // (Capacitor Preferences).  On web this is a no-op since localStorage
  // and Preferences stay in sync via the adapter.
  useEffect(() => {
    (async () => {
      const stored = await getItem("theme");
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (parsed !== darkMode) setDarkMode(parsed);
      }
    })();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#1976d2",
      },
      secondary: {
        main: "#dc004e",
      },
      background: {
        default: darkMode ? "#121212" : "#f5f5f5",
        paper: darkMode ? "#1e1e1e" : "#ffffff",
      },
    },
    typography: {
      fontFamily: "Roboto, Arial, sans-serif",
    },
    shape: {
      borderRadius: 8,
    },
  });

  // ── Sidebar toggle state ──────────────────────────────────────
  // Auto-collapse on narrow screens (< 600 px, typical phone portrait).
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 600);

  // Collapse sidebar when the viewport shrinks below the breakpoint.
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 599px)");
    const handler = (e) => {
      if (e.matches) setSidebarOpen(false);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OllamaProvider>
        <SettingsProvider>
          <ConversationProvider>
            <div className="app-container">
              <Header
                setDarkMode={setDarkMode}
                darkMode={darkMode}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={toggleSidebar}
              />
              <div className="main-content">
                <Routes>
                  <Route
                    path="/"
                    element={<ChatPage sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />}
                  />
                  <Route
                    path="/settings"
                    element={
                      <SettingsPage sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
                    }
                  />
                </Routes>
              </div>
            </div>
          </ConversationProvider>
        </SettingsProvider>
      </OllamaProvider>
    </ThemeProvider>
  );
};

export default App;
