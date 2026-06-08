import React from "react";

/**
 * Catches rendering errors in child components and displays them instead of
 * crashing to a white screen.  In production Tauri builds, React errors that
 * escape a component tree silently unmount everything — this boundary turns
 * those invisible failures into actionable diagnostics on-screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[SV] Uncaught rendering error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const { error, errorInfo } = this.state;
      return (
        <div
          style={{
            padding: "32px",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            backgroundColor: "#0b0d13",
            color: "#ef4444",
            minHeight: "100vh",
            overflow: "auto",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#e2e8f0", fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ color: "#94a3b8", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {error?.toString?.() || String(error)}
          </p>
          {errorInfo?.componentStack && (
            <details style={{ marginTop: "16px" }}>
              <summary style={{ cursor: "pointer", color: "#64748b" }}>Component stack</summary>
              <pre
                style={{
                  color: "#475569",
                  whiteSpace: "pre-wrap",
                  fontSize: "12px",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
          {error?.stack && (
            <details style={{ marginTop: "8px" }}>
              <summary style={{ cursor: "pointer", color: "#64748b" }}>Error stack</summary>
              <pre
                style={{
                  color: "#475569",
                  whiteSpace: "pre-wrap",
                  fontSize: "12px",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReload}
            style={{
              marginTop: "20px",
              padding: "8px 20px",
              backgroundColor: "#14b8a6",
              color: "#0b0d13",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
