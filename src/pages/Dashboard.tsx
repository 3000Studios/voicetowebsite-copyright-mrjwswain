import { Navbar } from "@/components/Navbar";
import { VoiceApp } from "@/components/VoiceApp";
import { useAuth } from "@/context/AuthContext";
import { db, handleFirestoreError } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Archive, ArrowUpRight, Copy, History, LayoutTemplate, Plus, RotateCcw, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const { user, isLoggedIn, isReady, isOwnerAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"builder" | "sites">("builder");
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dashboardNotice, setDashboardNotice] = useState<string | null>(null);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) navigate("/login");
    if (user) void loadSites();
  }, [isReady, isLoggedIn, user, navigate]);

  const loadSites = async () => {
    if (!user) return;
    if (!db) {
      setDashboardNotice(
        "Dashboard data sync is unavailable right now. Check Firebase configuration.",
      );
      return;
    }
    try {
      const q = query(
        collection(db, "sites"),
        where("ownerId", "==", user.uid),
        orderBy("timestamp", "desc"),
      );
      const snap = await getDocs(q);
      setSites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      handleFirestoreError(error, "list", "sites");
    }
  };

  const saveCurrent = async () => {
    if (!user || !currentHtml) return;
    if (!db) {
      setDashboardNotice(
        "Save is unavailable because Firebase is not configured correctly.",
      );
      return;
    }
    setIsSaving(true);
    await addDoc(collection(db, "sites"), {
      html: currentHtml,
      ownerId: user.uid,
      title: `Site_${Date.now()}`,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "draft",
    });
    setIsSaving(false);
    setTab("sites");
    await loadSites();
  };

  const renameSite = async (siteId: string, title: string) => {
    const next = window.prompt("Rename website", title || "My Site");
    if (!next?.trim()) return;
    if (!db) {
      setDashboardNotice(
        "Rename is unavailable because Firebase is not configured correctly.",
      );
      return;
    }
    await updateDoc(doc(db, "sites", siteId), {
      title: next.trim(),
      updatedAt: serverTimestamp(),
    });
    await loadSites();
  };

  const duplicateSite = async (site: any) => {
    if (!db || !user) return;
    await addDoc(collection(db, "sites"), {
      html: site.html || "",
      ownerId: user.uid,
      title: `${site.title || "Site"} (Copy)`,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "draft",
    });
    await loadSites();
  };

  const archiveSite = async (siteId: string) => {
    if (!db) return;
    await updateDoc(doc(db, "sites", siteId), {
      status: "archived",
      updatedAt: serverTimestamp(),
    });
    await loadSites();
  };

  const publishSite = async (siteId: string) => {
    if (!db) return;
    await updateDoc(doc(db, "sites", siteId), {
      status: "published",
      updatedAt: serverTimestamp(),
    });
    await loadSites();
  };

  const snapshotVersion = async (siteId: string, html: string) => {
    if (!db || !user || !html) return;
    await addDoc(collection(db, "site_versions"), {
      siteId,
      ownerId: user.uid,
      html,
      createdAt: serverTimestamp(),
    });
    setDashboardNotice("Version snapshot saved.");
  };

  const restoreLatestVersion = async (siteId: string) => {
    if (!db) return;
    const versionQuery = query(
      collection(db, "site_versions"),
      where("siteId", "==", siteId),
      orderBy("createdAt", "desc"),
      limit(1),
    );
    const snap = await getDocs(versionQuery);
    if (snap.empty) {
      setDashboardNotice("No saved versions found for this site yet.");
      return;
    }
    const version = snap.docs[0].data() as { html?: string };
    if (!version.html) return;
    await updateDoc(doc(db, "sites", siteId), {
      html: version.html,
      updatedAt: serverTimestamp(),
    });
    setDashboardNotice("Latest saved version restored.");
    await loadSites();
  };

  if (!isReady || !user) return null;

  return (
    <div className="relative min-h-screen bg-transparent text-slate-50">
      <Navbar />
      <div className="section-shell pt-28">
        <div className="content-grid gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="section-title text-gradient">Dashboard</h1>
              <p className="section-copy">
                Build and manage your sites in the same design system as the homepage.
              </p>
            </div>
            <div className="flex gap-3">
              {isOwnerAdmin ? (
                <button
                  onClick={() => navigate("/admin")}
                  className="hero-secondary-button"
                >
                  Admin
                </button>
              ) : null}
              <button
                onClick={() => setTab("builder")}
                className={tab === "builder" ? "hero-primary-button" : "hero-secondary-button"}
              >
                Builder
              </button>
              <button
                onClick={() => setTab("sites")}
                className={tab === "sites" ? "hero-primary-button" : "hero-secondary-button"}
              >
                My Sites
              </button>
          </div>
        </div>
        {dashboardNotice ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {dashboardNotice}
          </div>
        ) : null}

          {tab === "builder" ? (
            <div className="luxury-card p-4">
              <VoiceApp
                isEditing
                existingHtml={currentHtml}
                onUpdateHtml={setCurrentHtml}
              />
              <div className="pt-4 flex flex-wrap gap-3">
                <button
                  onClick={saveCurrent}
                  disabled={!currentHtml || isSaving}
                  className="hero-primary-button disabled:opacity-40"
                >
                  {isSaving ? "Saving..." : "Save Site"}
                </button>
                <button
                  onClick={() => activeSiteId && currentHtml && snapshotVersion(activeSiteId, currentHtml)}
                  disabled={!activeSiteId || !currentHtml}
                  className="hero-secondary-button disabled:opacity-40"
                >
                  <History className="h-4 w-4" />
                  Save Version
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div
                onClick={() => setTab("builder")}
                className="luxury-card cursor-pointer flex h-56 flex-col items-center justify-center gap-3 hover:border-indigo-400/50"
              >
                <Plus className="h-8 w-8 text-cyan-300" />
                <div className="text-white font-semibold">Create New Site</div>
              </div>

              {sites.map((site) => (
                <div key={site.id} className="luxury-card p-0 overflow-hidden">
                  <div className="h-36 bg-slate-900/70 border-b border-white/10 flex items-center justify-center">
                    <LayoutTemplate className="h-10 w-10 text-white/30" />
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="text-white text-lg font-semibold">{site.title || "Untitled Site"}</h3>
                    <p className="text-xs uppercase tracking-widest text-slate-400">
                      Status: {site.status || "draft"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentHtml(site.html);
                          setActiveSiteId(site.id);
                          setTab("builder");
                        }}
                        className="hero-secondary-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => renameSite(site.id, site.title || "")}
                        className="hero-secondary-button"
                      >
                        Rename
                      </button>
                      <a href={`/${site.id}`} target="_blank" rel="noreferrer" className="hero-primary-button">
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => duplicateSite(site)}
                        className="hero-secondary-button"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => publishSite(site.id)}
                        className="hero-secondary-button"
                      >
                        <Upload className="h-4 w-4" />
                        Publish
                      </button>
                      <button
                        onClick={() => archiveSite(site.id)}
                        className="hero-secondary-button"
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </button>
                      <button
                        onClick={() => restoreLatestVersion(site.id)}
                        className="hero-secondary-button"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
