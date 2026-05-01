import { Logo3D } from "@/components/Logo3D";
import { motion } from "motion/react";

export const About = () => {
  return (
    <div className="min-h-screen px-6 lg:px-24">
      <div className="max-w-7xl mx-auto pt-40 pb-20">
        <div className="mb-40 space-y-12">
          <span className="subheading text-indigo-500 font-bold">
            About VoiceToWebsite
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-title"
          >
            Build with <br /> <span className="text-white/20">voice.</span>
          </motion.h1>
          <p className="text-3xl text-slate-400 max-w-3xl font-light italic leading-relaxed opacity-60">
            We believe that the barrier between an idea and its digital creation
            should be as thin as a spoken word. VoiceToWebsite turns business
            briefs into launch-ready websites with a fast, branded workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 mb-60 items-center">
          <div className="relative aspect-square grayscale border border-white/5 bg-white/2">
            <Logo3D className="w-full h-full opacity-40" />
            <div className="absolute inset-0 grid-structure opacity-20" />
          </div>
          <div className="space-y-12">
            <h2 className="text-6xl font-bold tracking-tighter uppercase italic leading-none">
              Product <br /> direction.
            </h2>
            <div className="space-y-8">
              <p className="text-xl font-light italic leading-relaxed opacity-60">
                Founded to remove the friction between a request and a live
                website, the platform focuses on clear layouts, fast delivery,
                and production-ready output.
              </p>
              <p className="text-xl font-light italic leading-relaxed opacity-60">
                The goal is simple: keep the product useful, legible, and easy
                to trust so customers can move from idea to published site
                without unnecessary steps.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-white/5 border border-white/5">
          {[
            { title: "3-step", desc: "Launch flow" },
            { title: "24/7", desc: "Hosted delivery" },
            { title: "SEO", desc: "Ready pages" },
            { title: "Code", desc: "Ownership" },
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
