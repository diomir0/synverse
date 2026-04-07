import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { ConversationProvider } from "./contexts/ConversationContext";
import { OllamaProvider } from "./contexts/OllamaContext";
import { SettingsProvider } from "./contexts/SettingsContext";

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme
      ? JSON.parse(savedTheme)
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(darkMode));
  }, [darkMode]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#1976d2",
      },
      secondary: {
        main: "#dc004e",
      },
    },
    typography: {
      fontFamily: "Roboto, Arial, sans-serif",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OllamaProvider>
        <SettingsProvider>
          <ConversationProvider>
            <div className="app-container">
              <Header setDarkMode={setDarkMode} darkMode={darkMode} />
              <div className="main-content">
                <Sidebar />
                <Routes>
                  <Route path="/" element={<ChatPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
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
