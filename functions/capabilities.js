const MANIFEST_VERSION = "1.0";

export const getCapabilityManifest = (env) => {
  const confirmationPhrase = "hell yeah ship it";
  return {
    system: {
      name: "VoiceToWebsite OS",
      role: "Autonomous Website Commander",
      mode: "commands-only",
      manifestVersion: MANIFEST_VERSION,
    },
    execution: {
      testingPolicy: "always_test_and_auto_fix",
      rollbackMode: "enabled",
      safety: {
        model: "confirmation_gated_structural_changes",
        levels: ["low", "medium", "high"],
        highRequires: { phrase: confirmationPhrase },
      },
    },
    commandSurface: {
      // Canonical edge API used by Custom GPT + voice command center.
      executeEndpoint: "/api/execute",
      // Machine-readable manifest for clients/tools.
      capabilitiesEndpoint: "/api/capabilities",
      actions: [
        "plan",
        "preview",
        "apply",
        "deploy",
        "status",
        "rollback",
        "auto",
        "list_pages",
        "read_page",
      ],
      confirmationPhrase,
      operationMode: {
        enabled: true,
        trigger:
          "Use command prefix `ops:` for backend operations (fs/repo/preview/deploy/store/media/audio/live/env/governance/analytics).",
        explicitApi:
          "Use parameters.api = { path, method, query?, body? } to call whitelisted command-center endpoints through /api/execute.",
      },
      commandCenterEndpoints: [
        "/api/fs/*",
        "/api/repo/*",
        "/api/preview/*",
        "/api/deploy/*",
        "/api/analytics/metrics",
        "/api/monetization/config",
        "/api/store/*",
        "/api/media/*",
        "/api/audio/*",
        "/api/live/*",
        "/api/voice/execute",
        "/api/env/audit",
        "/api/governance/check",
      ],
    },
    orchestrator: {
      endpoint: "/api/orchestrator",
      structuralActionsRequireConfirmationPhrase: true,
      confirmationPhrase,
    },
    environment: {
      // Names only; presence and exact wiring is returned by /api/config/status (admin-only).
      requiredForAdmin: ["CONTROL_PASSWORD"],
      recommendedForAdmin: ["ADMIN_COOKIE_SECRET"],
    },
    notes: {
      // Keep this short; the long-form version lives in GLOBAL_SYSTEM_INSTRUCTIONS.md.
      doctrine: [
        "completion_over_explanation",
        "generate_preview_before_apply",
        "never_execute_high_without_confirmation",
        "always_log_actions",
        "fail_safe_not_silent",
      ],
      env: {
        environment: String(env?.ENVIRONMENT || "production"),
      },
    },
  };
};
