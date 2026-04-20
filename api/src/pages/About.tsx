import React from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Users, Target, Rocket, Award } from 'lucide-react';
import { Logo3D } from '@/components/Logo3D';

export const About = () => {
  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase italic"
        >
          OUR <span className="text-indigo-400">MISSION</span>
        </motion.h1>
        <p className="text-slate-400 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
          We believe that the barrier between an idea and its digital manifestation 
          should be as thin as a spoken word. VoiceToWebsite is pioneering the 
          next generation of the web.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32 items-center">
        <div className="relative h-[500px] bg-slate-900 border-2 border-slate-800 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)]">
          <Logo3D className="w-full h-full" />
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 uppercase italic tracking-tight">Redefining Creation</h2>
          <p className="text-slate-400 text-xl font-medium leading-relaxed mb-6">
            Founded in 2024, VoiceToWebsite started with a simple question: 
            "Why do we still have to code when we can just talk?" 
            Our team of world-class engineers and designers spent two years 
            developing the neural architecture that powers our platform.
          </p>
          <p className="text-slate-400 text-xl font-medium leading-relaxed">
            Today, we serve over 50,000 users globally, from solo entrepreneurs 
            to Fortune 500 companies, helping them speak their business into life.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { icon: Users, title: "50k+", desc: "Active Users" },
          { icon: Target, title: "99.9%", desc: "Uptime" },
          { icon: Rocket, title: "2s", desc: "Avg. Build Time" },
          { icon: Award, title: "200+", desc: "Design Awards" },
        ].map((stat, i) => (
          <div key={i} className="lifted-section p-10 bg-slate-900 text-center">
            <div className="w-16 h-16 bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
              <stat.icon className="text-white" size={32} />
            </div>
            <div className="text-4xl font-black text-white mb-2 uppercase italic tracking-tight">{stat.title}</div>
            <div className="text-slate-500 font-black uppercase tracking-widest text-xs">{stat.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
