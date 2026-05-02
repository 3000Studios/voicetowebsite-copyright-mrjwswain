import { motion } from "motion/react";
import { Mic, ArrowRight, Play, CheckCircle, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative pt-40 pb-24 px-6 lg:px-12 flex flex-col items-center overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-cyan/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple/20 blur-[120px] rounded-full animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl text-center relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/10 text-xs font-bold tracking-widest uppercase text-brand-cyan mb-8">
          <Zap className="w-3 h-3" />
          The future of web design is voice-powered
        </div>
        
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9] italic">
          Turn Your Voice Into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-white to-brand-purple">
            The Best Website
          </span>
        </h1>
        
        <p className="text-xl lg:text-2xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
          Speak or type your vision. Our AI builds a premium, conversion-ready website with custom copy, layout, and media in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          <Link
            to="/dashboard"
            className="group relative px-8 py-4 bg-white text-black font-extrabold rounded-2xl flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 neon-glow-cyan"
          >
            Generate My Website
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#demo"
            className="flex items-center gap-3 px-8 py-4 glass rounded-2xl font-bold hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-4 h-4 fill-white" />
            </div>
            See Demo
          </a>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 text-white/40 grayscale opacity-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Trusted by 50k+ creators</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <span>Stripe</span>
            <span>PayPal</span>
            <span>Google</span>
          </div>
        </div>
      </motion.div>

      {/* Hero Preview Card / Video Demo */}
      <motion.div
        id="demo"
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 1 }}
        className="mt-20 w-full max-w-5xl relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative glass p-4 rounded-[2.5rem] border border-white/20">
          <div className="aspect-video rounded-[1.5rem] bg-black/60 overflow-hidden relative border border-white/5">
             {/* Realistic Video Placeholder */}
             <video 
              autoPlay 
              muted 
              loop 
              playsInline
              className="w-full h-full object-cover opacity-60"
              poster="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1600"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-laptop-34448-large.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
              <div className="w-20 h-20 rounded-full bg-brand-cyan/20 backdrop-blur-md flex items-center justify-center border border-brand-cyan/50 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white fill-white translate-x-1" />
              </div>
            </div>
            
            {/* Mock Floating UI elements inside the video */}
            <div className="absolute bottom-8 left-8 glass p-4 rounded-2xl animate-bounce">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-cyan flex items-center justify-center"><Mic className="w-4 h-4 text-black" /></div>
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase">Voice Prompt</div>
                  <div className="text-xs font-bold text-white truncate max-w-[150px]">"Build a luxury spa website"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
