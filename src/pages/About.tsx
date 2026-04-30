import { Logo3D } from "@/components/Logo3D";
import { motion } from "motion/react";

export const About = () => {
  return (
    <div className="min-h-screen px-6 lg:px-24">
      <div className="max-w-7xl mx-auto pt-40 pb-20">
        <div className="mb-40 space-y-12">
          <span className="subheading text-indigo-500 font-bold">
            The Protocol // Origins
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-title"
          >
            Neural <br /> <span className="text-white/20">Build.</span>
          </motion.h1>
          <p className="text-3xl text-slate-400 max-w-3xl font-light italic leading-relaxed opacity-60">
            We believe that the barrier between an idea and its digital creation
            should be as thin as a spoken word. Neural Architect is pioneering
            the next generation of the web.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 mb-60 items-center">
          <div className="relative aspect-square grayscale border border-white/5 bg-white/2">
            <Logo3D className="w-full h-full opacity-40" />
            <div className="absolute inset-0 grid-structure opacity-20" />
          </div>
          <div className="space-y-12">
            <h2 className="text-6xl font-bold tracking-tighter uppercase italic leading-none">
              Redefining <br /> Creation.
            </h2>
            <div className="space-y-8">
              <p className="text-xl font-light italic leading-relaxed opacity-60">
                Founded in 2024, Neural Architect started with a simple
                question: "Why do we still have to code when we can just talk?"
                Our team of world-class engineers and designers spent two years
                developing the neural architecture that powers our platform.
              </p>
              <p className="text-xl font-light italic leading-relaxed opacity-60">
                Today, we serve over 50,000 users globally, from solo
                entrepreneurs to Fortune 500 companies, helping them speak their
                business into life.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-white/5 border border-white/5">
          {[
            { title: "50k+", desc: "Active Architects" },
            { title: "99.9%", desc: "Neural Uptime" },
            { title: "24ms", desc: "Sync Latency" },
            { title: "200+", desc: "Awards Won" },
          ].map((stat, i) => (
            <div key={i} className="p-16 bg-[#080808] space-y-6">
              <div className="text-4xl font-display italic tracking-tight">
                {stat.title}
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">
                {stat.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
