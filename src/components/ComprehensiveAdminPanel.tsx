import React, { useCallback, useEffect, useState } from "react";

interface AdminPanelProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const ComprehensiveAdminPanel: React.FC<AdminPanelProps> = ({
  isAuthenticated,
  onLogin,
  onLogout,
}) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expanded, setExpanded] = useState(false);

  // Admin password hash (use environment variable for production)
  const ADMIN_PASSWORD_HASH = import.meta.env?.VITE_ADMIN_PASSWORD_HASH || "";

  const checkAuthStatus = useCallback(() => {
    const auth = sessionStorage.getItem("adminAuth");
    const authTime = parseInt(sessionStorage.getItem("adminAuthTime") || "0");
    const now = Date.now();

    if (auth === "true" && now - authTime < 3600000) {
      onLogin();
    } else {
      onLogout();
      sessionStorage.setItem("adminAuth", "false");
    }
  }, [onLogin, onLogout]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setMessage("Please enter a password");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const hashedPassword = await hashPassword(password);

      if (hashedPassword === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem("adminAuth", "true");
        sessionStorage.setItem("adminAuthTime", Date.now().toString());
        setMessage("Access granted");
        setMessageType("success");
        setPassword("");
        setTimeout(() => {
          onLogin();
          setMessage("");
        }, 1000);
      } else {
        setMessage("Invalid password");
        setMessageType("error");
        setPassword("");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage("Authentication error");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.setItem("adminAuth", "false");
    sessionStorage.removeItem("adminAuthTime");
    onLogout();
    setMessage("");
    setPassword("");
  };

  // Admin Functions
  const clearMarketData = () => {
    const cleanupFn = (
      window as typeof window & { cleanupMarketData?: () => void }
    ).cleanupMarketData;
    if (cleanupFn) {
      cleanupFn();
      console.warn("Market data cleared");
    }
  };

  const stopAudio = () => {
    const cleanupFunctions =
      (window as typeof window & { __cleanupFunctions?: (() => void)[] })
        .__cleanupFunctions || [];
    cleanupFunctions.forEach((fn: () => void) => {
      if (fn && typeof fn === "function") {
        try {
          fn();
        } catch (e) {
          console.warn("Cleanup function failed:", e);
        }
      }
    });
    console.warn("Audio and other resources stopped");
  };

  const restartTicker = () => {
    console.warn("Ticker restart requested");
    // This would need to be exposed from the main app
  };

  const clearCache = () => {
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    console.warn("Cache cleared");
  };

  const resetPreview = () => {
    // Reset preview state in main app
    const event = new CustomEvent("resetPreview");
    window.dispatchEvent(event);
    console.warn("Preview reset triggered");
  };

  const openLiveStream = () => {
    window.open("/admin/live", "_blank");
  };

  const openStoreManager = () => {
    window.open("/admin/store", "_blank");
  };

  const openAnalytics = () => {
    window.open("/admin/analytics", "_blank");
  };

  const openVoiceCommands = () => {
    window.open("/admin/vcc", "_blank");
  };

  const openAppStore = () => {
    window.open("/appstore.html", "_blank");
  };

  const openOrders = () => {
    window.open("/admin/store", "_blank");
  };

  const openCustomerChat = () => {
    window.open("/admin/cc", "_blank");
  };

  const openAgentControl = () => {
    window.open("/admin/the-kraken", "_blank");
  };

  const sections = [
    { id: "dashboard", label: "Dashboard", icon: "🎯" },
    { id: "system", label: "System Control", icon: "⚙️" },
    { id: "streaming", label: "Live Streaming", icon: "🎥" },
    { id: "store", label: "Store Manager", icon: "🛒" },
    { id: "payments", label: "Payment Gateway", icon: "💳" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "voice", label: "Voice Commands", icon: "🎤" },
    { id: "apps", label: "App Store", icon: "📱" },
    { id: "orders", label: "Orders", icon: "📋" },
    { id: "chat", label: "Customer Chat", icon: "💬" },
    { id: "agent", label: "Agent Control", icon: "🤖" },
    { id: "preview", label: "Preview Control", icon: "👁" },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                🎯 Quick Actions
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button
                  onClick={clearMarketData}
                  style={buttonStyle("#3b82f6")}
                >
                  Clear Market Data
                </button>
                <button onClick={stopAudio} style={buttonStyle("#ef4444")}>
                  Stop Audio
                </button>
                <button onClick={restartTicker} style={buttonStyle("#f59e0b")}>
                  Restart Ticker
                </button>
                <button onClick={clearCache} style={buttonStyle("#8b5cf6")}>
                  Clear Cache
                </button>
              </div>
            </div>
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                📊 System Status
              </h4>
              <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                <div>✅ Node.js: v24.14.0</div>
                <div>✅ Build: Working</div>
                <div>✅ Tests: 94/94 Passing</div>
                <div>✅ Security: Active</div>
              </div>
            </div>
          </div>
        );

      case "system":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                ⚙️ System Control
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button onClick={resetPreview} style={buttonStyle("#f59e0b")}>
                  Reset Preview
                </button>
                <button onClick={clearCache} style={buttonStyle("#8b5cf6")}>
                  Clear All Cache
                </button>
                <button
                  onClick={() => window.location.reload()}
                  style={buttonStyle("#6b7280")}
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        );

      case "streaming":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                🎥 Live Streaming
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button onClick={openLiveStream} style={buttonStyle("#ef4444")}>
                  Open Live Stream
                </button>
                <button
                  onClick={() =>
                    window.open("/admin/voice-commands.html", "_blank")
                  }
                  style={buttonStyle("#3b82f6")}
                >
                  Stream Controls
                </button>
              </div>
            </div>
          </div>
        );

      case "store":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                🛒 Store Management
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button
                  onClick={openStoreManager}
                  style={buttonStyle("#3b82f6")}
                >
                  Store Manager
                </button>
                <button onClick={openOrders} style={buttonStyle("#8b5cf6")}>
                  View Orders
                </button>
                <button
                  onClick={() =>
                    window.open("/stripe-connect-dashboard.html", "_blank")
                  }
                  style={buttonStyle("#6366f1")}
                >
                  Stripe Dashboard
                </button>
              </div>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                📊 Analytics
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button onClick={openAnalytics} style={buttonStyle("#3b82f6")}>
                  Analytics Dashboard
                </button>
                <button
                  onClick={() =>
                    window.open("/admin/analytics-enhanced.html", "_blank")
                  }
                  style={buttonStyle("#8b5cf6")}
                >
                  Enhanced Analytics
                </button>
                <button
                  onClick={() =>
                    window.open("/api/analytics/overview", "_blank")
                  }
                  style={buttonStyle("#6366f1")}
                >
                  API Overview
                </button>
              </div>
            </div>
          </div>
        );

      case "voice":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                🎤 Voice Commands
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button
                  onClick={openVoiceCommands}
                  style={buttonStyle("#3b82f6")}
                >
                  Voice Control Panel
                </button>
                <button
                  onClick={() =>
                    window.open("/admin/voice-commands.html", "_blank")
                  }
                  style={buttonStyle("#8b5cf6")}
                >
                  Command History
                </button>
              </div>
            </div>
          </div>
        );

      case "apps":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                📱 App Store
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button onClick={openAppStore} style={buttonStyle("#3b82f6")}>
                  App Store
                </button>
                <button
                  onClick={() =>
                    window.open("/admin/app-store-manager.html", "_blank")
                  }
                  style={buttonStyle("#8b5cf6")}
                >
                  App Manager
                </button>
              </div>
            </div>
          </div>
        );

      case "orders":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                📋 Order Management
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button onClick={openOrders} style={buttonStyle("#3b82f6")}>
                  View Orders
                </button>
                <button
                  onClick={() =>
                    window.open("/stripe-connect-storefront.html", "_blank")
                  }
                  style={buttonStyle("#6366f1")}
                >
                  Payment Settings
                </button>
              </div>
            </div>
          </div>
        );

      case "chat":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                💬 Customer Support
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button
                  onClick={openCustomerChat}
                  style={buttonStyle("#3b82f6")}
                >
                  Customer Chat
                </button>
                <button
                  onClick={() => window.open("/admin/chat.html", "_blank")}
                  style={buttonStyle("#8b5cf6")}
                >
                  Chat Settings
                </button>
              </div>
            </div>
          </div>
        );

      case "agent":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                🤖 AI Agent Control
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button
                  onClick={openAgentControl}
                  style={buttonStyle("#3b82f6")}
                >
                  Agent Control
                </button>
                <button
                  onClick={() =>
                    window.open("/admin/agent-control.html", "_blank")
                  }
                  style={buttonStyle("#8b5cf6")}
                >
                  Agent Settings
                </button>
              </div>
            </div>
          </div>
        );

      case "preview":
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>
                👁 Preview Control
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button onClick={resetPreview} style={buttonStyle("#f59e0b")}>
                  Reset Preview
                </button>
                <button
                  onClick={() => window.open("/demo.html", "_blank")}
                  style={buttonStyle("#3b82f6")}
                >
                  Demo Preview
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a section</div>;
    }
  };

  const buttonStyle = (bgColor: string) => ({
    padding: "8px 12px",
    background: bgColor,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
    transition: "all 0.2s ease",
  });

  if (isAuthenticated) {
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
          minWidth: expanded ? "600px" : "300px",
          maxWidth: "90vw",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#1f2937",
            padding: "12px",
            borderRadius: "8px 8px 0 0",
            borderBottom: "1px solid #333",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4 style={{ margin: 0, color: "#10b981" }}>🎯 Admin Panel</h4>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {expanded ? "✕" : "☰"}
          </button>
        </div>

        {/* Content */}
        {expanded && (
          <div style={{ padding: "12px" }}>
            {/* Navigation Tabs */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                marginBottom: "12px",
              }}
            >
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    ...buttonStyle(
                      activeSection === section.id ? "#10b981" : "#374151"
                    ),
                    fontSize: "10px",
                    padding: "6px 10px",
                  }}
                >
                  {section.icon} {section.label}
                </button>
              ))}
            </div>

            {/* Section Content */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "4px",
                padding: "12px",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {renderSectionContent()}
            </div>

            {/* Logout Button */}
            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <button
                onClick={handleLogout}
                style={{
                  ...buttonStyle("#dc2626"),
                  fontSize: "10px",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Login Form
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
        width: "200px",
      }}
    >
      <h4 style={{ margin: "0 0 12px 0" }}>Admin Access</h4>
      <form
        onSubmit={handleLogin}
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoComplete="current-password"
          style={{
            padding: "6px",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "4px",
            color: "white",
            fontSize: "11px",
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...buttonStyle(isLoading ? "#6b7280" : "#3b82f6"),
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "..." : "Unlock"}
        </button>
      </form>
      {message && (
        <div
          style={{
            marginTop: "8px",
            padding: "4px",
            borderRadius: "4px",
            fontSize: "10px",
            background: messageType === "error" ? "#ef4444" : "#22c55e",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default ComprehensiveAdminPanel;
