import { Navbar } from "@/components/Navbar";
import { VoiceApp } from "@/components/VoiceApp";
import { useAuth } from "@/context/AuthContext";
import { db, handleFirestoreError } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArrowUpRight, LayoutTemplate, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const { user, isLoggedIn, isReady, isOwnerAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"builder" | "sites">("builder");
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) navigate("/login");
    if (user) void loadSites();
  }, [isReady, isLoggedIn, user, navigate]);

  const loadSites = async () => {
    if (!user) return;
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
    setIsSaving(true);
    await addDoc(collection(db, "sites"), {
      html: currentHtml,
      ownerId: user.uid,
      title: `Site_${Date.now()}`,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setIsSaving(false);
    setTab("sites");
    await loadSites();
  };

  const renameSite = async (siteId: string, title: string) => {
    const next = window.prompt("Rename website", title || "My Site");
    if (!next?.trim()) return;
    await updateDoc(doc(db, "sites", siteId), {
      title: next.trim(),
      updatedAt: serverTimestamp(),
    });
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

          {tab === "builder" ? (
            <div className="luxury-card p-4">
              <VoiceApp
                isEditing
                existingHtml={currentHtml}
                onUpdateHtml={setCurrentHtml}
              />
              <div className="pt-4">
                <button
                  onClick={saveCurrent}
                  disabled={!currentHtml || isSaving}
                  className="hero-primary-button disabled:opacity-40"
                >
                  {isSaving ? "Saving..." : "Save Site"}
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentHtml(site.html);
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

