#!/usr/bin/env node
/**
 * MCP Server: UI Commands
 * Handles real-time UI/UX modifications for voicetowebsite.com
 * Entry points: Continue.dev chat, Custom GPT, Voice Commands
 */

import { StdIO } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";

class UICommandServer {
  constructor() {
    this.server = new StdIO({
      name: "ui-commands",
      version: "1.0.0",
    });

    this.setupHandlers();
    this.uiState = this.loadUIState();
    this.commandHistory = [];
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: [
        {
          name: "execute-ui-command",
          description: "Execute command to modify UI/UX in real-time",
          inputSchema: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description:
                  "UI command (set-headline, set-cta, apply-theme, show-modal, etc.)",
              },
              args: {
                type: "object",
                description: "Command arguments",
              },
              source: {
                type: "string",
                enum: ["chat", "voice", "gpt", "api"],
                description: "Command source",
              },
            },
            required: ["command"],
          },
        },
        {
          name: "get-ui-state",
          description: "Get current UI state",
          inputSchema: {
            type: "object",
            properties: {
              property: {
                type: "string",
                description: "Property to query (headline, cta, theme, etc.)",
              },
            },
          },
        },
        {
          name: "list-ui-commands",
          description: "List all available UI commands",
          inputSchema: { type: "object" },
        },
        {
          name: "get-command-history",
          description: "Get recent command history",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of commands to return",
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, (request) =>
      this.handleToolCall(request)
    );
  }

  loadUIState() {
    return {
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
  }

  async handleToolCall(request) {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "execute-ui-command":
          return await this.executeUICommand(args);
        case "get-ui-state":
          return await this.getUIState(args);
        case "list-ui-commands":
          return await this.listUICommands();
        case "get-command-history":
          return await this.getCommandHistory(args);
        default:
          throw new Error(`Unknown command: ${name}`);
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }

  async executeUICommand(args) {
    const { command, args: cmdArgs = {}, source = "api" } = args;

    // Log command
    this.commandHistory.push({
      command,
      args: cmdArgs,
      source,
      timestamp: new Date().toISOString(),
    });

    // Trim history to last 50
    if (this.commandHistory.length > 50) {
      this.commandHistory.shift();
    }

    // Execute command
    const result = await this.runCommand(command, cmdArgs, source);

    return {
      content: [
        {
          type: "text",
          text: `✓ UI Command executed: ${command}\n\n${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  async runCommand(command, args, source) {
    // Build fetch request to the website's command API
    const payload = {
      action: command,
      args,
      source,
      timestamp: new Date().toISOString(),
    };

    // Post to your API endpoint
    const apiUrl = "https://voicetowebsite.com/api/ui-command";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => ({ ok: false, error: "API unreachable" }));

    // Update local state optimistically
    this.updateLocalState(command, args);

    return {
      success: response.ok !== false,
      command,
      args,
      state: this.uiState,
    };
  }

  updateLocalState(command, args) {
    switch (command) {
      case "set-headline":
        this.uiState.headline = args.value || this.uiState.headline;
        break;
      case "set-subhead":
        this.uiState.subhead = args.value || this.uiState.subhead;
        break;
      case "set-cta":
        this.uiState.cta = args.value || this.uiState.cta;
        break;
      case "set-price":
        this.uiState.price = args.value || this.uiState.price;
        break;
      case "apply-theme":
        this.uiState.theme = args.theme || this.uiState.theme;
        break;
      case "toggle-testimonials":
        this.uiState.testimonialsVisible = !this.uiState.testimonialsVisible;
        break;
      case "show-modal":
        this.uiState.modalsOpen[args.modalName] = true;
        break;
      case "hide-modal":
        this.uiState.modalsOpen[args.modalName] = false;
        break;
      case "update-metric":
        if (args.metricNum === 1) this.uiState.metric1 = args.value;
        else if (args.metricNum === 2) this.uiState.metric2 = args.value;
        else if (args.metricNum === 3) this.uiState.metric3 = args.value;
        break;
    }
  }

  async getUIState(args) {
    const { property } = args;

    if (property) {
      const value = this.uiState[property];
      return {
        content: [
          {
            type: "text",
            text: `${property}: ${JSON.stringify(value)}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Current UI State:\n\n${JSON.stringify(this.uiState, null, 2)}`,
        },
      ],
    };
  }

  async listUICommands() {
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

  async getCommandHistory(args) {
    const { limit = 10 } = args;
    const recent = this.commandHistory.slice(-limit);

    return {
      content: [
        {
          type: "text",
          text: `Recent Commands (last ${Math.min(limit, this.commandHistory.length)}):\n\n${JSON.stringify(recent, null, 2)}`,
        },
      ],
    };
  }

  async run() {
    await this.server.connect(process.stdin, process.stdout);
  }
}

const server = new UICommandServer();
server.run().catch(console.error);
