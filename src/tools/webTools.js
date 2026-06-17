/**
 * Web tools for the Synverse agent.
 *
 * Exposes two operations that can be surfaced to an Ollama tool-calling model:
 *   - web_search: return a list of search results {title, link, snippet}
 *   - web_fetch:  return the readable text of a specific URL
 *
 * Search providers:
 *   - "duckduckgo" (default, no API key, HTML scraping — may fail CORS in pure web builds)
 *   - "serper"     (https://serper.dev)
 *   - "tavily"     (https://tavily.com)
 *   - "bing"       (Azure Bing Web Search)
 *
 * CORS note:
 *   - Android (CapacitorHttp) and Tauri can fetch arbitrary URLs directly.
 *   - Pure browser builds cannot scrape DuckDuckGo or arbitrary sites because of CORS.
 *     Options for web builds:
 *       1) Use an API-key provider whose endpoint supports CORS (Serper, Tavily, etc.)
 *       2) Extend the Vite dev proxy (dev only, not production)
 *       3) Ship a tiny backend proxy in production
 */

import { Capacitor } from "@capacitor/core";
import { httpRequest } from "../utils/networkAdapter";

const isNative = Capacitor.isNativePlatform();
const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const isBrowser = !isNative && !isTauri;

// In browser builds, arbitrary cross-origin fetches are blocked by CORS.
// Route them through the Vite dev proxy using a relative /web-proxy URL
// and an X-Target-URL header. Native (Capacitor) and Tauri bypass CORS.
function proxyAwareFetch(url) {
  if (isBrowser) {
    return httpRequest("/web-proxy", {
      method: "GET",
      headers: { "X-Target-URL": url },
    });
  }
  return httpRequest(url, { method: "GET" });
}

export const DEFAULT_SEARCH_PROVIDER = "duckduckgo";
export const SEARCH_PROVIDERS = [
  { value: "duckduckgo", label: "DuckDuckGo (no API key, may hit CORS in browser)" },
  { value: "serper", label: "Serper (serper.dev)" },
  { value: "tavily", label: "Tavily (tavily.com)" },
  { value: "bing", label: "Bing Web Search (Azure)" },
];

export function buildSearchConfig(settings) {
  return {
    provider: settings.webSearchProvider || DEFAULT_SEARCH_PROVIDER,
    apiKey: settings.webSearchApiKey || "",
  };
}

export async function webSearch(query, config = {}) {
  const { provider, apiKey } = config;
  switch (provider) {
    case "serper":
      return searchSerper(query, apiKey);
    case "tavily":
      return searchTavily(query, apiKey);
    case "bing":
      return searchBing(query, apiKey);
    case "duckduckgo":
    default:
      return searchDuckDuckGo(query);
  }
}

export async function webFetch(url, _config = {}) {
  // Native/Tauri bypass browser CORS; pure web builds use the dev proxy.
  const response = await proxyAwareFetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const html = await response.text();
  return extractReadableText(html, url);
}

// ── DuckDuckGo HTML scraping (no API key) ───────────────────────────

async function searchDuckDuckGo(query) {
  const searchURL = new URL("https://html.duckduckgo.com/html");
  searchURL.searchParams.append("q", query);

  const response = await proxyAwareFetch(searchURL.toString());
  if (!response.ok) throw new Error(`DuckDuckGo search failed: ${response.status}`);
  const html = await response.text();
  return parseDuckDuckGoResults(html);
}

function parseDuckDuckGoResults(html) {
  const results = [];
  const blocks = html.split('<div class="result results_links');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*>(.*?)<\/a>/);
    const hrefMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)">/);
    const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/);
    const title = titleMatch ? stripHtml(titleMatch[1]) : "";
    const link = hrefMatch ? extractDuckDuckGoUrl(hrefMatch[1]) : "";
    const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : "";
    if (title && link) results.push({ title, link, snippet });
  }
  return results.slice(0, 10);
}

function extractDuckDuckGoUrl(ddgLink) {
  if (!ddgLink) return ddgLink;
  try {
    const fullUrl = ddgLink.startsWith("//") ? `https:${ddgLink}` : ddgLink;
    const url = new URL(fullUrl);
    const actual = url.searchParams.get("uddg");
    return actual ? decodeURIComponent(actual) : ddgLink;
  } catch {
    return ddgLink;
  }
}

// ── API-key search providers ────────────────────────────────────────

async function searchSerper(query, apiKey) {
  if (!apiKey) throw new Error("Serper API key is not configured.");
  const response = await httpRequest("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query }),
  });
  if (!response.ok) throw new Error(`Serper error: ${response.status}`);
  const data = await response.json();
  return (data.organic || []).map((r) => ({ title: r.title, link: r.link, snippet: r.snippet }));
}

async function searchTavily(query, apiKey) {
  if (!apiKey) throw new Error("Tavily API key is not configured.");
  const response = await httpRequest("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query }),
  });
  if (!response.ok) throw new Error(`Tavily error: ${response.status}`);
  const data = await response.json();
  return (data.results || []).map((r) => ({ title: r.title, link: r.url, snippet: r.content }));
}

async function searchBing(query, apiKey) {
  if (!apiKey) throw new Error("Bing Search API key is not configured.");
  const url = new URL("https://api.bing.microsoft.com/v7.0/search");
  url.searchParams.append("q", query);
  const response = await httpRequest(url.toString(), {
    method: "GET",
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
  });
  if (!response.ok) throw new Error(`Bing error: ${response.status}`);
  const data = await response.json();
  return (data.webPages?.value || []).map((r) => ({
    title: r.name,
    link: r.url,
    snippet: r.snippet,
  }));
}

// ── HTML utilities ──────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractReadableText(html, _url) {
  // Naive but dependency-free extraction. For production, consider a readability
  // library or server-side extraction to handle modern SPAs and paywalls.
  let text = "";
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (articleMatch) text = articleMatch[1];
  else if (mainMatch) text = mainMatch[1];
  else if (bodyMatch) text = bodyMatch[1];
  else text = html;

  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ");

  text = stripHtml(text).replace(/\n+/g, "\n").trim();
  return text.slice(0, 8000);
}
