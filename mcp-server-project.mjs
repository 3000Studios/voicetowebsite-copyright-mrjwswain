#!/usr/bin/env node
/**
 * MCP Server: Project Context
 * Provides project-aware context to Continue.dev for better code suggestions
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const server = new McpServer({
  name: "project-context",
  version: "1.0.0",
});

server.registerTool(
  "get-project-summary",
  {
    description: "Get summary of project structure and recent changes",
    inputSchema: z.object({}),
  },
  async () => {
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

    return { content: [{ type: "text", text: summary }] };
  }
);

server.registerTool(
  "get-file-context",
  {
    description: "Get context about a specific file",
    inputSchema: z.object({
      filePath: z.string().describe("Path to file (relative to project root)"),
    }),
  },
  async ({ filePath }) => {
    const fullPath = path.join(projectRoot, filePath);

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
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "search-references",
  {
    description: "Search for references to a symbol",
    inputSchema: z.object({
      symbol: z.string().describe("Symbol name to search"),
      limit: z.number().optional().describe("Max results"),
    }),
  },
  async ({ symbol }) => ({
    content: [
      {
        type: "text",
        text: `References to "${symbol}" (search not implemented in this stub - integrate with codebase indexer for full functionality)`,
      },
    ],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("project-context MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
