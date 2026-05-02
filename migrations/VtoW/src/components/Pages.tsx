import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { 
  ArrowRight, 
  HelpCircle, 
  BookOpen, 
  Star, 
  Mic, 
  Globe, 
  Shield, 
  Zap, 
  MessageSquare, 
  User, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { ExamplesSection, TrustSection } from "./home/HomeContent";

export const ExamplesPage = () => (
  <div className="pt-32 pb-20 px-6 lg:px-12 bg-black/50 min-h-screen">
    <ExamplesSection />
    <section className="py-24 px-6 lg:px-12">
       <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6 italic">Ready to see your own?</h2>
          <div className="flex justify-center gap-6">
            <Link to="/signup" className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform uppercase text-xs tracking-widest">Get Started Free</Link>
          </div>
       </div>
    </section>
    <TrustSection />
  </div>
);

export const FAQPage = () => {
  const faqs = [
    { q: "How long does it take to generate a website?", a: "Most websites are architected and ready for preview in under 30 seconds. Detailed prompts may take a few seconds longer as we refine the copywriting." },
    { q: "Can I export my code?", a: "Yes! Users on Pro and Ultimate plans can export their generated websites as a clean React/Vite/Tailwind codebase." },
    { q: "Are the images and videos copyrighted?", a: "We fetch media from free-to-use sources like Unsplash, Pexels, and Coverr. However, the user is always responsible for ensuring final compliance for their specific business." },
    { q: "Do you offer refunds?", a: "No. Due to the high compute costs of AI generation and our unlimited preview model, all sales are final." },
    { q: "How do I host my site?", a: "We provide high-speed global hosting on our Ultimate plan. You can also host on your own provider using our exported code." }
  ];

  return (
    <div className="pt-40 pb-24 px-6 lg:px-12 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-black mb-12 italic tracking-tight">Frequently Asked Questions</h1>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-3xl border-white/5"
            >
              <div className="flex gap-4 mb-4">
                <HelpCircle className="w-5 h-5 text-brand-cyan shrink-0" />
                <h3 className="font-bold text-lg">{faq.q}</h3>
              </div>
              <p className="text-white/40 text-sm leading-relaxed ml-9">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AboutPage = () => (
  <div className="pt-40 pb-24 px-6 lg:px-12 min-h-screen">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-6xl font-black mb-12 italic leading-none">We Believe Design <br /><span className="text-brand-purple">Belongs to Everyone.</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-white/60 leading-relaxed italic">
        <p>
          VoiceToWebsite.com was founded by a team of engineers and designers who were tired of the limitations of drag-and-drop builders. We saw a future where imagination was the only bottleneck.
        </p>
        <p>
          By leveraging the world's most advanced large language models and a proprietary design engine, we've turned that vision into reality. Now, you can speak your business into existence.
        </p>
      </div>
      
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Vision", icon: Globe, text: "High-end design for every entrepreneur." },
          { label: "Truth", icon: Shield, text: "No templates. No generic results." },
          { label: "Speed", icon: Zap, text: "From thought to live in seconds." },
        ].map((item, i) => (
          <div key={i} className="glass p-8 rounded-3xl text-center border-white/5">
            <item.icon className="w-8 h-8 text-brand-cyan mx-auto mb-4" />
            <h4 className="font-bold mb-2 uppercase tracking-widest text-[10px]">{item.label}</h4>
            <p className="text-xs text-white/40">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const StoriesPage = () => (
  <div className="pt-40 pb-24 px-6 lg:px-12 min-h-screen">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-5xl font-black mb-16 italic text-center">Success Stories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {[
          { name: "Sarah J.", role: "Spa Owner", quote: "I described my vision in 10 seconds and had a live site that looked better than the $5k agency version.", img: "https://images.unsplash.com/photo-1544005313-94ddf028fbdb" },
          { name: "Marcus L.", role: "Tech Consultant", quote: "The code export feature is a game changer. I prototype in VoiceToWebsite and then ship to production.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d" },
          { name: "Elena V.", role: "Bistro Owner", quote: "Finally, a builder that understands 'atmosphere'. My restaurant's online presence matches the food.", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956" },
        ].map((story, i) => (
          <div key={i} className="glass p-8 rounded-[3rem] text-center border-white/5">
            <img src={story.img} alt={story.name} className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border-4 border-brand-cyan/20" />
            <p className="text-lg font-bold mb-6 italic leading-relaxed text-white/80">"{story.quote}"</p>
            <h4 className="font-bold uppercase tracking-widest text-xs">{story.name}</h4>
            <p className="text-[10px] text-white/40 uppercase">{story.role}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SupportPage = () => (
  <div className="pt-40 pb-24 px-6 lg:px-12 min-h-screen">
    <div className="max-w-3xl mx-auto text-center">
      <MessageSquare className="w-16 h-16 text-brand-cyan mx-auto mb-8" />
      <h1 className="text-5xl font-black mb-6 italic">Support Nexus</h1>
      <p className="text-white/40 mb-12">Our elite response team is available 24/7 for Pro and Ultimate members.</p>
      <div className="glass p-12 rounded-[3.5rem] text-left border-white/5">
         <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-2">Name Identity</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-brand-cyan" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-2">Communication Link</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-brand-cyan" />
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-2">Request Parameters</label>
               <textarea rows={4} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-brand-cyan"></textarea>
            </div>
            <button className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-brand-cyan transition-colors uppercase text-xs tracking-widest">Transmit Request</button>
         </form>
      </div>
    </div>
  </div>
);

export const SuccessPage = () => (
  <div className="pt-40 pb-24 px-6 min-h-screen flex items-center justify-center">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass p-12 rounded-[4rem] max-w-xl text-center border-brand-cyan/50 shadow-[0_0_50px_rgba(0,242,255,0.2)]"
    >
      <div className="w-20 h-20 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan mx-auto mb-8">
        <Star className="w-10 h-10 fill-brand-cyan" />
      </div>
      <h1 className="text-4xl font-black mb-4 italic">Operation Successful</h1>
      <p className="text-white/40 mb-10 leading-relaxed italic">Your vision is now part of the global digital architecture. Your premium dashboard is ready.</p>
      <Link to="/dashboard" className="px-12 py-5 bg-white text-black font-black rounded-3xl inline-flex items-center gap-3 hover:scale-105 transition-transform uppercase text-xs tracking-widest">
        Enter Dashboard <Zap className="w-5 h-5" />
      </Link>
    </motion.div>
  </div>
);

export const SetupPage = () => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const nextStep = () => {
    if (step === 3) {
      setIsAnalyzing(true);
      setTimeout(() => {
        window.location.href = "/success";
      }, 3000);
      return;
    }
    setStep(step + 1);
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-8">
           <div className="relative">
              <Loader2 className="w-20 h-20 text-brand-cyan animate-spin mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-brand-cyan/20 rounded-full animate-ping" />
              </div>
           </div>
           <h2 className="text-3xl font-black italic animate-pulse">Architecting Neural Path...</h2>
           <div className="space-y-2 text-[10px] uppercase font-black tracking-[0.3em] text-white/20">
              <p className="animate-bounce">Understanding Industry benchmarks</p>
              <p className="animate-bounce delay-100">Generating strategic copy</p>
              <p className="animate-bounce delay-200">Matching visual identity</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-24 px-6 lg:px-12 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-12">
           <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            <span className="text-[10px] uppercase font-black tracking-widest text-brand-cyan">Phase 0{step} Identity Discovery</span>
           </div>
           <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={cn("w-8 h-1 rounded-full transition-all", i <= step ? "bg-brand-cyan" : "bg-white/10")} />
              ))}
           </div>
        </div>

        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-12"
        >
           {step === 1 && (
             <div className="space-y-8">
               <h1 className="text-5xl font-black italic leading-none">What is the <span className="text-brand-cyan">Soul</span> of your business?</h1>
               <div className="glass p-8 rounded-3xl flex items-center gap-8 group hover:border-brand-cyan/50 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-brand-cyan">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div className="flex-grow space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Business Name</label>
                    <input type="text" placeholder="e.g. Nexis Ventures" className="w-full bg-transparent text-2xl font-bold outline-none" />
                  </div>
               </div>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-8">
               <h1 className="text-5xl font-black italic leading-none">Who are we <span className="text-brand-purple">Capturing?</span></h1>
               <div className="glass p-8 rounded-3xl flex items-center gap-8 group hover:border-brand-purple/50 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-brand-purple">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="flex-grow space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Target Audience</label>
                    <textarea placeholder="e.g. Modern tech professionals who value efficiency..." className="w-full bg-transparent text-xl font-bold outline-none h-24" />
                  </div>
               </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-8">
               <h1 className="text-5xl font-black italic leading-none">What is the <span className="text-brand-magenta">Action?</span></h1>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {["Bookings", "Direct Sales", "Leads"].map((goal) => (
                    <button key={goal} onClick={nextStep} className="glass p-8 rounded-3xl text-center hover:border-white transition-all group">
                       <Zap className="w-8 h-8 mx-auto mb-4 text-white/20 group-hover:text-brand-magenta" />
                       <span className="font-bold">{goal}</span>
                    </button>
                  ))}
               </div>
             </div>
           )}

           {step < 3 && (
             <button onClick={nextStep} className="w-full py-6 bg-white text-black font-black rounded-3xl text-xl hover:scale-105 transition-transform flex items-center justify-center gap-3">
               Continue <ArrowRight className="w-6 h-6" />
             </button>
           )}
        </motion.div>
      </div>
    </div>
  );
};

import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const SitePreviewPage = () => {
  const location = useLocation();
  const config = location.state?.config;
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
       alert("Please sign in to save your architecture.");
       window.location.href = "/signin";
       return;
    }
    if (!db) {
       alert("Database is not configured.");
       return;
    }

    try {
      setIsSaving(true);
      await addDoc(collection(db, "sites"), {
         ownerId: user.uid,
         title: config.name,
         html: config.html,
         industry: config.mood,
         status: "Draft",
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp()
      });
      window.location.href = "/dashboard";
    } catch (e) {
      console.error(e);
      alert("Failed to save architecture.");
      setIsSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="pt-40 pb-24 px-6 flex flex-col items-center min-h-screen text-center">
        <h1 className="text-4xl font-black mb-4 italic">No Preview Active</h1>
        <p className="text-white/40 mb-8">Please generate a website first using our AI engine.</p>
        <Link to="/" className="px-8 py-4 bg-brand-cyan text-black font-black rounded-2xl hover:scale-105 transition-transform uppercase text-xs tracking-widest">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-black flex flex-col">
      <div className="sticky top-20 z-50 px-6 py-3 glass-premium border-y border-white/10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Previewing:</span>
            <span className="text-sm font-black italic">{config.name}</span>
         </div>
         <div className="flex gap-4">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-6 py-2 bg-brand-cyan text-black text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-transform tracking-widest disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Architecture"}
            </button>
         </div>
      </div>
      <div className="flex-grow w-full max-w-[1440px] mx-auto shadow-2xl shadow-brand-cyan/10 relative">
         <iframe 
           srcDoc={config.html} 
           title="Website Preview"
           className="w-full h-[calc(100vh-140px)] border-none pointer-events-auto bg-white"
           sandbox="allow-scripts allow-same-origin"
         />
      </div>
    </div>
  );
};
