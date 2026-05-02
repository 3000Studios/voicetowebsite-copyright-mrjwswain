import { Hero } from "./home/Hero";
import { GeneratorSection } from "./home/GeneratorSection";
import { HowItWorks, WhatYouGet, ExamplesSection, PricingSection, TrustSection } from "./home/HomeContent";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { AdContainer } from "../App";

export const Home = () => {
  return (
    <div className="flex flex-col">
      <Hero />
      <AdContainer className="py-8" />
      <GeneratorSection />
      <AdContainer className="py-12" />
      <HowItWorks />
      <WhatYouGet />
      <ExamplesSection />
      <PricingSection />
      <TrustSection />
      
      {/* Final CTA */}
      <section className="py-32 px-6 lg:px-12 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-cyan/20 blur-[160px] rounded-full pointer-events-none" />
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
           className="relative z-10"
        >
          <h2 className="text-5xl lg:text-8xl font-black italic mb-12 tracking-tighter leading-none">
            Ready to Build the <br />
            <span className="text-brand-cyan">Future?</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
             <Link
              to="/signup"
              className="px-12 py-5 bg-white text-black font-black rounded-3xl text-xl hover:scale-105 transition-transform neon-glow-cyan"
            >
              Build My Website Now
            </Link>
            <Link
              to="/examples"
              className="px-12 py-5 glass rounded-3xl text-xl font-bold hover:bg-white/10 transition-colors"
            >
              See 3 Variations
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
