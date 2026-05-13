/**
 * Unified UI Command API
 * Handles commands from: Continue.dev chat, Custom GPT, Voice commands, and API calls
 * This function runs in src/functions/uiCommand.js
 */

import { z } from "zod";

// Input validation schemas
const commandSchema = z.object({
  action: z.string().min(1).max(50),
  args: z.record(z.any()).optional().default({}),
  source: z.string().min(1).max(20).optional().default("api"),
});

const stateActionSchema = z.object({
  value: z.string().max(500),
});

const themeActionSchema = z.object({
  theme: z.enum(["ember", "ocean", "volt", "midnight"]),
});

const metricActionSchema = z.object({
  metricNum: z.number().int().min(1).max(3),
  value: z.string().max(200),
});

const modalActionSchema = z.object({
  modalName: z.string().min(1).max(50).optional().default("default"),
});

export async function handleUICommand(request, env, _context) {
  const { method } = request;

  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await request.json();

    // Validate input
    const validationResult = commandSchema.safeParse(payload);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { action, args = {}, source = "api" } = validationResult.data;

    // Execute action
    const result = await executeUIAction(action, args, source, env);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("UI Command Error:", err);
    return new Response(
      JSON.stringify({ error: err.message, source: "server" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function executeUIAction(action, args, source, env) {
  // Actions that modify UI state
  const stateActions = {
    "set-headline": { key: "headline", schema: stateActionSchema },
    "set-subhead": { key: "subhead", schema: stateActionSchema },
    "set-cta": { key: "cta", schema: stateActionSchema },
    "set-price": { key: "price", schema: stateActionSchema },
    "apply-theme": { key: "theme", schema: themeActionSchema },
    "update-metric": { key: "metric", schema: metricActionSchema },
  };

  if (stateActions[action]) {
    const { key, schema } = stateActions[action];

    // Validate args based on action type
    let validatedArgs;
    if (action === "update-metric") {
      const result = schema.safeParse(args);
      if (!result.success) {
        return {
          success: false,
          error: `Invalid args for ${action}`,
          details: result.error.errors,
        };
      }
      validatedArgs = result.data;
    } else if (action === "apply-theme") {
      const result = schema.safeParse(args);
      if (!result.success) {
        return {
          success: false,
          error: `Invalid args for ${action}`,
          details: result.error.errors,
        };
      }
      validatedArgs = result.data;
    } else {
      const result = schema.safeParse(args);
      if (!result.success) {
        return {
          success: false,
          error: `Invalid args for ${action}`,
          details: result.error.errors,
        };
      }
      validatedArgs = result.data;
    }

    const finalKey =
      action === "update-metric" ? `metric${validatedArgs.metricNum}` : key;
    const finalValue =
      action === "update-metric" ? validatedArgs.value : validatedArgs.value;

    // Store in KV cache for quick retrieval
    await env.VTW_CACHE.put(
      `ui:${finalKey}`,
      JSON.stringify({ value: finalValue, timestamp: Date.now(), source })
    );

    return {
      success: true,
      action,
      key: finalKey,
      value: finalValue,
      source,
      timestamp: new Date().toISOString(),
      message: `UI updated: ${action}`,
    };
  }

  // Toggle actions
  if (action === "toggle-testimonials") {
    const current = await env.VTW_CACHE.get("ui:testimonialsVisible");
    const newValue = current === "true" ? false : true;
    await env.VTW_CACHE.put("ui:testimonialsVisible", JSON.stringify(newValue));
    return {
      success: true,
      action,
      testimonialsVisible: newValue,
      source,
      timestamp: new Date().toISOString(),
    };
  }

  // Modal actions
  if (action === "show-modal" || action === "hide-modal") {
    const isShow = action === "show-modal";
    const modalName = args.modalName || "default";
    await env.VTW_CACHE.put(
      `ui:modal:${modalName}`,
      JSON.stringify({ visible: isShow, timestamp: Date.now() })
    );
    return {
      success: true,
      action,
      modal: modalName,
      visible: isShow,
      source,
      timestamp: new Date().toISOString(),
    };
  }

  // List available commands
  if (action === "list-commands") {
    return {
      success: true,
      commands: [
        "set-headline",
        "set-subhead",
        "set-cta",
        "set-price",
        "apply-theme",
        "update-metric",
        "toggle-testimonials",
        "show-modal",
        "hide-modal",
        "get-state",
      ],
      source,
    };
  }

  // Get current state
  if (action === "get-state") {
    const state = {};
    const keys = [
      "headline",
      "subhead",
      "cta",
      "price",
      "theme",
      "metric1",
      "metric2",
      "metric3",
      "testimonialsVisible",
    ];

    for (const key of keys) {
      const data = await env.VTW_CACHE.get(`ui:${key}`);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          state[key] = parsed.value !== undefined ? parsed.value : parsed;
        } catch (parseError) {
          console.warn(
            `Failed to parse cached data for key ${key}:`,
            parseError
          );
          state[key] = null;
        }
      } else {
        state[key] = null;
      }
    }

    return {
      success: true,
      state,
      source,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false,
    error: `Unknown action: ${action}`,
    source,
  };
}
