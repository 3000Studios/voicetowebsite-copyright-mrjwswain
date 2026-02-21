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
