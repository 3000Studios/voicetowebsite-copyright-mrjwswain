import React, { useEffect, useMemo, useState } from "react";

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

const App: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [products, setProducts] = useState<ProductPayload | null>(null);
  const [bots, setBots] = useState<BotStatus | null>(null);
  const [logs, setLogs] = useState<AdminLog[] | null>(null);

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
      const [h, a, p, b, l] = await Promise.all([
        fetchJson<HealthStatus>("/api/health"),
        fetchJson<AnalyticsOverview>("/api/analytics/overview"),
        fetchJson<ProductPayload>("/api/products"),
        fetchJson<BotStatus>("/api/bots/status"),
        fetchJson<{ logs?: AdminLog[] }>("/admin/logs"),
      ]);
      setHealth(h);
      setAnalytics(a);
      setProducts(p);
      setBots(b);
      setLogs(l?.logs || []);
    };
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, []);

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

      <header className="sticky top-0 z-40 glass-metal px-6 py-4 flex items-center justify-between gap-6">
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
        <nav className="admin-topnav">
          <a href="/admin/voice-commands.html">Voice</a>
          <a href="/admin/index.html" className="is-active">
            Command Center
          </a>
          <a href="/admin/test-lab-1.html">Agent</a>
          <a href="/admin/analytics.html">Analytics</a>
          <a href="/admin/store-manager.html">Store</a>
          <a href="/admin/app-store-manager.html">Apps</a>
          <a href="/admin/customer-chat.html">Chat</a>
          <a href="/admin/live-stream.html">Live</a>
          <a href="/admin/nexus.html">Nexus</a>
          <a href="/admin/progress.html">Progress</a>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 pb-32 grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="glass-metal rounded-3xl p-6 space-y-6 sticky top-24 self-start">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Quick Actions
            </div>
            <a className="dash-link" href="/admin/voice-commands.html">
              Open Voice Control
            </a>
            <a className="dash-link" href="/admin/test-lab-1.html">
              Agent Control
            </a>
            <a className="dash-link" href="/">
              Open Site
            </a>
          </div>
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Status
            </div>
            <div className="status-row">
              <span>Auth</span>
              <strong>{authStatus}</strong>
            </div>
            <div className="status-row">
              <span>Orchestrator</span>
              <strong>{health?.orchestrator || "—"}</strong>
            </div>
            <div className="status-row">
              <span>Deploy</span>
              <strong>{deployStatus}</strong>
            </div>
          </div>
        </aside>

        <main className="space-y-8">
          <section className="glass-metal rounded-3xl p-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] items-center">
            <div className="space-y-4">
              <p className="eyebrow">Voice-first control</p>
              <h1 className="text-4xl font-black raised-text">
                Say it. Change it. Ship it.
              </h1>
              <p className="text-slate-300">
                Use voice or text commands to update any page, then deploy live.
                This dashboard connects your command center, voice bridge, and
                system status in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <a className="btn-primary" href="/admin/voice-commands.html">
                  Start Voice Control
                </a>
                <a className="btn-ghost" href="/admin/test-lab-1.html">
                  Agent Control
                </a>
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
                <p className="eyebrow">Visual map</p>
                <h2 className="text-2xl font-black raised-text">
                  Where to go for each task
                </h2>
              </div>
            </div>
            <div className="media-strip">
              <a className="media-card" href="/admin/voice-commands.html">
                <video
                  src="/media/vtw-animated-logo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="media-card__body">
                  <strong>Voice Control</strong>
                  <span>Speak commands and ship updates.</span>
                </div>
              </a>
              <a className="media-card" href="/admin/index.html">
                <video
                  src="/media/vtw-admin-dashboard.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="media-card__body">
                  <strong>Command Center</strong>
                  <span>Plan, preview, apply, deploy.</span>
                </div>
              </a>
              <a className="media-card" href="/admin/test-lab-1.html">
                <video
                  src="/media/vtw-home-wallpaper.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="media-card__body">
                  <strong>Agent Control</strong>
                  <span>Autonomy, remote access, status.</span>
                </div>
              </a>
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
        </main>
      </div>
    </div>
  );
};

export default App;
