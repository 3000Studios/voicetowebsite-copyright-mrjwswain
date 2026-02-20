#!/usr/bin/env node
/**
 * MCP Server: UI Commands
 * Handles real-time UI/UX modifications for voicetowebsite.com
 * Entry points: Continue.dev chat, Custom GPT, Voice Commands
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

const server = new McpServer({
  name: "ui-commands",
  version: "1.0.0",
});

const uiState = {
  headline: "Hi Tiger",
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
      else if (args.metricNum === 2) uiState.metric2 = args.value;
      else if (args.metricNum === 3) uiState.metric3 = args.value;
      break;
  }
}

async function runCommand(command, args, source) {
  const payload = {
    action: command,
    args,
    source,
    timestamp: new Date().toISOString(),
  };

  const apiUrl = "https://voicetowebsite.com/api/ui-command";
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => ({ ok: false, error: "API unreachable" }));

  updateLocalState(command, args);

  return {
    success: response.ok !== false,
    command,
    args,
    state: uiState,
  };
}

server.registerTool(
  "execute-ui-command",
  {
    description: "Execute command to modify UI/UX in real-time",
    inputSchema: z.object({
      command: z
        .string()
        .describe(
          "UI command (set-headline, set-cta, apply-theme, show-modal, etc.)"
        ),
      args: z.record(z.any()).optional().describe("Command arguments"),
      source: z
        .enum(["chat", "voice", "gpt", "api"])
        .optional()
        .describe("Command source"),
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

    const result = await runCommand(command, args, source);
    return {
      content: [
        {
          type: "text",
          text: `✓ UI Command executed: ${command}\n\n${JSON.stringify(
            result,
            null,
            2
          )}`,
        },
      ],
    };
  }
);

server.registerTool(
  "get-ui-state",
  {
    description: "Get current UI state",
    inputSchema: z.object({
      property: z
        .string()
        .optional()
        .describe("Property to query (headline, cta, theme, etc.)"),
    }),
  },
  async ({ property }) => {
    if (property) {
      const value = uiState[property];
      return {
        content: [
          { type: "text", text: `${property}: ${JSON.stringify(value)}` },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Current UI State:\n\n${JSON.stringify(uiState, null, 2)}`,
        },
      ],
    };
  }
);

server.registerTool(
  "list-ui-commands",
  {
    description: "List all available UI commands",
    inputSchema: z.object({}),
  },
  async () => {
    const commands = `
Available UI Commands:

TEXT CONTENT:
  set-headline {value}     - Update MainHeadline
  set-subhead {value}      - Update subheading
  set-cta {value}          - Update call-to-action button text
  set-price {value}        - Update price display
  update-metric {num} {val} - Update metric 1, 2, or 3

THEMES:
  apply-theme {name}       - Apply theme (ember, ocean, volt, midnight)

VISIBILITY:
  toggle-testimonials      - Show/hide testimonials
  show-modal {name}        - Open modal (e.g., 'contact-modal')
  hide-modal {name}        - Close modal
  toggle-section {name}    - Toggle section visibility

STYLING:
  apply-style {element} {style} {value} - Apply CSS styles

ACTIONS:
  play-audio {url}         - Play audio/video
  search {query}           - Perform search

EXAMPLES:
  set-headline "Welcome to AI"
  apply-theme ocean
  toggle-testimonials
  show-modal contact-modal
  update-metric 1 "99% Uptime"
    `;
    return { content: [{ type: "text", text: commands }] };
  }
);

server.registerTool(
  "get-command-history",
  {
    description: "Get recent command history",
    inputSchema: z.object({
      limit: z.number().optional().describe("Number of commands to return"),
    }),
  },
  async ({ limit = 10 }) => {
    const recent = commandHistory.slice(-limit);
    return {
      content: [
        {
          type: "text",
          text: `Recent Commands (last ${Math.min(
            limit,
            commandHistory.length
          )}):\n\n${JSON.stringify(recent, null, 2)}`,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ui-commands MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
