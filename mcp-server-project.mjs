#!/usr/bin/env node
/**
 * MCP Server: Project Context
 * Provides project-aware context to Continue.dev for better code suggestions.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

const projectRoot = process.cwd();
const IGNORED_SEGMENTS = new Set([
  ".git",
  "node_modules",
  "dist",
  ".wrangler",
  "coverage",
]);

const server = new McpServer({
  name: "project-context",
  version: "1.1.0",
});

const resolveWorkspacePath = (targetPath) => {
  const fullPath = path.resolve(projectRoot, String(targetPath || "."));
  const normalizedRoot = path.resolve(projectRoot);
  if (
    fullPath !== normalizedRoot &&
    !fullPath.startsWith(`${normalizedRoot}${path.sep}`)
  ) {
    throw new Error("Path must stay inside the workspace.");
  }
  return fullPath;
};

const tryListFilesWithRg = () => {
  try {
    const output = execFileSync("rg", ["--files"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
};

const walkFiles = (dirPath, prefix = "") => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (IGNORED_SEGMENTS.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, relativePath));
      continue;
    }
    results.push(relativePath.replaceAll("\\", "/"));
  }

  return results;
};

const listWorkspaceFiles = () => tryListFilesWithRg() || walkFiles(projectRoot);

const buildProjectSummary = () => {
  const packageJsonPath = path.join(projectRoot, "package.json");
  const packageJson = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
    : {};
  const scripts = Object.keys(packageJson.scripts || {});

  return [
    "VoiceToWebsite Project",
    `- Root: ${projectRoot}`,
    `- Package: ${packageJson.name || "unknown"}`,
    "- Stack: React + Vite + Cloudflare Workers",
    `- Scripts: ${scripts.slice(0, 12).join(", ") || "none"}`,
    "",
    "High-value files:",
    "- src/App.tsx",
    "- worker.js",
    "- package.json",
    "- wrangler.toml",
    "- public/config/*",
  ].join("\n");
};

server.registerTool(
  "get-project-summary",
  {
    description:
      "Get a summary of the workspace and the main repo entry points.",
    inputSchema: z.object({}),
  },
  async () => ({ content: [{ type: "text", text: buildProjectSummary() }] })
);

server.registerTool(
  "get-file-context",
  {
    description: "Get metadata and an excerpt for a workspace file.",
    inputSchema: z.object({
      filePath: z
        .string()
        .describe("Path to file relative to the workspace root."),
    }),
  },
  async ({ filePath }) => {
    const fullPath = resolveWorkspacePath(filePath);
    const stats = fs.statSync(fullPath);
    const content = fs.readFileSync(fullPath, "utf8");
    const lines = content.split(/\r?\n/).length;

    return {
      content: [
        {
          type: "text",
          text: `File: ${filePath}\nSize: ${stats.size} bytes\nLines: ${lines}\n\n${content.slice(0, 1200)}`,
        },
      ],
    };
  }
);

server.registerTool(
  "read-file-window",
  {
    description: "Read a selected line range from a workspace file.",
    inputSchema: z.object({
      filePath: z
        .string()
        .describe("Path to file relative to the workspace root."),
      startLine: z.number().optional().describe("1-based start line."),
      endLine: z.number().optional().describe("1-based end line."),
    }),
  },
  async ({ filePath, startLine = 1, endLine = 120 }) => {
    const fullPath = resolveWorkspacePath(filePath);
    const content = fs.readFileSync(fullPath, "utf8");
    const lines = content.split(/\r?\n/);
    const start = Math.max(1, Number(startLine) || 1);
    const end = Math.max(start, Number(endLine) || start);
    const excerpt = lines
      .slice(start - 1, end)
      .map((line, index) => `${start + index}: ${line}`)
      .join("\n");

    return {
      content: [{ type: "text", text: excerpt || "No lines found." }],
    };
  }
);

server.registerTool(
  "list-workspace-files",
  {
    description:
      "List workspace files using a safe substring filter instead of user-supplied globs.",
    inputSchema: z.object({
      contains: z
        .string()
        .optional()
        .describe("Optional case-insensitive path substring filter."),
      limit: z.number().optional().describe("Maximum files to return."),
    }),
  },
  async ({ contains = "", limit = 100 }) => {
    const needle = String(contains).trim().toLowerCase();
    const max = Math.max(1, Math.min(Number(limit) || 100, 500));
    const files = listWorkspaceFiles()
      .filter((entry) => (needle ? entry.toLowerCase().includes(needle) : true))
      .slice(0, max);

    return {
      content: [
        {
          type: "text",
          text: files.length ? files.join("\n") : "No matching files found.",
        },
      ],
    };
  }
);

server.registerTool(
  "search-text",
  {
    description: "Search the workspace for a literal text string.",
    inputSchema: z.object({
      query: z.string().min(1).describe("Literal text to search for."),
      filePathContains: z
        .string()
        .optional()
        .describe("Optional file path substring filter."),
      limit: z.number().optional().describe("Maximum matches to return."),
    }),
  },
  async ({ query, filePathContains = "", limit = 20 }) => {
    const max = Math.max(1, Math.min(Number(limit) || 20, 100));
    const filter = String(filePathContains).trim().toLowerCase();

    try {
      const output = execFileSync(
        "rg",
        ["-n", "-F", "--no-heading", "--color", "never", String(query), "."],
        {
          cwd: projectRoot,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      const matches = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => (filter ? line.toLowerCase().includes(filter) : true))
        .slice(0, max);

      return {
        content: [
          {
            type: "text",
            text: matches.length ? matches.join("\n") : "No matches found.",
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Search failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "get-package-scripts",
  {
    description: "Read the current npm script map from package.json.",
    inputSchema: z.object({}),
  },
  async () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(packageJson.scripts || {}, null, 2),
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
  console.error("project-context MCP server failed:", error);
  process.exit(1);
});
