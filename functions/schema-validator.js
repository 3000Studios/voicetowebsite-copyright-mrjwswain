/**
 * Request/Response Schema Validation
 * Provides runtime validation for API contracts
 */

/**
 * Schema validation error class
 */
class SchemaValidationError extends Error {
  constructor(message, field, value, schema) {
    super(message);
    this.name = "SchemaValidationError";
    this.field = field;
    this.value = value;
    this.schema = schema;
  }
}

/**
 * Schema validator class
 */
class SchemaValidator {
  constructor() {
    this.schemas = new Map();
    this.registerDefaultSchemas();
  }

  /**
   * Register a schema
   */
  register(name, schema) {
    this.schemas.set(name, schema);
  }

  /**
   * Get a schema by name
   */
  getSchema(name) {
    return this.schemas.get(name);
  }

  /**
   * Validate data against a schema
   */
  validate(schemaName, data) {
    const schema = this.getSchema(schemaName);
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }

    return this.validateAgainstSchema(data, schema, schemaName);
  }

  /**
   * Validate data against a schema definition
   */
  validateAgainstSchema(data, schema, path = "") {
    const errors = [];

    // Type validation
    if (schema.type && !this.validateType(data, schema.type)) {
      errors.push(new SchemaValidationError(`Expected type ${schema.type}, got ${typeof data}`, path, data, schema));
    }

    // Required fields validation
    if (schema.required && typeof data === "object" && data !== null) {
      for (const requiredField of schema.required) {
        if (!(requiredField in data)) {
          errors.push(
            new SchemaValidationError(
              `Required field '${requiredField}' is missing`,
              path ? `${path}.${requiredField}` : requiredField,
              undefined,
              schema
            )
          );
        }
      }
    }

    // Properties validation
    if (schema.properties && typeof data === "object" && data !== null) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in data) {
          const propPath = path ? `${path}.${propName}` : propName;
          const propResult = this.validateAgainstSchema(data[propName], propSchema, propPath);
          const nestedErrors = Array.isArray(propResult?.errors) ? propResult.errors : [];
          errors.push(...nestedErrors);
        }
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push(new SchemaValidationError(`Value must be one of: ${schema.enum.join(", ")}`, path, data, schema));
    }

    // String validations
    if (schema.type === "string" && typeof data === "string") {
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        errors.push(
          new SchemaValidationError(`String must be at least ${schema.minLength} characters long`, path, data, schema)
        );
      }

      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        errors.push(
          new SchemaValidationError(`String must be at most ${schema.maxLength} characters long`, path, data, schema)
        );
      }

      if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
        errors.push(new SchemaValidationError(`String does not match pattern: ${schema.pattern}`, path, data, schema));
      }
    }

    // Number validations
    if (schema.type === "number" && typeof data === "number") {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push(new SchemaValidationError(`Number must be at least ${schema.minimum}`, path, data, schema));
      }

      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push(new SchemaValidationError(`Number must be at most ${schema.maximum}`, path, data, schema));
      }
    }

    // Array validations
    if (schema.type === "array" && Array.isArray(data)) {
      if (schema.minItems !== undefined && data.length < schema.minItems) {
        errors.push(new SchemaValidationError(`Array must have at least ${schema.minItems} items`, path, data, schema));
      }

      if (schema.maxItems !== undefined && data.length > schema.maxItems) {
        errors.push(new SchemaValidationError(`Array must have at most ${schema.maxItems} items`, path, data, schema));
      }

      if (schema.items) {
        data.forEach((item, index) => {
          const itemPath = `${path}[${index}]`;
          const itemResult = this.validateAgainstSchema(item, schema.items, itemPath);
          const nestedErrors = Array.isArray(itemResult?.errors) ? itemResult.errors : [];
          errors.push(...nestedErrors);
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data,
    };
  }

  /**
   * Validate data type
   */
  validateType(data, expectedType) {
    switch (expectedType) {
      case "string":
        return typeof data === "string";
      case "number":
        return typeof data === "number" && !isNaN(data);
      case "boolean":
        return typeof data === "boolean";
      case "object":
        return typeof data === "object" && data !== null && !Array.isArray(data);
      case "array":
        return Array.isArray(data);
      case "null":
        return data === null;
      default:
        return true; // Unknown types pass
    }
  }

  /**
   * Register default schemas
   */
  registerDefaultSchemas() {
    // Execute API request schema
    this.register("ExecuteRequest", {
      type: "object",
      required: ["action", "idempotencyKey"],
      properties: {
        action: {
          type: "string",
          enum: ["plan", "preview", "apply", "deploy", "status", "rollback", "auto", "list_pages", "read_page"],
        },
        idempotencyKey: {
          type: "string",
          minLength: 3,
          maxLength: 100,
          pattern: "^[a-zA-Z0-9_-]+$",
        },
        command: {
          type: "string",
          maxLength: 1000,
        },
        target: {
          type: "string",
          enum: ["site"],
        },
        safetyLevel: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
        confirmToken: {
          type: "string",
          pattern: "^vtwcfm\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+$",
        },
        actor: {
          // Custom GPT actions may send either a string or an object; keep this permissive.
        },
        page: {
          type: "string",
          maxLength: 120,
          pattern: "^(all|[a-z0-9-]+(?:\\.html)?)$",
        },
        path: {
          type: "string",
          maxLength: 100,
        },
        file: {
          type: "string",
          maxLength: 100,
        },
        parameters: {
          type: "object",
        },
      },
    });

    // Execute API response schema
    this.register("ExecuteResponse", {
      type: "object",
      required: ["eventId", "timestamp", "traceId", "eventType", "action"],
      properties: {
        eventId: {
          type: "string",
          pattern: "^[0-9a-f-]{36}$", // UUID pattern
        },
        timestamp: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$", // ISO timestamp
        },
        traceId: {
          type: "string",
          pattern: "^[0-9a-f-]{36}$",
        },
        eventType: {
          type: "string",
          enum: ["planned", "previewed", "applied", "deployed", "rolled_back", "error"],
        },
        action: {
          type: "object",
        },
        result: {
          type: ["object", "array", "string", "number", "boolean", "null"],
        },
        error: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },
          },
        },
      },
    });

    // Token schema
    this.register("ConfirmToken", {
      type: "object",
      required: ["confirmToken", "confirmBy"],
      properties: {
        confirmToken: {
          type: "string",
          pattern: "^vtwcfm\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+$",
        },
        confirmBy: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
        },
        confirmInstructions: {
          type: "string",
        },
      },
    });

    // Error response schema
    this.register("ErrorResponse", {
      type: "object",
      required: ["error"],
      properties: {
        error: {
          type: "string",
          minLength: 1,
          maxLength: 500,
        },
        traceId: {
          type: "string",
          pattern: "^[0-9a-f-]{36}$",
        },
        code: {
          type: "string",
        },
      },
    });

    // Rate limit response schema
    this.register("RateLimitResponse", {
      type: "object",
      required: ["error", "retryAfter", "limit", "windowMs"],
      properties: {
        error: {
          type: "string",
        },
        retryAfter: {
          type: "number",
          minimum: 1,
        },
        limit: {
          type: "number",
          minimum: 1,
        },
        windowMs: {
          type: "number",
          minimum: 1000,
        },
      },
    });
  }
}

