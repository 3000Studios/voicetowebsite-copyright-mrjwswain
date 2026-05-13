#!/usr/bin/env node
/**
 * MCP Server: UI Commands
 * Handles real-time UI/UX command routing for VoiceToWebsite.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

const apiBase =
  String(process.env.VTW_SITE_ORIGIN || "").trim() ||
  "https://voicetowebsite.com";

const server = new McpServer({
  name: "ui-commands",
  version: "1.1.0",
});

const uiState = {
  headline: "VoiceToWebsite",
  subhead: "",
  cta: "Start Now",
  price: "",
  theme: "ember",
  testimonialsVisible: true,
  modalsOpen: {},
  metric1: "",
  metric2: "",
  metric3: "",
};

const commandHistory = [];

function updateLocalState(command, args) {
  switch (command) {
    case "set-headline":
      uiState.headline = args.value || uiState.headline;
      break;
    case "set-subhead":
      uiState.subhead = args.value || uiState.subhead;
      break;
    case "set-cta":
      uiState.cta = args.value || uiState.cta;
      break;
    case "set-price":
      uiState.price = args.value || uiState.price;
      break;
    case "apply-theme":
      uiState.theme = args.theme || uiState.theme;
      break;
    case "toggle-testimonials":
      uiState.testimonialsVisible = !uiState.testimonialsVisible;
      break;
    case "show-modal":
      uiState.modalsOpen[args.modalName] = true;
      break;
    case "hide-modal":
      uiState.modalsOpen[args.modalName] = false;
      break;
    case "update-metric":
      if (args.metricNum === 1) uiState.metric1 = args.value;
      if (args.metricNum === 2) uiState.metric2 = args.value;
      if (args.metricNum === 3) uiState.metric3 = args.value;
      break;
  }
}

async function postUiAction(action, args = {}, source = "api") {
  const response = await fetch(`${apiBase}/api/ui-command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      args,
      source,
      timestamp: new Date().toISOString(),
    }),
  }).catch((error) => ({
    ok: false,
    status: 0,
    error: error.message || "API unreachable",
    json: async () => ({}),
  }));

  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok !== false, status: response.status || 200, payload };
}

async function readRemoteState(property) {
  const result = await postUiAction("get-state");
  const state =
    result.payload && typeof result.payload.state === "object"
      ? result.payload.state
      : null;
  if (!state) return null;
  return property ? state[property] : state;
}

server.registerTool(
  "execute-ui-command",
  {
    description: "Execute a UI command against the live UI command API.",
    inputSchema: z.object({
      command: z
        .string()
        .describe(
          "UI command like set-headline, set-cta, apply-theme, or show-modal."
        ),
      args: z.record(z.any()).optional().describe("Command arguments."),
      source: z
        .enum(["chat", "voice", "gpt", "api"])
        .optional()
        .describe("Command source."),
    }),
  },
  async ({ command, args = {}, source = "api" }) => {
    commandHistory.push({
      command,
      args,
      source,
      timestamp: new Date().toISOString(),
    });
    if (commandHistory.length > 50) commandHistory.shift();

    const result = await postUiAction(command, args, source);
    if (result.ok) updateLocalState(command, args);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: result.ok,
              status: result.status,
              command,
              args,
              remote: result.payload,
              state: uiState,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.registerTool(
  "get-ui-state",
  {
    description: "Get current UI state from the live API, with local fallback.",
    inputSchema: z.object({
      property: z
        .string()
        .optional()
        .describe("Optional property like headline, cta, or theme."),
    }),
  },
  async ({ property }) => {
    const remoteState = await readRemoteState(property);
    const state =
      remoteState !== null && remoteState !== undefined
        ? remoteState
        : property
          ? uiState[property]
          : uiState;

    return {
      content: [
        {
          type: "text",
          text: property
            ? `${property}: ${JSON.stringify(state)}`
            : `Current UI State:\n\n${JSON.stringify(state, null, 2)}`,
        },
      ],
    };
  }
);

server.registerTool(
  "list-ui-commands",
  {
    description: "List supported UI commands.",
    inputSchema: z.object({}),
  },
  async () => ({
    content: [
      {
        type: "text",
        text: [
          "TEXT CONTENT:",
          "  set-headline { value }",
          "  set-subhead { value }",
          "  set-cta { value }",
          "  set-price { value }",
          "  update-metric { metricNum, value }",
          "",
          "THEMES:",
          "  apply-theme { theme }",
          "",
          "VISIBILITY:",
          "  toggle-testimonials",
          "  show-modal { modalName }",
          "  hide-modal { modalName }",
        ].join("\n"),
      },
    ],
  })
);

server.registerTool(
  "get-command-history",
  {
    description: "Get recent UI command history from this MCP session.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Number of commands to return."),
    }),
  },
  async ({ limit = 10 }) => {
    const recent = commandHistory.slice(-Math.max(1, Math.min(limit, 25)));
    return {
      content: [{ type: "text", text: JSON.stringify(recent, null, 2) }],
    };
  }
);

server.registerTool(
  "ping-ui-api",
  {
    description: "Check whether the live UI command API is reachable.",
    inputSchema: z.object({}),
  },
  async () => {
    const remoteState = await readRemoteState();
    return {
      content: [
        {
          type: "text",
          text: remoteState
            ? `UI command API reachable at ${apiBase}.`
            : `UI command API did not return state from ${apiBase}.`,
        },
      ],
    };
  }
);

const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main().catch((error) => {
  console.error("ui-commands MCP server failed:", error);
  process.exit(1);
});
