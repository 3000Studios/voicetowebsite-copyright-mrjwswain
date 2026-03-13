#!/usr/bin/env node
/**
 * MCP Server: Workspace Memory
 * Stores lightweight notes for Continue inside the workspace.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const memoryFile = path.join(projectRoot, ".continue", "memory.json");

const ensureStore = () => {
  fs.mkdirSync(path.dirname(memoryFile), { recursive: true });
  if (!fs.existsSync(memoryFile)) {
    fs.writeFileSync(memoryFile, JSON.stringify({ notes: [] }, null, 2));
  }
};

const loadStore = () => {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(memoryFile, "utf8"));
  } catch {
    return { notes: [] };
  }
};

const saveStore = (store) => {
  ensureStore();
  fs.writeFileSync(memoryFile, JSON.stringify(store, null, 2));
};

const server = new McpServer({
  name: "memory",
  version: "1.0.0",
});

server.registerTool(
  "remember-note",
  {
    description:
      "Persist a workspace note that should survive between Continue sessions.",
    inputSchema: z.object({
      note: z.string().min(1).describe("The note to store."),
      tags: z.array(z.string()).optional().describe("Optional tags."),
    }),
  },
  async ({ note, tags = [] }) => {
    const store = loadStore();
    const entry = {
      id: crypto.randomUUID(),
      note: String(note).trim(),
      tags: tags.map((tag) => String(tag).trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    store.notes.unshift(entry);
    store.notes = store.notes.slice(0, 100);
    saveStore(store);

    return {
      content: [
        {
          type: "text",
          text: `Saved note ${entry.id} with ${entry.tags.length} tag(s).`,
        },
      ],
    };
  }
);

server.registerTool(
  "list-notes",
  {
    description: "List recent workspace notes saved by Continue.",
    inputSchema: z.object({
      tag: z.string().optional().describe("Optional tag filter."),
      limit: z.number().optional().describe("Maximum notes to return."),
    }),
  },
  async ({ tag, limit = 10 }) => {
    const store = loadStore();
    const normalizedTag = String(tag || "")
      .trim()
      .toLowerCase();
    const notes = store.notes
      .filter((entry) =>
        normalizedTag
          ? entry.tags.some((item) => item.toLowerCase() === normalizedTag)
          : true
      )
      .slice(0, Math.max(1, Math.min(Number(limit) || 10, 25)));

    return {
      content: [
        {
          type: "text",
          text: notes.length
            ? JSON.stringify(notes, null, 2)
            : "No saved workspace notes found.",
        },
      ],
    };
  }
);

server.registerTool(
  "forget-note",
  {
    description: "Delete a saved workspace note by id.",
    inputSchema: z.object({
      id: z.string().describe("The note id to remove."),
    }),
  },
  async ({ id }) => {
    const store = loadStore();
    const before = store.notes.length;
    store.notes = store.notes.filter((entry) => entry.id !== id);
    saveStore(store);

    return {
      content: [
        {
          type: "text",
          text:
            before === store.notes.length
              ? `No note found for ${id}.`
              : `Deleted note ${id}.`,
        },
      ],
    };
  }
);

async function main() {
  ensureStore();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("memory MCP server failed:", error);
  process.exit(1);
});
