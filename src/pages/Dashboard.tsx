import { GoogleAdSense } from "@/components/GoogleAdSense";
import { Navbar } from "@/components/Navbar";
import { VoiceApp } from "@/components/VoiceApp";
import { PLAN_LIMITS, PlanType } from "@/constants/plans";
import { useAuth } from "@/context/AuthContext";
import {
  Clock,
  Cloud,
  Cpu,
  LayoutTemplate,
  Monitor,
  Plus,
  Rocket,
  Search,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { db, handleFirestoreError } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

export const Dashboard = () => {
  const { user, isLoggedIn, isReady } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"builder" | "sites" | "publish">(
    "builder",
  );
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [userSites, setUserSites] = useState<any[]>([]);
  const [domainSearch, setDomainSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);

  const planType: PlanType = (user as any)?.plan || "free";
  const limits = PLAN_LIMITS[planType];
  const isSubscriber = planType !== "free";

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) {
      navigate("/login");
    } else if (user && isSubscriber) {
      fetchUserSites();
    }
  }, [isLoggedIn, user, isReady, isSubscriber]);

  const fetchUserSites = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "sites"),
        where("ownerId", "==", user.uid),
        orderBy("timestamp", "desc"),
      );
      const querySnapshot = await getDocs(q);
      const sites = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUserSites(sites);
    } catch (err) {
      handleFirestoreError(err, "list", "sites");
    }
  };

  const handleSave = async () => {
    if (!isSubscriber) {
      return;
    }
    if (!currentHtml || !user) return;

    // Enforce limits
    if (userSites.length >= limits.sites) {
      setSaveError(
        `Persistence limit reached for ${limits.name}. Upgrade to create more sites.`,
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await addDoc(collection(db, "sites"), {
        html: currentHtml,
        ownerId: user.uid,
        timestamp: serverTimestamp(),
        isDraft: false,
        title: `Site_${Date.now()}`,
      });
      fetchUserSites();
      setActiveTab("sites");
    } catch (err) {
      handleFirestoreError(err, "create", "sites");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isReady || !user)
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Terminal className="text-indigo-500 animate-pulse" size={48} />
          <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.5em] italic">
            Initializing Neural Link...
          </span>
        </div>
      </div>
    );

  if (!isSubscriber) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 lg:p-24 overflow-hidden relative">
        <Navbar />
        <div className="absolute inset-0 z-0">
          <video
            src="/input_file_0.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-20 filter grayscale"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full glass-premium p-16 md:p-24 text-center space-y-12 relative z-10 border-t-8 border-indigo-600"
        >
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none text-white lg:whitespace-nowrap">
              AUTH: <span className="text-indigo-600">FAILED</span>
            </h2>
            <div className="h-px w-full bg-linear-to-r from-transparent via-indigo-600 to-transparent my-12" />
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-widest italic text-white/80">
              For subscribers use only.
            </h3>
            <p className="text-lg md:text-xl text-slate-400 font-light italic leading-relaxed max-w-2xl mx-auto">
              Don’t be left out wondering what the dashboard looks like! Our
              builder engine is reserved for elite operators who have committed
              to their digital empire.
              <span className="text-indigo-400 block mt-4 font-bold">
                Subscribe now and get instant access to your command center.
              </span>
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <button
              onClick={() => navigate("/#pricing")}
              className="px-16 py-6 bg-indigo-600 text-white font-black uppercase tracking-[0.3em] italic hover:bg-white hover:text-black transition-all shadow-[0_20px_50px_rgba(79,70,229,0.3)]"
            >
              UPGRADE FOR ACCESS
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 hover:opacity-100 transition-opacity italic"
            >
              Back to Surface
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-6 font-sans relative overflow-hidden">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-30">
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-0 left-0 w-px h-full bg-linear-to-b from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header - Recipe 1/11 Hybrid */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-16 gap-12 border-b border-white/5 pb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 text-indigo-500 font-mono text-[10px] uppercase tracking-[0.4em] font-black">
              <Cpu size={14} className="animate-spin-slow" />
              Voice Synthesis Terminal v2.0
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
              Voice <span className="text-white/20">Builder</span>
            </h1>
            <div className="flex flex-wrap items-center gap-8 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] italic">
              <span className="flex items-center gap-2">
                Operator:{" "}
                <span className="text-indigo-400">
                  {user.profile?.username || user.displayName}
                </span>
              </span>
              <span className="flex items-center gap-2">
                Protocol:{" "}
                <span className="text-white px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40">
                  {limits.name}
                </span>
              </span>
              <span className="flex items-center gap-2">
                Frequency:{" "}
                <span className="text-emerald-500 animate-pulse">
                  Sync Active
                </span>
              </span>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 brutal-shadow border border-white/10">
            {(["builder", "sites", "publish"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] italic transition-all ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab === "builder"
                  ? "Voice Engine"
                  : tab === "sites"
                    ? "My Sites"
                    : "Deployment"}
              </button>
            ))}
          </div>
        </div>

        {/* AdSense Slot */}
        <div className="mb-16">
          <GoogleAdSense slot="dashboard-top" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === "builder" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Control Panel */}
                <div className="lg:col-span-3 space-y-8">
                  <div className="glass-blur p-8 brutal-shadow space-y-8 border-l-4 border-indigo-600">
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 italic">
                        Neural Action
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium italic">
                        Execute structural modifications via voice.
                      </p>
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={isSaving || !currentHtml}
                      className="w-full h-16 bg-white text-black font-black uppercase tracking-widest italic flex items-center justify-center gap-3 hover:bg-indigo-600 hover:text-white transition-all brutal-shadow"
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                          <span>Syncing...</span>
                        </div>
                      ) : (
                        <>
                          <Rocket size={18} />
                          Persist Design
                        </>
                      )}
                    </button>

                    {saveError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase text-red-500 tracking-widest italic">
                        {saveError}
                      </div>
                    )}

                    <div className="pt-8 border-t border-white/5 space-y-4">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-600 italic">
                        Quick Protocols
                      </h4>
                      <div className="flex flex-col gap-2">
                        {[
                          "Dark Mode Synthesis",
                          "Bento Grid Injection",
                          "Mobile Optimization",
                        ].map((proto) => (
                          <button
                            key={proto}
                            className="w-full py-3 px-4 bg-black/40 border border-white/5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-500 hover:text-white transition-all italic"
                          >
                            {proto}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-blur p-8 space-y-6">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-indigo-500 italic flex items-center gap-2">
                      <Monitor size={14} /> System Health
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 italic">
                          Render Latency
                        </span>
                        <span className="text-[8px] font-mono text-emerald-500">
                          2ms
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/5 overflow-hidden">
                        <motion.div
                          animate={{ x: [-100, 100] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-1/2 h-full bg-indigo-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Engine */}
                <div className="lg:col-span-9 relative">
                  <div className="absolute -inset-4 bg-indigo-500/5 blur-[80px] z-0" />
                  <div className="relative z-10 glass-blur p-2 brutal-shadow">
                    <VoiceApp
                      isEditing={true}
                      existingHtml={currentHtml}
                      onUpdateHtml={setCurrentHtml}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sites" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                <motion.div
                  whileHover={{ y: -8 }}
                  onClick={() => setActiveTab("builder")}
                  className="aspect-video bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-indigo-500 hover:bg-white/8 transition-all group p-12"
                >
                  <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-500">
                    <Plus
                      className="text-slate-500 group-hover:text-white"
                      size={32}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic block">
                      Create New Identity
                    </span>
                    <span className="text-[8px] font-medium text-slate-500 uppercase tracking-widest">
                      Costs 10 Credits
                    </span>
                  </div>
                </motion.div>

                {userSites.map((site) => (
                  <motion.div
                    key={site.id}
                    whileHover={{ y: -10 }}
                    className="group bg-white/5 border border-white/10 overflow-hidden brutal-shadow relative flex flex-col"
                  >
                    <div className="aspect-video bg-slate-900 border-b border-white/5 relative overflow-hidden flex items-center justify-center p-8">
                      <LayoutTemplate
                        size={48}
                        className="text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"
                      />
                      <div className="relative z-10 flex flex-col items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-10 group-hover:translate-y-0">
                        <button
                          onClick={() => {
                            setCurrentHtml(site.html);
                            setActiveTab("builder");
                          }}
                          className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] italic shadow-2xl"
                        >
                          Modify Protocol
                        </button>
                      </div>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-2xl font-black uppercase tracking-tighter italic text-white group-hover:text-indigo-400 transition-colors">
                          {site.title || "Untitled-Protocol"}
                        </h4>
                        <span className="px-3 py-1 bg-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Stable
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-600 border-t border-white/5 pt-6">
                        <span className="flex items-center gap-2">
                          <Clock size={12} className="text-indigo-500" />{" "}
                          {site.timestamp?.toDate().toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
                          Sync Correct
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "publish" && (
              <div className="max-w-4xl mx-auto space-y-16 py-12">
                <div className="text-center space-y-6">
                  <span className="text-indigo-500 font-mono text-xs uppercase tracking-[0.5em] font-black">
                    Digital Authority
                  </span>
                  <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
                    Domain <span className="text-indigo-500">Buyout</span>
                  </h3>
                  <p className="text-xl text-slate-500 font-medium italic max-w-2xl mx-auto">
                    Connect your launched visions to a permanent address on the
                    global grid.
                  </p>
                </div>

                <div className="glass-blur p-16 space-y-12 brutal-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-indigo-500 to-transparent" />

                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic block">
                      Proposed Neural Domain
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input
                        type="text"
                        placeholder="your-vision.com"
                        value={domainSearch}
                        onChange={(e) => setDomainSearch(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 px-8 py-5 text-white font-mono text-sm focus:border-indigo-500 outline-none transition-all uppercase tracking-widest"
                      />
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.namecheap.com/domains/registration/results/?domain=${domainSearch}`,
                            "_blank",
                          )
                        }
                        className="px-12 py-5 bg-indigo-600 text-white font-black uppercase tracking-widest italic hover:bg-white hover:text-black transition-all brutal-shadow"
                      >
                        Search Namecheap
                      </button>
                    </div>
                  </div>

                  <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                    <div className="p-10 border border-white/5 hover:border-indigo-500 transition-all space-y-4 group">
                      <Cloud
                        className="text-indigo-500 mx-auto group-hover:scale-110 transition-transform"
                        size={40}
                      />
                      <h4 className="text-xl font-black uppercase italic tracking-tighter">
                        Fast-Sync Relay
                      </h4>
                      <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest italic leading-relaxed">
                        Instantly route your site through our high-speed edge
                        proxy.
                      </p>
                      <button className="w-full py-4 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] hover:bg-white hover:text-black transition-all">
                        Initialize Relay
                      </button>
                    </div>
                    <div className="p-10 border border-white/5 hover:border-indigo-500 transition-all space-y-4 group">
                      <Search
                        className="text-indigo-500 mx-auto group-hover:scale-110 transition-transform"
                        size={40}
                      />
                      <h4 className="text-xl font-black uppercase italic tracking-tighter">
                        Premium Buyout
                      </h4>
                      <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest italic leading-relaxed">
                        Secure domain ownership via Namecheap integration.
                      </p>
                      <a
                        href="https://www.namecheap.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full py-4 bg-white/5 text-white text-center font-black uppercase tracking-widest text-[9px] hover:bg-indigo-600 transition-all"
                      >
                        Open Namecheap Portal
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
