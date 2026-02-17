#!/usr/bin/env node
/**
 * MCP Server: Project Context
 * Provides project-aware context to Continue.dev for better code suggestions
 */

import { StdIO } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";

class ProjectContextServer {
  constructor() {
    this.server = new StdIO({
      name: "project-context",
      version: "1.0.0",
    });

    this.setupHandlers();
    this.projectRoot = process.cwd();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: [
        {
          name: "get-project-summary",
          description: "Get summary of project structure and recent changes",
          inputSchema: { type: "object" },
        },
        {
          name: "get-file-context",
          description: "Get context about a specific file",
          inputSchema: {
            type: "object",
            properties: {
              filePath: {
                type: "string",
                description: "Path to file (relative to project root)",
              },
            },
          },
        },
        {
          name: "search-references",
          description: "Search for references to a symbol",
          inputSchema: {
            type: "object",
            properties: {
              symbol: { type: "string", description: "Symbol name to search" },
              limit: { type: "number", description: "Max results" },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, (request) =>
      this.handleToolCall(request)
    );
  }

  async handleToolCall(request) {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "get-project-summary":
          return await this.getProjectSummary();
        case "get-file-context":
          return await this.getFileContext(args);
        case "search-references":
          return await this.searchReferences(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }

  async getProjectSummary() {
    const summary = `
VoiceToWebsite Project:
- Type: Vite + React + Cloudflare Workers
- Main Tech: TypeScript, JSX, NPM
- Deploy: Wrangler to Cloudflare

Key Files:
- src/App.tsx - Main React app
- nav.js - Navigation component
- app.js - Legacy UI controller (with unified command handler)
- worker.js - Cloudflare Worker entry point
- wrangler.toml - Cloudflare config
- package.json - Dependencies and scripts

Scripts:
- npm run dev - Local development
- npm run verify - Run verification suite
- npm run deploy - Deploy to production
- npm run build - Build for production

Status: All systems operational, unified command center integrated
    `;

    return {
      content: [{ type: "text", text: summary }],
    };
  }

  async getFileContext(args) {
    const { filePath } = args;
    const fullPath = path.join(this.projectRoot, filePath);

    try {
      const stats = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n").length;

      return {
        content: [
          {
            type: "text",
            text: `File: ${filePath}\nSize: ${stats.size} bytes\nLines: ${lines}\nFirst 500 chars:\n\n${content.substring(0, 500)}...`,
          },
        ],
      };
    } catch (err) {
      throw new Error(`Could not read file: ${err.message}`);
    }
  }

  async searchReferences(args) {
    const { symbol, limit = 10 } = args;
    // Simplified: just return a placeholder
    return {
      content: [
        {
          type: "text",
          text: `References to "${symbol}" (search not implemented in this stub - integrate with codebase indexer for full functionality)`,
        },
      ],
    };
  }

  async run() {
    await this.server.connect(process.stdin, process.stdout);
  }
}

const server = new ProjectContextServer();
server.run().catch(console.error);
