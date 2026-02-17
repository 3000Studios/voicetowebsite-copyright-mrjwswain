/**
 * Unified UI Command API
 * Handles commands from: Continue.dev chat, Custom GPT, Voice commands, and API calls
 * This function runs in src/functions/uiCommand.js
 */

export async function handleUICommand(request, env, context) {
  const { method } = request;

  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await request.json();
    const { action, args = {}, source = "api" } = payload;

    // Validate command
    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action field" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
    "set-headline": { key: "headline", value: args.value },
    "set-subhead": { key: "subhead", value: args.value },
    "set-cta": { key: "cta", value: args.value },
    "set-price": { key: "price", value: args.value },
    "apply-theme": { key: "theme", value: args.theme },
    "update-metric": {
      key: `metric${args.metricNum}`,
      value: args.value,
    },
  };

  if (stateActions[action]) {
    const { key, value } = stateActions[action];
    // Store in KV cache for quick retrieval
    await env.VTW_CACHE.put(
      `ui:${key}`,
      JSON.stringify({ value, timestamp: Date.now(), source })
    );

    return {
      success: true,
      action,
      key,
      value,
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
      state[key] = data ? JSON.parse(data).value : null;
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
