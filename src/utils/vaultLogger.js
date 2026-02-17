/**
 * Vault Logging System
 * Centralized audit trail for all operations
 * Stored in Cloudflare KV with 90-day retention
 */

/**
 * Write event to vault
 * @param {Object} env - Cloudflare Worker env
 * @param {Object} entry - Log entry
 * @param {string} entry.type - 'command'|'payment'|'deployment'|'error'|'image'
 * @param {string} entry.category - Specific category
 * @param {string} entry.status - 'success'|'failed'|'pending'
 * @param {Object} entry.details - Event-specific details
 * @param {Object} entry.metadata - Additional context
 */
export async function logToVault(env, entry) {
  if (!env.VTW_VAULT && !env.VTW_KV) {
    console.warn("[VaultLog] No vault available");
    return null;
  }

  const vault = env.VTW_VAULT || env.VTW_KV;
  const id = `${entry.type}:${entry.category}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

  const vaultEntry = {
    id,
    timestamp: new Date().toISOString(),
    type: entry.type,
    category: entry.category,
    status: entry.status || "pending",
    details: entry.details || {},
    metadata: entry.metadata || {},
    ttlDays: entry.ttlDays || 90,
  };

  try {
    // Store in vault (90-day retention)
    await vault.put(`vault:${id}`, JSON.stringify(vaultEntry), {
      expirationTtl: 7776000, // 90 days in seconds
    });

    // Also log to D1 if available (for query access)
    if (env.D1) {
      try {
        await env.D1.prepare(
          `
          INSERT INTO vault_logs (id, type, category, status, details, metadata, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `
        )
          .bind(
            id,
            entry.type,
            entry.category,
            entry.status || "pending",
            JSON.stringify(entry.details || {}),
            JSON.stringify(entry.metadata || {})
          )
          .run();
      } catch (dbErr) {
        console.warn("[VaultLog] D1 insert failed:", dbErr.message);
      }
    }

    return vaultEntry;
  } catch (err) {
    console.error("[VaultLog] Failed to log:", err);
    return null;
  }
}

/**
 * Log a command execution
 */
export async function logCommand(env, command) {
  return logToVault(env, {
    type: "command",
    category: command.action || "unknown",
    status: command.status || "pending",
    details: {
      action: command.action,
      summary: command.summary,
      safetyLevel: command.safetyLevel,
      requiresConfirmation: command.requiresConfirmation,
      filesAffected: command.filesAffected || [],
      actionsCount: command.actionsCount || 0,
    },
    metadata: {
      source: command.source || "custom-gpt",
      user: command.user,
      commitSha: command.commitSha,
      deploymentId: command.deploymentId,
    },
  });
}

/**
 * Log a payment transaction
 */
export async function logPayment(env, payment) {
  return logToVault(env, {
    type: "payment",
    category: payment.provider,
    status: payment.status || "pending",
    details: {
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency || "USD",
      status: payment.status,
      items: payment.items || [],
      itemCount: payment.items?.length || 0,
    },
    metadata: {
      customerId: payment.customerId,
      transactionId: payment.transactionId,
      orderId: payment.orderId,
      email: payment.email,
      ip: payment.ip,
    },
  });
}

/**
 * Log a deployment
 */
export async function logDeployment(env, deployment) {
  return logToVault(env, {
    type: "deployment",
    category: deployment.service || "wrangler",
    status: deployment.status || "pending",
    details: {
      service: deployment.service,
      status: deployment.status,
      duration: deployment.duration,
      filesChanged: deployment.filesChanged || [],
      commitSha: deployment.commitSha,
      deploymentId: deployment.deploymentId,
    },
    metadata: {
      environment: deployment.environment || "production",
      triggeredBy: deployment.triggeredBy,
      errorMessage: deployment.errorMessage,
    },
  });
}

/**
 * Log an error
 */
export async function logError(env, error) {
  return logToVault(env, {
    type: "error",
    category: error.category || "unknown",
    status: "failed",
    details: {
      message: error.message,
      code: error.code,
      stack: error.stack?.slice(0, 500), // Truncate stack
      context: error.context,
    },
    metadata: {
      endpoint: error.endpoint,
      method: error.method,
      statusCode: error.statusCode,
      triggeredBy: error.triggeredBy,
    },
  });
}

/**
 * Log image operation
 */
export async function logImage(env, image) {
  return logToVault(env, {
    type: "image",
    category: image.action || "download", // download, optimize, inject
    status: image.status || "pending",
    details: {
      action: image.action,
      source: image.source, // unsplash, pexels, url
      url: image.url,
      width: image.width,
      height: image.height,
      format: image.format, // webp, jpg, etc
      size: image.size, // bytes
    },
    metadata: {
      searchQuery: image.searchQuery,
      injectedInto: image.injectedInto, // css, html, inline
      altText: image.altText,
    },
  });
}

/**
 * Retrieve logs from vault
 * @param {Object} env - Cloudflare Worker env
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by type
 * @param {string} options.category - Filter by category
 * @param {number} options.limit - Max results
 * @param {number} options.days - Last N days
 */
export async function queryVault(env, options = {}) {
  const vault = env.VTW_VAULT || env.VTW_KV;
  if (!vault) return [];

  // Use D1 for querying if available
  if (env.D1) {
    try {
      let sql = "SELECT * FROM vault_logs WHERE 1=1";
      const params = [];

      if (options.type) {
        sql += " AND type = ?";
        params.push(options.type);
      }

      if (options.category) {
        sql += " AND category = ?";
        params.push(options.category);
      }

      if (options.days) {
        sql += ` AND created_at > datetime('now', '-${options.days} days')`;
      }

      sql += ` ORDER BY created_at DESC LIMIT ${options.limit || 50}`;

      const result = await env.D1.prepare(sql)
        .bind(...params)
        .all();
      return result.results || [];
    } catch (err) {
      console.warn("[VaultQuery] D1 query failed:", err.message);
    }
  }

  // Fallback: Scan KV (less efficient but works)
  const results = [];
  const listResult = await vault.list({ prefix: "vault:" });

  for (const key of listResult.keys) {
    const data = await vault.get(key.name, "json");

    if (!options.type || data.type === options.type) {
      if (!options.category || data.category === options.category) {
        results.push(data);
      }
    }
  }

  return results
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, options.limit || 50);
}

/**
 * Get vault statistics
 */
export async function getVaultStats(env) {
  if (!env.D1) return null;

  try {
    const stats = await env.D1.prepare(
      `
      SELECT
        type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM vault_logs
      WHERE created_at > datetime('now', '-30 days')
      GROUP BY type
    `
    ).all();

    return stats.results || [];
  } catch (err) {
    console.warn("[VaultStats] Query failed:", err.message);
    return null;
  }
}

/**
 * Initialize vault schema in D1
 */
export async function initializeVaultSchema(env) {
  if (!env.D1) return;

  try {
    await env.D1.prepare(
      `
      CREATE TABLE IF NOT EXISTS vault_logs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        details TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT (datetime('now', '+90 days'))
      );
    `
    ).run();

    // Create index for queries
    await env.D1.prepare(
      `
      CREATE INDEX IF NOT EXISTS idx_vault_logs_type_category
      ON vault_logs(type, category, created_at DESC);
    `
    ).run();

    console.log("[VaultSchema] Initialized");
  } catch (err) {
    console.warn("[VaultSchema] Init failed:", err.message);
  }
}
