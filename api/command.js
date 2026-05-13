import express from "express";
import { routeCommand } from "../ai/router/commandRouter.js";
import { interpretCommand } from "./aiInterpreter.js";
import { applyPatch } from "./patchEngine.js";
import { deployUpdate } from "./gitDeploy.js";
import { validate } from "../server/middleware/validate.js";
import { CommandSchema } from "../server/validation/schemas.js";

const router = express.Router();

export async function executeRepositoryCommand(payload) {
  if (payload && typeof payload.action === "string") {
    return routeCommand(payload);
  }

  const command =
    typeof payload?.command === "string" ? payload.command.trim() : "";

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

router.post("/", validate(CommandSchema), async (request, response, next) => {
  try {
    const result = await executeRepositoryCommand(request.validated);
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
