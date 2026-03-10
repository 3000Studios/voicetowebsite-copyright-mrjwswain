import React, { useEffect, useState } from "react";

// Add PayPal global type declaration
declare global {
  interface Window {
    paypal?: unknown;
  }
}

interface PayPalConfig {
  clientId?: string;
  sandbox?: boolean;
  currency?: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  timestamp: string;
  customer?: string;
  email?: string;
}

interface PayPalIntegrationProps {
  isAuthenticated: boolean;
}

const PayPalIntegration: React.FC<PayPalIntegrationProps> = ({
  isAuthenticated,
}) => {
  const [config, setConfig] = useState<PayPalConfig>(() => {
    // Load PayPal config from environment or storage during initialization
    const savedConfig = localStorage.getItem("paypalConfig");
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.warn("Failed to load PayPal config:", e);
      }
    }
    return {
      clientId: "",
      sandbox: true,
      currency: "USD",
    };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    // Load transactions during initialization
    const saved = localStorage.getItem("paypalTransactions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load transactions:", e);
      }
    }
    return [];
  });
  const [isLoading, _setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // Load PayPal SDK dynamically
  useEffect(() => {
    if (config.clientId && !window.paypal) {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${config.currency}`;
      script.async = true;
      script.onload = () => console.warn("PayPal SDK loaded");
      script.onerror = () => console.error("Failed to load PayPal SDK");
      document.head.appendChild(script);
    }
  }, [config.clientId, config.currency]);

  const saveConfig = (newConfig: PayPalConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem("paypalConfig", JSON.stringify(newConfig));
    } catch (e) {
      console.warn("Failed to save PayPal config:", e);
    }
  };

  const saveTransaction = (transaction: Transaction) => {
    const updated = [transaction, ...transactions];
    setTransactions(updated);
    try {
      localStorage.setItem("paypalTransactions", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save transaction:", e);
    }
  };

  const clearTransactions = () => {
    setTransactions([]);
    try {
      localStorage.removeItem("paypalTransactions");
    } catch (e) {
      console.warn("Failed to clear transactions:", e);
    }
    setMessage("Transaction history cleared");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  const refundTransaction = (id: string) => {
    const updated = transactions.map((tx) =>
      tx.id === id ? { ...tx, status: "refunded" as const } : tx
    );
    setTransactions(updated);
    try {
      localStorage.setItem("paypalTransactions", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save refund:", e);
    }
    setMessage("Transaction refunded");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleConfigSave = () => {
    if (!config.clientId?.trim()) {
      setMessage("Client ID is required");
      setMessageType("error");
      return;
    }
    saveConfig(config);
    setMessage("PayPal configuration saved");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  const createMockPayment = () => {
    const mockTransaction: Transaction = {
      id: `txn_${Date.now()}`,
      amount: Math.floor(Math.random() * 1000) + 10,
      status: "completed",
      timestamp: new Date().toISOString(),
      customer: "Test Customer",
      email: "test@example.com",
    };

    saveTransaction(mockTransaction);
    setMessage("Mock payment created for testing");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  const renderPayPalButtons = () => {
    if (config.sandbox) {
      return (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <div
            style={{
              background: "#fff3cd",
              color: "#1e1e1e",
              padding: "12px 20px",
              borderRadius: "8px",
              border: "1px solid #ffa500",
              fontSize: "14px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              ⚠️ Sandbox Mode
            </div>
            <div>
              PayPal is running in sandbox mode. Use test credentials for
              development.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        {/* PayPal SDK Script */}
        <script
          src="https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${config.currency}"
          async
        />

        {/* PayPal Buttons */}
        <div style={{ marginBottom: "20px" }}>
          <div id="paypal-button-container" style={{ minHeight: "50px" }}></div>
        </div>

        {/* PayPal Form */}
        <div
          style={{
            background: "#f0f4f8",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#111827" }}>
            Quick Payment
          </h3>
          <button
            onClick={createMockPayment}
            style={{
              background: "#0070ba",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              width: "100%",
              marginBottom: "12px",
            }}
          >
            Create Test Payment ($10.00)
          </button>
        </div>
      </div>
    );
  };

  const renderTransactionHistory = () => (
    <div
      style={{
        background: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        marginTop: "20px",
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", color: "#111827" }}>
        Transaction History
      </h3>

      {transactions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          No transactions found
        </div>
      ) : (
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {transactions.map((tx, _index) => (
            <div
              key={tx.id}
              style={{
                background: "white",
                padding: "12px",
                borderRadius: "4px",
                marginBottom: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold", color: "#111827" }}>
                    ${tx.amount.toFixed(2)} {config.currency}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {tx.timestamp}
                  </div>
                </div>
                <div
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {tx.status === "completed" && (
                    <span style={{ color: "#10b981" }}>✓ Completed</span>
                  )}
                  {tx.status === "pending" && (
                    <span style={{ color: "#f59e0b" }}>⏳ Pending</span>
                  )}
                  {tx.status === "failed" && (
                    <span style={{ color: "#ef4444" }}>✗ Failed</span>
                  )}
                  {tx.status === "refunded" && (
                    <span style={{ color: "#6366f1" }}>↩ Refunded</span>
                  )}
                </div>
              </div>

              {tx.customer && (
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Customer: {tx.customer}
                </div>
              )}

              {tx.email && (
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Email: {tx.email}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={() => refundTransaction(tx.id)}
                  disabled={tx.status === "refunded"}
                  style={{
                    background:
                      tx.status === "refunded" ? "#9ca3af" : "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    cursor:
                      tx.status === "refunded" ? "not-allowed" : "pointer",
                    fontSize: "12px",
                  }}
                >
                  Refund
                </button>
                <button
                  onClick={() => {
                    const updated = transactions.filter((t) => t.id !== tx.id);
                    setTransactions(updated);
                    try {
                      localStorage.setItem(
                        "paypalTransactions",
                        JSON.stringify(updated)
                      );
                    } catch (e) {
                      console.warn("Failed to delete transaction:", e);
                    }
                  }}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <button
          onClick={clearTransactions}
          style={{
            background: "#6b7280",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear History
        </button>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          background: "rgba(0, 0, 0, 0.9)",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "16px",
          zIndex: 10000,
          color: "white",
          fontFamily: "monospace",
          fontSize: "12px",
          width: "250px",
        }}
      >
        <h4 style={{ margin: "0 0 12px 0" }}>🔒 PayPal Setup</h4>
        <div
          style={{ color: "#fbbf24", fontSize: "11px", marginBottom: "12px" }}
        >
          Admin access required to configure PayPal
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "rgba(0, 0, 0, 0.95)",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "0",
        zIndex: 10000,
        color: "white",
        fontFamily: "monospace",
        fontSize: "12px",
        minWidth: "300px",
        maxWidth: "90vw",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#0070ba",
          padding: "12px",
          borderRadius: "8px 8px 0 0",
          borderBottom: "1px solid #333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4 style={{ margin: 0, color: "white" }}>💳 PayPal Integration</h4>
        <button
          onClick={() => {
            // This would be handled by parent admin panel
            const event = new CustomEvent("closePayPalPanel");
            window.dispatchEvent(event);
          }}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "12px", maxHeight: "500px", overflowY: "auto" }}>
        {/* Configuration */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#fbbf24" }}>
            Configuration
          </h4>
          <div style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "12px",
                }}
              >
                PayPal Client ID:
              </label>
              <input
                type="text"
                value={config.clientId}
                onChange={(e) =>
                  setConfig({ ...config, clientId: e.target.value })
                }
                placeholder="Your PayPal Client ID"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "4px",
                  color: "white",
                  fontSize: "12px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "12px",
                }}
              >
                Environment:
              </label>
              <select
                value={config.sandbox ? "sandbox" : "production"}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sandbox: e.target.value === "sandbox",
                  })
                }
                title="PayPal environment selection"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "4px",
                  color: "white",
                  fontSize: "12px",
                }}
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "12px",
                }}
              >
                Currency:
              </label>
              <select
                value={config.currency}
                onChange={(e) =>
                  setConfig({ ...config, currency: e.target.value })
                }
                title="PayPal currency selection"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "4px",
                  color: "white",
                  fontSize: "12px",
                }}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleConfigSave}
            disabled={isLoading}
            style={{
              background: "#10b981",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "12px",
              width: "100%",
            }}
          >
            {isLoading ? "Saving..." : "Save Configuration"}
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: "8px",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "11px",
              background: messageType === "error" ? "#ef4444" : "#22c55e",
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}

        {/* PayPal Buttons */}
        {renderPayPalButtons()}

        {/* Transaction History */}
        {renderTransactionHistory()}
      </div>
    </div>
  );
};

export default PayPalIntegration;
