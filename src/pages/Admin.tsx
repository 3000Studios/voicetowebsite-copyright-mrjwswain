import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { compileLayoutFromPrompt } from "@/lib/layoutCompiler";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { BarChart3, DollarSign, Grid3X3, Globe, LayoutDashboard, Shield, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type OrderRow = {
  id: string;
  created_at?: string;
  email?: string;
  plan?: string;
  cadence?: string;
  launch_discount?: number;
  status?: string;
  site_url?: string;
  error?: string;
};

export const Admin = () => {
  const { isReady, isLoggedIn, isOwnerAdmin, user, ownerAdminEmail } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [compilerPrompt, setCompilerPrompt] = useState(
    "Build a dashboard website for a local fitness coach with three features, pricing, FAQ, and contact.",
  );

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!isOwnerAdmin) {
      navigate("/dashboard");
      return;
    }
    void loadAdminData();
  }, [isReady, isLoggedIn, isOwnerAdmin, navigate]);

  const loadAdminData = async () => {
    const [sitesSnap, usersSnap, chatSnap] = await Promise.all([
      getDocs(query(collection(db, "sites"), orderBy("timestamp", "desc"), limit(200))),
      getDocs(query(collection(db, "users"), limit(500))),
      getDocs(query(collection(db, "chatLogs"), orderBy("createdAt", "desc"), limit(200))),
    ]);

    setSites(sitesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setChatLogs(chatSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    try {
      const res = await fetch("/api/admin/orders?limit=200", {
        headers: {
          "x-owner-email": String(user?.email || "").trim().toLowerCase(),
        },
      });
      const data = (await res.json()) as { rows?: OrderRow[] };
      setOrders(data.rows || []);
    } catch {
      setOrders([]);
    }
  };

  const addAdminRecord = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    const existing = await getDocs(
      query(collection(db, "admins"), where("email", "==", email), limit(1)),
    );
    if (!existing.empty) {
      setStatusMessage("Admin already exists.");
      return;
    }
    await addDoc(collection(db, "admins"), {
      email,
      createdAt: serverTimestamp(),
      createdBy: user?.email || ownerAdminEmail,
      ownerGranted: true,
    });
    setNewAdminEmail("");
    setStatusMessage("Admin added to records.");
  };

  const analytics = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status === "paid");
    const revenueCount = paidOrders.length;
    const proUsers = users.filter((u) => u.plan === "pro" || u.plan === "enterprise").length;
    const countriesKnown = new Set(
      chatLogs
        .map((log) => String((log as any).country || "").trim())
        .filter(Boolean),
    ).size;

    return {
      totalUsers: users.length,
      totalSites: sites.length,
      paidOrders: paidOrders.length,
      proUsers,
      revenueCount,
      activeLast24h: chatLogs.filter((log) => {
        const created = (log as any).createdAt?.toDate?.() || null;
        return created ? Date.now() - created.getTime() < 24 * 60 * 60 * 1000 : false;
      }).length,
      countriesKnown,
    };
  }, [orders, users, sites, chatLogs]);

  const compilerPreview = useMemo(() => compileLayoutFromPrompt(compilerPrompt), [compilerPrompt]);

  if (!isReady || !isLoggedIn || !isOwnerAdmin) return null;

  return (
    <div className="min-h-screen bg-[#050505] pt-28 pb-20 px-6">
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">Owner Admin Console</h1>
            <p className="text-slate-400 text-sm">
              Signed in as {user?.email}. Only owner email has access.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={<Users size={16} />} label="Users" value={String(analytics.totalUsers)} />
          <StatCard icon={<Globe size={16} />} label="Sites" value={String(analytics.totalSites)} />
          <StatCard icon={<DollarSign size={16} />} label="Paid Orders" value={String(analytics.paidOrders)} />
          <StatCard icon={<BarChart3 size={16} />} label="Pro/Enterprise" value={String(analytics.proUsers)} />
          <StatCard icon={<Shield size={16} />} label="24h Activity" value={String(analytics.activeLast24h)} />
          <StatCard icon={<Globe size={16} />} label="Countries Seen" value={String(analytics.countriesKnown)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Admin Controls">
            <p className="text-sm text-slate-300 mb-3">
              Owner-only controls for admin records and operations.
            </p>
            <div className="flex gap-2">
              <input
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="new-admin@email.com"
                className="flex-1 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
              />
              <button onClick={addAdminRecord} className="px-4 py-2 bg-emerald-600 rounded-lg text-white">
                Add Admin
              </button>
            </div>
            {statusMessage ? <p className="text-xs text-emerald-300 mt-2">{statusMessage}</p> : null}
          </Panel>

          <Panel title="Monetization Notes">
            <ul className="text-sm text-slate-300 space-y-1">
              <li>- Pricing links are active with Stripe fallback paths.</li>
              <li>- Orders endpoint is connected to admin feed.</li>
              <li>- Add GA4 or Cloudflare Web Analytics for exact live visitors and geo.</li>
              <li>- Add Sentry DSN to monitor production errors centrally.</li>
            </ul>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Layout Compiler Control">
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Test how the generator maps raw voice intent into a 12-column Flowbite-compatible Blok tree before delivery.
              </p>
              <textarea
                value={compilerPrompt}
                onChange={(event) => setCompilerPrompt(event.target.value)}
                className="min-h-32 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricPill icon={<Grid3X3 size={16} />} label="Grid" value="12 columns" />
                <MetricPill icon={<Sparkles size={16} />} label="Engine" value="Compiler v1" />
                <MetricPill icon={<LayoutDashboard size={16} />} label="Bloks" value={String(compilerPreview.tree.bloks.length)} />
              </div>
            </div>
          </Panel>

          <Panel title="Compiled Blok Tree">
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Grid Span</th>
                    <th className="px-4 py-3">Placement</th>
                  </tr>
                </thead>
                <tbody>
                  {compilerPreview.tree.bloks.map((blok) => (
                    <tr key={`${blok.order}-${blok.component}`} className="border-t border-white/8">
                      <td className="px-4 py-3 text-slate-300">{blok.order}</td>
                      <td className="px-4 py-3 font-semibold text-white">{blok.component}</td>
                      <td className="px-4 py-3 text-cyan-200">col-span-{blok.grid_span}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {blok.component === "sidebar"
                          ? "Left app rail"
                          : blok.component === "dashboard"
                            ? "Main app workspace"
                            : "Full-width section"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Recent Orders">
            <div className="max-h-72 overflow-auto text-xs">
              {orders.slice(0, 40).map((order) => (
                <div key={order.id} className="border-b border-white/10 py-2 text-slate-300">
                  {order.email || "no-email"} · {order.plan || "n/a"} · {order.status || "n/a"}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Users">
            <div className="max-h-72 overflow-auto text-xs">
              {users.slice(0, 60).map((u) => (
                <div key={u.id} className="border-b border-white/10 py-2 text-slate-300">
                  {String((u as any).email || "no-email")} · {String((u as any).plan || "free")}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Chat Logs / Inbox">
          <div className="max-h-96 overflow-auto text-xs">
            {chatLogs.length === 0 ? (
              <div className="text-slate-500">No chat logs found in `chatLogs` collection yet.</div>
            ) : (
              chatLogs.map((log) => (
                <div key={log.id} className="border-b border-white/10 py-2 text-slate-300">
                  {String((log as any).email || "anon")} · {String((log as any).message || "").slice(0, 140)}
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase">{icon}{label}</div>
    <div className="text-2xl font-black text-white mt-2">{value}</div>
  </div>
);

const MetricPill = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
    <div className="mb-2 flex items-center gap-2 text-cyan-200">
      {icon}
      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
    </div>
    <div className="font-bold text-white">{value}</div>
  </div>
);

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
    <h2 className="text-white font-bold mb-3">{title}</h2>
    {children}
  </div>
);
