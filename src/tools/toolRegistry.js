/**
 * Tool registry for Ollama tool calling.
 *
 * Defines the JSON schema passed to Ollama's `/api/chat` `tools` parameter and
 * dispatches incoming `tool_calls` to the matching implementation.
 */

import { webSearch, webFetch } from "./webTools";

export const AVAILABLE_TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the internet for real-time information. Use for current events, recent data, " +
        "prices, weather, or facts that are not available in the conversation history.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "A concise web search query in the user's language.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_fetch",
      description:
        "Fetch the text content of a specific URL. Use when a search result needs to be read " +
        "in detail or when the user asks about a specific web page.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The full URL to fetch.",
          },
        },
        required: ["url"],
      },
    },
  },
];

/**
 * Execute a single tool call returned by the model.
 *
 * @param {object} toolCall - Ollama tool_call object:
 *   { function: { name: string, arguments: string|object } }
 * @param {object} config - Tool configuration (e.g. search provider + API key).
 * @returns {Promise<string>} Tool result as a string to send back to the model.
 */
export async function executeToolCall(toolCall, config) {
  const name = toolCall.function?.name;
  let args = {};
  try {
    args =
      typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments || {};
  } catch (e) {
    return `Invalid arguments for tool "${name}": ${e.message}`;
  }

  try {
    switch (name) {
      case "web_search": {
        const results = await webSearch(args.query, config);
        return JSON.stringify(results.slice(0, 5));
      }
      case "web_fetch": {
        const text = await webFetch(args.url, config);
        return text;
      }
      default:
        return `Unknown tool: ${name}. Available tools: web_search, web_fetch.`;
    }
  } catch (error) {
    return `Error executing tool "${name}": ${error.message}`;
  }
}

/**
 * Build an Ollama `tool` result message from an executed tool call.
 *
 * @param {object} toolCall
 * @param {string} content
 * @returns {object} Message to push into the conversation history.
 */
export function buildToolResultMessage(toolCall, content) {
  return {
    role: "tool",
    content,
    tool_name: toolCall.function?.name,
    tool_call_id: toolCall.id || toolCall.function?.name,
  };
}
