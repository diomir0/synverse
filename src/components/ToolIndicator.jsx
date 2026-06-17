import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { Search as SearchIcon, Link as LinkIcon } from "@mui/icons-material";

const ICONS = {
  web_search: SearchIcon,
  web_fetch: LinkIcon,
};

const LABELS = {
  web_search: "Searching the web",
  web_fetch: "Fetching page",
};

/**
 * Shows a small inline indicator while the agent is executing a web tool.
 */
export default function ToolIndicator({ toolCalls = [] }) {
  if (!toolCalls || toolCalls.length === 0) return null;

  const call = toolCalls[0];
  const name = call.function?.name || "tool";
  const args =
    typeof call.function?.arguments === "string"
      ? JSON.parse(call.function.arguments || "{}")
      : call.function?.arguments || {};

  const Icon = ICONS[name] || SearchIcon;
  const label = LABELS[name] || `Running ${name}`;
  const detail = args.query || args.url || "";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1,
        borderRadius: 2,
        bgcolor: "rgba(20,184,166,0.08)",
        border: "1px solid rgba(20,184,166,0.2)",
        color: "#2dd4bf",
        width: "fit-content",
        mb: 1,
      }}
    >
      <CircularProgress size={16} sx={{ color: "#2dd4bf" }} />
      <Icon sx={{ fontSize: 18 }} />
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {label}
        {detail && (
          <span style={{ opacity: 0.8, marginLeft: 8 }}>
            {detail.length > 60 ? `${detail.slice(0, 60)}...` : detail}
          </span>
        )}
      </Typography>
    </Box>
  );
}
