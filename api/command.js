import express from "express";
import { routeCommand } from "../ai/router/commandRouter.js";
import { interpretCommand } from "./aiInterpreter.js";
import { applyPatch } from "./patchEngine.js";
import { deployUpdate } from "./gitDeploy.js";
import { validate } from "../server/middleware/validate.js";
import { CommandSchema } from "../server/validation/schemas.js";
import { buildProductSectionHtml, enforceLimit } from "./paywall.js";

const router = express.Router();

export async function executeRepositoryCommand(payload) {
  const normalizedCommand =
    typeof payload?.command === "string" ? payload.command.trim() : "";

  if (normalizedCommand.toLowerCase().includes("create product")) {
    return {
      success: true,
      action: "create_product",
      productSectionHtml: buildProductSectionHtml()
    };
  }

  if (payload && typeof payload.action === "string") {
    return routeCommand(payload);
  }

  const command = normalizedCommand;

  if (!command) {
    const error = new Error("Missing command");
    error.statusCode = 400;
    throw error;
  }

  const instruction = await interpretCommand(command);
  const patch = await applyPatch(instruction);
  const deployment = await deployUpdate({
    commitMessage: instruction.commitMessage,
  });

  return {
    status: "success",
    mode: "natural_language",
    instruction,
    patch,
    deployment,
  };
}

export async function executeCommandWithPaywall(payload) {
  const gate = enforceLimit(payload)
  if (gate.blocked) {
    return gate
  }

  const result = await executeRepositoryCommand(payload)
  return {
    ...result,
    commandsUsed: gate.nextCommandsUsed,
    plan: gate.plan
  }
}

router.post("/", validate(CommandSchema), async (request, response, next) => {
  try {
    const result = await executeCommandWithPaywall(request.validated);
    response.json(result);
  } catch (error) {
    if (error.statusCode) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }

    next(error);
  }
});

export default router;
