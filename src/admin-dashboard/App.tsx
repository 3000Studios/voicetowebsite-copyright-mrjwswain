import React, { useEffect, useMemo, useState } from "react";
import { AccessGuard } from "./AccessGuard";

type HealthStatus = {
  status?: string;
  orchestrator?: string;
  d1?: boolean;
  assets?: boolean;
  ts?: string;
};

type AnalyticsOverview = {
  result?: {
    totals?: {
      requests?: { all?: number };
      uniques?: { all?: number };
    };
  };
};

type ProductPayload = {
  products?: Array<{ id?: string }>;
};

type BotStatus = {
  builds?: Array<{ status?: string; ts?: string }>;
  commands?: Array<{
    command?: string;
    ts?: string;
    deployment_status?: string;
  }>;
};

type AdminLog = {
  command?: string;
  ts?: string;
};

type Order = {
  id?: string;
  email?: string;
  amount?: number;
  status?: string;
  ts?: string;
  product_name?: string;
};

const fetchJson = async <T,>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url, { cache: "no-store", credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (_) {
    return null;
  }
};

const formatNumber = (value?: number) =>
  typeof value === "number" ? value.toLocaleString() : "—";

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `$${value.toFixed(2)}` : "—";

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [products, setProducts] = useState<ProductPayload | null>(null);
  const [bots, setBots] = useState<BotStatus | null>(null);
  const [logs, setLogs] = useState<AdminLog[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {
      // Best-effort logout; always clear local auth hints.
    } finally {
      try {
        sessionStorage.removeItem("adminAccessValidated");
        sessionStorage.removeItem("yt-admin-unlocked");
        sessionStorage.removeItem("yt-admin-unlocked-ts");
      } catch (_) {}
      window.location.href = "/admin/login";
    }
  };

  const authStatus = useMemo(() => {
    if (!health) return "Checking…";
    return health.status === "ok" ? "Unlocked" : "Locked";
  }, [health]);

  const deployStatus = useMemo(() => {
    if (!bots?.builds?.length) return "Idle";
    return bots.builds[0]?.status || "Idle";
  }, [bots]);

  useEffect(() => {
    const load = async () => {
      const [h, a, p, b, l, o] = await Promise.all([
        fetchJson<HealthStatus>("/api/health"),
        fetchJson<AnalyticsOverview>("/api/analytics/overview"),
        fetchJson<ProductPayload>("/api/products"),
        fetchJson<BotStatus>("/api/bots/status"),
        fetchJson<{ logs?: AdminLog[] }>("/admin/logs"),
        fetchJson<{ results?: Order[] }>("/api/orders"),
      ]);
      setHealth(h);
      setAnalytics(a);
      setProducts(p);
      setBots(b);
      setLogs(l?.logs || []);
      setOrders(o?.results || []);
    };
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "🎯" },
    { id: "voice", label: "Voice Commands", icon: "🎤" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "store", label: "Store Manager", icon: "🛒" },
    { id: "apps", label: "App Store", icon: "📱" },
    { id: "orders", label: "Orders", icon: "📋" },
    { id: "chat", label: "Customer Chat", icon: "💬" },
    { id: "live", label: "Live Stream", icon: "🎥" },
    { id: "agent", label: "Agent Control", icon: "🤖" },
    { id: "progress", label: "Progress", icon: "📈" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <section className="glass-metal rounded-3xl p-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] items-center">
              <div className="space-y-4">
                <p className="eyebrow">Voice-first control</p>
                <h1 className="text-4xl font-black raised-text">
                  Say it. Change it. Ship it.
                </h1>
                <p className="text-slate-300">
                  Use voice or text commands to update any page, then deploy
                  live. This dashboard connects your command center, voice
                  bridge, and system status in one place.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="btn-primary"
                    onClick={() => setActiveTab("voice")}
                  >
                    Start Voice Control
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setActiveTab("agent")}
                  >
                    Agent Control
                  </button>
                </div>
              </div>
              <div className="media-frame">
                <video
                  src="/media/vtw-opener.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-4">
              <div className="glass-metal rounded-2xl p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Requests (12h)
                </div>
                <div className="text-2xl font-black mt-2">
                  {formatNumber(analytics?.result?.totals?.requests?.all)}
                </div>
              </div>
              <div className="glass-metal rounded-2xl p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Uniques (12h)
                </div>
                <div className="text-2xl font-black mt-2">
                  {formatNumber(analytics?.result?.totals?.uniques?.all)}
                </div>
              </div>
              <div className="glass-metal rounded-2xl p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Products
                </div>
                <div className="text-2xl font-black mt-2">
                  {formatNumber(products?.products?.length || 0)}
                </div>
              </div>
            </section>

            <section className="glass-metal rounded-3xl p-8">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Recent activity</p>
                  <h2 className="text-2xl font-black raised-text">
                    Last commands
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                {(logs || []).slice(0, 6).map((log, index) => (
                  <div
                    key={`${log.ts || "log"}-${index}`}
                    className="activity-row"
                  >
                    <span>{log.command || "—"}</span>
                    <span className="text-slate-500 text-xs">
                      {log.ts ? new Date(log.ts).toLocaleString() : ""}
                    </span>
                  </div>
                ))}
                {(!logs || logs.length === 0) && (
                  <div className="text-slate-500 text-sm">No activity yet.</div>
                )}
              </div>
            </section>
          </>
        );

      case "voice":
        return (
          <section className="glass-metal rounded-3xl p-8">
            <div className="section-head">
              <div>
                <p className="eyebrow">Voice Control</p>
                <h2 className="text-2xl font-black raised-text">
                  Voice Command Center
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-slate-300">
                Use voice commands to control the website. Click the microphone
                button and speak your command.
              </p>
              <div className="flex justify-center">
                <button className="btn-primary btn-lg">
                  🎤 Start Voice Control
                </button>
              </div>
              <div className="glass-metal rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Available Commands</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• "Update homepage hero text"</li>
                  <li>• "Change pricing to $29/month"</li>
                  <li>• "Add new blog post about AI"</li>
                  <li>• "Deploy changes to production"</li>
                </ul>
              </div>
            </div>
          </section>
        );

      case "analytics":
        return (
          <section className="glass-metal rounded-3xl p-8">
            <div className="section-head">
              <div>
                <p className="eyebrow">Analytics</p>
                <h2 className="text-2xl font-black raised-text">
                  Site Analytics Overview
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-metal rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4">Traffic Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Requests</span>
                      <strong>
                        {formatNumber(analytics?.result?.totals?.requests?.all)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Visitors</span>
                      <strong>
                        {formatNumber(analytics?.result?.totals?.uniques?.all)}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="glass-metal rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Auth Status</span>
                      <strong>{authStatus}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Orchestrator</span>
                      <strong>{health?.orchestrator || "—"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Deploy Status</span>
                      <strong>{deployStatus}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "store":
        return (
          <section className="glass-metal rounded-3xl p-8">
            <div className="section-head">
              <div>
                <p className="eyebrow">Store Manager</p>
                <h2 className="text-2xl font-black raised-text">
                  Product Management
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-slate-300">
                Manage your products, pricing, and inventory.
              </p>
              <div className="glass-metal rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">
                  Products ({products?.products?.length || 0})
                </h3>
                <div className="space-y-3">
                  {(products?.products || []).map((product, index) => (
                    <div
                      key={product.id || index}
                      className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                    >
                      <span>{product.id || `Product ${index + 1}`}</span>
                      <button className="btn-ghost btn-sm">Edit</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case "orders":
        return (
          <section className="glass-metal rounded-3xl p-8">
            <div className="section-head">
              <div>
                <p className="eyebrow">Orders</p>
                <h2 className="text-2xl font-black raised-text">
                  Order Management
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <div className="glass-metal rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">
                  Recent Orders ({orders?.length || 0})
                </h3>
                <div className="space-y-3">
                  {(orders || []).slice(0, 10).map((order, index) => (
                    <div
                      key={order.id || index}
                      className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {order.email || "Unknown"}
                        </div>
                        <div className="text-sm text-slate-400">
                          {order.product_name || "Product"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(order.amount)}
                        </div>
                        <div className="text-sm text-slate-400">
                          {order.status || "pending"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case "apps":
        return (
          <section className="glass-metal rounded-3xl p-8">
            <div className="section-head">
              <div>
                <p className="eyebrow">App Store</p>
                <h2 className="text-2xl font-black raised-text">
                  App Management
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-slate-300">
                Manage applications and extensions.
              </p>
              <div className="glass-metal rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Available Apps</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span>Voice Commander Pro</span>
                    <button className="btn-ghost btn-sm">Manage</button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span>Project Planning Hub</span>
                    <button className="btn-ghost btn-sm">Manage</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "chat":
        return (
          <section className="glass-metal rounded-3xl p-8">
            <div className="section-head">
              <div>
                <p className="eyebrow">Customer Chat</p>
                <h2 className="text-2xl font-black raised-text">
                  Support Chat
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-slate-300">
                View and respond to customer support requests.
              </p>
              <div className="glass-metal rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Recent Conversations</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="font-medium">Customer Support</div>
                    <div className="text-sm text-slate-400">
                      No active conversations
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "live":
        return (
          <section className="glass-metal rounded-3xl p-8">
            <div className="section-head">
              <div>
                <p className="eyebrow">Live Stream</p>
                <h2 className="text-2xl font-black raised-text">
                  Live Streaming Control
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-slate-300">
                Manage live streaming sessions and content.
              </p>
              <div className="glass-metal rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Stream Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Current Stream</span>
                    <span className="text-slate-400">Offline</span>
                  </div>
                  <button className="btn-primary">Start Stream</button>
                </div>
              </div>
            </div>
          </section>
        );

      case "agent":
        return (
          <section className="glass-metal rounded-3xl p-8">
            <div className="section-head">
              <div>
                <p className="eyebrow">Agent Control</p>
                <h2 className="text-2xl font-black raised-text">
                  AI Agent Management
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-slate-300">
                Control and monitor AI agent operations.
              </p>
              <div className="glass-metal rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Agent Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Autonomous Mode</span>
                    <button className="btn-ghost btn-sm">Enable</button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Remote Access</span>
                    <button className="btn-ghost btn-sm">Connect</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "progress":
        return (
          <section className="glass-metal rounded-3xl p-8">
            <div className="section-head">
              <div>
                <p className="eyebrow">Progress</p>
                <h2 className="text-2xl font-black raised-text">
                  Development Progress
                </h2>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-slate-300">
                Track development progress and milestones.
              </p>
              <div className="glass-metal rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Current Sprint</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>UI/UX Normalization</span>
                    <span className="text-green-400">✅ Complete</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Admin Dashboard Consolidation</span>
                    <span className="text-yellow-400">🔄 In Progress</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen text-slate-50 relative overflow-hidden">
      <video
        className="fixed inset-0 w-full h-full object-cover -z-20 opacity-35"
        autoPlay
        muted
        loop
        playsInline
        src="/media/vtw-admin-dashboard.mp4"
      />
      <div className="fixed inset-0 bg-[#010103]/70 -z-10" />

      <header className="sticky top-0 z-40 glass-metal px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-800 flex items-center justify-center font-black text-xl shadow-2xl border border-white/20">
              J
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">
                VoiceToWebsite
              </div>
              <div className="text-lg font-black raised-text">
                Admin Command Core
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="btn-ghost btn-sm">
              View Site
            </a>
            <button type="button" className="btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="glass-metal rounded-2xl p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-500 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Bar */}
        <div className="glass-metal rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Auth</span>
              <strong>{authStatus}</strong>
            </div>
            <div className="flex justify-between">
              <span>Orchestrator</span>
              <strong>{health?.orchestrator || "—"}</strong>
            </div>
            <div className="flex justify-between">
              <span>Deploy</span>
              <strong>{deployStatus}</strong>
            </div>
            <div className="flex justify-between">
              <span>Products</span>
              <strong>{products?.products?.length || 0}</strong>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <main className="space-y-8">{renderTabContent()}</main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AccessGuard>
      <AdminDashboard />
    </AccessGuard>
  );
};

export default App;
