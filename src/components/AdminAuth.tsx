import React, { useEffect, useState } from "react";

interface AdminAuthProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({
  isAuthenticated,
  onLogin,
  onLogout,
}) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // Admin password hash should be provided via environment variable
  // This component should only be used for demo/testing purposes
  // Production authentication should be handled server-side
  const ADMIN_PASSWORD_HASH = import.meta.env?.VITE_ADMIN_PASSWORD_HASH || "";

  useEffect(() => {
    const checkAuthStatus = () => {
      const auth = sessionStorage.getItem("adminAuth");
      const authTime = parseInt(sessionStorage.getItem("adminAuthTime") || "0");
      const now = Date.now();

      // Session expires after 1 hour
      if (auth === "true" && now - authTime < 3600000) {
        onLogin();
      } else {
        onLogout();
        sessionStorage.setItem("adminAuth", "false");
      }
    };

    checkAuthStatus();
  }, [onLogin, onLogout]);

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
        // Add delay to prevent brute force
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
    // This would need to be exposed from the main app
    console.warn("Ticker restart requested");
  };

  if (isAuthenticated) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "rgba(0, 0, 0, 0.9)",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "16px",
          zIndex: 10000,
          color: "white",
          fontFamily: "monospace",
          fontSize: "12px",
        }}
      >
        <h4 style={{ margin: "0 0 12px 0", color: "#22c55e" }}>Admin Panel</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={clearMarketData}
            style={{
              padding: "6px 12px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            Clear Market Data
          </button>
          <button
            onClick={stopAudio}
            style={{
              padding: "6px 12px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            Stop Audio
          </button>
          <button
            onClick={restartTicker}
            style={{
              padding: "6px 12px",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            Restart Ticker
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
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
            padding: "6px 12px",
            background: isLoading ? "#6b7280" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "11px",
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

export default AdminAuth;