/**
 * Global schema validator instance
 */
const globalValidator = new SchemaValidator();

/**
 * Validation middleware
 */
export function createValidationMiddleware(schemaName) {
  return (data) => {
    const result = globalValidator.validate(schemaName, data);

    if (!result.valid) {
      const errorMessages = result.errors.map((err) => `${err.field}: ${err.message}`).join("; ");

      throw new SchemaValidationError(`Validation failed: ${errorMessages}`, "validation", data, schemaName);
    }

    return result.data;
  };
}

/**
 * Request validator for execute API
 */
export const validateExecuteRequest = createValidationMiddleware("ExecuteRequest");

/**
 * Response validator for execute API
 */
export const validateExecuteResponse = createValidationMiddleware("ExecuteResponse");

/**
 * Error response validator
 */
export const validateErrorResponse = createValidationMiddleware("ErrorResponse");

/**
 * Rate limit response validator
 */
export const validateRateLimitResponse = createValidationMiddleware("RateLimitResponse");

/**
 * Validate and sanitize request data
 */
export function validateRequest(request, schemaName) {
  try {
    const data = typeof request === "string" ? JSON.parse(request) : request;
    return validateExecuteRequest(data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SchemaValidationError("Invalid JSON format", "request", request, "json");
    }
    throw error;
  }
}

/**
 * Validate response data
 */
export function validateResponse(response, schemaName = "ExecuteResponse") {
  const result = globalValidator.validate(schemaName, response);

  if (!result.valid) {
    console.warn("Response validation failed:", result.errors);
    // Don't throw for responses, just log and continue
  }

  return response;
}

/**
 * Custom schema registration
 */
export function registerSchema(name, schema) {
  globalValidator.register(name, schema);
}

/**
 * Get validation statistics
 */
export function getValidationStats() {
  return {
    registeredSchemas: Array.from(globalValidator.schemas.keys()),
    totalSchemas: globalValidator.schemas.size,
  };
}

export { SchemaValidator, SchemaValidationError, globalValidator };
