import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import http from "node:http";
import https from "node:https";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Dynamic Ollama proxy — reads target URL from X-Ollama-URL header
    // so it works for any Ollama instance (local or cloud).
    // Strips the browser Origin header that causes 403 on newer Ollama.
    {
      name: "ollama-dynamic-proxy",
      configureServer(server) {
        server.middlewares.use("/ollama-api", (req, res, next) => {
          const targetUrl = req.headers["x-ollama-url"] || "http://localhost:11434";
          const apiKey = req.headers["x-ollama-key"] || "";

          let parsedTarget;
          try {
            parsedTarget = new URL(targetUrl);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid Ollama URL", url: targetUrl }));
            return;
          }

          // Build the full proxy URL
          const proxyUrl = new URL(req.url, targetUrl);

          // Copy headers but strip browser-specific ones that cause 403
          const proxyHeaders = {};
          for (const [key, value] of Object.entries(req.headers)) {
            const lower = key.toLowerCase();
            if (
              ["origin", "referer", "host", "connection", "x-ollama-url", "x-ollama-key"].includes(
                lower,
              )
            ) {
              continue;
            }
            proxyHeaders[key] = value;
          }

          // Add auth if key was provided
          if (apiKey) {
            proxyHeaders["authorization"] = `Bearer ${apiKey}`;
          }

          const isHttps = proxyUrl.protocol === "https:";
          const httpModule = isHttps ? https : http;

          const proxyReq = httpModule.request(
            proxyUrl,
            {
              method: req.method,
              headers: proxyHeaders,
            },
            (proxyRes) => {
              // Forward status and headers (strip hop-by-hop headers)
              const resHeaders = { ...proxyRes.headers };
              delete resHeaders["transfer-encoding"]; // let node handle chunked
              res.writeHead(proxyRes.statusCode, resHeaders);
              // Pipe the response — preserves streaming for NDJSON
              proxyRes.pipe(res);
            },
          );

          proxyReq.on("error", (err) => {
            console.error("Ollama proxy error:", err.message);
            if (!res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: "Proxy error",
                  message: err.message,
                  target: targetUrl,
                }),
              );
            }
          });

          // Pipe the incoming request body to the proxy request
          req.pipe(proxyReq);
        });
      },
    },
  ],
  server: {
    host: true,
    port: 3000,
  },
});
