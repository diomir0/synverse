import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.synverse.app",
  appName: "Synverse",

  // Vite build output — relative to this config file (project root)
  webDir: "dist",

  server: {
    // Serve from bundled assets in production (no local dev server needed).
    // For live-reload during development, use: npx cap run android --livereload --external
    // androidScheme: "https",
  },

  // Route non-streaming fetch() calls through the native HTTP client
  // on Android.  This bypasses WebView CORS restrictions.
  //
  // NOTE: fetch patching is DISABLED because it buffers the entire
  // response, which breaks streaming for the /api/chat endpoint.
  // Instead, the networkAdapter.js uses CapacitorHttp.request() directly
  // for non-streaming calls and for the chat endpoint.
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#121212",
      showSpinner: true,
      spinnerColor: "#1976d2",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#121212",
    },
  },
};

export default config;
