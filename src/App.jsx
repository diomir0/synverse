import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import CircularProgress from "@mui/material/CircularProgress";
import Header from "./components/Header";
import { ConversationProvider } from "./contexts/ConversationContext";
import { OllamaProvider } from "./contexts/OllamaContext";
import { SettingsProvider } from "./contexts/SettingsContext";

const ChatPage = lazy(() => import("./pages/ChatPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// ── Dark theme inspired by AnythingLLM ──────────────────────────────
// Deep navy-charcoal backgrounds, teal accent, generous spacing,
// restrained visual elements. Dark-only — no light mode toggle.
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#14b8a6",
      light: "#2dd4bf",
      dark: "#0d9488",
      contrastText: "#0b0d13",
    },
    secondary: {
      main: "#818cf8",
      light: "#a5b4fc",
      dark: "#6366f1",
    },
    background: {
      default: "#0b0d13",
      paper: "#111827",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#64748b",
      disabled: "#475569",
    },
    divider: "rgba(255, 255, 255, 0.06)",
    error: {
      main: "#ef4444",
    },
    success: {
      main: "#22c55e",
    },
    warning: {
      main: "#f59e0b",
    },
    action: {
      hover: "rgba(255, 255, 255, 0.04)",
      selected: "rgba(20, 184, 166, 0.12)",
      focus: "rgba(20, 184, 166, 0.12)",
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    body1: {
      lineHeight: 1.7,
    },
    body2: {
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
    caption: {
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    "none",
    "0 1px 2px rgba(0,0,0,0.3)",
    "0 1px 3px rgba(0,0,0,0.3)",
    "0 2px 6px rgba(0,0,0,0.3)",
    "0 4px 12px rgba(0,0,0,0.4)",
    "0 6px 16px rgba(0,0,0,0.4)",
    "0 8px 24px rgba(0,0,0,0.5)",
    "0 12px 32px rgba(0,0,0,0.5)",
    "0 16px 48px rgba(0,0,0,0.6)",
    ...Array(16).fill("0 16px 48px rgba(0,0,0,0.6)"),
  ],
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#111827",
          backgroundImage: "none",
          boxShadow: "none",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 8,
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#0d9488",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#111827",
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          boxShadow: "none",
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: "16px 20px 8px",
        },
        title: {
          fontWeight: 600,
          fontSize: "1rem",
        },
        subheader: {
          color: "#64748b",
          fontSize: "0.8125rem",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "8px 20px 20px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1f35",
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "& fieldset": {
              borderColor: "rgba(255,255,255,0.08)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255,255,255,0.14)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#14b8a6",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#64748b",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#14b8a6",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: "2px 0",
          padding: "8px 12px",
          "&.Mui-selected": {
            backgroundColor: "rgba(20,184,166,0.12)",
            "&:hover": {
              backgroundColor: "rgba(20,184,166,0.18)",
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "#14b8a6",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "#14b8a6",
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          color: "#94a3b8",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255,255,255,0.06)",
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: "#14b8a6",
        },
      },
    },
  },
});

const App = () => {
  console.log("[SV] App: rendering");

  // ── Sidebar toggle state ──────────────────────────────────────
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
              <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
              <div className="main-content">
                <Suspense
                  fallback={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <CircularProgress />
                    </div>
                  }
                >
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ChatPage sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <SettingsPage sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
                      }
                    />
                  </Routes>
                </Suspense>
              </div>
            </div>
          </ConversationProvider>
        </SettingsProvider>
      </OllamaProvider>
    </ThemeProvider>
  );
};

export default App;
